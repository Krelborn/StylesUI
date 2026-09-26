# Concepts

## Styling

Components that have styles have an `[ComponentName].module.css` file that provides the styles.

A base set of styles provides a global CSS reset at the root and defines the base design tokens as CSS variables. Component CSS modules leverage the variables as much as possible. In future, styles may also be applied via props that override CSS variables for an instance from TypeScript.

### Colours

A colour palette is defined in the base styles. The default palette ships with 10 base colours with 9 variations.

Base colours are:

- `black`
- `white`
- `gray`
- `red`
- `orange`
- `yellow`
- `green`
- `blue`
- `indigo`
- `violet`

For each colour there exists 9 variations `[color]-[variant]` where each variant is a shade on colour ramp from `100` - `900` with `500` being the base colour value. The `black` and `white` colours do not have colour ramps of their own, they sit at undefined `0` and `1000` variations of the `gray` colour.

### Token tiers

Tokens are layered so themes only ever change one tier:

1. **Palette**: the colour ramps above (`--sui-blue-600`). Theme-agnostic.
2. **Semantic**: what a colour or measurement is for (`--sui-color-primary`, `--sui-color-surface`, `--sui-radius-md`, `--sui-space-3`, `--sui-font-body`). Themes set these, and components read only these.
3. **Component**: local to a component's CSS module (`--sui-button-bg`). They default to semantic tokens, and variants reassign them.

### Themes

A theme sets every semantic token: primary, secondary and status colours, surfaces, text, radius, spacing unit and fonts. StylesUI ships `default` (blue and gray, small radius, system font) and `playful` (violet and orange, large radius, roomier spacing, rounded font). `default` applies at `:root`; any subtree can switch with `data-sui-theme="playful"`, usually through the `Theme` component.

### Modes

Every semantic colour is defined once with `light-dark()`, so light and dark variants come from `color-scheme`. Mode follows the OS by default, and `data-sui-mode="light" | "dark" | "system"` overrides it for a subtree. Because `light-dark()` resolves where a colour is used, themes and modes nest independently of each other. This needs Chrome 123, Safari 17.5 or Firefox 120.

### Global styles

`@krelborn/stylesui/styles.css` contains the reset, palette, tokens, themes and modes. Apps import it once at the root. Component CSS still loads per component, and every token read has a fallback, so components render sensibly without it.

## Components

### Box

The Box component forms the base wrapper around all DOM elements. Never render DOM elements directly, instead render them using Box or use a pre-existing wrapper component that itself renders a Box.
