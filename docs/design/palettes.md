# Palettes

Status: accepted. [`docs/specs/2026-10-11-palettes.md`](../specs/2026-10-11-palettes.md) turns this into acceptance criteria.

## Problem

The `default` theme's light mode paints the page white. Cards are a light grey on top of it, and inputs and popovers take the page colour, so a page built from StylesUI components ends up mostly white. That suits some apps, such as documents, forms and shops, but it is tiring in apps people sit in all day.

The obvious fix, a third theme with dimmer colours, has two costs:

- A theme sets every semantic token, so the new theme would copy default's radius, borders, shadows, motion, spacing and fonts to change only its colours. Every later change to default would have to be made twice.
- Colour and shape would stay bound together. Each new look multiplies: N shape themes times M colour schemes means N × M theme files, and playful's shapes could never be used on calm neutrals.

## Decision

Colour becomes its own axis, the **palette**, alongside the theme and the mode:

- **Theme**: shape, type, motion, depth and spacing. Radius, border width, focus ring width, shadow geometry, control depth, springs, the spacing unit and fonts.
- **Palette**: every `--sui-color-*` token. Neutrals, page brightness, layers, primary, secondary, status colours, focus ring and tooltip.
- **Mode**: light or dark, unchanged. Every palette defines its colours with `light-dark()`.

Four palettes ship: **Bright**, **Mist**, **Paper** and **Dusk**. Playful's existing colours move into a fifth palette, **Pop**, so playful looks as it does today.

```tsx
<Theme theme="default" palette="mist">…</Theme>
<Theme theme="playful" palette="paper">…</Theme>
```

`Theme` sets `data-sui-palette` beside `data-sui-theme` and `data-sui-mode`, and the attribute works on any element without the component, as the other two do.

## Goals

- Mist, Paper and Dusk give default a softer light mode without changing its shapes.
- Any palette combines with any theme, and palettes nest like themes and modes.
- Existing apps see no change beyond a lighter popover in default's dark mode: default renders in Bright and playful in Pop unless a palette is chosen.
- Every palette meets every pairing the Contrast stories assert, in both modes.
- `styles.css` stays the only delivery: palettes ship in it, and component CSS still loads per component.

## Non-goals

- An accent axis, a density axis and a high-contrast palette. They are possible next steps (see [Future axes](#future-axes)), not part of this change.
- Typed support for consumer-defined palettes. A consumer can declare every colour token under its own `data-sui-palette` value, but `Theme`'s `palette` prop accepts only the shipped names.

## The palettes

All four keep default's blue primary and its status colours, so the neutrals are what changes. Brightness is the WCAG relative luminance of the light page against white.

- **Bright**: today's default colours, unchanged. White page, grey cards. 100% page brightness. For documents, forms, shops and print-like pages.
- **Mist**: cool grey page with white cards, inputs and popovers on it, the layered shell GitHub, Linear and Windows 11 use. 88% page brightness. The closest to default, for web apps, dashboards, enterprise and admin tools.
- **Paper**: warm off-white page, ivory panels and stone greys. Nothing is pure white. 88% page brightness. For docs, reading, blogs, note-taking and consumer apps.
- **Dusk**: the dimmest light mode, with nothing near white, and a lifted charcoal dark mode with lower contrast. 78% page brightness. For desktop apps, long sessions, developer tools and game menus.

## Layers

Two tokens carry every neutral layer today, and a tinted page breaks both:

- `background` is the page and also the fill of inputs (`TextControl`, `ChoiceControl`) and of `Popover`. Dimming the page would dim every input and popover with it.
- `surface` is darker than the page in light mode (a recessed card, code chip or key) and lighter in dark mode (a raised card). A tinted page needs cards lighter than the page, but code chips and keys darker than whatever holds them. One token cannot do both.

So the layers split into five tokens. Each palette decides how bright each one is:

- `--sui-color-background`: the page. Unchanged.
- `--sui-color-surface`: a panel on the page, such as `Card`. Its meaning narrows from "the other neutral" to "panel". Bright keeps it darker than the page in light mode, and Mist, Paper and Dusk make it lighter.
- `--sui-color-field` (new): the fill of a form control. `TextControl` and `ChoiceControl` move to it from `background`.
- `--sui-color-overlay` (new): a layer floating above the page, such as `Popover`, which moves to it from `background`. Menus and dialogs will use it too.
- `--sui-color-sunken` (new): a recessed chip or block. `Code`, `Kbd` and Prose's `code`, `pre`, `kbd` and table header cells move to it from `surface`.

`AvatarGroup`'s ring stays on `background`, because its job is to match the page. `Tooltip` keeps its own inverse pair.

Bright and Pop map the new tokens onto today's values: `field` and `overlay` take today's `background`, and `sunken` takes today's `surface`. Default and playful render exactly as they do now, apart from Bright's dark-mode overlay (see below), including playful's white code chips on its cream page.

## Colours that depend on the theme too

Two colours belong to the theme's shape language, not to the palette alone:

- **Control outlines.** `--sui-color-control-border` is transparent in default and an ink outline in playful.
- **Shadows and lips.** `--sui-color-shadow` is a soft translucent black in default, and in playful it is the colour of the hard offset shadow and of the lip under a raised control.

Playful on Mist needs ink outlines in Mist's ink, and default on Pop needs no outlines at all, so neither the theme nor the palette can set these on its own. Each axis exposes what it knows, and `tokens.css` combines them:

- A palette declares the colours: `--sui-color-ink` for outlines, `--sui-color-shadow-soft` for soft shadows and `--sui-color-shadow-hard` for hard shadows and lips.
- A theme declares how much of each it uses: `--sui-control-outline` (`0%` in default, `100%` in playful), `--sui-shadow-hardness` (`0%` or `100%`) and `--sui-shadow-sm-offset` (`0 1px 3px` in default, `4px 4px 0` in playful).
- `tokens.css` derives the tokens components already read:

```css
:root,
[data-sui-theme],
[data-sui-palette] {
  --sui-color-control-border: color-mix(in srgb, var(--sui-color-ink) var(--sui-control-outline), transparent);
  --sui-color-shadow: color-mix(
    in srgb,
    var(--sui-color-shadow-hard) var(--sui-shadow-hardness),
    var(--sui-color-shadow-soft)
  );
  --sui-shadow-sm: var(--sui-shadow-sm-offset) var(--sui-color-shadow);
}
```

A custom property substitutes its `var()`s on the element that declares it and inherits the result. So the derived tokens are declared on every element that sets either axis, the same way `tokens.css` already handles the spacing scale. Components keep reading `--sui-color-control-border`, `--sui-color-shadow` and `--sui-shadow-sm`, and none of them change.

Two things this relies on need proving in Chromium and through lightningcss at the pinned `cssTarget` before the rest is built: a `light-dark()` value inside `color-mix()`, and a `color-mix()` percentage that comes from `var()`.

## Companion palettes

Each theme names a companion palette, Bright for default and Pop for playful. An element that sets a theme also gets its companion's colours, and `data-sui-palette` overrides them:

- `<Theme theme="playful">` renders in Pop, as it does today.
- `<Theme theme="playful" palette="mist">` renders playful's shapes in Mist.
- A palette on a descendant overrides the companion, as a nested theme or mode does.
- A palette on an ancestor does not reach through an element that sets a theme. That element's companion is nearer. Set `palette` beside `theme` to keep it.

The companion colours are declared at zero specificity, so a palette attribute on the same element always wins:

```css
:where(:root, [data-sui-theme="default"]),
[data-sui-palette="bright"] {
  /* Bright's colours */
}

:where([data-sui-theme="playful"]),
[data-sui-palette="pop"] {
  /* Pop's colours */
}
```

Where `:root` also sets a theme, the theme's companion wins by coming later in the source.

The other option was a default theme with no companion, which just inherits whatever palette is in effect. It was rejected because a default island inside a playful page would turn Pop-coloured, which changes how existing apps render.

## Values

Each palette declares the same tokens: the layers, borders, text, primary, secondary, the four status grades, focus ring, tooltip, and the theme-dependent inputs above. The neutral and primary values below have been checked against the WCAG contrast formula for every pairing the Contrast stories assert, over every layer each colour can sit on. The Contrast stories decide the final values.

Hex values that equal a ramp step are written as the step (`#1d4ed8` is `var(--sui-blue-700)`). Neutrals that are not on a ramp are private helpers of their palette (`--_sui-*`), as playful's ink and plum are today.

### Bright

Today's default values, through the new layer tokens: `field` is `white` / `gray-900`, `overlay` is `white` / an even mix of `gray-800` and `gray-700`, and `sunken` is `gray-100` / `gray-800`. The dark overlay is the one change to default: it was the page colour, darker than the cards a popover floats over, and is now lighter than them, keeping 4.5:1 for muted and primary text. Everything else is as declared in `themes/default.css` today.

### Mist

| Token              | Light     | Dark      |
| ------------------ | --------- | --------- |
| `background`       | `#eef1f5` | `#0f141b` |
| `surface`          | `#ffffff` | `#19212b` |
| `field`            | `#ffffff` | `#131a22` |
| `overlay`          | `#ffffff` | `#212a36` |
| `sunken`           | `#e2e6ec` | `#0a0e13` |
| `border`           | `#d5dbe3` | `#2a3441` |
| `input-border`     | `#6b7280` | `#8b95a3` |
| `text`             | `#111827` | `#eef1f5` |
| `text-muted`       | `#4b5563` | `#9aa4b2` |
| `primary`          | `#1d4ed8` | `#60a5fa` |
| `primary-hover`    | `#1e40af` | `#93c5fd` |
| `on-primary`       | `#ffffff` | `#0f141b` |
| `primary-subtle`   | `#dfe8fb` | `#172a4a` |
| `secondary`        | `#e2e6ec` | `#2a3441` |
| `secondary-subtle` | `#e2e6ec` | `#222b37` |
| `focus-ring`       | `#2563eb` | `#93c5fd` |

### Paper

| Token              | Light     | Dark      |
| ------------------ | --------- | --------- |
| `background`       | `#f4f1ea` | `#1b1916` |
| `surface`          | `#fcfbf8` | `#26231f` |
| `field`            | `#fefdfb` | `#1f1d1a` |
| `overlay`          | `#fefdfb` | `#2f2b26` |
| `sunken`           | `#e9e4da` | `#141210` |
| `border`           | `#ddd6c9` | `#3a352f` |
| `input-border`     | `#78716c` | `#948d86` |
| `text`             | `#1c1917` | `#f2eee6` |
| `text-muted`       | `#57534e` | `#a8a29e` |
| `primary`          | `#1d4ed8` | `#7cb0f7` |
| `primary-hover`    | `#1e40af` | `#a5c8fa` |
| `on-primary`       | `#ffffff` | `#1b1916` |
| `primary-subtle`   | `#e3e6f3` | `#22304a` |
| `secondary`        | `#e9e4da` | `#3a352f` |
| `secondary-subtle` | `#e9e4da` | `#302c27` |
| `focus-ring`       | `#2563eb` | `#93c5fd` |

### Dusk

| Token              | Light     | Dark      |
| ------------------ | --------- | --------- |
| `background`       | `#e2e5e9` | `#23282f` |
| `surface`          | `#eceef1` | `#2c323a` |
| `field`            | `#f4f5f7` | `#272c33` |
| `overlay`          | `#f4f5f7` | `#363d46` |
| `sunken`           | `#d6dae0` | `#1c2026` |
| `border`           | `#c5cbd3` | `#444c56` |
| `input-border`     | `#5f6773` | `#8b96a3` |
| `text`             | `#0f141a` | `#ccd4dc` |
| `text-muted`       | `#424a55` | `#a4aeb9` |
| `primary`          | `#1e40af` | `#6cb6ff` |
| `primary-hover`    | `#1e3a8a` | `#96d0ff` |
| `on-primary`       | `#ffffff` | `#23282f` |
| `primary-subtle`   | `#d3dbec` | `#26364d` |
| `secondary`        | `#d6dae0` | `#444c56` |
| `secondary-subtle` | `#d6dae0` | `#363d46` |
| `focus-ring`       | `#2563eb` | `#96d0ff` |

`secondary-hover`, the status hovers, the tooltip pair and the theme-dependent inputs are left to implementation, which follows these rules:

- **`secondary-hover`**: one step further from the page than `secondary`.
- **Status hovers** (`<status>-hover`): one ramp step further from the status's `on-*` text than its fill, as `primary-hover` is: darker under light text, lighter under dark text.
- **Tooltip**: `text` on `background`, inverted.
- **`ink`**: the palette's light-mode `text` in both modes, which is what playful's ink does today.
- **`shadow-soft`**: default's translucent black.
- **`shadow-hard`**: `ink` in light mode, and in dark mode a colour the focus ring keeps 3:1 against.

### Status colours

Default's status text shades (`green-800`, `yellow-800`, `red-700` and `indigo-700` in light mode, the `300` steps in dark) keep 4.5:1 on every new palette's page, surface, sunken layer and own subtle. The tightest is danger on Dusk's light sunken layer at 4.61:1. The fills and their `on-*` text do not depend on the page, so they carry over unchanged. Subtles mix the status's `100` step with the palette's `surface` in light mode, and the `900` step with its `background` in dark mode, so a subtle reads as a tint of the layer it sits on rather than a patch of white.

### The primary steps down a shade

Default's `blue-600` is 5.17:1 on white, but about 4.1:1 on every tinted page, which fails as text. Mist and Paper step down to `blue-700` and Dusk to `blue-800`. The focus ring steps down to `blue-600` in all three. It goes no further on Dusk, because `blue-700` falls to 2.76:1 against the ink-coloured lip under raised controls in playful. Any future accent hits the same problem, and it hits some harder: green, orange and teal need their `800` step on a tinted page, and indigo keeps `600` everywhere but Dusk. That is why each palette tunes its own primary, and why an accent axis would have to tune each accent per palette.

## Files

- `src/styles/palettes/` holds one file per palette: `bright.css`, `mist.css`, `paper.css`, `dusk.css` and `pop.css`. `index.css` imports them after the themes, Bright first.
- `src/styles/themes/default.css` and `playful.css` keep only the non-colour tokens, plus the theme-dependent inputs above.
- `src/styles/palette.css` holds the colour ramps. It is renamed `ramps.css`, and the token tier "Palette" becomes "Ramps", so the word means one thing. The ramp tokens keep their names (`--sui-blue-600`), and the file is internal to `styles.css`, so nothing public changes.
- `modes.css` paints the background, text colour and font of any element with `data-sui-palette` too, so a palette island repaints itself as a theme or mode island does.

## API

- `PaletteName`, exported from `src/index.ts` beside `ThemeName`: `"bright" | "dusk" | "mist" | "paper" | "pop"`.
- `Theme` takes `palette?: PaletteName`, documented as: "Colour palette for this subtree. Defaults to the theme's companion palette on an element that sets `theme`, and is inherited otherwise."
- The `data-sui-palette` attribute, for apps that set attributes themselves (`<html data-sui-theme="default" data-sui-palette="mist">`).

## Testing

- **Token tests.** `themeTokens.test.ts` splits in two. Every theme declares the same non-colour tokens, and declares no `--sui-color-*` token other than the theme-dependent inputs. Every palette declares the same colour tokens, each with `light-dark()`, and with different light and dark values except for a listed set of exceptions per palette.
- **Selectors.** A unit test checks that the derived block in `tokens.css` matches `[data-sui-palette]` as well as `:root` and `[data-sui-theme]`. Another checks that companion colours sit inside `:where()`. `modes.test.ts` covers the palette attribute in the paint rule.
- **Contrast stories.** The Contrast stories render each pairing once per palette, each palette in its own `Theme` island, so the four existing storybook projects (mode × theme) cover every palette in both modes. No storybook projects are added. `field`, `overlay` and `sunken` join the text, focus ring and input border backgrounds.
- **Palette showcase.** A new story renders a representative set of components (Button variants, Badge, Alert, TextInput, Checkbox, Tabs, Listbox, Card, Code, Kbd, NavList) in every palette, with `a11y.test: "error"`. That way axe checks real components, not just token pairs, in every palette and mode.
- **Fallbacks.** Component fallbacks stay Bright's light values (`var(--sui-color-field, #fff)`), and fallback pairs are checked by hand as now.

## Compatibility

Apps that set no palette render as before, except that a popover in default's dark mode is lighter than the cards around it. Overrides change in three places:

- An app that overrides `--sui-color-background` to recolour inputs or popovers now overrides `--sui-color-field` or `--sui-color-overlay`.
- An app that overrides `--sui-color-surface` to recolour `Code`, `Kbd` or Prose code now overrides `--sui-color-sunken`.
- `--sui-color-control-border`, `--sui-color-shadow` and `--sui-shadow-sm` become derived. Overriding one directly still works on the element where it is overridden. Overriding the inputs (`--sui-color-ink`, `--sui-color-shadow-soft`, `--sui-color-shadow-hard`) changes them for the whole subtree.

The README's note on base tokens extends to `data-sui-palette`: tokens that others derive from take effect when overridden on `:root`, a theme element or a palette element. This ships as a minor version.

## Documentation

- `docs/design/concepts.md`: the token tiers (themes set non-colour tokens, palettes set colour tokens, `tokens.css` derives the tokens that need both), the layers, the palettes and companions, and the ramps rename.
- The Theming guide (`src/docs/Theming.mdx`): a palettes section that embeds the palette showcase.
- `README.md`: `palette` in the theming section, and the base-token note.
- `AGENTS.md`: the styles architecture bullet, the theme token test description and the Storybook toolbar.
- `.design-sync/conventions.md`: the `palette` prop and the palette names, so the design agent can use them.
- Storybook gets a `palette` toolbar global whose default, "theme", uses the theme's companion. `ThemeRoot` passes it on, and `ThemeDocsContainer` keeps docs pages in Bright.

## Alternatives considered

- **A Mist theme.** The smallest change, and the costs are in [Problem](#problem): duplicated non-colour tokens and N × M growth.
- **Ramp indirection.** Palettes would set ramps (`--sui-neutral-100` to `900`, `--sui-accent-100` to `900`), and one shared block would map ramps to semantic tokens. That is less CSS, but one mapping cannot pick a different primary shade per palette, and the shade has to change with the page's brightness.
- **`@scope` for the theme-dependent colours.** `@scope ([data-sui-theme="playful"]) to ([data-sui-theme])` would scope playful's outlines without deriving them. It needs Firefox 146 against the `light-dark()` floor of Firefox 120.
- **Translucent sunken tints.** A `sunken` of `color-mix(in srgb, var(--sui-color-text) 6%, transparent)` would read as recessed on any layer, including a code chip on a Bright card, where today's grey disappears. It changes Bright's look slightly, so sunken stays solid for now. The contrast helpers already composite translucent backgrounds.

## Future axes

- **Accent**: the primary hue, tuned per palette as described in [The primary steps down a shade](#the-primary-steps-down-a-shade). Teal would need a new ramp.
- **Density**: `--sui-space-unit` lives in the theme, but enterprise and desktop apps want compact spacing with any theme.
- **Contrast**: a high-contrast palette, or a variant of each palette, chosen by `prefers-contrast: more`.

## Resolved questions

- **Pop's name.** Pop, after the "chunky pop" description of playful. Grape and Candy were the alternatives.
- **Sunken.** Solid per palette, so Bright stays identical. The translucent tint stays an option for later.
- **Default's dark popover.** Lifted to a raised `overlay` in this change, after the palette axis landed with no visual change.
