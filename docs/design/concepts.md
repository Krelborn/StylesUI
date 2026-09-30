# Concepts

## Styling

Components that have styles have an `[ComponentName].module.css` file that provides the styles.

A base set of styles provides a global CSS reset at the root and defines the base design tokens as CSS variables. Component CSS modules leverage the variables as much as possible. In future, styles may also be applied via props that override CSS variables for an instance from TypeScript.

### Colours

A colour palette is defined in the base styles. The default palette ships with 11 base colours with 9 variations.

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
- `pink`

For each colour there exists 9 variations `[color]-[variant]` where each variant is a shade on colour ramp from `100` - `900` with `500` being the base colour value. The `black` and `white` colours do not have colour ramps of their own, they sit at undefined `0` and `1000` variations of the `gray` colour.

#### Status colours

Each status (`danger`, `success`, `warning`, `info`) has three grades:

- **Fill**: `--sui-color-<status>`, a solid background. `--sui-color-on-<status>` is the text on it.
- **Text**: `--sui-color-<status>-text`, for text, borders and icons on the page background, on a surface and on the status's own subtle.
- **Subtle**: `--sui-color-<status>-subtle`, a tinted background. Body text (`--sui-color-text`) sits on it. Primary-coloured text must not, because it falls below 4.5:1 on some subtles.

#### Borders

- `--sui-color-border`: decorative dividers and outlines. It carries no contrast guarantee.
- `--sui-color-control-border`: the Button outline. Transparent in `default`.
- `--sui-color-input-border`: the boundary of form controls. At least 3:1 against the page background and a surface (WCAG 1.4.11).

### Token tiers

Tokens are layered so themes only ever change one tier:

1. **Palette**: the colour ramps above (`--sui-blue-600`). Theme-agnostic.
2. **Semantic**: what a colour or measurement is for (`--sui-color-primary`, `--sui-color-surface`, `--sui-radius-md`, `--sui-space-3`, `--sui-control-depth`, `--sui-font-body`). Themes set these, and components read only these.
3. **Component**: local to a component's CSS module (`--sui-button-bg`). They default to semantic tokens, and variants reassign them.

### Themes

A theme sets every semantic token: primary, secondary and status colours, surfaces, text, radius, border width, shadows, control depth, motion, spacing unit and fonts. StylesUI ships two:

- `default`: blue and gray, small radius, thin borders, soft shadows, system font, no motion beyond colour fades.
- `playful`: a "chunky pop" look. Cream background in light mode and deep plum in dark, grape and sunshine-yellow fills, 2px ink outlines, hard offset shadows, pill buttons on a 3D lip that spring up on hover and squash when pressed, and Fredoka headings over Nunito body text.

`default` applies at `:root`; any subtree can switch with `data-sui-theme="playful"`, usually through the `Theme` component.

### Motion

Controls with depth (`--sui-control-depth` above `0px`) sit on a lip in the shadow colour, rise on hover and press down into the lip, easing with `--sui-motion-spring`. Hover movement only applies on devices that can hover, and under `prefers-reduced-motion: reduce` only colours transition, so state changes are instant.

### Modes

Every semantic colour is defined once with `light-dark()`, so light and dark variants come from `color-scheme`. Mode follows the OS by default, and `data-sui-mode="light" | "dark" | "system"` overrides it for a subtree. Because `light-dark()` resolves where a colour is used, themes and modes nest independently of each other. This needs Chrome 123, Safari 17.5 or Firefox 120.

### Global styles

`@krelborn/stylesui/styles.css` contains the reset, palette, tokens, themes and modes. Apps import it once at the root. Playful's fonts are a separate, opt-in import, `@krelborn/stylesui/fonts/playful.css`, so apps that don't use them don't bundle them. Component CSS still loads per component, and every token read has a fallback, so components render sensibly without it.

## Components

### Box

The Box component forms the base wrapper around all DOM elements. Never render DOM elements directly, instead render them using Box or use a pre-existing wrapper component that itself renders a Box.

The one exception is Link. Its `as` also accepts a component that renders an anchor, such as a router's link, and Link renders that component directly.

### Forms

Field wraps one form control with its label, description and error message, and shares its state with the control. The control takes its `id`, `aria-describedby`, `aria-invalid`, `required` and `disabled` from the Field around it, so the association between label, error and control is written once. Field's id for the control always wins over one set on the control, so the label reaches it. A control outside a Field works on its own and needs its own accessible name, for example an `aria-label`.

TextInput, Textarea and Select are each a single native element, so they behave in a form, with the keyboard and with assistive technology as the platform's own controls do.

- **Sizes**: `sm`, `md` and `lg` use the same spacing and font size tokens as Button, so a TextInput or Select is as tall as a button of the same size. `size` takes the place of the native `size` attribute.
- **State**: styles follow native and ARIA state (`:disabled`, `:focus-visible`, `[aria-invalid="true"]`) rather than extra props. An invalid control draws its border in `--sui-color-danger-text`.
- **Depth**: text controls are flat in every theme. They have no lip and no spring, which are kept for controls that are pressed.
