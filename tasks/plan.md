# Implementation Plan: Compact checkbox and radio

## Overview

Implements [SPEC.md](../SPEC.md). The box of a `Checkbox` or `Radio` shrinks to `space-4`, centred between the capital and lowercase letters of the label's first line, so the label text starts at `space-6` in every theme. Then a hover and press halo is added around the box. Every change is in `ChoiceControl.module.css`, and the checks are stories, because layout and paint can't be measured in jsdom. Tasks are in [todo.md](todo.md).

## Architecture Decisions

- **Centred between the capitals and the lowercase letters.** Checkpoint A found that a box centred on the line looks high against a long lowercase label, so Task 3 centred it on the lowercase letters with `vertical-align: middle` in an inline layout. That hung low beside short capitalised labels, so Task 4 lifts it halfway towards the capitals, as the spec's Centring decision sets out.
- **Two slices: size, then halo.** The size change is the risky one, because axe's `target-size` rule might reject a 16px input, so it lands and is checked first. The halo is independent of it and builds on the same helpers.
- **Hover and press colours are custom properties on the input.** `--_sui-choice-control-halo-hover` and `--_sui-choice-control-halo-press` hold the 8% and 16% mixes of the tint, as Button's `--sui-button-bg-hover` holds its hover fill. `:hover` and `:active` on the label point `--sui-choice-control-halo` at one of them. A story can then measure every palette's halo without moving the pointer, as the palette showcase does for Buttons. This replaces the strength variable in the spec's sample, with the same behaviour, so the spec's sample is updated to match in Task 5.

  ```css
  .input {
    --_sui-choice-control-halo: transparent;
    --_sui-choice-control-halo-hover: color-mix(in srgb, var(--_sui-choice-control-halo-tint) 8%, transparent);
    --_sui-choice-control-halo-press: color-mix(in srgb, var(--_sui-choice-control-halo-tint) 16%, transparent);
  }

  @media (hover: hover) {
    .choiceControl:hover .input {
      --_sui-choice-control-halo: var(--_sui-choice-control-halo-hover);
    }
  }

  .choiceControl:active .input {
    --_sui-choice-control-halo: var(--_sui-choice-control-halo-press);
  }

  .input:enabled {
    box-shadow: 0 0 0 var(--sui-choice-control-halo-spread) var(--_sui-choice-control-halo);
  }
  ```

- **Shared story helpers in `src/test/choiceControl.ts`.** Checkbox and Radio stories make the same measurements: a token resolved to pixels in the control's scope, the box's position against the label's first line and text, and the halo read from the computed `box-shadow`. The module is committed with its first consumer, because the fallow gate rejects a file nothing reachable imports.
- **Measured against resolved tokens.** Each assertion compares pixels with `--sui-space-4`, `--sui-space-6` and `--sui-space-2` resolved in the story's own theme, within 0.5px, so the same story passes in `default` (16, 24, 8) and `playful` (19.2, 28.8, 9.6).
- **Switch is pinned, not changed.** Its rule sets `--sui-choice-control-size: 1.5rem` and `--sui-choice-control-halo-spread: 0px`, so it looks the same as now.
- **Review fixes.** An independent review before the pull request found that `position: relative` changed the input's paint order and that a consumer's padding on the label moved the box. Task 7 lifts the box with a margin instead, guards the padding and inherited text alignment, makes the derived custom properties private, and adds right-to-left and hover-gate tests and the docs the review asked for.
- **Order.** The tasks touch the same stylesheet and story files, so they run in sequence, one commit each. `SPEC.md` and `tasks/` are committed with Task 1.

## Task List

### Phase 1: Compact box on the space scale

- [x] Task 1: Shrink and centre the box, and line Checkbox text up at `space-6`
- [x] Task 2: Check the Radio's alignment and that Switch is unchanged
- [x] Task 3: Centre the box on the lowercase letters
- [x] Task 4: Centre the box between the capitals and the lowercase letters

### Checkpoint A: after Tasks 1 to 4

- [x] `pnpm verify` and the fallow audit pass
- [x] Every form story passes axe, including `target-size`, in all four projects
- [x] You look at Checkbox, Radio and the Forms guide in Storybook, in both themes, before the halo goes in

### Phase 2: Hover and press halo

- [x] Task 5: Add the halo to Checkbox and Radio, with none on Switch
- [x] Task 6: Check the halo in every palette
- [x] Task 7: Apply the code review's fixes

### Checkpoint B: complete

- [x] Spec success criteria 1 to 16 hold
- [x] `pnpm verify`, `pnpm build` and the fallow audit pass
- [ ] You review the branch before anything is pushed

## Risks and Mitigations

| Risk                                                                                                                                                                  | Impact | Mitigation                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| axe's `target-size` rejects the 16px input, in `Stacked` (`gap={1}`) or elsewhere                                                                                     | High   | Task 1 runs every form story file before committing. Its spacing exception should pass: neighbouring inputs' centres are 28px apart, and 24px is needed. If it fails, stop and bring options rather than loosen the rule. |
| `vertical-align: middle` can't be checked in Firefox, because Playwright's Firefox does not launch here                                                               | Low    | It is CSS 2.1 and long supported. Chromium and WebKit agree to within 0.01px, and the alignment stories run in Chromium on every change.                                                                                  |
| Sub-pixel rounding at `playful`'s 19.2px box and 28.8px indent                                                                                                        | Low    | Assertions allow 0.5px.                                                                                                                                                                                                   |
| Real hover or press in a halo story changes later stories in the same file: `:hover` lingers, and `userEvent.tab()` stops giving `:focus-visible` after trusted input | Medium | Halo stories go last in their files and release the pointer in `finally`, as Button's do. A story that needs `:focus-visible` after them starts with `pressKey("Shift")`.                                                 |
| The primary halo is close to the 1.1:1 bar (lowest computed 1.112)                                                                                                    | Medium | Stories measure the real colours in Bright and Pop (Task 5) and the declared colours in all five palettes (Task 6). If one fails, stop and bring options rather than lower `distinctFillContrast`.                        |
| The reduced-motion unit test in `Checkbox.test.tsx` only allows colour transitions                                                                                    | Low    | The halo transitions `box-shadow`, whose spread never changes, only its colour. It is added to the input's transition, not the reduced-motion block, and the unit tests run in Tasks 1 and 5.                             |

## Open Questions

None. Task 6 stayed in the plan, and `tasks/` is committed with the spec.
