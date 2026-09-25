# Concepts

## Styling

Components that have styles have an `[ComponentName].module.css` file that provides the styles.

A base set of styles provides a global CSS reset at the route and defines the base design tokens as CSS variables. Component CSS modules leverage the variables as much as possible. Styles may also be applied via props that override CSS variables for an instance from typescript.

### Colours

A colour palette is define in the base styles. The default palette ships with 10 base colours with 9 variations.

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

## Components

### Box

The Box component forms the base wrapper for around all DOM elements. Never render DOM elements directly, instead render them using Box or use a pre-existing wrapper component that itself renders a Box.

&nbsp;
