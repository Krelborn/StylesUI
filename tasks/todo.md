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

- [ ] SC 7 holds in all four projects, in both writing directions.
- [ ] SC 8 holds in all four projects: the overshoot is at most 0.125rem.
- [ ] The doc part of SC 13 for the thumb: concepts.md gives the thumb's travel and inset, and says the `playful` spring stays inside the track.

**Verification:**

- [ ] With the switch rule's track set back to 2.75rem by 1.5rem for one run, `Thumb` fails on the travel in all four projects and on the overshoot in the two `playful` ones. The track is then restored.
- [ ] `pnpm test:storybook src/components/Switch/Switch.stories.tsx`
- [ ] `pnpm verify` and the fallow audit

**Dependencies:** Task 1

**Files likely touched:**

- `src/components/Switch/Switch.stories.tsx`
- `docs/design/concepts.md`, `tasks/`

**Estimated scope:** S

## Checkpoint A: after Tasks 1 and 2

- [ ] `pnpm verify` and the fallow audit pass
- [ ] Every story that renders a Switch passes axe, including `target-size`, in all four projects

## Task 3: Turn on the halo for Switch

**Description:** The switch rule drops `--sui-choice-control-halo-spread: 0px`, so the Checkbox's halo applies to the track. Story changes, both last in the file:

- A `Halo` story replaces `NoHalo`, as Checkbox's does. It checks a transparent halo at rest, then runs `expectDistinctHaloStates` on an unchecked switch with the text tint and a checked one with the primary tint, and finds no box-shadow on a disabled switch while hovered.
- A new `FocusedHalo` story puts a switch on a `Card`, as Checkbox's does. It hovers it, tabs to it, and checks that the halo goes at once, that no `box-shadow` transition runs, and that the ring keeps 3:1.

concepts.md no longer says a Switch has no halo.

**Acceptance criteria:**

- [ ] SC 9 to 11 hold in all four projects.
- [ ] The doc part of SC 13 for the halo: concepts.md describes the Switch's halo and no longer says it has none.

**Verification:**

- [ ] Before the CSS change, `Halo` fails on the spread, and `FocusedHalo` fails on the halo shown before focus.
- [ ] With the `.choiceControl .input:focus-visible` rule removed for one run, `FocusedHalo` fails on the halo under the ring. The rule is then restored.
- [ ] `pnpm test:storybook src/components/Switch/Switch.stories.tsx`
- [ ] The Checkbox unit tests: `pnpm test:unit src/components/Checkbox/Checkbox.test.tsx`
- [ ] `pnpm verify`, `pnpm build` and the fallow audit

**Dependencies:** Task 1

**Files likely touched:**

- `src/components/ChoiceControl/ChoiceControl.module.css`
- `src/components/Switch/Switch.stories.tsx`
- `docs/design/concepts.md`, `tasks/`

**Estimated scope:** S

## Checkpoint B: complete

- [ ] Spec success criteria 1 to 14 hold
- [ ] `pnpm verify`, `pnpm build` and the fallow audit pass
- [ ] By hand: screenshots of the Switch stories in both themes and modes, under Chromium's forced colours, and in WebKit, published with `html_render`
- [ ] You review the branch; pushing and opening a pull request wait for your go-ahead
