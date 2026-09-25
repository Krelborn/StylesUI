# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project

StylesUI is a React 19 component library built with Vite 8 (rolldown), TypeScript, pnpm and oxlint. It must stay fully tree-shakable. Styling uses CSS modules and CSS custom properties only (no Sass, no Tailwind).

## Commands

- `pnpm build`: `vite build` (JS + CSS to `dist/`) then `tsc -p tsconfig.build.json` (declarations only)
- `pnpm typecheck`: `tsc -b` over app and node tsconfigs (includes tests, stories, `.storybook`)
- `pnpm lint`: oxlint
- `pnpm format`: oxfmt (config in `.oxfmtrc.json`); `pnpm format:check` to check without writing
- `pnpm test`: Vitest run once over `src/`; `pnpm test:watch` to watch
- `pnpm test:hooks`: `node:test` tests for the Claude Code hook scripts in `.claude/hooks/`
- Single test file: `pnpm test src/components/Box/Box.test.tsx`; single test by name: `pnpm test -t "renders a div by default"`
- `pnpm storybook` (port 6006) / `pnpm build-storybook`

A Husky pre-commit hook (`.husky/pre-commit`) runs lint-staged (`.lintstagedrc.json`): `oxlint --fix` then `oxfmt` on staged JS/TS files, `oxfmt` on everything else. `pnpm install` sets it up via the `prepare` script.

Publishing: `.github/workflows/publish.yml` lints, typechecks, tests, builds and publishes `@krelborn/stylesui` to GitHub Packages when a GitHub Release is published. Bump `version` in `package.json` first (`pnpm version patch|minor|major`); a published version can't be republished.

Install dependencies via `pnpm add` without hand-written versions so the latest release is resolved.

## Architecture

- `src/index.ts` is the only package entry. Each component lives in `src/components/<Name>/` (`<Name>.tsx`, `<Name>.module.css`, `<Name>.test.tsx`, `<Name>.stories.tsx`, `index.ts`) and is re-exported from `src/index.ts`.
- `Box` is the polymorphic primitive other components should build on. `as` is constrained to `keyof JSX.IntrinsicElements`, and all other props (including `ref`, React 19 ref-as-prop, no `forwardRef`) are typed from the chosen element via `ComponentPropsWithRef`.
- Components read CSS custom properties with fallbacks (e.g. `var(--sui-space-2, 0.5rem)`) so consumers theme by overriding variables.
- Global styles live in `src/styles/` (palette, tokens, `themes/`, modes, reset) and are built to `dist/styles.css`, exported as `@krelborn/stylesui/styles.css`. Themes set semantic tokens with `light-dark()`; `docs/design/concepts.md` describes the token tiers. `src/styles/themeTokens.test.ts` checks that every theme declares the same tokens.
- The React Compiler runs at build time (`@rolldown/plugin-babel` + `reactCompilerPreset`), so output imports `react/compiler-runtime`. Don't add manual `useMemo`/`useCallback` for memoization.

### Tree-shaking and CSS delivery (`vite.config.ts`, `package.json`)

These pieces work together; changing one can silently break consumers:

- `preserveModules` + `preserveModulesRoot: 'src'` emit one file per source module; React and `clsx` (`/^(react(-dom)?|clsx)($|\/)/`) are external.
- `vite-plugin-lib-inject-css` adds `import './X.css'` to each emitted chunk, so consumers only get CSS for components they import.
- `assetFileNames` strips `.module` from emitted CSS. If the file were published as `X.module.css`, the consumer's bundler would reprocess it as a side-effect-free CSS module and tree-shake the styles away.
- `"sideEffects": ["**/*.css"]` in `package.json` lets bundlers drop unused JS while keeping CSS imports. Component modules must not have other top-level side effects.
- Scoped class names are `sui-[local]-[hash:base64:5]`.
- `build.cssTarget` is pinned to the `light-dark()` support floor (Chrome/Edge 123, Firefox 120, Safari 17.5). A lower target makes lightningcss rewrite `light-dark()` into fallback variables, which breaks theme and mode nesting.

To verify tree-shaking after build changes, build a throwaway consumer app that imports the package with and without using a component, and check the unused case contains no component JS/CSS.

## Testing

Vitest with jsdom, Testing Library and `@testing-library/jest-dom` matchers. Globals are off (import `describe`/`it`/`expect`/`vi` explicitly), so `src/test/setup.ts` registers Testing Library's `cleanup` in `afterEach`. Type-level expectations use `// @ts-expect-error` inside tests and are enforced by `pnpm typecheck`.

## Storybook

Storybook 10 with `@storybook/react-vite`, configured manually in `.storybook/` (stories glob `src/**/*.stories.tsx`). Import `Meta`/`StoryObj` from `@storybook/react-vite` and `fn` from `storybook/test`.

## Coding standards

`docs/standards/` holds the coding standards. `.claude/standards.json` maps each document to the file suffixes it applies to (for example `.tsx` gets comments, typescript and react; `.test.tsx` adds vitest-unit-testing).

Claude Code hooks in `.claude/settings.json` run `.claude/hooks/standards.mjs` so matching standards are in an agent's context whenever it reads, writes or edits a file:

- **PreToolUse (`Read|Write|Edit`)**: adds any matching document not yet in that agent's context, in full. A Write or Edit made before its standards were in context is denied once, with the standards attached, so the change is redone following them. A Write or Edit issued in the same assistant message as the tool call whose hook loaded its standards (matched by `message.id` in the transcript, or loaded under 3 seconds ago when either call is not in the transcript yet) is also denied, without the standards attached, since that other call delivers them.
- **PostToolUse (`Bash`)**: after `git diff`, `git show`, `git log` or `gh pr diff`, adds the standards for existing project files named in the output (raw or rtk-compacted), so diff-based reviews get them too. Output cut short by a pipe such as `| head` may name no files.
- **Per-context tracking**: state lives in `$TMPDIR/claude-standards/<session_id>/<agent_id or main>.json`, so each subagent is tracked separately. A `compact_boundary` entry in the agent's transcript clears its state, so documents are sent again on its next matching tool call.
- **SessionStart (`compact`)**: re-sends every loaded document to the main agent straight after compaction; `clear` resets its state. **SubagentStart (`fork`)**: a fork inherits the main agent's loaded documents.
- **Size limit**: Claude Code moves any single `additionalContext` string over 10,000 characters to a file and leaves only a 2,000-character preview in context, so each event has `slotCount` handlers (`... standards.mjs <mode> <slot>`) that each emit one chunk. Parallel slots share one plan per event via a lock in the state directory. Keep `slotCount` in `standards.json` and the number of handlers in `settings.json` equal; `pnpm test:hooks` checks this.

To add a standard, add the document under `docs/standards/` and a rule in `.claude/standards.json`.

---

<!-- fallow:setup-hooks:start -->

## Fallow local gate

Before any `git commit` or `git push`, run `fallow audit --format json --quiet --explain --gate-marker agent`. If the verdict is `fail`, fix the reported findings before retrying. Treat JSON runtime errors like `{ "error": true, ... }` as non-blocking.

Audit defaults to `gate=new-only`: only findings introduced by the current changeset affect the verdict. Inherited findings on touched files are reported under `attribution` and annotated with `introduced: false`, but do not block the commit. Set `[audit] gate = "all"` in `fallow.toml` to gate every finding in changed files.

For non-skill agents, treat the task map below as the local onboarding source: run the listed fallow command before destructive edits, before commits, and before pull request handoff.

## Fallow task map

| When the agent is about to...                                     | Run                                                                                                                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| delete an "unused" export or file                                 | `fallow dead-code --trace <file>:<export>`                                                                                                              |
| prove a TypeScript symbol's exact consumers before refactoring    | `fallow dead-code --type-aware --symbol-impact <file>:<export-or-class.method>`                                                                         |
| find how one module reaches another                               | `fallow trace --path <from> <to>` (Reports `reachable: false` instead of failing when no import path exists; type-only hops are reported, not skipped.) |
| delete an "unused" dependency                                     | `fallow dead-code --trace-dependency <name>`                                                                                                            |
| commit or open a PR                                               | `fallow audit --base <ref>`                                                                                                                             |
| read a diff before approving it                                   | `fallow review --base <ref> --brief` (orientation, never gates: deterministic and always exit 0, unlike the audit row)                                  |
| prioritize refactoring                                            | `fallow health --hotspots --targets`                                                                                                                    |
| ask who owns code                                                 | `fallow health --ownership`                                                                                                                             |
| check untested-but-reachable code                                 | `fallow health --coverage-gaps`                                                                                                                         |
| consolidate duplication                                           | `fallow dupes --trace dup:<fingerprint>`                                                                                                                |
| find feature flags                                                | `fallow flags`                                                                                                                                          |
| check which architecture rules apply to a file before changing it | `fallow guard <files>`                                                                                                                                  |
| surface security candidates                                       | `fallow security`                                                                                                                                       |
| understand a finding                                              | `fallow explain <issue-type>`                                                                                                                           |
| scope a monorepo                                                  | `--workspace <glob> / --changed-workspaces <ref>` (global flags, prefix any command)                                                                    |

<!-- fallow:setup-hooks:end -->
