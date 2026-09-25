---
name: no-mistakes
description: Conduct a thorough code review and fix issues. Use when the user asks for their work/code/branch to be reviewed and any necessary fixes to be made.
---

# No Mistakes

## Process

Follow these steps:

1. Use a subagent to run **open-code-review-delegate** skill to review the changes and report by findings. The subagent must be readonly. No edits allowed, do NOT try to fix any issues.
2. Load the **receiving-code-review** skill and review the reported issues
3. Plan how you will make any necessary fixes using **subagent-driven-development**
4. If there is an important choice needed by the user before fixing, **stop**, present the findings and ask the user questions to unblock you before proceeding. Skip the approval when trivial changes are required.
5. Fix the issues following your plan once approved

On completion summarize the issues found and the fixes made as well as anything that was pushed back on that wasn't fixed or couldn't be.

## Knowing When Permission Is Needed

Before proceeding with fixes you may need to ask the user for permission. Do this when:

- The changes are non-trivial or require changes that increase scope of the work
- Change behavior in the way that a user would notice if it's not part of the original intent or the intended behavior is not clear
- Require changes to the architecture or other design decisions that require new files, components or dependencies
- Only minor or nit issues are found in order to avoid trivial, unnecessary changes
