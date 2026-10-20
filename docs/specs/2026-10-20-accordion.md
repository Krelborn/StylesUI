# Spec: Accordion

StylesUI has no way to show and hide sections of content. Apps need one for inspector panels, where many dense sections stay open at once and carry their own actions, and websites need one for rich content such as FAQs and settings pages. This spec adds `Accordion` and `AccordionItem`. The looks, the indicator choices and the API were chosen in conversation from an interactive mockup: flush sections for inspectors, contained items (joined or separated) for content, and a chevron or plus/minus indicator whose position each look fixes.

## Objective

1. **One accordion, three looks.** `flush` is dense rows split by dividers, for inspectors and sidebars. `joined` puts every item in one bordered box, for settings pages and short FAQs. `separated` makes each item a card, for content pages. All three share one behaviour and work in both themes, every palette and both modes.
2. **The WAI-ARIA accordion pattern.** Each header is a heading at the level the page outline needs, holding a native `button` with `aria-expanded` and `aria-controls`. Panels can be named regions. The headers of one accordion are linked by the arrow keys.
3. **Content stays findable.** A closed panel keeps its content in the document under `hidden="until-found"`, so find-in-page and a link to a fragment inside it open it. Closed panels print open.
4. **Rich headers.** A header holds a title, an optional description and optional trailing content such as a value or a `Counter`, all inside the toggle, and optional actions beside the toggle.
5. **One open or many.** Any number of items can be open, or with `exclusive` at most one.

Users are app developers building with StylesUI. Success looks like this: an inspector with a dozen sections, a FAQ page and a settings page are each built from the same two components, every one works from the keyboard and with a screen reader's heading navigation, and find-in-page reaches text in a closed section.

## Assumptions

1. One pull request, one commit per task, as for earlier specs.
2. No new dependencies. The chevron is `ChevronDownIcon`. The plus/minus indicator is drawn from Lucide's `plus` shapes, which `AddIcon` already copies, inside the internal `Icon`.
3. React 19.3 does not render `hidden="until-found"` (it treats `hidden` as a boolean) and has no `onBeforeMatch` prop, so the panel's `hidden` attribute and its `beforematch` listener are set from an effect on a ref.
4. `hidden="until-found"` and `beforematch` have been Baseline since December 2025. Height animation needs `interpolate-size`, which only Chromium supports, so Firefox and Safari open and close a panel at once. No polyfill.
5. The default look is `flush` and the default size `md`, as `Tabs` defaults to its lighter look.

## API

```tsx
// An inspector
<Accordion defaultValue={["layout", "fill"]} headingLevel={3} size="sm" variant="flush">
  <AccordionItem title="Layout" trailing="Fixed" value="layout">
    <LayoutFields />
  </AccordionItem>
  <AccordionItem
    actions={
      // oxlint-disable-next-line jsx-a11y/control-has-associated-label -- label names the IconButton
      <IconButton label="Add fill" size="sm">
        <AddIcon />
      </IconButton>
    }
    title="Fill"
    value="fill"
  >
    <FillList />
  </AccordionItem>
  <AccordionItem disabled={true} title="Prototype" trailing="Select a frame" value="prototype" />
</Accordion>

// A FAQ
<Accordion exclusive={true} headingLevel={2} indicator="plusMinus" size="lg" variant="separated">
  <AccordionItem description="Up to 30 days after delivery" title="Can I return a kit?" value="returns">
    …
  </AccordionItem>
</Accordion>
```

### `Accordion`

Renders a `div`, and every other `div` prop goes to it. It omits `as` and `defaultValue`, which it declares for itself.

- `children`: the `AccordionItem`s.
- `defaultValue?: string[]`: the items open at first, which leaves the accordion uncontrolled. Defaults to none.
- `exclusive?: boolean`: at most one item open; opening one closes the others. Defaults to `false`.
- `headingLevel: HeadingLevel`: required, as in `NavListGroup`, because only the page outline knows the level.
- `indicator?: AccordionIndicator`: `"chevron" | "plusMinus"`. Defaults to `chevron`.
- `onValueChange?: (value: string[]) => void`: called with the new open items when the user opens or closes one, or when find-in-page or a fragment link opens one.
- `regions?: boolean`: whether each panel is a `region` named by its header. Defaults to `true` for `joined` and `separated` and `false` for `flush`, following WAI-ARIA's warning against more than about six regions that can be open at once.
- `size?: ControlSize`: defaults to `md`.
- `value?: string[]`: the open items, which makes the accordion controlled. Not accepted with `defaultValue`, typed as `Tabs`' selection is.
- `variant?: AccordionVariant`: `"flush" | "joined" | "separated"`. Defaults to `flush`.

### `AccordionItem`

Renders a `div` holding the header row and the panel, and every other `div` prop goes to that `div`. It omits `as`, `dangerouslySetInnerHTML` and `title`, which it declares as a `ReactNode`.

- `actions?: ReactNode`: controls beside the toggle, outside the heading, so they are not part of the heading's text or the button's name.
- `children?: ReactNode`: the panel's content.
- `description?: ReactNode`: muted text under the title, inside the toggle.
- `disabled?: boolean`: sets `aria-disabled` on the toggle. The item stays reachable with Tab and the arrow keys, is read with its state, and never opens or closes. Defaults to `false`.
- `lazy?: boolean`: renders the content when the item first opens, and keeps it rendered after it closes. Defaults to `false`, so find-in-page and fragment links reach content that has never been opened.
- `title: ReactNode`: the header's text, inside the toggle.
- `trailing?: ReactNode`: content at the end of the toggle, such as a value, a `Counter` or a labelled `StatusDot`, separated from the title by a space, so it is read after it.
- `value: string`: identifies the item in `value`, `defaultValue` and `onValueChange`, and builds the toggle's and panel's ids through `idSegment`, so any characters are safe.

### Exports

`Accordion`, `AccordionItem`, and the types `AccordionProps`, `AccordionItemProps`, `AccordionVariant` and `AccordionIndicator`, from `src/index.ts`.

## Decisions

### Structure and semantics

- **Markup.** Each item renders:
  ```html
  <div class="item">
    <div class="header">
      <h3 class="heading">
        <button aria-controls="…-panel" aria-expanded="false" id="…-toggle" type="button">
          indicator · title · description · trailing · indicator
        </button>
      </h3>
      <div class="actions">…</div>
    </div>
    <div aria-labelledby="…-toggle" class="panel" hidden="until-found" id="…-panel" role="region">…</div>
  </div>
  ```
  The heading is a `Heading` at `headingLevel`. Only one of the two indicator places is filled, and the indicator is `aria-hidden`, because `aria-expanded` carries the state. `role` and `aria-labelledby` are on the panel only when `regions` is on. The actions wrapper renders only when `actions` has content.
- **Why not `details` and `summary`.** A heading inside `summary` is exposed inconsistently by screen readers, interactive content inside `summary` is invalid, so actions would have no place, and a `details` element cannot be controlled from React without fighting its own toggling.
- **Context.** `AccordionContext.ts` sits alone in the `Accordion` folder and is read through `useAccordionContext`. An `AccordionItem` outside an `Accordion` throws `MissingContextError`. A nested `Accordion` provides its own context, so its items read only it.
- **Ids.** Both ids are built from a `useId` base and `idSegment(value)`, in `accordionIds.ts`, as `tabIds.ts` does for `Tabs`.

### Opening and closing

- A click, Enter or Space on the toggle opens a closed item or closes an open one. With `exclusive`, opening one closes the others. Uncontrolled, the accordion updates its own state; controlled, it only calls `onValueChange`.
- `onValueChange` receives the open values with the opened one appended, or the closed one removed. With `exclusive` it receives `[value]` or `[]`. The accordion shows exactly what `value` or its own state says, so an `exclusive` accordion given two open values shows both until the user opens another.
- **Find-in-page and fragment links.** A closed, enabled panel has `hidden="until-found"`. The browser removes it and fires `beforematch` when a find or a fragment link matches inside, and the accordion opens the item as if its toggle had been pressed, closing the others when `exclusive`. A controlled parent that keeps the item closed gets its panel hidden again after the render, so the DOM never shows a panel `value` says is closed.
- **Disabled.** A disabled item's toggle ignores clicks, Enter and Space. Its closed panel has a plain `hidden`, so find-in-page skips it rather than opening an item the user cannot close.
- **Lazy.** A `lazy` item's panel is empty until the item first opens, and keeps its content after that.
- **Scrolling.** The accordion moves no scroll position. When `exclusive` closes an item above the one opened, the browser's scroll anchoring keeps the opened header in place where the browser supports it.

### Keyboard

- Every toggle and every action is in the tab order, in document order. Enter and Space toggle the native button.
- Down and Up move focus to the next and previous toggle of the same accordion, without wrapping; Home and End go to the first and last. They use `targetIndexForKey` with `orientation: "vertical"` and `wraps: false`. Disabled toggles are reached.
- The keys move only between the toggles of the accordion whose toggle has focus, not into or out of a nested accordion. A key pressed with Alt, Ctrl, Meta or Shift is left to the browser. A key whose default a consumer prevented is left alone.

### Look

Every token read has a literal fallback equal to the `default` theme's value. Component tokens are `--sui-accordion-*`.

- **Sizes.** At each size the header's block padding and font size match `Button`'s: `sm` is `--sui-space-1` and `--sui-font-size-sm`, `md` is `--sui-space-2` and `--sui-font-size-md`, `lg` is `--sui-space-3` and `--sui-font-size-lg`. The indicator is 1em, and `description` is one size smaller than the title. Every toggle is at least 24px tall.
- **Title.** `--sui-font-weight-control`. `flush` uses the body font, because an inspector header is a control label. `joined` and `separated` use `--sui-font-heading`, because their headers title content.
- **Indicator position.** `flush` puts it at the start, before the title; `joined` and `separated` at the end. Not configurable.
- **Chevron.** In `flush` it points the way the text runs when closed, rotated a quarter turn from `ChevronDownIcon` (left in right-to-left text, through `:dir(rtl)`), and points down when open. In `joined` and `separated` it points down when closed and up when open. It rotates with `--sui-motion-spring`.
- **Plus/minus.** A plus when closed whose vertical stroke turns flat to make a minus when open, with `--sui-motion-spring`.
- **Indicator colour.** `--sui-color-text-muted` in `flush` and `joined`, which keeps 3:1 against the page, a surface and an overlay. In `separated` the indicator sits in a circle as tall as the title's line, filled `--sui-color-secondary` with `--sui-color-on-secondary` when closed and `--sui-color-primary` with `--sui-color-on-primary` when open, outlined in `--sui-color-control-border`.
- **`flush`.** No outer border or fill. A `--sui-color-border` divider between items. The toggle is inset from the row's edges by `--sui-space-1`, with `--sui-radius-md` corners, and the panel's content starts where the title does.
- **`joined`.** A `--sui-color-border` border at `--sui-border-width` with `--sui-radius-lg` corners around all the items, a divider between them, and no fill, so it sits on a page or a surface. The toggle fills the row. Content starts where the title does.
- **`separated`.** Each item is drawn as a `Card` is: `--sui-color-surface`, a `--sui-color-border` border at `--sui-border-width`, `--sui-radius-lg` and `--sui-shadow-sm`, with `--sui-space-3` between items. Content starts where the title does.
- **Hover and press.** The toggle tints with its text colour at 8% on hover and 16% while pressed, laid over whatever is behind it, as the ghost Button does, except in `separated`, where hovering an enabled item's toggle lifts the whole card by half of `--sui-control-depth` and grows its shadow by the same amount, so in `default`, where the depth is 0, only the press tint shows. Hover rules sit inside `@media (hover: hover)`.
- **Focus.** The ring is drawn on the toggle, inside its edge (`outline-offset` of minus the ring width), so a scrolling pane, a neighbouring item or a joined box's border cannot clip or cover it. In `separated` its corners follow the card's.
- **Disabled.** The title, description, trailing text and indicator are `--sui-color-text` mixed down to half strength, not dimmed with `opacity`, so the focus ring keeps full strength. No hover tint and no lift.
- **Motion.** The panel animates its block size open and closed over 200ms ease-out where `interpolate-size: allow-keywords` is supported, transitioning `content-visibility` with `allow-discrete`. A spring would overshoot the content's height, so the height never springs. Under `prefers-reduced-motion: reduce` nothing moves: only colours transition, and the indicator, the panel and the lift change at once.
- **Forced colours.** The indicator, dividers and borders take `CanvasText`, a disabled item `GrayText`, and the separated indicator's circle `ButtonFace` with a `ButtonText` outline and mark, so the open and closed states still differ in shape.
- **Print.** Under `@media print` closed panels show their content and the indicators are hidden, so a printed page reads as a document. A `lazy` panel that has never opened prints empty.

## Tech Stack

React 19, TypeScript 7, Vite 8 (rolldown) library mode, CSS modules and custom properties, Vitest 5 (a jsdom unit project and four Chromium storybook projects), Storybook 10, oxlint and oxfmt, pnpm. No new dependencies.

## Commands

```sh
pnpm verify                                                        # lint, format check, typecheck, every test; before every commit
pnpm test:unit src/components/Accordion                            # unit tests
pnpm test:storybook src/components/Accordion/Accordion.stories.tsx # stories, in all four projects
pnpm build                                                         # dist/
fallow audit --format json --quiet --explain --gate-marker agent   # before every commit
```

## Project Structure

```
src/components/Accordion/Accordion.tsx            ← root: state, keyboard, context provider
src/components/Accordion/AccordionItem.tsx        ← header, toggle, actions, panel, until-found
src/components/Accordion/AccordionIndicator.tsx   ← internal chevron and plus/minus
src/components/Accordion/AccordionContext.ts      ← context alone in its module
src/components/Accordion/useAccordionContext.ts   ← throws MissingContextError
src/components/Accordion/accordionIds.ts          ← toggle and panel ids
src/components/Accordion/Accordion.module.css     ← every look, size and state
src/components/Accordion/Accordion.test.tsx       ← unit tests
src/components/Accordion/Accordion.stories.tsx    ← stories
src/components/Accordion/index.ts                 ← barrel
src/index.ts                                      ← exports
src/docs/                                         ← a short guide only if the stories' docs page is not enough
.oxlintrc.json                                    ← Accordion and AccordionItem as div in jsx-a11y components
docs/design/concepts.md                           ← an Accordion section
AGENTS.md                                         ← component lists and Accordion architecture notes
docs/specs/README.md                              ← this spec's entry
```

## Code Style

Follow `docs/standards/` and the patterns of `Tabs` and `NavListGroup`. Props are sorted, booleans are passed explicitly, and the item reads the root's state through its hook:

```tsx
export function AccordionItem({
  actions,
  children,
  className,
  description,
  disabled = false,
  lazy = false,
  title,
  trailing,
  value,
  ...rest
}: AccordionItemProps): JSX.Element {
  const accordion = useAccordionContext("AccordionItem");
  const open = accordion.openValues.includes(value);
  const ids = accordionIds(accordion.baseId, value);

  return (
    <Box {...rest} className={clsx(styles.item, className)} data-disabled={disabled} data-open={open}>
      …
    </Box>
  );
}
```

```css
.toggle {
  --_sui-accordion-tint: transparent;

  padding-block: var(--sui-accordion-padding-y);
  background-color: color-mix(in srgb, currentColor var(--_sui-accordion-tint), transparent);
  font-size: var(--sui-accordion-font-size);
}
```

## Testing Strategy

- **Unit (jsdom), `Accordion.test.tsx`.**
  - Markup: a heading at `headingLevel` holds a `button` with `type="button"`, `aria-expanded` and `aria-controls` pointing at its panel; actions sit outside the heading; the panel is a region named by its toggle only when `regions` is on, including the per-variant default.
  - Ids: values with spaces, quotes and unpaired surrogates give unique, valid ids.
  - Uncontrolled and controlled opening and closing, `onValueChange`'s argument in each case, and `exclusive`.
  - `beforematch`: dispatching it on a closed panel, after removing `hidden` as the browser does, opens the item; a controlled parent that ignores it gets `hidden="until-found"` back.
  - Disabled: clicks, Enter and Space change nothing, the toggle stays focusable, and the closed panel has a plain `hidden`.
  - `lazy`: no content before the first opening, content kept after closing.
  - Keyboard: Down, Up, Home and End move between toggles without wrapping, reach disabled ones, stay inside a nested accordion, and ignore modified keys and prevented defaults.
  - `MissingContextError` outside an `Accordion`.
  - Types: `value` with `defaultValue`, a missing `headingLevel` and a string `title` attribute override rejected with `@ts-expect-error`.
  - Stylesheet: transitions under reduced motion are colours only, every `:hover` rule is inside `@media (hover: hover)`, and a print rule shows closed panels.
- **Stories (Chromium, all four mode and theme projects).** Story files set `a11y.test: "error"`.
  - `Inspector` (flush, `sm`, actions, a `Counter`, a disabled item, a nested accordion), `Settings` (joined, descriptions, `exclusive`), `Faq` (separated, `lg`, `plusMinus`, rich content), `Sizes` and `Indicators`.
  - `KeyboardInteraction` in each look: tab order through toggles and actions, the arrow keys, Home and End, Enter and Space toggling `aria-expanded`, a disabled item reached but not opened, and `focusRingContrast(toggle) >= 3`.
  - `States`: hover and press over each look through `trustedInput()`, with `fillContrast` at least `distinctFillContrast` between rest, hover and press in `flush` and `joined`, the lift in `separated` equal to half the resolved `--sui-control-depth`, and no tint or lift on a disabled item.
  - `FragmentLink`: navigating to a fragment inside a closed panel opens the item and its toggle reports `aria-expanded="true"`.
  - `RightToLeft`: a closed flush chevron points left, and the content starts where the title does, measured from the right.
  - The indicator keeps 3:1 against the background behind it in every look, and against its circle in `separated` open and closed.
  - axe's `target-size` passes on every story.
- **By hand.** Before the pull request: find-in-page opening a closed item in Chromium, Firefox and Safari; forced colours in Chromium; printing; a VoiceOver and an NVDA pass over headings, the toggle's name and state, and regions.

## Boundaries

- **Always:** run `pnpm verify` and the fallow audit before every commit. Give every token read a literal fallback. Keep docs in the same commit as the behaviour they describe. Prove each new test fails without its code.
- **Ask first:** pushing or opening a pull request; bumping the version or publishing; adding a semantic token; changing another component's look or API; adding a prop not in this spec.
- **Never:** lower a contrast threshold, skip an assertion or set a story to `a11y.test: "todo"`; use `details` and `summary`; animate with JavaScript; edit `dist/`; hand-write a dependency version.

## Success Criteria

### Semantics and behaviour

1. Each item's toggle is a native `button` inside a heading at `headingLevel`, with `aria-expanded` matching its state and `aria-controls` naming its panel. Actions are outside the heading. Proven by unit tests.
2. Panels are `region`s named by their toggle when `regions` is on, by default in `joined` and `separated` and not in `flush`. Proven by unit tests.
3. A click, Enter or Space toggles an enabled item; with `exclusive` opening one closes the others; controlled accordions change only through `value`, with `onValueChange` called as the API section says. Proven by unit tests.
4. A disabled item stays focusable, never opens or closes, and its closed panel is skipped by find-in-page. Proven by unit tests.
5. A closed enabled panel has `hidden="until-found"`, and `beforematch` opens its item, respecting `exclusive` and a controlled parent. A fragment link into a closed panel opens it in Chromium. Proven by unit tests and `FragmentLink`.
6. A `lazy` item renders nothing in its panel until it first opens and keeps its content afterwards. Proven by unit tests.
7. Down, Up, Home and End move between the toggles of one accordion without wrapping, including disabled ones, never crossing into or out of a nested accordion. Proven by unit tests and `KeyboardInteraction`.

### Look

8. In every storybook project, the header's block padding and font size equal the resolved `Button` values at each size, within 0.5px, and every toggle is at least 24px tall. Proven by `Sizes`.
9. The indicator is at the start in `flush` and the end in `joined` and `separated`; a closed flush chevron points the way the text runs, in both directions. Proven by `Indicators` and `RightToLeft`.
10. The panel's content starts where the title does, within 0.5px, in every look and both directions. Proven by `Inspector`, `Settings`, `Faq` and `RightToLeft`.
11. The focus ring keeps 3:1 in every look, the indicator keeps 3:1 against what is behind it, and hover and press differ from rest by at least `distinctFillContrast`. Proven by `KeyboardInteraction` and `States`.
12. In `separated`, hovering lifts an enabled card by half the resolved `--sui-control-depth` (0 in `default`), and a disabled card does not move. Proven by `States`.
13. Under reduced motion only colours transition, and closed panels print open. Proven by the stylesheet unit tests.

### Docs and whole change

14. `docs/design/concepts.md` has an Accordion section; AGENTS.md lists both components among the fixed-element components and describes the until-found handling and keyboard scope; `.oxlintrc.json` maps both to `div`; `docs/specs/README.md` lists this spec.
15. A consumer that does not import `Accordion` bundles none of its JS or CSS, checked with a throwaway consumer app as AGENTS.md describes.
16. `pnpm verify`, `pnpm build` and the fallow audit pass.

## Out of Scope

- **Keeping one item always open.** WAI-ARIA would mark the open item's toggle `aria-disabled`, and nothing needs it yet.
- **Sticky headers.** See Open Questions.
- **Scroll compensation** beyond the browser's own scroll anchoring.
- **Per-item open callbacks.** `onValueChange` on the root covers them.

## Open Questions

1. **Sticky headers for long inspectors.** Pinning each `flush` header to the top of its scrolling pane while its panel scrolls past is useful in a long inspector, but needs a fill behind the header, a stacking order and a scroll margin so a focused toggle isn't hidden under it. Recommended: leave it out of this change and add it as a `stickyHeaders` prop later if an inspector needs it.
