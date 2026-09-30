# design-sync notes

Syncs to the Claude Design project "StylesUI" (`projectId` in `config.json`). Shape: storybook.

## Commands

```sh
pnpm build
npx storybook build -c .storybook -o .design-sync/sb-reference
node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./node_modules --entry ./dist/index.js --out ./ds-bundle --remote .design-sync/.cache/remote-sync.json
```

`--entry ./dist/index.js` is needed because the package is not installed into its own `node_modules`.

## Fixes

- [GENERAL] Every preview failed with `(0, import_compiler_runtime.c) is not a function` -> the converter's React shim maps `react/compiler-runtime` to `window.React`, which has no `c` export, and the library is built with the React Compiler -> `tsconfig.json` here aliases `react/compiler-runtime` to `compiler-runtime.js`, which delegates to `React.__COMPILER_RUNTIME.c` and falls back to a `useMemo` cache. Wired through `cfg.tsconfig`.
- [GENERAL] Previews had component CSS but no tokens or themes -> the converter only collected the per-component CSS imported by the JS entry -> `cssEntry: "dist/styles.css"`.
- [GENERAL] Playful theme fonts did not ship -> `fonts/playful.css` only `@import`s `@fontsource-variable/*` -> `extraFonts` points at the two fontsource `wght.css` files.
- `! preview decorator bundle failed` (woff2 has no loader) prints on every build. Left as is, with no `cfg.provider`: the decorator only sets `data-sui-theme="default"` and `data-sui-mode="system"` on the document, which is what `:root` already gets from `styles.css`.
- Story titles Contrast, ThemeShowcase, Tokens and BlogPage are not components -> `titleMap` excludes them.
- Center, Grid, Sidebar, Switcher: `[GRID_OVERFLOW]` wide -> `cardMode: "column"`.
- PageLayout: `min-block-size: 100dvh` -> `cardMode: "single"` so the card is full-bleed.

## Known render warns

- `[FONT_MISSING] "Nunito", "Fredoka"`: these are the static-family fallbacks in the playful font stacks. The families actually used, "Nunito Variable" and "Fredoka Variable", ship in `fonts/`.

## Re-sync risks

- `compiler-runtime.js` depends on `React.__COMPILER_RUNTIME` (React 19). If a converter update gives its React shim a real `c` export, remove the alias and `cfg.tsconfig`.
- `extraFonts` paths point into `node_modules/@fontsource-variable/*`; a fontsource layout change breaks them silently apart from a build log line.
- The reference Storybook and previews were only compared in the default theme, light mode. The playful theme and dark mode are covered only by the two `Theme` stories.
- Button has 7 stories and the capture cap is 6: `KeyboardInteraction` was not captured (same render as `Primary`).
- PageLayout's per-story capture hides the footer below the fold (24px capture gutter around a 100dvh component). Judge it from the card screenshot instead.
- Row's `Byline` story renders the current date; captures freeze the clock, so it is stable.
- `conventions.md` names props and tokens by hand; re-validate it against the build when components or tokens change.
