# Spec: Compact switch

PR #50 (8b4fe25) put `Checkbox` and `Radio` on the space scale and gave them a hover halo, and left `Switch` as it was. Its 2.75rem by 1.5rem track now looks heavy beside a 16px box. Its text starts at 52px in `default` and 53.6px in `playful`, which is not a space token, its label is 25.06px tall in `default`, and it has no halo. This change brings Switch in line with Checkbox and Radio. Track B, halo H1 and the 0.125rem thumb inset were chosen from prototypes reviewed in conversation.

## Objective

1. **A smaller track.** The track shrinks from a fixed 2.75rem by 1.5rem to `--sui-space-6` by `--sui-space-4`: 24 by 16px in `default` and 28.8 by 19.2px in `playful`. It is as tall as a Checkbox's box and centred the same way, so a one-line label is one line tall.
2. **Text on the space scale.** The gap stays `--sui-space-2`, so the label text starts `--sui-space-8` from the track's start edge in every theme. Text under a Switch lines up with its label when it is padded by `var(--sui-space-8)`.
3. **The halo.** Hovering anywhere on the label of an enabled Switch tints the Checkbox's halo around the track, a pill spread by the gap. Pressing darkens it.
4. **A thumb that stays inside the track.** The thumb keeps its 0.125rem inset and travels `--sui-space-2`, so the `playful` spring no longer carries it into the border.

Users are app developers building with StylesUI. Success looks like this: in a settings list that mixes switches, checkboxes and radios with descriptions, every control is in proportion to its text, every edge sits on a space token, and every control responds to the pointer in the same way.

## Decisions

- **Track.** The switch rule no longer pins `--sui-choice-control-size`, so the track is as tall as a Checkbox's box (`var(--sui-space-4, 1rem)`). It sets `--sui-choice-control-track-size: var(--sui-space-6, 1.5rem)`, a 3:2 pill. Tying both to the space scale is what puts the text on a token in every theme. The prototypes rejected three alternatives:
  - `space-7` by `space-4` with a `space-1` gap: its text is also at `space-8`, but its gap and halo differ from Checkbox's, and the `playful` spring overshoots 0.3px into the border.
  - `space-8` by `space-4`: its text starts at 40px in `default` and 48px in `playful`, which is not a token unless the scale gains a `space-10`.
  - Today's track.
- **Text start.** The `space-6` track plus the `space-2` gap put the text at `space-8`, which is `space-2` after a Checkbox's or Radio's text. A track wider than the box cannot share their `space-6`. Text placed under a Switch is padded by `var(--sui-space-8)`.
- **Centring.** The mechanism is unchanged. The track is centred halfway between the middles of the capitals and the lowercase letters of the label's first line. At 16px it no longer overhangs the 24px line, so the label is 24px tall, down from 25.06px in `default` and 24.2px in `playful`.
- **Thumb.** The size formula is unchanged: the track's height, less twice the border width and twice the 0.125rem inset. That gives 10px in `default` and 11.2px in `playful`. The travel is the track's width less its height, `space-2`: 8px and 9.6px. The `playful` spring peaks at 116.2% of the travel, so the thumb overshoots by 1.6px, inside its 2px inset. Today's 20px travel overshoots by 3.2px, which is 1.2px into the 2px border. Insets of 1px and 3px were rejected.
- **Halo.** The switch rule no longer sets `--sui-choice-control-halo-spread: 0px`, so the Checkbox's halo applies unchanged:
  - It is a box-shadow spread by the gap that follows the track's pill radius: 40 by 32px in `default`, the same 32px height as a Checkbox's or Radio's halo.
  - It is tinted with the text colour when unchecked and the primary colour when checked, at 8% on hover and 16% while pressed.
  - Hover is gated on `@media (hover: hover)`.
  - A disabled Switch has none.
  - A focused Switch has none and does not transition its `box-shadow`.

  A halo on the thumb, as MUI draws, was rejected for three reasons. It needs a second shadow on the `::before` pseudo-element and a second path through the tests, and it tints the track around the thumb.

- **Focus ring.** Unchanged: 2px (3px in `playful`) at a 2px offset on the input, around the track. It ends 4px (5px) past the track, before the text at 8px (9.6px).
- **Target size.** The label is one line tall: 24px at 16px text. A Switch named by `aria-label` alone is a 24 by 24px target in `default` and 28.8 by 24px in `playful`. Unlike a Checkbox named that way, it meets WCAG 2.5.8 without extra spacing.
- **Right to left.** The track sits at the right, and the existing `:dir(rtl)` rule reverses the thumb's travel. The text starts `space-8` to the left of the track's right edge.
- **Reduced motion.** Unchanged: only colours transition, so the thumb jumps. The existing stylesheet test in `Checkbox.test.tsx` covers every kind of control.
- **Forced colours.** Unchanged: the track and thumb use system colours, and the browser removes box-shadows, so there is no halo. Checked in the prototypes with Chromium's forced-colours emulation. No story project runs in forced colours.
- **Measuring helper.** `expectOnSpaceScale` measures a Checkbox's or Radio's box. It gains the box's width and the text's indent as lengths, with defaults of `var(--sui-space-4)` and `var(--sui-space-6)`. Switch stories pass `var(--sui-space-6)` and `var(--sui-space-8)` and get the same checks. The options type, `SpaceScaleLayout`, is exported, so a story declares its layout with `satisfies` and a misspelt key fails to compile.
- **No new props or tokens.** `--sui-choice-control-track-size` is already public. As with a Checkbox, `--sui-choice-control-halo-spread: 0px` on the label turns the halo off. The palette showcase keeps measuring only checkboxes, because a switch declares its halo colours through the same rules.
- **Visual change for consumers.** Every Switch shrinks, its text starts 20px sooner in `default` and 15.2px sooner in `playful`, and it gains a halo. Text that was padded by hand to line up under a switch needs `var(--sui-space-8)`. The release notes say so when a release is cut. No version bump.
- **Shared halo story steps.** The Checkbox, Radio and Switch `Halo` stories call one helper, `expectHaloStates`, and the Checkbox and Switch `FocusedHalo` stories call `expectHaloHiddenUnderFocus`, both in `src/test/choiceControl.ts`. The helpers only they use are no longer exported. `expectHaloHiddenUnderFocus` also checks that the halo has a spread before focus, because a 0px halo still declares its colour. Checkbox's `Halo` measures the checked control first, as Radio's did, because pressing an unchecked radio checks it.
- **Prototypes.** `src/components/Switch/SwitchPrototypes.stories.tsx` is a scratch file for the review and is deleted before the first commit.
- One pull request, one commit per task.

## Tech Stack

React 19, TypeScript 7, Vite 8 (rolldown) library mode, CSS modules and custom properties, Vitest 5 (a jsdom unit project and four Chromium storybook projects), Storybook 10, oxlint and oxfmt, pnpm. No new dependencies.

## Commands

```sh
pnpm verify                                                        # lint, format check, typecheck, every test; before every commit
pnpm test:storybook src/components/Switch/Switch.stories.tsx       # one story file, in all four projects
pnpm test:storybook src/components/Checkbox src/components/Radio   # the helper's defaults keep these passing
pnpm build                                                         # dist/
fallow audit --format json --quiet --explain --gate-marker agent   # before every commit
```

## Project Structure

```
src/components/ChoiceControl/ChoiceControl.module.css  ← Switch's track size and halo
src/test/choiceControl.ts                              ← expectOnSpaceScale takes the box width and the indent; shared halo steps
src/components/Switch/Switch.stories.tsx               ← size, alignment, thumb, halo, focus, right to left, no text
src/components/{Checkbox,Radio}/*.stories.tsx          ← Halo and FocusedHalo through the shared halo steps
src/docs/Forms.mdx                                     ← lining text up under a switch, its target size
docs/design/concepts.md                                ← Forms section
.design-sync/conventions.md                            ← the space-8 rule for a switch
AGENTS.md                                              ← expectOnSpaceScale's width and indent
SPEC.md, tasks/                                        ← this spec and its plan
```

## Code Style

Follow `docs/standards/`. Every token read keeps a literal fallback equal to the `default` theme's value. The switch rule loses its size and halo overrides:

```css
.choiceControl[data-kind="switch"] {
  --sui-choice-control-track-size: var(--sui-space-6, 1.5rem);
  --sui-choice-control-radius: var(--sui-radius-full, 9999px);
  --sui-choice-control-mark-unchecked: var(--sui-color-input-border, #6b7280);
  --sui-choice-control-mark-size: calc(
    var(--sui-choice-control-size) - 2 * var(--sui-choice-control-border-width) - 2 *
      var(--sui-choice-control-mark-inset)
  );
  --sui-choice-control-mark-shape: none;
  --sui-choice-control-mark-radius: 50%;
  --sui-choice-control-mark-justify: start;
  --sui-choice-control-mark-inset: 0.125rem;
  --sui-choice-control-mark-transform: translateX(
    calc(var(--sui-choice-control-track-size) - var(--sui-choice-control-size))
  );
  --sui-choice-control-mark-transform-unchecked: none;
}
```

The helper takes the layout to measure against as an options object with defaults, so existing calls don't change:

```ts
/**
 * Where a choice control's box and text sit on the space scale
 */
export interface SpaceScaleLayout {
  /**
   * Width of the box, such as `"var(--sui-space-6)"` for a switch's track; defaults to `--sui-space-4`
   */
  boxWidth?: string;

  /**
   * How far every line of the text starts from the box's start edge; defaults to `--sui-space-6`
   */
  indent?: string;
}

export async function expectOnSpaceScale(
  input: HTMLInputElement,
  text: HTMLElement,
  { boxWidth = "var(--sui-space-4)", indent = "var(--sui-space-6)" }: SpaceScaleLayout = {}
): Promise<void>;
```

## Testing Strategy

- **Stories (Chromium, all four mode and theme projects).** Layout and paint can't be measured in jsdom, so the new checks are Switch stories. Each one compares measured pixels with the tokens resolved in the story's own theme, so the same assertions hold in `default` and `playful`.
  - `Stacked`: the track is the resolved `space-6` by `space-4`. Each label is at least 24px tall and as wide as its track plus its text.
  - `AlignedText` (new): a one-line label and a wrapping one pass `expectOnSpaceScale` with `space-6` and `space-8`. A `Text` padded by `var(--sui-space-8)` starts where the label text does, and the one-line label is exactly one line tall.
  - `RightToLeft` (new): `AlignedText` inside `dir="rtl"`, and a checked thumb moves left.
  - `WithoutText` (new): a Switch named by `aria-label` alone has a label as wide as its track and at least 24px in both dimensions.
  - `Thumb` (new): the thumb's size and travel are read from the `::before` computed style. The checking transition's transform is paused at steps through its duration, and at each step the thumb's far edge must be inside the inner edge of the track's border. Under reduced motion, where the thumb jumps, the sampling is skipped, so the story doesn't throw in Storybook.
  - `Halo` replaces `NoHalo`, as Checkbox's `Halo` does: real hover and press through `expectDistinctHaloStates`, unchecked and checked, and no halo on a disabled switch.
  - `FocusedHalo` (new), as Checkbox's: no halo and no `box-shadow` transition under keyboard focus, and a 3:1 ring on a surface.
  - `KeyboardInteraction` adds that the ring ends before the label text.
  - axe, including `target-size`, keeps passing on every Switch, Field, Fieldset and contact form story.
  - Checkbox and Radio stories keep every check they had, through `expectOnSpaceScale`'s defaults and the shared halo steps.
- **Unit (jsdom).** The existing stylesheet tests in `Checkbox.test.tsx` keep passing: no `outline` or `all` transition, only colour transitions under reduced motion, and every `:hover` rule inside `@media (hover: hover)`. No new unit tests.
- **By hand.** Before the pull request: forced colours in Chromium, and a pass in WebKit, from screenshots in both themes and modes.

## Boundaries

- **Always:** run `pnpm verify` and the fallow audit before every commit. Give every token read a literal fallback. Keep the docs in the same commit as the behaviour they describe. Prove each new test fails without its fix.
- **Ask first:** pushing or opening a pull request; bumping the version or publishing; a Claude Design sync; adding a space token; changing a Checkbox's or Radio's size, gap or halo; adding a prop.
- **Never:** lower a contrast threshold, skip an assertion or set a story to `a11y.test: "todo"`; change `SegmentedControl`; edit `dist/`; hand-write a dependency version; commit the prototype story.

## Success Criteria

### Size and alignment

1. In every storybook project, a Switch's track is as wide as the resolved `--sui-space-6` and as tall as the resolved `--sui-space-4`, within 0.5px. Proven by `Stacked` and `AlignedText`.
2. The track's vertical centre is within 0.5px of the point halfway between the middles of the capitals and the lowercase letters on the label's first line, on a one-line label and on one that wraps. Proven by `AlignedText`.
3. Every line of the label text starts the resolved `--sui-space-8` from the track's start edge, within 0.5px. A `Text` padded by `var(--sui-space-8)` under the switch starts within 0.5px of it. Proven by `AlignedText`.
4. A one-line label is one line tall, within 0.5px. Each label in `Stacked` is at least 24px tall and as wide as its track plus its text. Proven by `AlignedText` and `Stacked`.
5. In a right-to-left layout, criteria 1 to 3 hold, measured from the track's right edge. Proven by `RightToLeft`.
6. A Switch named by `aria-label` alone has a label as wide as its track, within 0.5px, and at least 24px in both dimensions. Proven by `WithoutText`.

### Thumb

7. The thumb is as wide as the track's height less twice the border width and twice 0.125rem, within 0.5px. A checked thumb is translated by the resolved `--sui-space-2` towards the end of the track: right in a left-to-right layout and left in a right-to-left one. Proven by `Thumb` and `RightToLeft`.
8. At every sampled step of the checking transition, the thumb's far edge is inside the inner edge of the track's border. With today's track this fails in the `playful` projects. Proven by `Thumb`.

### Halo

9. At rest the input's box-shadow colour is transparent. With the pointer over the label text, the halo spreads by the resolved `--sui-space-2`. Its colour is the 8% mix of `--sui-color-text` when unchecked or `--sui-color-primary` when checked, checked with `isSameColor`, and it differs from rest by at least `distinctFillContrast`. While pressed it is the 16% mix and differs from hover by at least `distinctFillContrast`. Proven for unchecked and checked in all four projects by `Halo`.
10. A disabled Switch's box-shadow is `none` while hovered. Proven by `Halo`.
11. A Switch with keyboard focus draws no halo while hovered and does not transition its `box-shadow`, and on a surface its focus ring keeps 3:1. Proven by `FocusedHalo`.

### Focus

12. `KeyboardInteraction` still passes its focus ring width and 3:1 contrast checks. The ring's end edge (track edge plus `outline-offset` plus `outline-width`) is before the label text's start edge.

### Docs and whole change

13. The docs are updated:
    - `docs/design/concepts.md` gives the track size, the `space-8` text start, the thumb's travel and inset, and the Switch's halo. It no longer says the track stays 2.75rem by 1.5rem or that a Switch has no halo.
    - `src/docs/Forms.mdx` shows lining text up under a switch with `var(--sui-space-8)`, embedding the Switch `AlignedText` story, and gives the target size of a switch without text.
    - `.design-sync/conventions.md` states the `space-8` rule.
    - AGENTS.md describes `expectOnSpaceScale`'s width and indent.
14. The Checkbox and Radio stories keep every check they had, through `expectOnSpaceScale`'s defaults and the shared halo steps. `pnpm verify`, `pnpm build` and the fallow audit pass.

## Open Questions

None.
