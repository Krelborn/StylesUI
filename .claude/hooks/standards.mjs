import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Claude Code hook that adds the project's coding standards to an agent's context when it
 * reads, writes or edits a matching file, and restores them after compaction.
 *
 * Usage: node standards.mjs <pre|post|session|subagent> <slot>
 *
 * See the "Coding standards" section of AGENTS.md.
 */

// Below Claude Code's per-string additionalContext cap described in AGENTS.md
const messageCharacterLimit = 9500;
const lockTimeoutMilliseconds = 3000;
const staleFileMilliseconds = 10 * 60 * 1000;
const writeTools = new Set(["Write", "Edit"]);

const projectDirectory = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
let configuration;

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function readStandardInput() {
  return JSON.parse(fs.readFileSync(0, "utf8"));
}

function writeJsonAtomically(filePath, value) {
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(value));
  fs.renameSync(temporaryPath, filePath);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

function sessionDirectory(input) {
  const directory = path.join(os.tmpdir(), "claude-standards", input.session_id);
  fs.mkdirSync(path.join(directory, "plans"), { recursive: true });
  return directory;
}

function agentKey(input) {
  return input.agent_id ?? "main";
}

function statePath(input, key = agentKey(input)) {
  return path.join(sessionDirectory(input), `${key}.json`);
}

function readState(input, key) {
  return readJson(statePath(input, key)) ?? { loaded: [], transcriptOffset: 0 };
}

/**
 * Runs a callback while holding the session's lock, so parallel hook processes update state
 * one at a time
 *
 * @param input the hook input
 * @param callback the work to run under the lock
 * @returns the callback's result
 */
function withSessionLock(input, callback) {
  const lockPath = path.join(sessionDirectory(input), "lock");
  const deadline = Date.now() + lockTimeoutMilliseconds;
  while (!tryAcquireLock(lockPath)) {
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for ${lockPath}`);
    }
    removeLockIfOwnerDead(lockPath);
    sleep(10);
  }
  try {
    return callback();
  } finally {
    fs.rmSync(lockPath, { force: true });
  }
}

function tryAcquireLock(lockPath) {
  try {
    fs.writeFileSync(lockPath, String(process.pid), { flag: "wx" });
    return true;
  } catch (error) {
    if (error.code === "EEXIST") {
      return false;
    }
    throw error;
  }
}

function isProcessAlive(processId) {
  try {
    process.kill(processId, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}

/**
 * Removes the lock when the process holding it has exited without releasing it
 *
 * @param lockPath the lock file, which holds its owner's process ID
 */
function removeLockIfOwnerDead(lockPath) {
  const owner = readLockOwner(lockPath);
  if (owner === undefined || isProcessAlive(owner)) {
    return;
  }
  // Claiming by rename means only one waiter removes the dead lock. If the claimed file is not
  // the dead owner's, another waiter already replaced it, so it is put back.
  const claimPath = `${lockPath}.${process.pid}.claim`;
  try {
    fs.renameSync(lockPath, claimPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return;
    }
    throw error;
  }
  if (readLockOwner(claimPath) !== owner) {
    restoreLock(claimPath, lockPath);
  }
  fs.rmSync(claimPath, { force: true });
}

function readLockOwner(lockPath) {
  try {
    return Number(fs.readFileSync(lockPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

function restoreLock(claimPath, lockPath) {
  try {
    fs.linkSync(claimPath, lockPath);
  } catch (error) {
    if (error.code !== "EEXIST") {
      throw error;
    }
  }
}

function transcriptPath(input) {
  if (input.agent_id === undefined) {
    return input.transcript_path;
  }
  const agentFileName = input.agent_id.startsWith("agent-") ? input.agent_id : `agent-${input.agent_id}`;
  return path.join(input.transcript_path.replace(/\.jsonl$/, ""), "subagents", `${agentFileName}.jsonl`);
}

function isCompactBoundary(line) {
  if (!line.includes("compact_boundary")) {
    return false;
  }
  try {
    const entry = JSON.parse(line);
    return entry.type === "system" && entry.subtype === "compact_boundary";
  } catch {
    return false;
  }
}

function readFrom(filePath, offset) {
  let descriptor;
  try {
    descriptor = fs.openSync(filePath, "r");
  } catch (error) {
    if (error.code === "ENOENT") {
      return Buffer.alloc(0);
    }
    throw error;
  }
  try {
    const length = Math.max(0, fs.fstatSync(descriptor).size - offset);
    const buffer = Buffer.alloc(length);
    fs.readSync(descriptor, buffer, 0, length, offset);
    return buffer;
  } finally {
    fs.closeSync(descriptor);
  }
}

/**
 * Counts compactions recorded in a transcript after a byte offset
 *
 * @param filePath the transcript file; a missing file counts as empty
 * @param offset the byte offset to start from
 * @returns the number of compactions found and the offset of the end of the last complete line
 */
function scanTranscript(filePath, offset) {
  const contents = readFrom(filePath, offset);
  const lastNewline = contents.lastIndexOf(10);
  if (lastNewline === -1) {
    return { compactions: 0, offset };
  }
  const lines = contents.subarray(0, lastNewline).toString("utf8").split("\n");
  return {
    compactions: lines.filter(isCompactBoundary).length,
    offset: offset + lastNewline + 1,
  };
}

/**
 * Brings an agent's state up to date with its transcript
 *
 * @param state the stored state
 * @param input the hook input
 * @returns the state with a new offset, and with nothing loaded if the agent's context was
 *   compacted since the last scan
 */
function refreshForCompaction(state, input) {
  const scan = scanTranscript(transcriptPath(input), state.transcriptOffset);
  return { loaded: scan.compactions === 0 ? state.loaded : [], transcriptOffset: scan.offset };
}

function applicableRules(filePath) {
  const relativePath = path.relative(projectDirectory, path.resolve(projectDirectory, filePath));
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return [];
  }
  const segments = relativePath.split(path.sep);
  if (segments.some((segment) => configuration.excludedDirectories.includes(segment))) {
    return [];
  }
  return configuration.rules.filter((rule) => rule.suffixes.some((suffix) => relativePath.endsWith(suffix)));
}

/**
 * Splits markdown into pieces no longer than a limit, breaking at level-two headings outside
 * code fences where possible and between lines otherwise
 *
 * @param markdown the document text
 * @param limit the maximum piece length
 * @returns the pieces, which concatenate back to the original text
 */
function splitMarkdown(markdown, limit) {
  const sections = [];
  let current = "";
  let insideFence = false;
  for (const line of markdown.split(/(?<=\n)/)) {
    if (line.startsWith("```")) {
      insideFence = !insideFence;
    }
    if (!insideFence && line.startsWith("## ") && current !== "") {
      sections.push(current);
      current = "";
    }
    current += line;
  }
  sections.push(current);
  return packPieces(sections.flatMap((section) => splitByLines(section, limit)), limit, "");
}

function splitByLines(text, limit) {
  if (text.length <= limit) {
    return [text];
  }
  return packPieces(text.split(/(?<=\n)/), limit, "");
}

function packPieces(pieces, limit, separator) {
  const packed = [];
  for (const piece of pieces) {
    const last = packed.at(-1);
    if (last !== undefined && last.length + separator.length + piece.length <= limit) {
      packed[packed.length - 1] = last + separator + piece;
    } else {
      packed.push(piece);
    }
  }
  return packed;
}

function documentHeader(rule, part, partCount) {
  const partLabel = partCount > 1 ? ` (part ${part} of ${partCount})` : "";
  return `Project coding standard ${rule.document}${partLabel}, which applies to ${rule.suffixes.join(" ")} files. Its full text:\n\n`;
}

/**
 * Builds the context messages that carry a set of standards documents in full
 *
 * @param documents the document paths, relative to the project directory; any no longer
 *   configured or on disk are skipped
 * @returns one message per hook slot, each within the additionalContext limit
 */
function buildMessages(documents) {
  const headerAllowance = 300;
  const segments = documents.flatMap((document) => {
    const rule = configuration.rules.find((candidate) => candidate.document === document);
    const documentPath = path.join(projectDirectory, document);
    if (rule === undefined || !fs.existsSync(documentPath)) {
      return [];
    }
    const parts = splitMarkdown(fs.readFileSync(documentPath, "utf8"), messageCharacterLimit - headerAllowance);
    return parts.map((part, index) => ({
      document,
      partCount: parts.length,
      text: documentHeader(rule, index + 1, parts.length) + part,
    }));
  });
  return fitToSlots(packSegments(segments));
}

function packSegments(segments) {
  const separator = "\n\n";
  const messages = [];
  for (const segment of segments) {
    const last = messages.at(-1);
    if (last !== undefined && last.text.length + separator.length + segment.text.length <= messageCharacterLimit) {
      last.text += separator + segment.text;
      last.segments.push(segment);
    } else {
      messages.push({ text: segment.text, segments: [segment] });
    }
  }
  return messages;
}

function fitToSlots(messages) {
  if (messages.length <= configuration.slotCount) {
    return messages.map((message) => message.text);
  }
  const kept = messages.slice(0, configuration.slotCount - 1);
  const keptSegments = kept.flatMap((message) => message.segments);
  const documents = new Set(messages.flatMap((message) => message.segments).map((segment) => segment.document));
  const omitted = [...documents].filter((document) => {
    const keptParts = keptSegments.filter((segment) => segment.document === document);
    return keptParts.length === 0 || keptParts.length < keptParts[0].partCount;
  });
  const note = `These project coding standards did not fit in context automatically, in whole or in part, and are available to read in full: ${omitted.join(", ")}`;
  return [...kept.map((message) => message.text), note];
}

function removeStalePlans(plansDirectory) {
  for (const fileName of fs.readdirSync(plansDirectory)) {
    const filePath = path.join(plansDirectory, fileName);
    if (Date.now() - fs.statSync(filePath).mtimeMs > staleFileMilliseconds) {
      fs.rmSync(filePath, { force: true });
    }
  }
}

/**
 * Returns the messages every slot process for one hook event shares, creating them on first use
 *
 * @param input the hook input
 * @param key identifies the hook event across its parallel slot processes
 * @param createPlan builds the messages and updates state; runs at most once per key, under the
 *   session lock
 * @returns the messages for the event
 */
function sharedPlan(input, key, createPlan) {
  const plansDirectory = path.join(sessionDirectory(input), "plans");
  const planPath = path.join(plansDirectory, `${key}.json`);
  const existing = readJson(planPath);
  if (existing !== undefined) {
    return existing;
  }
  return withSessionLock(input, () => {
    const created = readJson(planPath);
    if (created !== undefined) {
      return created;
    }
    removeStalePlans(plansDirectory);
    const messages = createPlan();
    writeJsonAtomically(planPath, messages);
    return messages;
  });
}

function emit(hookEventName, fields) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName, ...fields } }));
}

/**
 * Returns this slot's share of the standards documents matching some files that the agent's
 * context does not hold yet, recording them as held
 *
 * @param input the hook input
 * @param key identifies the hook event across its parallel slot processes
 * @param filePaths the files the tool call concerns
 * @param slot the slot being run
 * @returns the slot's message, or undefined when it has nothing to add
 */
function messageForFiles(input, key, filePaths, slot) {
  const documents = new Set(filePaths.flatMap(applicableRules).map((rule) => rule.document));
  if (documents.size === 0) {
    return undefined;
  }
  const ordered = configuration.rules.map((rule) => rule.document).filter((document) => documents.has(document));
  const messages = sharedPlan(input, key, () => {
    const state = refreshForCompaction(readState(input), input);
    const missing = ordered.filter((document) => !state.loaded.includes(document));
    writeJsonAtomically(statePath(input), { ...state, loaded: [...state.loaded, ...missing] });
    return missing.length === 0 ? [] : buildMessages(missing);
  });
  return messages[slot];
}

/**
 * Finds project files named in the output of a command that shows changes
 *
 * @param command the Bash command that ran
 * @param output the command's standard output
 * @returns the paths of existing project files that the output's file headers or stat lines
 *   name; empty when the command does not show changes
 */
function filesInChangeOutput(command, output) {
  if (!/\b(git\s+(diff|show|log)|gh\s+pr\s+diff)\b/.test(command)) {
    return [];
  }
  const candidates = new Set(output.split("\n").flatMap(pathsInChangeLine));
  return [...candidates].filter((candidate) => {
    if (applicableRules(candidate).length === 0) {
      return false;
    }
    return fs.statSync(path.resolve(projectDirectory, candidate), { throwIfNoEntry: false })?.isFile() ?? false;
  });
}

function pathsInChangeLine(line) {
  const gitHeader = /^diff --git a\/(\S+) b\/(\S+)$/.exec(line);
  if (gitHeader !== null) {
    return [gitHeader[1], gitHeader[2]];
  }
  const fileMarker = /^(?:---|\+\+\+) [ab]\/(\S+)$/.exec(line);
  if (fileMarker !== null) {
    return [fileMarker[1]];
  }
  const statLine = /^\s*(\S+)\s+\|\s+(?:\d+|Bin)/.exec(line);
  if (statLine !== null) {
    return [statLine[1]];
  }
  const barePath = /^(\S+)$/.exec(line);
  return barePath === null ? [] : [barePath[1]];
}

function handlePostToolUse(input, slot) {
  const files = filesInChangeOutput(input.tool_input?.command ?? "", input.tool_response?.stdout ?? "");
  const message = messageForFiles(input, `post-${input.tool_use_id}`, files, slot);
  if (message !== undefined) {
    emit("PostToolUse", { additionalContext: message });
  }
}

function handlePreToolUse(input, slot) {
  const message = messageForFiles(input, input.tool_use_id, [input.tool_input?.file_path ?? ""], slot);
  if (message === undefined) {
    return;
  }
  const denial =
    slot === 0 && writeTools.has(input.tool_name)
      ? {
          permissionDecision: "deny",
          permissionDecisionReason:
            "This file type's project coding standards were not in context when this change was written, so it was not applied. They are now in context alongside this result, and the change can be made again following them.",
        }
      : {};
  emit("PreToolUse", { ...denial, additionalContext: message });
}

function handleSessionStart(input, slot) {
  if (input.source === "clear") {
    if (slot === 0) {
      withSessionLock(input, () => fs.rmSync(statePath(input), { force: true }));
    }
    return;
  }
  if (input.source !== "compact") {
    return;
  }
  const compactions = scanTranscript(input.transcript_path, 0).compactions;
  const messages = sharedPlan(input, `compact-${compactions}`, () => {
    const state = readState(input);
    const scan = scanTranscript(input.transcript_path, state.transcriptOffset);
    writeJsonAtomically(statePath(input), { loaded: state.loaded, transcriptOffset: scan.offset });
    return state.loaded.length === 0 ? [] : buildMessages(state.loaded);
  });
  if (messages[slot] !== undefined) {
    emit("SessionStart", { additionalContext: messages[slot] });
  }
}

function handleSubagentStart(input, slot) {
  if (slot !== 0) {
    return;
  }
  withSessionLock(input, () => {
    // A fork's transcript starts with the parent's history, whose compactions are already
    // reflected in the parent's state
    const scan = scanTranscript(transcriptPath(input), 0);
    writeJsonAtomically(statePath(input), { loaded: readState(input, "main").loaded, transcriptOffset: scan.offset });
  });
}

const handlers = {
  post: handlePostToolUse,
  pre: handlePreToolUse,
  session: handleSessionStart,
  subagent: handleSubagentStart,
};

try {
  const [mode, slotArgument = "0"] = process.argv.slice(2);
  configuration = readJson(path.join(projectDirectory, ".claude", "standards.json"));
  const handler = handlers[mode];
  if (handler === undefined) {
    throw new Error(`Unknown mode "${mode}"; expected one of ${Object.keys(handlers).join(", ")}`);
  }
  handler(readStandardInput(), Number(slotArgument));
} catch (error) {
  process.stderr.write(`standards hook: ${error.stack ?? error}\n`);
}
