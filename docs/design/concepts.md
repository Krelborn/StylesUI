# Concepts

## Styling

Components that have styles have an `[ComponentName].module.css` file that provides the styles. A component that only wraps an internal one has none: `TextInput`, `Textarea` and `Select` render `TextControl`, and `Checkbox`, `Switch` and `Radio` render `ChoiceControl`, each of which owns the one module its wrappers share.

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
- `--sui-color-control-border`: the outline of `Button`, `Badge` and a checked `Checkbox`, `Radio` or `Switch`. Transparent in `default`.
- `--sui-color-input-border`: the boundary of form controls. At least 3:1 against the page background and a surface (WCAG 1.4.11).

### Token tiers

Tokens are layered so themes only ever change one tier:

1. **Palette**: the colour ramps above (`--sui-blue-600`). Theme-agnostic.
2. **Semantic**: what a colour or measurement is for (`--sui-color-primary`, `--sui-color-surface`, `--sui-radius-md`, `--sui-space-3`, `--sui-control-depth`, `--sui-font-body`). Themes set these, and components read only these.
3. **Component**: local to a component's CSS module (`--sui-button-bg`). They default to semantic tokens, and variants reassign them.

### Themes

A theme sets every semantic token: primary, secondary and status colours, surfaces, text, borders, focus ring, radius, border width, shadows, control depth, motion, spacing unit and fonts. StylesUI ships two:

- `default`: blue and gray, small radius, thin borders, soft shadows, system font, no depth, and no motion beyond colour fades, a short slide of a Switch thumb and a short scale of a Checkbox or Radio mark.
- `playful`: a "chunky pop" look. Cream background in light mode and deep plum in dark, grape and sunshine-yellow fills, 2px ink outlines, hard offset shadows, pill buttons on a 3D lip that spring up on hover and squash when pressed, and Fredoka headings over Nunito body text.

`default` applies at `:root`; any subtree can switch with `data-sui-theme="playful"`, usually through the `Theme` component.

### Motion

Controls with depth (`--sui-control-depth` above `0px`) sit on a lip in the shadow colour, rise on hover and press down into the lip, easing with `--sui-motion-spring`. Hover movement only applies on devices that can hover, and under `prefers-reduced-motion: reduce` only colours transition, so state changes are instant. A ghost Button has no lip in any theme: it has nothing to raise, so it changes colour only.

A `Checkbox`, `Radio` or `Switch` moves its mark with the same spring when it is checked. Unchecking uses a plain 120ms ease-out, because a spring on the way out would overshoot. Under `prefers-reduced-motion: reduce` only its colours transition. In `default` the spring is a plain 120ms ease-out, so the Switch thumb slides and the Checkbox and Radio marks scale without a bounce.

### Modes

Every semantic colour is defined once with `light-dark()`, so light and dark variants come from `color-scheme`. Mode follows the OS by default, and `data-sui-mode="light" | "dark" | "system"` overrides it for a subtree. Because `light-dark()` resolves where a colour is used, themes and modes nest independently of each other. This needs Chrome 123, Safari 17.5 or Firefox 120.

### Global styles

`@krelborn/stylesui/styles.css` contains the reset, palette, tokens, themes and modes. Apps import it once at the root. Playful's fonts are a separate, opt-in import, `@krelborn/stylesui/fonts/playful.css`, so apps that don't use them don't bundle them. Component CSS still loads per component, and every token read has a fallback, so components render sensibly without it.

## Components

### Box

The Box component forms the base wrapper around all DOM elements. Never render DOM elements directly, instead render them using Box or use a pre-existing wrapper component that itself renders a Box.

The one exception is Link. Its `as` also accepts a component that renders an anchor, such as a router's link, and Link renders that component directly. That component must pass on the `className` and `data-*` attributes Link gives it, or the link is unstyled.

### Links

Link is an anchor in the primary colour with an underline. `underline="hover"` shows the underline only on hover and keyboard focus, and is for navigation: in running text a link needs its underline to be told apart from the text around it (WCAG 1.4.1). Hover changes only the underline, so links need no colour pairing of their own and work inside an Alert. `aria-current` (any value but `"false"`) makes the current link bold.

`--sui-link-color` recolours every Link with the default tone and every link inside Prose. Link and Prose read it without declaring it, so an ancestor can set it for everything inside, and Alert does: it sets it to `currentColor`, so links inside an Alert take its text colour.

SkipLink is an anchor to a fragment. It stays out of sight until it takes keyboard focus, then shows pinned to the top-left of the page. Render it first in the page.

### Prose

Prose styles the raw HTML inside it (headings, paragraphs, links, lists, quotes, code, images, figures and tables) for content that can't be written one component per element, such as rendered markdown. Headings follow Heading's level sizes and links look like Link. Code blocks wrap rather than scroll, because CSS cannot add the `tabindex` a scrolling region needs to be reachable by keyboard.

Every descendant rule is `:where(.prose)` followed by type selectors only. That puts it above the reset and below every component class, so a StylesUI component inside prose keeps its own styles. Heading and Text declare `margin: 0` for this reason: without it, prose's heading and paragraph margins would beat the reset's. Prose has no opt-out, and three limits follow:

- A raw element inside a nested component is styled as prose, for example a bare `p` inside a Card.
- A component rendered with `as` as an element prose styles, such as `<Text as="code">`, still takes the prose properties its own class does not set.
- A component placed directly in prose gets no flow spacing, because the spacing rules match raw elements and Heading and Text set their own margin to 0.

### Alerts and badges

Alert and Badge use the status grades. An Alert draws its border, icon and title in `--sui-color-<status>-text` on `--sui-color-<status>-subtle`, with body text in `--sui-color-text`. A subtle Badge is `<tone>-subtle` with `<tone>-text`, and a solid Badge is the fill with its `on-*` colour. The primary Badge uses `primary` and `primary-subtle`, and the neutral Badge uses `secondary` and `secondary-subtle`. Alert sets no role, so it is read in place; the docs show `role="alert"` for an error raised by an action and `aria-live="polite"` for a quiet update.

### Forms

Field wraps one form control with its label, description and error message, and shares its state with the control. The control takes its `id`, `aria-describedby`, `aria-invalid`, `required` and `disabled` from the Field around it, so the association between label, error and control is written once. Field's id for the control always wins over one set on the control, so the label reaches it. A value set on the control for `aria-invalid`, `required` or `disabled` wins over the Field's, and the control's own `aria-describedby` is listed after the Field's. A control outside a Field works on its own and needs its own accessible name, for example an `aria-label`.

TextInput, Textarea and Select are each a single native element, so they behave in a form, with the keyboard and with assistive technology as the platform's own controls do.

- **Sizes**: `sm`, `md` and `lg` use the same spacing and font size tokens as Button, so a TextInput or Select is as tall as a button of the same size. `size` takes the place of the native `size` attribute.
- **State**: styles follow native and ARIA state (`:disabled`, `:focus-visible`, `[aria-invalid="true"]`) rather than extra props. An invalid control draws its border in `--sui-color-danger-text`.
- **Depth**: text controls are flat in every theme. They have no lip and no spring, which are kept for controls that are pressed.

Checkbox, Switch and Radio each render a `label` around a native `input` and its text. `className` and `style` go to the label, and `ref` and every other prop go to the input. The box, dot or track is drawn on the input itself, so it stays a native control, and follows `:checked`, `:disabled` and `[aria-invalid="true"]`. The focus ring is drawn on the input, which holds focus. A checked control fills with `--sui-color-primary` and takes `--sui-color-control-border`, and an unchecked one has an `--sui-color-input-border` border. A Switch is a checkbox input with the `switch` role. Give one of them either children or a Field `label`, not both.

Fieldset groups controls under a legend. Its `label` is the `legend`, `aria-labelledby` points at it, `description` and `error` are linked to the fieldset with `aria-describedby`, and the native `disabled` disables every control inside. It clears the surrounding Field's state, so a control inside a Fieldset does not take the state of a Field around the Fieldset. RadioGroup is a Fieldset that sets the `radiogroup` role itself, so `role` is not one of its props. It holds no state: `value` controls the radios, `defaultValue` selects one at first, and it passes the value, `defaultValue`, `name`, `required`, `invalid` (whether it has an `error`) and `onValueChange` to its Radios through `RadioGroupContext`, so they share one name. A radio is not marked `aria-invalid`, so a group's `error` sets `aria-invalid` on the group and `data-invalid` on each radio, which draws the danger border.

`required` on a Field or RadioGroup adds an asterisk to the label. The asterisk is `aria-hidden`, because assistive technology announces the control's own required state. A required Checkbox or Switch shows its own asterisk after its label, and a Radio shows none, because its group does.

An `error` renders below the control in `--sui-color-danger-text` and is linked with `aria-describedby`. It is not a live region, so a form's summary of errors is an Alert with `role="alert"`.

The text controls share the internal TextControl, and the choice controls share the internal ChoiceControl. RequiredIndicator draws the asterisk. Shared code lives in `src/forms/`: the `ControlSize` type, the two contexts, the `useFieldControl` hook and `hasContent`, which tells whether a `description` or `error` has anything to render.

### Overlays

An overlay floats beside the element that opens it, its trigger. A hook owns each kind of overlay: it holds the open state, opens and closes the overlay in response to the trigger, and hands out prop getters, `getTriggerProps()` for the trigger and `getOverlayProps()` for the overlay component. A getter merges the consumer's own props with the hook's: where both set a handler, both run, the consumer's first; the hook's `aria-describedby` or `aria-labelledby` id comes before the consumer's; and `style` objects merge.

The overlay is a `popover="manual"` element in the top layer, so no `overflow` clips it and no stacking context covers it. It stays in place in the DOM, so it inherits the theme and mode around it: render it inside the same `Theme` as its trigger. CSS anchor positioning places it on the side of the trigger given by `placement`, where `start` and `end` follow the writing direction around the trigger, and flips it to the opposite side when there is no room. Overlays need Chrome 129, Firefox 147 or Safari 26.

Tooltip is the first overlay. `useTooltip` opens it after a delay when a mouse or pen rests on the trigger, and at once when the trigger takes keyboard focus (`:focus-visible`). A text field matches `:focus-visible` however it takes focus, so its tooltip also opens when it is clicked into. It hides after a delay once the pointer leaves both the trigger and the tooltip, so the pointer can move onto the tooltip, and at once on blur, on Escape and when the trigger is pressed. A tooltip that keyboard focus opened stays open when the pointer leaves, until blur or Escape. An Escape that hides a tooltip has its default action prevented, so a native dialog around the trigger stays open until the next Escape. One tooltip is open at a time, and while one is open, or for 300ms after it closes, the next opens without its delay.

A tooltip describes its trigger (`aria-describedby`), or names it with `relationship: "label"` (`aria-labelledby`) when the trigger has no text of its own, such as an icon-only button. It holds text only, nothing interactive. A native `disabled` button cannot take focus, so keyboard users never reach its tooltip: use `aria-disabled` on a trigger whose tooltip they need. On a `Checkbox`, `Radio` or `Switch` trigger, only the box itself responds to hover, not its label text.

The tooltip's colours are `--sui-color-tooltip` and `--sui-color-on-tooltip`, which each theme sets to the inverse of body text on the page background. `--sui-tooltip-max-width` (default `20rem`) sets how wide a tooltip grows before its text wraps.
