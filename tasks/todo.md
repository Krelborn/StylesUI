# Tasks: Compact checkbox and radio

Spec: [SPEC.md](../SPEC.md). Plan: [plan.md](plan.md). "SC n" is the spec's success criterion n.

Before every commit: `pnpm verify` and `fallow audit --format json --quiet --explain --gate-marker agent`.

## Task 1: Shrink and centre the box, and line Checkbox text up at `space-6`

**Description:** `--sui-choice-control-size` becomes `var(--sui-space-4, 1rem)`. The input sets `font: inherit` and `margin-block: calc((1lh - var(--sui-choice-control-size)) / 2)`, so the box is centred on the label's first line. Switch's rule pins its size at `1.5rem`. New helpers in `src/test/choiceControl.ts` resolve a token to pixels in an element's scope and measure the box against the label. A new Checkbox `AlignedText` story renders a one-line label, a wrapping one and a `Text` padded by `var(--sui-space-6)`. The docs describe the size, the centring and how to line text up.

**Acceptance criteria:**

- [x] SC 1 to 3 hold for Checkbox in all four projects: the box is `space-4` square, centred on the first line of a one-line and a wrapping label, and the label text and the padded `Text` start at `space-6`.
- [x] SC 4: `Stacked` checks each label is at least 24px tall, and its JSDoc says the label is the target. Checkbox's `KeyboardInteraction` checks that the ring ends before the label text (SC 9).
- [x] concepts.md's Forms section gives the box size, the centring and the `space-6` alignment. Forms.mdx shows lining text up under a control and embeds `AlignedText`. `.design-sync/conventions.md` states the `space-6` rule.

**Verification:**

- [x] `pnpm test:storybook src/components/Checkbox/Checkbox.stories.tsx`
- [x] Every other form story file still passes axe, including `target-size`: `pnpm test:storybook src/components/Radio src/components/RadioGroup src/components/Switch src/components/Field src/components/Fieldset`
- [x] `pnpm test:unit src/components/Checkbox/Checkbox.test.tsx`
- [x] By hand: the Checkbox stories and the Forms guide in Storybook, in both themes

**Dependencies:** None

**Files likely touched:**

- `src/components/ChoiceControl/ChoiceControl.module.css`
- `src/test/choiceControl.ts` (new)
- `src/components/Checkbox/Checkbox.stories.tsx`
- `docs/design/concepts.md`, `src/docs/Forms.mdx`, `.design-sync/conventions.md` (a paragraph each)
- `SPEC.md`, `tasks/plan.md`, `tasks/todo.md` (committed with this task)

**Estimated scope:** M. Three of the files are short doc edits.

## Task 2: Check the Radio's alignment and that Switch is unchanged

**Description:** A Radio `AlignedText` story makes the same measurements with the helpers from Task 1. Switch's `Stacked` story checks that the track is still 2.75rem by 1.5rem, and its JSDoc says the label is the 24px target.

**Acceptance criteria:**

- [x] SC 1 to 3 hold for Radio in all four projects.
- [x] The size half of SC 8: the Switch track is 2.75rem by 1.5rem. Switch's `Stacked` JSDoc is updated (SC 4).

**Verification:**

- [x] `pnpm test:storybook src/components/Radio/Radio.stories.tsx src/components/Switch/Switch.stories.tsx`

**Dependencies:** Task 1

**Files likely touched:**

- `src/components/Radio/Radio.stories.tsx`
- `src/components/Switch/Switch.stories.tsx`

**Estimated scope:** S

## Task 3: Centre the box on the lowercase letters

**Description:** Checkpoint A found that the box, centred on the line, sits 1.8px above the middle of the lowercase letters in `default` (1.1px in `playful`), so it looks high. The label becomes an `inline-block` with `--sui-choice-control-indent` (the box's width plus the gap) of inline-start padding when it has text, through a `withText` class that `ChoiceControl.tsx` adds. The input becomes an `inline-grid` with `vertical-align: middle`, pulled back into the padding by a negative margin. The `1lh` margin and `font: inherit` go. `expectOnSpaceScale` checks the box's centre against the middle of the lowercase letters, half the resolved `1ex` above the first baseline. A Checkbox `WithoutText` story checks that a checkbox named by `aria-label` alone is as wide as its box. concepts.md says what the box is centred on, and the spec already records the decision.

**Acceptance criteria:**

- [x] SC 1 to 3 hold for Checkbox and Radio in all four projects, with SC 2 measured against the lowercase letters.
- [x] SC 4: a Checkbox named by `aria-label` alone has a label as wide as its box.
- [x] Switch's track is still 2.75rem by 1.5rem, and its label is at least 24px tall.

**Verification:**

- [x] The updated alignment stories fail before the CSS change, by about 1.8px in `default` and 1.1px in `playful`
- [x] `pnpm test:storybook` on every story file that renders a choice control: Checkbox, Radio, RadioGroup, Switch, Field, Fieldset, Tooltip, the contact form and the palette showcase
- [x] By hand: screenshots of Checkbox, Radio, RadioGroup and Switch in both themes for Checkpoint A

**Dependencies:** Task 2

**Files likely touched:**

- `src/components/ChoiceControl/ChoiceControl.module.css`, `src/components/ChoiceControl/ChoiceControl.tsx`
- `src/test/choiceControl.ts`
- `src/components/Checkbox/Checkbox.stories.tsx`, `src/components/Radio/Radio.stories.tsx` (JSDoc)
- `docs/design/concepts.md`, `SPEC.md`, `tasks/`

**Estimated scope:** M

## Task 4: Centre the box between the capitals and the lowercase letters

**Description:** Reviewed at Checkpoint A, the box centred on the lowercase letters hung low beside short capitalised labels such as "Email", and centred on the capitals it looked slightly high. You chose halfway between. The input gains `position: relative`, an `inset-block-start` of `calc((1ex - 1cap) / 4)` and `font: inherit`, so it rises a quarter of the gap between the two middles, measured in the label's font. `expectOnSpaceScale` checks the box's centre a quarter of `1cap + 1ex` above the first baseline. concepts.md and the story JSDoc say where the box is centred, and the spec already records the decision.

**Acceptance criteria:**

- [x] SC 1 to 3 hold for Checkbox and Radio in all four projects, with SC 2 measured halfway between the capitals and the lowercase letters.
- [x] Checkbox and radio labels are still 24px tall, and Switch's track is still 2.75rem by 1.5rem.

**Verification:**

- [x] The updated alignment stories fail before the CSS change, by about 0.7px in `default` and 0.9px in `playful`
- [x] `pnpm test:storybook` on every story file that renders a choice control
- [x] By hand: screenshots of RadioGroup and stacked checkboxes in both themes for Checkpoint A

**Dependencies:** Task 3

**Files likely touched:**

- `src/components/ChoiceControl/ChoiceControl.module.css`
- `src/test/choiceControl.ts`
- `src/components/Checkbox/Checkbox.stories.tsx`, `src/components/Radio/Radio.stories.tsx` (JSDoc)
- `docs/design/concepts.md`, `SPEC.md`, `tasks/`

**Estimated scope:** S

## Checkpoint A: after Tasks 1 to 4

- [x] `pnpm verify` and the fallow audit pass
- [x] Every form story passes axe, including `target-size`, in all four projects
- [x] You review Checkbox, Radio and the Forms guide in Storybook before the halo goes in

## Task 5: Add the halo to Checkbox and Radio, with none on Switch

**Description:** The stylesheet gains the halo as the plan's Architecture Decisions set out: a `box-shadow` on an enabled input, spread by the gap, tinted with the text colour or, on a checked input, with the fill. Hover on the label (inside `@media (hover: hover)`) uses the 8% colour, and press uses the 16% one. `box-shadow` joins the input's transition. Switch's rule sets the spread to `0px`. A helper in `src/test/choiceControl.ts` reads the colour and spread from the computed `box-shadow`, and another drives real hover and press, as Button's `expectDistinctPointerStates` does. New `Halo` stories, last in their files, cover Checkbox and Radio unchecked, checked and disabled. A Switch story checks that hovering shows no halo. The spec's code sample is updated to the custom properties.

**Acceptance criteria:**

- [x] SC 5: with the pointer over the label text, the halo is spread by `space-2`, and rest, hover and press are each at least `distinctFillContrast` apart, unchecked and checked, for Checkbox and Radio in all four projects.
- [x] SC 6 and 7: the tint is primary when checked and text otherwise, checked with `isSameColor`, and a hovered disabled control has no `box-shadow`. The other half of SC 8: a hovered Switch has no halo.
- [x] concepts.md describes the halo: when it shows, its colours, that disabled controls and Switch have none, and that forced colours remove it. The halo fallback colours are checked by hand against the fallback page colour.

**Verification:**

- [x] `pnpm test:storybook src/components/Checkbox src/components/Radio src/components/Switch`
- [x] `pnpm test:unit src/components/Checkbox/Checkbox.test.tsx`
- [ ] By hand: hover and press in Storybook, both themes and modes

**Dependencies:** Task 4

**Files likely touched:**

- `src/components/ChoiceControl/ChoiceControl.module.css`
- `src/test/choiceControl.ts`
- `src/components/Checkbox/Checkbox.stories.tsx`, `src/components/Radio/Radio.stories.tsx`, `src/components/Switch/Switch.stories.tsx`
- `docs/design/concepts.md`, `SPEC.md`

**Estimated scope:** M

## Task 6: Check the halo in every palette

**Description:** The palette showcase gains a checked Checkbox beside its unchecked one. Its play function checks each palette's two checkboxes: transparent against `var(--sui-choice-control-halo-hover)`, and hover against `var(--sui-choice-control-halo-press)`, each at least `distinctFillContrast` with `fillContrast`. This is how it already checks every Button's hover fill. The spec's Testing Strategy and Success Criteria gain the check. This task depends on your answer to the plan's first open question.

**Acceptance criteria:**

- [ ] In all four projects, every palette's unchecked and checked halos clear `distinctFillContrast` from rest to hover and from hover to press.
- [ ] The palette showcase still passes axe.

**Verification:**

- [ ] `pnpm test:storybook src/styles/PaletteShowcase.stories.tsx`

**Dependencies:** Task 5

**Files likely touched:**

- `src/styles/PaletteShowcase.stories.tsx`
- `SPEC.md`

**Estimated scope:** S

## Checkpoint B: complete

- [ ] Spec success criteria 1 to 11 hold
- [ ] `pnpm verify`, `pnpm build` and the fallow audit pass
- [ ] You review the branch; pushing and opening a pull request wait for your go-ahead
