# Tasks: Compact switch

Spec: [SPEC.md](../SPEC.md). Plan: [plan.md](plan.md). "SC n" is the spec's success criterion n.

Before every commit: `pnpm verify` and `fallow audit --format json --quiet --explain --gate-marker agent`.

## Task 1: Shrink the track and start the text at `space-8`

**Description:** The switch rule in `ChoiceControl.module.css` drops `--sui-choice-control-size: 1.5rem`, so the track is as tall as the box, and sets `--sui-choice-control-track-size: var(--sui-space-6, 1.5rem)`. `expectOnSpaceScale` takes an optional `{ boxWidth, indent }`, which default to `var(--sui-space-4)` and `var(--sui-space-6)`. Story changes in `Switch.stories.tsx`:

- `Stacked` checks the track against the resolved `space-6` and `space-4`, not 2.75rem by 1.5rem.
- A new `AlignedText` story renders a one-line label, a wrapping one and a `Text` padded by `var(--sui-space-8)`, and runs `expectOnSpaceScale` with `space-6` and `space-8`. It also checks that the one-line label is one line tall.
- A new `RightToLeft` story runs `AlignedText` inside `dir="rtl"`.
- A new `WithoutText` story checks a switch named by `aria-label` alone.
- `KeyboardInteraction` checks that the ring ends before the label text.

The docs describe the new size and the `space-8` rule. The prototype story is deleted, and the spec and plan are committed with this task.

**Acceptance criteria:**

- [x] SC 1 to 6 hold in all four projects.
- [x] SC 12: Switch's `KeyboardInteraction` checks that the ring ends before the text.
- [x] The doc parts of SC 13 for the size are done:
  - concepts.md gives the track size and the `space-8` text start, and drops "stays 2.75rem by 1.5rem".
  - Forms.mdx shows lining text up under a switch, embedding `AlignedText`, and gives the target size of a switch without text.
  - conventions.md states the `space-8` rule.
  - AGENTS.md describes `expectOnSpaceScale`'s width and indent.

**Verification:**

- [x] Before the CSS change, `Stacked`, `AlignedText` and `RightToLeft` fail on the track's size and the text's start. `AlignedText` also fails on the label's height in `default`. `WithoutText` and the ring check pass before and after, as guards on the smaller track.
- [x] `pnpm test:storybook src/components/Switch/Switch.stories.tsx`
- [x] Unchanged calls still pass: `pnpm test:storybook src/components/Checkbox src/components/Radio`
- [x] axe, including `target-size`, on every story file that renders a Switch: `pnpm test:storybook src/components/Switch src/components/Field src/components/Fieldset src/docs/ContactForm.stories.tsx`
- [x] `pnpm verify` and the fallow audit

**Dependencies:** None

**Files likely touched:**

- `src/components/ChoiceControl/ChoiceControl.module.css`
- `src/test/choiceControl.ts`
- `src/components/Switch/Switch.stories.tsx`
- `docs/design/concepts.md`, `src/docs/Forms.mdx`, `.design-sync/conventions.md`, `AGENTS.md`
- `SPEC.md`, `tasks/`; delete `src/components/Switch/SwitchPrototypes.stories.tsx`

**Estimated scope:** M. The code is in three files, and the rest are doc edits that ship in the same commit.

## Task 2: Prove the thumb's size, travel and overshoot

**Description:** A new `Thumb` story renders a checked and an unchecked switch, and reads each thumb from its `::before` computed style. The thumb is as wide as the track's height, less twice the border width and twice `0.125rem`, and a checked thumb is translated by the resolved `space-2`. A helper in the story file gives the travel's sign from the writing direction, so `RightToLeft` also checks that a checked thumb moves left. The story then clicks the unchecked switch, pauses the `::before` `transform` transition, and steps through its duration in 2% steps. At each step the thumb's overshoot past its end position must be at most the inset. concepts.md gives the thumb's travel and inset. No CSS changes: Task 1's track already makes the travel `space-2`.

**Acceptance criteria:**

- [x] SC 7 holds in all four projects, in both writing directions.
- [x] SC 8 holds in all four projects: the overshoot is at most 0.125rem.
- [x] The doc part of SC 13 for the thumb: concepts.md gives the thumb's travel and inset, and says the `playful` spring stays inside the track.

**Verification:**

- [x] With the switch rule's track set back to 2.75rem by 1.5rem for one run, `Thumb` fails on the travel in all four projects and on the overshoot in the two `playful` ones. The track is then restored.
- [x] `pnpm test:storybook src/components/Switch/Switch.stories.tsx`
- [x] `pnpm verify` and the fallow audit

**Dependencies:** Task 1

**Files likely touched:**

- `src/components/Switch/Switch.stories.tsx`
- `src/test/choiceControl.ts` (exports `resolvedLength`, so the story resolves `--sui-space-2` on the label)
- `docs/design/concepts.md`, `AGENTS.md`, `tasks/`

**Estimated scope:** S

## Checkpoint A: after Tasks 1 and 2

- [x] `pnpm verify` and the fallow audit pass
- [x] Every story that renders a Switch passes axe, including `target-size`, in all four projects

## Task 3: Turn on the halo for Switch

**Description:** The switch rule drops `--sui-choice-control-halo-spread: 0px`, so the Checkbox's halo applies to the track. Story changes, both last in the file:

- A `Halo` story replaces `NoHalo`, as Checkbox's does. It checks a transparent halo at rest, then runs `expectDistinctHaloStates` on an unchecked switch with the text tint and a checked one with the primary tint, and finds no box-shadow on a disabled switch while hovered.
- A new `FocusedHalo` story puts a switch on a `Card`, as Checkbox's does. It hovers it, tabs to it, and checks that the halo goes at once, that no `box-shadow` transition runs, and that the ring keeps 3:1.

concepts.md no longer says a Switch has no halo.

**Acceptance criteria:**

- [x] SC 9 to 11 hold in all four projects.
- [x] The doc part of SC 13 for the halo: concepts.md describes the Switch's halo and no longer says it has none.

**Verification:**

- [x] Before the CSS change, `Halo` fails on the spread, and `FocusedHalo` fails on the halo shown before focus.
- [x] With the `.choiceControl .input:focus-visible` rule removed for one run, `FocusedHalo` fails on the halo under the ring. The rule is then restored.
- [x] `pnpm test:storybook src/components/Switch/Switch.stories.tsx`
- [x] The Checkbox unit tests: `pnpm test:unit src/components/Checkbox/Checkbox.test.tsx`
- [x] `pnpm verify`, `pnpm build` and the fallow audit

**Dependencies:** Task 1

**Files likely touched:**

- `src/components/ChoiceControl/ChoiceControl.module.css`
- `src/components/Switch/Switch.stories.tsx`
- `src/test/choiceControl.ts`: `expectHaloStates`, shared by the Checkbox, Radio and Switch `Halo` stories, and `expectHaloHiddenUnderFocus`, shared with Checkbox's `FocusedHalo`, which now also checks the halo's spread before focus
- `src/components/Checkbox/Checkbox.stories.tsx`, `src/components/Radio/Radio.stories.tsx`
- `docs/design/concepts.md`, `AGENTS.md`, `tasks/`

**Estimated scope:** S

## Task 4: Apply the review's fixes

**Description:** A review of Tasks 1 to 3, by a reviewer agent and by hand, with two stylesheet mutations, asked for these fixes:

- The docs claimed a switch named by `aria-label` alone is a target at least 24px square. That only holds at 16px text, because the label is one line of its inherited font, so concepts.md and Forms.mdx now say so.
- The spec said the Checkbox and Radio stories were unchanged, but they now use the shared halo steps. SPEC.md records the shared steps, lists those story files and rewords SC 8 and SC 14.
- `Thumb` threw under reduced motion, where there is no slide, and its duration check could never fail. It now skips the sampling under reduced motion, asserts the slide was found, and cancels it when done.
- Each sampled step now checks the thumb's far edge against the inner edge of the track's border, not its overshoot against the inset, so the check no longer assumes the thumb's start margin equals the inset.
- `SpaceScaleLayout` is exported and `switchLayout` declared with `satisfies`. `resolvedLength` sets `width`, the axis it reads.
- Nits: AGENTS.md, conventions.md and concepts.md wording, the `expectHaloStates` contract, the comment on why the click is native, a named step count, and `sign` for the travel's direction.

**Acceptance criteria:**

- [x] SC 6 and 8 as reworded hold in all four projects, and the docs give the 24px target at 16px text.
- [x] `Thumb` raises no error in Storybook under `prefers-reduced-motion: reduce`.
- [x] SPEC.md, plan.md and AGENTS.md match the code.

**Verification:**

- [x] With the old track, `Thumb` fails on the far edge in the `playful` projects (41.24px against a 40px inner width) and on travel in the `default` ones.
- [x] Loaded under reduced motion in Chromium, `Thumb` logs no error. Before the fix it logged a `TypeError` reading `pause`.
- [x] `pnpm test:storybook` on the Checkbox, Radio and Switch stories
- [x] `pnpm verify`, `pnpm build` and the fallow audit

**Dependencies:** Task 3

**Files likely touched:**

- `src/components/Switch/Switch.stories.tsx`, `src/test/choiceControl.ts`
- `docs/design/concepts.md`, `src/docs/Forms.mdx`, `.design-sync/conventions.md`, `AGENTS.md`
- `SPEC.md`, `tasks/`

**Estimated scope:** S

## Task 5: Keep every choice control a 24px target in small text

**Description:** Codex's review of the pull request found that the 16px track no longer keeps a Switch's label 24px tall, as the 1.5rem track did: at 12px text the label is one 18px line, and switches stacked with `gap={1}` sit 22px apart, which meets neither WCAG 2.5.8's size nor its spacing exception. Checkbox and Radio have had the same gap since their resize. The shared label rule gains block padding of `max(0px, (24px - 1lh) / 2)`, which is 0px at 16px text. `expectCentredTarget` in `src/test/choiceControl.ts` checks a label is at least 24px tall with its line in the middle, and new Checkbox and Switch `SmallText` stories render controls in 12px text, stacked with `gap={1}`, one named by `aria-label` alone.

**Acceptance criteria:**

- [x] SC 15 holds in all four projects.
- [x] concepts.md, Forms.mdx, SPEC.md and AGENTS.md describe the padding and the helper.

**Verification:**

- [x] Before the CSS change, both `SmallText` stories fail on the target height: 18px in `default` and 18.9px in `playful`.
- [x] With the padding only below the line, they fail on the line being 3.5px off centre.
- [x] `pnpm verify`, `pnpm build` and the fallow audit

**Dependencies:** Task 4

**Files likely touched:**

- `src/components/ChoiceControl/ChoiceControl.module.css`, `src/test/choiceControl.ts`
- `src/components/Checkbox/Checkbox.stories.tsx`, `src/components/Switch/Switch.stories.tsx`
- `docs/design/concepts.md`, `src/docs/Forms.mdx`, `AGENTS.md`, `SPEC.md`, `tasks/`

**Estimated scope:** S

## Checkpoint B: complete

- [x] Spec success criteria 1 to 15 hold
- [x] `pnpm verify`, `pnpm build` and the fallow audit pass
- [x] By hand: screenshots of the Switch stories in both themes and modes, under Chromium's forced colours, and in WebKit, published with `html_render`
- [ ] You review the branch; pushing and opening a pull request wait for your go-ahead
