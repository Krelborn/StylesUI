# Spec: Markdown Review follow-ups

Gaps Markdown Review found while polishing its comment cards ([Krelborn/markdown-review#19](https://github.com/Krelborn/markdown-review/pull/19)), on `@krelborn/stylesui` 0.6.0, and the follow-ups agreed in review.

## Objective

1. **Status buttons.** `Button` has no destructive variant, so Markdown Review's confirming Discard button is `secondary`. Button gains filled `danger`, `warning`, `info` and `success` variants.
2. **Aligned placements.** An overlay can only be centred on its trigger. Near a container's edge, such as Discard at the start of a narrow comments panel, the centred popover covers the content and spills past the panel. Markdown Review overrides `position-area` in its own CSS. Overlays gain placements aligned to the trigger's start or end edge.
3. **Controlled reopening.** In 0.6.0, a controlled `usePopover` reopened after Escape threw `InvalidStateError: Invalid to show a popover during another show operation`, which unmounted the app. Check that the current code fixes it, with a test in a real browser.
4. **An outline per colour.** `outline` is replaced by an outline variant for each colour: `outline-primary`, `outline-secondary`, `outline-danger`, `outline-warning`, `outline-info` and `outline-success`. This breaks `variant="outline"`, which the beta allows.
5. **Popover focus.** Markdown Review's `DiscardDraftButton` moves focus itself: into the popover as it opens, back to the trigger as it closes with focus inside, and to the trigger from Cancel, because WebKit doesn't focus a clicked button. `usePopover` does this instead.

Users are app developers building with StylesUI, Markdown Review first. Success looks like this: Markdown Review's confirming Discard becomes `variant="danger"`, its `.confirmation` override gives way to `placement="top-start"`, it can go back to a controlled popover, and `DiscardDraftButton`'s focus code gives way to `initialFocus` and `close()`.

## Decisions

- **Variants, not a tone prop.** `ButtonVariant` gains `danger`, `info`, `success` and `warning`. Each is filled in its status colour with `--sui-color-on-<status>` text, and keeps the outline, lip, sizes, `disabled` and `busy` that `primary` has. `IconButton` takes Button's variants, so it gains them too.
- **A hover token per status.** Each palette declares `--sui-color-<status>-hover`, one ramp step further from the status's `on-*` text than the fill: darker under light text, lighter under dark text. That is the rule `primary-hover` already follows in every palette. `danger-text` can't double as the hover, because Pop draws ink on its danger fill, and ink on `red-700` is about 3:1. The values are below.
- **Placements on the shared type.** `OverlayPlacement` gains `top-start`, `top-end`, `bottom-start` and `bottom-end`, the naming Floating UI uses, with `start` and `end` following the writing direction as they already do. `Overlay` owns placement, so `Popover`, `Tooltip` and `IconButton`'s tooltip all take them.
- **Placement CSS.** `top-start` is `position-area: self-block-start span-self-inline-end`, with no inline-start margin, so the overlay's start edge meets the trigger's. It flips to the other side, the other edge, or both, when even its narrowest width doesn't fit (`position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline`); with room to spare it shrinks rather than flips. The other three mirror it. A throwaway spike checked the keywords in Playwright's Chromium and WebKit: the `self-` keywords line up in both directions, and in a right-to-left container inside a left-to-right page. Markdown Review's `block-start span-inline-end` misses by the margin there, and `top span-x-self-end` is unsupported in both browsers. Playwright's Firefox would not launch here, so Firefox is unchecked, as it is for every story.
- **Controlled reopening is already fixed.** 0.6.1 guards both calls that could show the popover during the browser's own show: `Overlay`'s effect (#45) and `usePopover`'s re-show effect (#46), each through `syncPopover`, which retries a refusal on the next task. No test reopens a controlled popover after Escape with real input, so a story is added. It must fail with #46's guard removed.
- **Outline variants.** Each `outline-<colour>` is transparent at rest and fills with the colour's subtle on hover. A status outline draws its text and border in `--sui-color-<status>-text`, the grade made for text on the page, a surface and the status's own subtle. `outline-primary` keeps `outline`'s look. Secondary has no text grade, so `outline-secondary` draws `--sui-color-text` inside a `--sui-color-input-border` border and hovers to `--sui-color-secondary-subtle`. Every pair this needs is already asserted except status text on `overlay`, which is added, because an outline button can sit in a popover.
- **Focus moves with the popover.** `usePopover` takes `initialFocus`, a ref to the element to focus when the popover opens. Without one, focus stays where it is, as now. When the popover closes with focus inside it, focus returns to the trigger. `close()` also returns it when focus has been lost to the page, which is where WebKit leaves it after a click on a button inside the popover. A click outside leaves focus where it lands. The hook finds the trigger through its `popovertarget`, so a consumer's own `ref` on the trigger still works.
- One pull request, one commit per task, and no version bump unless asked. Breaking changes are acceptable while the package is in beta.

### Hover values

Bright, Mist, Paper and Dusk share the status fills, so they share the hovers:

- `success-hover`: `green-800` light, `green-300` dark
- `warning-hover`: `yellow-400` light, `yellow-200` dark
- `danger-hover`: `red-700` light, `red-300` dark
- `info-hover`: `indigo-800` light, `indigo-200` dark

Pop draws ink on every status fill, so its hovers are lighter in both modes:

- `success-hover`: `green-300` light, `green-200` dark
- `warning-hover`: `yellow-300` light, `yellow-200` dark
- `danger-hover`: `red-300` light, `red-200` dark
- `info-hover`: `blue-300` light, `blue-200` dark

## Tech Stack

React 19, TypeScript 7, Vite 8 (rolldown) library mode, CSS modules and custom properties, CSS anchor positioning, Vitest 5 (jsdom unit project plus four Chromium storybook projects), Storybook 10, oxlint and oxfmt, pnpm. No new dependencies.

## Commands

```sh
pnpm verify                                          # lint, format check, typecheck, every test; before every commit
pnpm test:unit src/components/Button/Button.test.tsx # one unit test file
pnpm test:storybook src/components/Popover/Popover.stories.tsx  # one story file, in all four projects
pnpm build                                           # dist/
fallow audit --format json --quiet --explain --gate-marker agent  # before every commit
```

## Project Structure

```
src/styles/palettes/*.css            ← four status hover tokens in each palette
src/styles/Contrast.stories.tsx      ← on-<status> on <status>-hover
src/styles/PaletteShowcase.stories.tsx ← the status buttons
src/components/Button/               ← variants, CSS, tests, stories
src/overlays/OverlayPlacement.ts     ← four aligned placements
src/components/Overlay/Overlay.module.css ← their position-area rules
src/components/Popover/              ← entrance motion for them, focus handling, tests and stories
src/components/IconButton/IconButton.stories.tsx ← every Button variant
src/styles/ThemeShowcase.stories.tsx, src/components/Card/Card.stories.tsx ← outline-primary in place of outline
src/components/Tooltip/Tooltip.stories.tsx ← the aligned placements
docs/design/concepts.md, docs/design/palettes.md, src/docs/Theming.mdx, .design-sync/conventions.md, AGENTS.md ← docs
```

## Code Style

Follow `docs/standards/`. Every token read keeps a literal fallback equal to Bright's light value:

```css
.button[data-variant="danger"] {
  --sui-button-bg: var(--sui-color-danger, #dc2626);
  --sui-button-bg-hover: var(--sui-color-danger-hover, #b91c1c);
  --sui-button-fg: var(--sui-color-on-danger, #fff);
}
```

```css
.overlay[data-placement="top-start"] {
  margin-inline-start: 0;
  position-area: self-block-start span-self-inline-end;
  position-try-fallbacks:
    flip-block,
    flip-inline,
    flip-block flip-inline;
}
```

## Testing Strategy

- **Unit (jsdom).** `Button.test.tsx` covers each new variant, and its existing `@ts-expect-error` keeps rejecting an unknown one, now including `outline`. `usePopover.test.tsx` covers `initialFocus`, focus returning on close from inside, focus left alone from outside, and `close()` with focus lost to the page, which only WebKit and Firefox on macOS produce, so no story can. `themeTokens.test.ts` already requires every palette to declare the same tokens, with different light and dark values.
- **Stories (Chromium, all four mode and theme projects).**
  - Contrast stories assert `on-<status>` on `<status>-hover` at 4.5:1 in every palette.
  - A Button story renders each status variant at every size, disabled and busy, under axe. `HoverContrast` measures each variant's hover text, and the new story checks that rest and hover fills can be told apart.
  - The palette showcase adds the four buttons, so axe checks them in every palette.
  - The Popover `Placement` story checks that each aligned placement is on its side and meets the trigger's edge. A right-to-left story checks that the edges swap.
  - `ControlledReopening` opens a controlled popover with real keys, closes it with Escape, and opens it again.
  - A Button story renders each outline variant at every size, disabled and busy, under axe, and the palette showcase renders them in every palette.
  - A confirmation popover story checks with real keys and clicks that focus moves to Cancel on opening, returns to the trigger on Escape and on Cancel, and stays put after a click outside.
- **Proof the reopening story bites.** It must fail with `usePopover`'s re-show effect put back to 0.6.0's bare `showPopover()`. That run is throwaway.
- **By hand.** Fallback colour pairs, as AGENTS.md requires.

## Boundaries

- **Always:** run `pnpm verify` and the fallow audit before every commit. Give every token read a literal fallback. Keep the docs in the same commit as the behaviour they describe.
- **Ask first:** pushing or opening a pull request; bumping the version or publishing; a Claude Design sync; changing an existing colour.
- **Never:** lower a contrast threshold, skip an assertion or set a story to `a11y.test: "todo"`; edit `dist/`; hand-write a dependency version.

## Success Criteria

### Status buttons

1. `ButtonVariant` gains `danger`, `info`, `success` and `warning`, and each sets `data-variant`. Proven by `Button.test.tsx`.
2. All five palettes declare `--sui-color-danger-hover`, `--sui-color-info-hover`, `--sui-color-success-hover` and `--sui-color-warning-hover` with the values above, through `light-dark()`. Proven by `themeTokens.test.ts`.
3. The Contrast stories pass `on-<status>` on `<status>-hover` at 4.5:1 for every palette in all four projects.
4. A status variant is filled with `--sui-color-<status>`, hovers to `--sui-color-<status>-hover` and draws `--sui-color-on-<status>` text, each read with Bright's light value as its fallback. Every fallback pair is at least 4.5:1, checked by hand.
5. The Button status story passes axe at every size, disabled and busy, and its rest and hover fills differ by at least the 1.1 the ghost Button's story requires. `HoverContrast` passes for every variant. The palette showcase passes axe with the four buttons.
6. `docs/design/concepts.md` and `src/docs/Theming.mdx` document the hover in the status fill grade. `docs/design/palettes.md` documents the hover rule. The Buttons section of concepts.md and `.design-sync/conventions.md` list the variants.

### Aligned placements

7. `OverlayPlacement` is `"bottom" | "bottom-end" | "bottom-start" | "end" | "start" | "top" | "top-end" | "top-start"`, and `Popover`, `usePopover`, `Tooltip`, `useTooltip` and `IconButton` take every value.
8. In Chromium, in a left-to-right page, each aligned placement puts the popover wholly on its side of the trigger. A `-start` popover's left edge, and an `-end` popover's right edge, is within 1px of the trigger's. Proven by the Popover `Placement` story.
9. In a right-to-left container, `top-start`'s right edge and `top-end`'s left edge meet the trigger's. Proven by a new story.
10. An aligned popover's entrance moves out from the trigger as `top` and `bottom` do, and `Tooltip`'s `Placement` story and controls offer every placement.
11. `docs/design/concepts.md` and `.design-sync/conventions.md` describe the aligned placements.

### Controlled reopening

12. `ControlledReopening` passes in all four projects: Tab and Enter open the controlled popover, Escape closes it and reports `false`, and Enter opens it again, reporting `true` with the link visible and no error.
13. The same story fails with `usePopover`'s re-show effect put back to 0.6.0's bare `showPopover()`. The run is reported in the PR, not committed.

### An outline per colour

14. `ButtonVariant` is `"danger" | "ghost" | "info" | "outline-danger" | "outline-info" | "outline-primary" | "outline-secondary" | "outline-success" | "outline-warning" | "primary" | "secondary" | "success" | "warning"`, and `variant="outline"` is a type error. Proven by `Button.test.tsx`.
15. Each outline variant reads the tokens in the decision above, each with Bright's light value as its fallback. Every fallback pair is at least 4.5:1 for text and 3:1 for the secondary border, checked by hand.
16. The Contrast stories pass `<status>-text` on `overlay` for every palette in all four projects.
17. The Button outline story passes axe at every size, disabled and busy, `HoverContrast` passes for every outline variant, and the palette showcase passes axe with them.
18. Nothing in the repository uses `variant="outline"` on a Button. The `ButtonVariant` JSDoc, concepts.md, Theming.mdx and `.design-sync/conventions.md` describe the outline variants.

### Popover focus

19. With `initialFocus`, the element it points at has focus once the popover has opened, uncontrolled or controlled.
20. When the popover closes with focus inside it, by Escape or by `close()`, the trigger has focus. When it closes after a click outside, focus stays where the click left it.
21. `close()` called with focus on the page's `body` moves focus to the trigger.
22. A consumer's `ref` on the trigger is unaffected.
23. The Popover and `usePopover` JSDoc, concepts.md, `.design-sync/conventions.md` and AGENTS.md describe the behaviour.

### Whole change

24. `pnpm verify` and `pnpm build` pass, and the fallow audit passes.

## Open Questions

- **Release.** Markdown Review needs a published version to drop its workarounds. Bump to 0.7.0 (new variants, placements, tokens and `initialFocus`, and `outline` removed) once this merges?
