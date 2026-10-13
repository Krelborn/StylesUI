# Spec: Compact checkbox and radio

On `@krelborn/stylesui` 0.7.0, a `Checkbox` or `Radio` draws a 24px box beside 16px text, which looks too big. This change shrinks the box, adds a hover halo like MUI's, and puts every edge on the space scale. Option B and focus option F1 were chosen from prototypes reviewed in conversation.

## Objective

1. **A smaller box.** The box or dot of a `Checkbox` or `Radio` shrinks from a fixed 1.5rem to `--sui-space-4`, centred halfway between the capital and the lowercase letters of the first line of its label.
2. **Edges on the space scale.** The label text starts `--sui-space-6` from the box's start edge in every theme: `--sui-space-4` box plus `--sui-space-2` gap. Text placed under a control lines up with the label when it is padded by `var(--sui-space-6)`. Today the text starts at 32px in `default` (`space-8`) and 33.6px in `playful` (`space-7`), so no single token lines it up.
3. **A hover halo.** Hovering anywhere on the label tints a halo around the box that fills the gap, and pressing darkens it, like MUI's. The halo is painted, not laid out, so it never moves anything.
4. **Focus unchanged.** The focus ring stays as it is (option F1): 2px (3px in `playful`) at a 2px offset on the input. It clears the label text in both themes.

Users are app developers building with StylesUI. Success looks like this: a settings list of checkboxes and radios with descriptions lines up on space tokens in both themes, and the controls look in proportion to their text.

## Decisions

- **The input stays the box.** The box, dot and halo are all drawn on the native input, as now, so its border, focus ring and the contrast tests that measure them carry over. The rejected alternative is MUI's: an input the size of the hit area, with the box drawn inside it. That would move the border onto a pseudo-element, which `borderContrast` cannot measure.
- **Size.** `--sui-choice-control-size` becomes `var(--sui-space-4, 1rem)`: 16px in `default` and 19.2px in `playful`. The gap stays `var(--sui-space-2, 0.5rem)`. Tying the box to the space scale, not to `em`, is what keeps the label at `space-6` in both themes.
- **Centring.** The box's centre sits halfway between the middle of the capitals and the middle of the lowercase letters on the label's first line, `(1cap + 1ex) / 4` above the baseline, so it looks centred against short capitalised labels such as "Email" and long lowercase ones alike. Reviewed in Storybook at Checkpoint A against two alternatives: centred on the lowercase letters, it hung low beside short capitalised labels, and centred on the capitals it looked slightly high. Centring on the line, as first built, lands near the capitals in `default` only because of system-ui's measurements. The label is an `inline-block` with `--_sui-choice-control-indent` (the box's width plus the gap) of inline-start padding, but only when it has text, so a control named by `aria-label` alone is as wide as its box. The input is an `inline-grid` pulled back into that padding by a negative margin, with `vertical-align: middle`, which CSS defines as centring a box's margin box on the middle of the parent's lowercase letters (half an `ex` above the baseline). A block-start margin of `calc((1ex - 1cap) / 2)` then lifts the border box a quarter of the gap between the two, and the input sets `font: inherit` so those units measure the label's font. The lift is a margin, not a `position: relative` offset, because a positioned input paints over later positioned content, such as a sticky table header without a `z-index`, that it used to pass under. `cap` needs Chrome 118, Firefox 97 and Safari 17.2, within the `build.cssTarget` floor. The label sets `text-align: start` and `text-indent: 0`, so alignment inherited from a parent cannot move the box, and wrapped lines start at the padding, under the first line's text. Checked in Chromium and WebKit, where the box lands within 0.01px of its target in both themes. Playwright's Firefox does not launch here.
- **The halo is a box-shadow.** It is `0 0 0 var(--sui-choice-control-halo-spread)`, with the spread equal to the gap, so it stops exactly where the text starts. It follows the box's shape: a rounded square around a checkbox and a circle around a radio. MUI's circle around a checkbox (prototype B2) was not chosen. No `:has()` is needed, which matters because Firefox 120 lacks it.
- **Halo colours.** The halo tints with `--sui-color-text` around an unchecked box, and with `--sui-choice-control-fill` (primary) around a checked one. It is 8% on hover and 16% while pressed, the strengths the ghost Button uses. Computed from every palette, light and dark, on the page and on a surface, the lowest step is 1.112:1, primary in Bright light on a surface, against the 1.1:1 `distinctFillContrast` a change of state needs. The stories measure the real values.
- **When the halo shows.** Hover anywhere on the label shows it, not only hover on the box, because the whole label is the click target. Hover is gated by `@media (hover: hover)`, as Button's lift is, so a tap on a touch screen doesn't leave a halo behind. Press shows on every device. A disabled input has no halo. Under forced colours the browser removes box-shadows, so the halo disappears and the rest is unchanged.
- **Click target.** The click target stays the label: box, gap and text, one line tall (24px at 16px text). The part of the halo outside the label is not clickable. A control named by `aria-label` alone is a 16px box in a 16px by 24px label, down from 24px square, so it meets WCAG 2.5.8 through spacing: neighbouring controls need 24px between their centres.
- **The label holds the box in its padding.** The inline-start padding is set by two classes (`.choiceControl.withText`), so a consumer's single class cannot override it, but padding in the `style` prop still can, and moves the box out of the label. The label's text is inline content, as HTML requires of a `label`: a child laid out as a block, such as a `Stack`, drops below the box. A description goes after the control, outside the label, padded by `var(--sui-space-6)` and linked with `aria-describedby`. A layout that keeps block children beside the box, an `inline-block` text span with `baseline-source: first`, failed in WebKit, which ignores `baseline-source`.
- **Switch keeps its size.** `Switch` shares ChoiceControl but keeps its 2.75rem by 1.5rem track and its gap, and shows no halo (`--sui-choice-control-halo-spread: 0px`). It takes the same centring, so its track moves down about 1.1px in `default`, and its label grows to about 25.1px tall, because a 24px track laid out on the lowercase letters overhangs a 24px line. The Switch follow-up revisits its size.
- **No new public props or tokens.** This change adds no `description` prop and no space token. Text padded by `var(--sui-space-6)` already lines up under a control, and the Forms guide documents it. A `description` prop is not planned. Of the new custom properties, only `--sui-choice-control-halo-spread` is public: set on the label, `0px` turns the halo off. The derived and state values, `--_sui-choice-control-indent`, `-halo`, `-halo-hover`, `-halo-press` and `-halo-tint`, take the private `--_sui-` prefix, which only palettes used before.
- **No version bump.** The version is bumped when a release is cut, which won't follow this change straight away.
- One pull request, one commit per task.

## Tech Stack

React 19, TypeScript 7, Vite 8 (rolldown) library mode, CSS modules and custom properties, Vitest 5 (a jsdom unit project and four Chromium storybook projects), Storybook 10, oxlint and oxfmt, pnpm. No new dependencies.

## Commands

```sh
pnpm verify                                                        # lint, format check, typecheck, every test; before every commit
pnpm test:storybook src/components/Checkbox/Checkbox.stories.tsx   # one story file, in all four projects
pnpm test:unit src/components/Checkbox/Checkbox.test.tsx           # one unit test file
pnpm build                                                         # dist/
fallow audit --format json --quiet --explain --gate-marker agent   # before every commit
```

## Project Structure

```
src/components/ChoiceControl/ChoiceControl.module.css  ← size, centring, halo, Switch overrides
src/components/ChoiceControl/ChoiceControl.tsx          ← a class for a label that has text
src/components/Checkbox/Checkbox.test.tsx               ← the hover gate on the stylesheet
src/components/{Checkbox,Radio,Switch}/*.tsx           ← children JSDoc: inline content only
AGENTS.md                                              ← the test helpers and the private --_sui- prefix
src/components/Checkbox/Checkbox.stories.tsx           ← alignment, halo, Stacked, KeyboardInteraction
src/components/Radio/Radio.stories.tsx                 ← alignment, halo
src/components/Switch/Switch.stories.tsx               ← unchanged size, no halo, Stacked wording
src/docs/Forms.mdx                                     ← lining text up under a control
docs/design/concepts.md                                ← Forms section
.design-sync/conventions.md                            ← the space-6 rule for forms
```

## Code Style

Follow `docs/standards/`. Every token read keeps a literal fallback equal to the `default` theme's or Bright's light value:

```css
.choiceControl {
  --sui-choice-control-size: var(--sui-space-4, 1rem);
  --sui-choice-control-gap: var(--sui-space-2, 0.5rem);
  --sui-choice-control-halo-spread: var(--sui-choice-control-gap);
  --_sui-choice-control-halo-tint: var(--sui-color-text, #111827);
}

.input {
  --_sui-choice-control-halo: transparent;
  --_sui-choice-control-halo-hover: color-mix(in srgb, var(--_sui-choice-control-halo-tint) 8%, transparent);
  --_sui-choice-control-halo-press: color-mix(in srgb, var(--_sui-choice-control-halo-tint) 16%, transparent);
}

.input:checked {
  --_sui-choice-control-halo-tint: var(--sui-choice-control-fill);
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

## Testing Strategy

- **Stories (Chromium, all four mode and theme projects).** Layout and paint can't be measured in jsdom, so the new checks are stories. Each one compares measured pixels with the tokens resolved in the story's own theme, so the same assertions hold in `default` and `playful`.
  - Checkbox and Radio alignment: the box is `space-4` square and centred halfway between the capitals and the lowercase letters of the label's first line, including on a label that wraps, and the label text starts `space-6` from the box. Text padded by `var(--sui-space-6)` below the control starts where the label text does.
  - Checkbox and Radio halo, with real pointer input (`hoverByTestId`, `holdPointerByTestId`, as Button's `expectDistinctPointerStates` does): hovering the label text spreads the halo by `space-2`. Rest, hover and press are each at least `distinctFillContrast` apart, measured with `fillContrast` against the background behind the control, unchecked and checked. A disabled control has no halo.
  - `KeyboardInteraction` keeps its focus ring assertions, and Checkbox's adds that the ring ends before the label text starts.
  - Switch: the track is still 2.75rem by 1.5rem, and hovering it shows no halo.
  - Palette showcase: in all five palettes, the hover and press halos an unchecked and a checked checkbox declare are each at least `distinctFillContrast` from the step before, as it checks every Button's hover fill. The story projects only run Bright and Pop.
  - axe, including `target-size`, keeps passing on every Checkbox, Radio, RadioGroup, Switch, Field and Fieldset story.
  - Review fixes: the input is not positioned; a label padded through a consumer class and a wrapping label under a centred parent keep the box inside the label and their text at `space-6`; and a right-to-left layout passes the same alignment checks, measured from the box's right edge.
- **Unit (jsdom).** The existing stylesheet tests in `Checkbox.test.tsx` keep passing: no `outline` or `all` transition, and only colour transitions under reduced motion. A new one fails if a `:hover` rule sits outside `@media (hover: hover)`, which no story can catch, because the test browser can hover.
- **By hand.** The halo fallback colours against the fallback page colour, as AGENTS.md requires.

## Boundaries

- **Always:** run `pnpm verify` and the fallow audit before every commit. Give every token read a literal fallback. Keep the docs in the same commit as the behaviour they describe.
- **Ask first:** pushing or opening a pull request; bumping the version or publishing; a Claude Design sync; adding a space token; changing `Switch`'s size or giving it a halo; adding a `description` prop.
- **Never:** lower a contrast threshold, skip an assertion or set a story to `a11y.test: "todo"`; change `SegmentedControl`; edit `dist/`; hand-write a dependency version.

## Success Criteria

### Size and alignment

1. In every storybook project, a Checkbox's and a Radio's input is as wide and as tall as the resolved `--sui-space-4`, within 0.5px.
2. The input's vertical centre is within 0.5px of the point halfway between the middles of the capitals and the lowercase letters on the label's first line, a quarter of the resolved `1cap + 1ex` above its baseline, on a one-line label and on one that wraps.
3. The label text's start edge is the resolved `--sui-space-6` from the input's start edge, within 0.5px, and a `Text` padded by `var(--sui-space-6)` under the control starts within 0.5px of it.
4. The Checkbox `Stacked` story still finds each label as wide as its input plus its text, and each label at least 24px tall. Its JSDoc and Switch's say the label is the 24px target. A Checkbox named by `aria-label` alone has a label as wide as its box.

### Halo

5. At rest, the input's box-shadow colour is transparent. With the pointer over the label text, it is spread by the resolved `--sui-space-2`, and its colour differs from rest by at least `distinctFillContrast`. While pressed, it differs from hover by at least `distinctFillContrast`. Proven for unchecked and checked, Checkbox and Radio, in all four projects. The palette showcase proves the same steps for the colours an unchecked and a checked checkbox declare, in all five palettes.
6. A checked control's halo is tinted with `--sui-color-primary`, and an unchecked one's with `--sui-color-text`, checked with `isSameColor` against the mixes the stylesheet declares.
7. A disabled Checkbox's and Radio's box-shadow is `none` while hovered.
8. A Switch's track is 2.75rem by 1.5rem and shows no halo while hovered.

### Focus

9. Every `KeyboardInteraction` story still passes its focus ring width and 3:1 contrast checks, and in Checkbox's the ring's end edge (input edge plus `outline-offset` plus `outline-width`) is before the label text's start edge.

### Docs and whole change

10. `docs/design/concepts.md` describes the box size, the centring, the `space-6` alignment and the halo, including when it shows, its colours and that Switch has none. `src/docs/Forms.mdx` shows lining text up under a control with `var(--sui-space-6)`, embedding the alignment story. `.design-sync/conventions.md` states the `space-6` rule.
11. `pnpm verify` and `pnpm build` pass, and the fallow audit passes.

### Review fixes

12. The input is not positioned: its `position` is `static`, checked in the Checkbox `AlignedText` story.
13. A label padded through a consumer's class, and a wrapping label under a parent with `text-align: center`, keep the box inside the label, their text at `space-6`, and wrapped lines under the first line's text. Proven by a Checkbox `OuterStyles` story.
14. In a right-to-left layout, criteria 1 to 3 hold, measured from the box's right edge. Proven by a Checkbox `RightToLeft` story.
15. A unit test in `Checkbox.test.tsx` fails if a `:hover` rule in the ChoiceControl stylesheet sits outside `@media (hover: hover)`.
16. concepts.md and the Checkbox, Radio and Switch `children` JSDoc say the label's text is inline content and descriptions go outside the label. concepts.md and Forms.mdx give the target size of a control without text, and Forms.mdx says to link a description with `aria-describedby`. AGENTS.md describes `src/test/choiceControl.ts`, the private `--_sui-` prefix in components, and that an element inside an `input` gets no computed style.

## Follow-ups

- **Switch.** Once this change lands, a new thread takes `Switch` through its own spec, so it matches the new Checkbox and Radio for consistency and polish. Next to a 16px box, its 44 by 24 track may look heavy, and it has no halo. Its label can't start at a single space token unless the scale gains a `space-10`.

## Open Questions

None.
