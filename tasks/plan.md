# Implementation Plan: Compact switch

## Overview

This plan implements [SPEC.md](../SPEC.md). The `Switch` track shrinks to `space-6` by `space-4`, so its label text starts at `space-8` in every theme. The thumb's travel becomes `space-2`, which keeps the `playful` spring inside the track, and the Checkbox's halo is turned on for Switch. Every change to the component is in the switch rule of `ChoiceControl.module.css`, and every check is a Switch story, because jsdom can't measure layout or paint. Tasks are in [todo.md](todo.md).

## Architecture Decisions

- **Three slices: size, thumb, halo.** The size change carries the layout risk and the most docs, so it goes first. The thumb needs no CSS of its own, since the smaller track brings the shorter travel, so its task only adds the proof. The halo is independent of both.
- **A thumb test that passes on arrival is proven against the old track.** The spec's rule is that every new test must be shown to fail without its fix. The `Thumb` story's fix is Task 1's track, so Task 2 proves the story by setting the track back to 2.75rem by 1.5rem for one run and watching it fail, then restores the track. `FocusedHalo` is handled the same way in Task 3. It is proven by removing the existing `.choiceControl .input:focus-visible` rule for one run.
- **`expectOnSpaceScale` takes an options object.** The box width and the indent default to `var(--sui-space-4)` and `var(--sui-space-6)`, so no Checkbox or Radio call changes. The options type is not exported, because callers pass an object literal and the fallow gate fails on an export nothing imports.
- **The thumb is read from the `::before` computed style.** A pseudo-element has no bounding box, so a story reads the thumb's size from its computed `inline-size` and its travel from the `m41` of its computed `transform`. Helpers that only Switch stories use stay in `Switch.stories.tsx`.
- **The overshoot is sampled, not computed.** The story checks the switch with a click and finds the `transform` transition on its `::before`. It pauses the transition and steps `currentTime` through its duration, reading the transform at each step. This measures whatever easing the theme sets, not a copy of the `linear()` peak, so changing the spring can't silently invalidate it.
- **Halo stories go last in the file.** As in Checkbox's file, `Halo` and `FocusedHalo` use real pointer input, which leaves `:hover` behind and stops `userEvent.tab()` giving `:focus-visible` to later stories.

## Task List

### Phase 1: Size and thumb

- [x] Task 1: Shrink the track and start the text at `space-8`
- [ ] Task 2: Prove the thumb's size, travel and overshoot

### Checkpoint A: after Tasks 1 and 2

- [ ] `pnpm verify` and the fallow audit pass
- [ ] Every story that renders a Switch passes axe, including `target-size`, in all four projects

### Phase 2: Halo

- [ ] Task 3: Turn on the halo for Switch

### Checkpoint B: complete

- [ ] Spec success criteria 1 to 14 hold
- [ ] `pnpm verify`, `pnpm build` and the fallow audit pass
- [ ] Screenshots of the Switch stories in both themes and modes, under forced colours, and in WebKit, published for your review
- [ ] You review the branch before anything is pushed

## Risks and Mitigations

| Risk                                                                                                                           | Impact | Mitigation                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getAnimations({ subtree: true })` does not return the `::before` transition, or pausing it does not update its computed style | Medium | Fall back to `document.getAnimations()`, filtered on `effect.target` and `effect.pseudoElement`. If no Chromium API can seek the transition, stop and bring options, rather than check only the end position. |
| The `playful` overshoot margin is small: 1.6px against a 2px inset                                                             | Low    | Measured, not computed, so a change to the spring or the inset fails the story. Sampling in 2% steps gets within a few hundredths of a pixel of the 38% peak.                                                 |
| Real hover or press in a halo story changes later stories in the same file                                                     | Medium | `Halo` and `FocusedHalo` go last and release the pointer in `finally`, through `expectDistinctHaloStates`. A story that needs `:focus-visible` after them starts with `pressKey("Shift")`.                    |
| Sub-pixel rounding in `playful` (28.8px track, 19.2px height, 38.4px indent)                                                   | Low    | Assertions allow 0.5px, as Checkbox's do.                                                                                                                                                                     |
| A smaller switch fails axe's `target-size` somewhere                                                                           | Low    | A one-line label is 24px tall and at least 24px wide, so it passes on its own. Task 1 runs every story file that renders a Switch.                                                                            |
| Firefox can't be checked, because Playwright's Firefox does not launch here                                                    | Low    | The layout is the one Checkbox and Radio use, and Chromium and WebKit agree on it. WebKit is checked by hand at Checkpoint B.                                                                                 |
| A consumer that padded text by hand to 52px under a switch                                                                     | Low    | Forms.mdx and concepts.md give `var(--sui-space-8)`, and the spec records the change for the release notes.                                                                                                   |

## Open Questions

None. The plan and the task list are committed with the spec in Task 1.
