# Theme System Design

Date: 2026-09-25
Status: Approved design, pending implementation plan
Related: `docs/design/concepts.md`

## Goal

Add a simple, CSS-only theme system to StylesUI and a few components that demonstrate it. A theme selects the primary, secondary and other semantic colours, and defines spacing, roundness and font. Ship two themes (`default`, `playful`), each with light and dark variants.

## Decisions

- Themes are pure CSS, selected with `data-sui-theme` attributes. A thin `<Theme>` React component sets the attributes; there is no context and no runtime theme logic.
- Light/dark uses the CSS `light-dark()` function driven by `color-scheme`. Mode follows the OS by default and can be forced with `data-sui-mode`.
- Global styles (reset, palette, tokens, themes) ship as one stylesheet the consumer imports explicitly: `@krelborn/stylesui/styles.css`.
- Tokens are layered in three tiers: palette, semantic, component.
- Component variants and sizes are applied as `data-*` attributes, not per-value classes.
- Fonts are font stacks only. No webfonts are bundled.

## Token tiers

1. **Palette** (theme-agnostic, `:root`): `--sui-{gray,red,orange,yellow,green,blue,indigo,violet}-{100..900}`, plus `--sui-black` and `--sui-white`. Values are the Tailwind CSS v3 colour steps 100 to 900 for the matching hue (50 and 950 dropped). `--sui-black: #000`, `--sui-white: #fff`, which sit at gray's notional `0` and `1000` as described in `concepts.md`.
2. **Semantic** (set by each theme): the only tokens components read directly. Listed below.
3. **Component** (local to each `.module.css`): for example `--sui-button-bg`. Defaults point at semantic tokens; variants reassign them. This is the seam for future per-instance overrides.

Components read semantic tokens with fallbacks (`var(--sui-color-primary, #2563eb)`) per `AGENTS.md`, so they stay usable without `styles.css`.

## Semantic tokens

### Colour (defined per theme with `light-dark()`)

| Token                                                                                       | Purpose                                                                             |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `--sui-color-primary`, `-primary-hover`, `-primary-subtle`, `-on-primary`                   | Primary action colour, hover shade, tinted background, text on primary              |
| `--sui-color-secondary`, `-secondary-hover`, `-secondary-subtle`, `-on-secondary`           | Same for secondary                                                                  |
| `--sui-color-background`                                                                    | Page / theme-island background                                                      |
| `--sui-color-surface`                                                                       | Raised containers (Card)                                                            |
| `--sui-color-border`                                                                        | Default borders                                                                     |
| `--sui-color-text`, `--sui-color-text-muted`                                                | Body and secondary text                                                             |
| `--sui-color-focus-ring`                                                                    | `:focus-visible` outline                                                            |
| `--sui-color-shadow`                                                                        | Shadow colour (`light-dark()` only accepts colours, so shadows are built from this) |
| `--sui-color-{success,warning,danger,info}`, `--sui-color-on-{success,warning,danger,info}` | Status colours and their text colour                                                |

### Shape, space, type

| Token                                                                                     | Defined in                           |
| ----------------------------------------------------------------------------------------- | ------------------------------------ |
| `--sui-radius-{sm,md,lg,full}`                                                            | theme                                |
| `--sui-space-unit`; `--sui-space-{1..8}` = `calc(n * var(--sui-space-unit))`              | unit in theme, steps in `tokens.css` |
| `--sui-font-{body,heading,mono}`                                                          | theme                                |
| `--sui-font-size-{xs,sm,md,lg,xl,2xl,3xl}` = `0.75, 0.875, 1, 1.125, 1.25, 1.5, 1.875rem` | `tokens.css`                         |
| `--sui-font-weight-{regular,medium,bold}` = `400, 500, 700`                               | `tokens.css`                         |
| `--sui-line-height-{tight,normal}` = `1.25, 1.5`                                          | `tokens.css`                         |
| `--sui-shadow-sm` = `0 1px 3px var(--sui-color-shadow)`                                   | `tokens.css`                         |

`--sui-space-{n}` steps are declared on `:root, [data-sui-theme]` so they recompute against the nearest theme's unit.

## Themes

Colour cells are `light / dark` palette steps.

| Token                      | `default`                                                  | `playful`                                     |
| -------------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| primary                    | blue-600 / blue-400                                        | violet-600 / violet-400                       |
| primary-hover              | blue-700 / blue-300                                        | violet-700 / violet-300                       |
| primary-subtle             | blue-100 / blue-900                                        | violet-100 / violet-900                       |
| on-primary                 | white / gray-900                                           | white / gray-900                              |
| secondary                  | gray-200 / gray-700                                        | orange-400 / orange-400                       |
| secondary-hover            | gray-300 / gray-600                                        | orange-500 / orange-300                       |
| secondary-subtle           | gray-100 / gray-800                                        | orange-100 / orange-900                       |
| on-secondary               | gray-900 / gray-100                                        | gray-900 / gray-900                           |
| background                 | white / gray-900                                           | white / gray-900                              |
| surface                    | gray-100 / gray-800                                        | violet-100 / gray-800                         |
| border                     | gray-300 / gray-700                                        | violet-200 / gray-700                         |
| text                       | gray-900 / gray-100                                        | gray-900 / gray-100                           |
| text-muted                 | gray-600 / gray-400                                        | gray-600 / gray-400                           |
| focus-ring                 | blue-500 / blue-300                                        | violet-500 / violet-300                       |
| shadow                     | `rgb(0 0 0 / 0.12)` / `rgb(0 0 0 / 0.5)`                   | `rgb(76 29 149 / 0.15)` / `rgb(0 0 0 / 0.5)`  |
| success / on               | green-600 / green-400, on white / gray-900                 | same                                          |
| warning / on               | yellow-500 / yellow-300, on gray-900 / gray-900            | same                                          |
| danger / on                | red-600 / red-400, on white / gray-900                     | same                                          |
| info / on                  | blue-500 / blue-300, on white / gray-900                   | same                                          |
| radius sm / md / lg / full | 2px / 4px / 8px / 9999px                                   | 6px / 12px / 20px / 9999px                    |
| space-unit                 | 0.25rem                                                    | 0.3rem                                        |
| font-body, font-heading    | `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | `"Nunito", ui-rounded, system-ui, sans-serif` |
| font-mono                  | `ui-monospace, SFMono-Regular, Menlo, monospace`           | same                                          |

Selectors: `default` uses `:root, [data-sui-theme="default"]`; `playful` uses `[data-sui-theme="playful"]`.

## Modes

```css
:root {
  color-scheme: light dark;
}
[data-sui-mode="system"] {
  color-scheme: light dark;
}
[data-sui-mode="light"] {
  color-scheme: light;
}
[data-sui-mode="dark"] {
  color-scheme: dark;
}
```

Each colour token is defined once, e.g. `--sui-color-primary: light-dark(var(--sui-blue-600), var(--sui-blue-400));`. Unregistered custom properties are substituted where used, so `light-dark()` resolves against the using element's `color-scheme`. Theme and mode therefore nest independently: a dark island in a light page, a playful island in a default page, in either order, on the same or different elements.

Browser support: `light-dark()` needs Chrome 123, Safari 17.5, Firefox 120 (Baseline May 2024). Older browsers are not supported.

## Stylesheet files

`src/styles/`:

- `reset.css`: minimal modern reset. `box-sizing: border-box` everywhere, margin reset, `font: inherit` on form controls, media elements block-level. `body` uses `--sui-font-body`, `--sui-color-text`, `--sui-color-background`, `--sui-line-height-normal`.
- `palette.css`: palette tier.
- `tokens.css`: theme-agnostic scalars, space steps, shadow.
- `modes.css`: `color-scheme` rules above.
- `themes/default.css`, `themes/playful.css`: semantic tier.
- `index.css`: `@import`s in order palette, tokens, themes, modes, reset.

## Components

All components build on `Box`, live in `src/components/<Name>/` with the standard five files, and are re-exported (with prop types) from `src/index.ts`.

### Theme

- Props: `name?: 'default' | 'playful'`, `mode?: 'system' | 'light' | 'dark'`, `as?` (default `div`), plus the chosen element's props.
- Renders `data-sui-theme` / `data-sui-mode` only when the prop is given, so an unset prop inherits from ancestors.
- Style: `color: var(--sui-color-text)`, `background: var(--sui-color-background)`, `font-family: var(--sui-font-body)` so an island looks themed.
- Exports types `ThemeName` and `ThemeMode`.

### Text

- Props: `size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'` (default `md`), `weight?: 'regular' | 'medium' | 'bold'` (default `regular`), `tone?: 'default' | 'muted'` (default `default`), `as?` (default `span`).
- Renders `data-size`, `data-weight`, `data-tone`. Uses `--sui-font-body`.

### Heading

- Props: `level: 1 | 2 | 3 | 4 | 5 | 6` (required), `size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'`.
- Renders `h{level}`. Default size by level: 1 → `3xl`, 2 → `2xl`, 3 → `xl`, 4 → `lg`, 5 → `md`, 6 → `sm`. Renders `data-size` with the resolved size.
- Uses `--sui-font-heading`, `--sui-font-weight-bold`, `--sui-line-height-tight`. No `as` prop; the level decides the tag.

### Button

- Props: `variant?: 'primary' | 'secondary' | 'outline'` (default `primary`), `size?: 'sm' | 'md' | 'lg'` (default `md`), plus all native button props. Always renders `button`; `type` defaults to `"button"`.
- Renders `data-variant`, `data-size`.
- Component tokens: `--sui-button-bg`, `--sui-button-bg-hover`, `--sui-button-fg`, `--sui-button-border`, `--sui-button-radius` (`--sui-radius-md`), `--sui-button-padding-x`, `--sui-button-padding-y`, `--sui-button-font-size`.
- Variants: `primary` and `secondary` use their semantic colour, hover and on-colour. `outline` is transparent with `--sui-color-primary` border and text, hovering to `--sui-color-primary-subtle`.
- Sizes: `sm` = space-1 / space-3 / font-size-sm, `md` = space-2 / space-4 / font-size-md, `lg` = space-3 / space-6 / font-size-lg (padding-y / padding-x / font size).
- States: `:hover:not(:disabled)` uses hover bg. `:focus-visible` shows a 2px `--sui-color-focus-ring` outline with 2px offset. `:disabled` sets opacity 0.5 and `cursor: not-allowed`.

### Card

- Props: `padding?: 'sm' | 'md' | 'lg'` (default `md`), `as?` (default `div`), plus element props.
- Renders `data-padding`. Padding `sm` / `md` / `lg` = space-3 / space-5 / space-8.
- Component tokens: `--sui-card-bg` (`surface`), `--sui-card-border` (`border`), `--sui-card-radius` (`--sui-radius-lg`), `--sui-card-shadow` (`--sui-shadow-sm`). 1px solid border.
- Pure container, no sub-components.

## Build and packaging

- Add `src/styles/index.css` as a second `build.lib.entry` (`{ index: 'src/index.ts', styles: 'src/styles/index.css' }`) so Vite emits `dist/styles.css` with the `@import`s inlined.
- Add `"./styles.css": "./dist/styles.css"` to `package.json` `exports`. `sideEffects: ["**/*.css"]` already covers it.
- First implementation step verifies this output. If lib mode emits a stray JS chunk or the wrong file name, fall back to a post-build script that bundles the CSS using tooling already installed (Vite's `preprocessCSS` or lightningcss via Vite), without new dependencies.
- Re-run the `AGENTS.md` tree-shaking check with a throwaway consumer: importing only `Button` must not include `Card`, `Text`, `Heading` or `Theme` JS or CSS, and no global stylesheet is included unless `styles.css` is imported.

## Storybook

- `.storybook/preview.ts` imports `src/styles/index.css`, adds toolbar globals `theme` (`default`, `playful`) and `mode` (`system`, `light`, `dark`), and a decorator wrapping each story in `<Theme>` with those values.
- One stories file per component covering variants, sizes and states.
- `Foundations/Tokens` story: palette swatches, semantic colours, radius, spacing and type scale for the active theme.
- `Foundations/Theme showcase` story: a Card containing a Heading, Text and one Button of each variant, rendered in all four theme × mode combinations side by side, proving nesting.

## Testing

jsdom cannot resolve `light-dark()` or CSS module values, so unit tests cover behaviour and the component contract:

- Rendered element and `as` handling; `Heading` level → tag.
- Data attributes for every variant/size/tone/padding/weight, including defaults.
- `Button` `type` defaults to `"button"` and can be overridden.
- `Theme` sets `data-sui-theme` / `data-sui-mode` when given and omits them otherwise.
- `className` merging, prop forwarding and `ref` forwarding.
- Type tests with `// @ts-expect-error`: invalid variant/size values, `Heading` without `level`, button-only props on `Card`, `as` on `Heading`.

Visual correctness is checked in Storybook: screenshot the theme showcase in all four combinations during implementation.

## Documentation

- Extend `docs/design/concepts.md` with Themes, Modes and Token tiers sections.
- Add a README section showing `import '@krelborn/stylesui/styles.css'` and `<Theme name="playful" mode="dark">`.

## Out of scope

- Consumer-authored themes via a TypeScript API.
- Prop-based per-instance CSS variable overrides.
- Bundled webfonts.
- Status-coloured component variants (status tokens exist but no component uses them yet).
- Support for browsers without `light-dark()`.
