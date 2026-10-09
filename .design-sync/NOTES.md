# design-sync notes

Syncs to the Claude Design project "StylesUI" (`projectId` in `config.json`). Shape: storybook.

## Commands

```sh
pnpm build
npx storybook build -c .storybook -o .design-sync/sb-reference
node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./node_modules --entry ./dist/index.js --out ./ds-bundle --remote .design-sync/.cache/remote-sync.json --max-stories 11
```

`--entry ./dist/index.js` is needed because the package is not installed into its own `node_modules`. `--max-stories 11` covers every story of the longest story file (Tooltip); raise it when a story file grows past that.

## Fixes

- [GENERAL] Every preview failed with `(0, import_compiler_runtime.c) is not a function` -> the converter's React shim maps `react/compiler-runtime` to `window.React`, which has no `c` export, and the library is built with the React Compiler -> `tsconfig.json` here aliases `react/compiler-runtime` to `compiler-runtime.js`, which delegates to `React.__COMPILER_RUNTIME.c` and falls back to a `useMemo` cache. Wired through `cfg.tsconfig`.
- [GENERAL] Previews had component CSS but no tokens or themes -> the converter only collected the per-component CSS imported by the JS entry -> `dist/styles.css` ships through `extraEntries: ["./.design-sync/global-styles.js"]`, a module that only imports it.
- [GENERAL] Tooltips touched their triggers (no 8px gap) -> `cssEntry` appends `dist/styles.css` after the component CSS, so the reset's `* { margin: 0 }` beat Overlay's zero-specificity `:where(.overlay)` margin. The README has consumers import `styles.css` first -> replaced `cssEntry` with `global-styles.js` in `extraEntries`, which the converter bundles before the main entry, so the reset, tokens and themes precede component CSS in `_ds_bundle.css`. Don't set `cssEntry` again: it would append a second copy after the components. `tokensPkg: ".."` + `tokensGlob` would also order it first, but prints `..` in the README.
- [GENERAL] Playful theme fonts did not ship -> `fonts/playful.css` only `@import`s `@fontsource-variable/*` -> `extraFonts` points at the two fontsource `wght.css` files.
- `! preview decorator bundle failed` (woff2 has no loader) prints on every build. Left as is, with no `cfg.provider`: the decorator only sets `data-sui-theme="default"` and `data-sui-mode="system"` on the document, which is what `:root` already gets from `styles.css`.
- Story titles Contrast, Tokens, BlogPage and ContactForm are not components -> `titleMap` excludes them.
- ThemeShowcase (`src/styles/ThemeShowcase.stories.tsx`) is mapped onto `Theme` in `titleMap`, so the Theme card shows every theme and mode. Its title puts the Theme card in the `foundations` group. `cardMode: "column"` keeps the four-up grid at full width.
- Center, Grid, Sidebar, Switcher: `[GRID_OVERFLOW]` wide -> `cardMode: "column"`.
- PageLayout: `min-block-size: 100dvh` -> `cardMode: "single"` so the card is full-bleed.
- TextInput: `[GRID_OVERFLOW]` wide on `Sizes` -> `cardMode: "column"`.
- Tooltip: `[GRID_OVERFLOW]` escape (open popovers in Placement, RightToLeft and Flip) -> `cardMode: "single"`, `primaryStory: "Placement"`, the one story with every side held open.
- Button: `[GRID_OVERFLOW]` wide on `HoverContrast` -> `cardMode: "column"`.
- Popover: `[GRID_OVERFLOW]` escape on `HeldOpen` -> `cardMode: "single"`, `primaryStory: "HeldOpen"`, the one story whose popover is open without its play function.
- Icons: the story title `Foundations/Icons` matches no export, so the converter dropped it -> `titleMap` maps `Icons` to `CloseIcon`, the story meta's `component`, so the gallery is the `CloseIcon` card in `foundations`. The other eight icons get no card or `.d.ts`; `conventions.md` lists them.
- Tooltip `Flip` (and `Default`'s hovered end state): the reference capture crops to the story root, and the open tooltip sits in the top layer outside it, so the reference shows the button alone. The play function asserts the tooltip is open below the button, which is what the preview shows. Graded `match`.
- Theme `All Combinations`: the preview's 24px capture gutter makes each cell 8px narrower than the reference, so the playful cards wrap their Outline button onto a second row. Framing, graded `match`.
- [GENERAL] Most form, link and feedback stories have play functions, and the reference Storybook captures their end state (focus rings, clicked radios and checkboxes, typed text, the revealed SkipLink) while previews show the story's initial render. Compare has no switch to skip play functions. Grade the preview against the story's args, not the post-play reference; these deltas are graded `match` with a note, and need no owned preview.

## Known render warns

- `[FONT_MISSING] "Nunito", "Fredoka"`: these are the static-family fallbacks in the playful font stacks. The families actually used, "Nunito Variable" and "Fredoka Variable", ship in `fonts/`.

## Re-sync risks

- `compiler-runtime.js` depends on `React.__COMPILER_RUNTIME` (React 19). If a converter update gives its React shim a real `c` export, remove the alias and `cfg.tsconfig`.
- `extraFonts` paths point into `node_modules/@fontsource-variable/*`; a fontsource layout change breaks them silently apart from a build log line.
- The reference Storybook and previews were only compared in the default theme, light mode. The playful theme and dark mode are covered only by the three stories on the `Theme` card.
- The capture cap is `--max-stories 11`. A story file that grows past 11 stories leaves its tail ungraded; `[STORY_CAP]` in the capture log names it.
- A new icon needs adding to the Icons bullet in `conventions.md`, since only `CloseIcon` has a card.
- PageLayout's per-story capture hides the footer below the fold (24px capture gutter around a 100dvh component). Judge it from the card screenshot instead.
- Prose `Default` is taller than the 700px per-story preview capture, so its figure and table are only visible in the card screenshot (`ds-bundle/_screenshots/typography__Prose.png`). Judge them there.
- SkipLink `KeyboardInteraction` and `LongLabel` show the link hidden on the card, since it only appears on focus. Faithful, but the card shows no visible link.
- Row's `Byline` story renders the current date; captures freeze the clock, so it is stable.
- `conventions.md` names props and tokens by hand; re-validate it against the build when components or tokens change.
- Tooltip is unusable from its generated docs alone: `Tooltip.prompt.md` examples call story-local helpers (`PublishButton`, `CopyLinkButton`) without their `useTooltip` wiring, and `useTooltip` (on `window.StylesUI`, no card) appears in no other generated file. `conventions.md` carries the `useTooltip` options, the prop-getter pattern and the two tooltip tokens; keep them in step when `useTooltip`'s options change, and give later overlay hooks (menus, typeaheads) the same treatment.
- `global-styles.js` relies on the converter emitting `extraEntries` ahead of the main entry in `.bundle-entry.mjs`. If a converter update reverses that, the reset lands after component CSS again and the Tooltip `Placement` gap disappears; check `_ds_bundle.css` has `* {` `margin: 0` before `:where(.sui-overlay-`.
