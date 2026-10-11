# Concepts

## Styling

Components that have styles have an `[ComponentName].module.css` file that provides the styles. A component that only wraps an internal one has none: `TextInput`, `Textarea` and `Select` render `TextControl`, and `Checkbox`, `Switch` and `Radio` render `ChoiceControl`, each of which owns the one module its wrappers share.

A base set of styles provides a global CSS reset at the root and defines the base design tokens as CSS variables. Component CSS modules leverage the variables as much as possible. In future, styles may also be applied via props that override CSS variables for an instance from TypeScript.

### Colours

Colour ramps are defined in the base styles: 11 base colours, most with 9 variations.

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

- **Fill**: `--sui-color-<status>`, a solid background, and `--sui-color-<status>-hover`, the same fill hovered. `--sui-color-on-<status>` is the text on both.
- **Text**: `--sui-color-<status>-text`, for text, borders and icons on the page background, on a surface, on an overlay and on the status's own subtle.
- **Subtle**: `--sui-color-<status>-subtle`, a tinted background. Body text (`--sui-color-text`) sits on it. Primary-coloured text must not, because it falls below 4.5:1 on some subtles.

#### Borders

- `--sui-color-border`: decorative dividers and outlines. It carries no contrast guarantee.
- `--sui-color-control-border`: the outline of `Avatar`, `Button`, `Badge`, the selected `Tabs` pill and a checked `Checkbox`, `Radio`, `Segment` or `Switch`. Transparent in `default` and the palette's ink in `playful` (see [Colours that depend on the theme](#colours-that-depend-on-the-theme)).
- `--sui-color-input-border`: the boundary of form controls. At least 3:1 against the page background, a surface and an overlay (WCAG 1.4.11).

#### Layers

Five neutral tokens paint the layers of a page, and the palette decides how bright each one is:

- `--sui-color-background`: the page.
- `--sui-color-surface`: a panel on the page, such as a `Card`.
- `--sui-color-field`: the fill of a form control: `TextInput`, `Textarea`, `Select`, `Checkbox`, `Radio` and `Switch`.
- `--sui-color-overlay`: a layer that floats above the page, such as a `Popover`.
- `--sui-color-sunken`: a recessed chip or block: `Code`, `Kbd`, and Prose's `code`, `kbd`, `pre` and table header cells.

Bright and Pop give `field` the page colour and `sunken` the surface colour. `overlay` is the page colour too, except in Bright's dark mode, where it is lighter than a card, so a popover floating over a card stands above it. Text, muted text and the focus ring keep their contrast on every layer, and primary text on the page, a surface and an overlay.

### Token tiers

Tokens are layered so themes and palettes only ever change one tier:

1. **Ramps**: the colour ramps above (`--sui-blue-600`). Shared by every palette.
2. **Semantic**: what a colour or measurement is for (`--sui-color-primary`, `--sui-color-surface`, `--sui-radius-md`, `--sui-space-3`, `--sui-control-depth`, `--sui-font-body`). Palettes set the colours, themes set the rest, and `tokens.css` derives the three that need both. Components read only these.
3. **Component**: local to a component's CSS module (`--sui-button-bg`). They default to semantic tokens, and variants reassign them.

### Themes

A theme sets every semantic token that is not a colour: radius, border width, focus ring width, shadow offset, control depth, motion, spacing unit and fonts, and how much outline and shadow hardness its controls use. StylesUI ships two:

- `default`: small radius, thin borders, soft shadows, system font, no depth, and no motion beyond colour fades, a short slide of a Switch thumb and a short scale of a Checkbox or Radio mark. Its companion palette is Bright.
- `playful`: a "chunky pop" look. 2px outlines in the palette's ink, hard offset shadows, pill buttons on a 3D lip that spring up on hover and squash when pressed, and Fredoka headings over Nunito body text. Its companion palette is Pop.

`default` applies at `:root`; any subtree can switch with `data-sui-theme="playful"`, usually through the `Theme` component.

### Palettes

A palette sets every colour token: the layers, text, borders, primary, secondary and status colours, focus ring and tooltip, and the ink, soft shadow and hard shadow that a theme's outlines and shadows are drawn in. StylesUI ships five:

- `bright`: blue and grey on a white page, with grey cards. `default`'s companion, for documents, forms and shops.
- `pop`: a cream page in light mode and deep plum in dark, grape and sunshine-yellow fills, and ink outlines and shadows. `playful`'s companion.
- `mist`: a cool grey page with white cards, inputs and popovers on it, for web apps, dashboards and admin tools.
- `paper`: a warm off-white page with ivory panels and stone greys, for reading, docs and consumer apps.
- `dusk`: the dimmest light mode, with nothing near white, and a lifted, lower-contrast dark mode, for desktop apps and long sessions.

On a tinted page, default's `blue-600` falls below 4.5:1 as text, so Mist and Paper use `blue-700` and Dusk `blue-800` for primary, with a `blue-600` focus ring. Their status subtles tint the palette's surface in light mode and its page in dark.

Each theme has a companion palette, Bright for `default` and Pop for `playful`. An element that sets `data-sui-theme` takes its companion's colours at zero specificity, so `data-sui-palette` on the same element or on any element inside overrides them. A palette set on an ancestor does not reach through an element that sets a theme, because that element's companion is nearer, so set the palette beside the theme to keep it. Bright also applies at `:root`. [Palettes](palettes.md) records the design and its alternatives.

#### Colours that depend on the theme

Control outlines and shadows belong to a theme's shape language but take a palette's colours, so `tokens.css` combines the two:

- `--sui-color-control-border` is the palette's `--sui-color-ink` at the theme's `--sui-control-outline`: `0%` in `default`, so transparent, and `100%` in `playful`.
- `--sui-color-shadow` mixes the palette's `--sui-color-shadow-hard` into its `--sui-color-shadow-soft` by the theme's `--sui-shadow-hardness`: soft in `default`, hard in `playful`. It is also the colour of the lip under a raised control.
- `--sui-shadow-sm` is the theme's `--sui-shadow-sm-offset` in that colour.

A custom property substitutes its `var()`s on the element that declares it, so these three are declared on every element that sets a theme or a palette, and an island of either recomputes them.

### Motion

Controls with depth (`--sui-control-depth` above `0px`) sit on a lip in the shadow colour, rise on hover and press down into the lip, easing with `--sui-motion-spring`. Hover movement only applies on devices that can hover, and under `prefers-reduced-motion: reduce` only colours transition, so state changes are instant. A ghost Button has no lip in any theme: it has nothing to raise, so it changes colour only.

A `Checkbox`, `Radio` or `Switch` moves its mark with the same spring when it is checked. Unchecking uses a plain 120ms ease-out, because a spring on the way out would overshoot. Under `prefers-reduced-motion: reduce` only its colours transition. In `default` the spring is a plain 120ms ease-out, so the Switch thumb slides and the Checkbox and Radio marks scale without a bounce.

### Modes

Every semantic colour is defined once with `light-dark()`, so light and dark variants come from `color-scheme`. Mode follows the OS by default, and `data-sui-mode="light" | "dark" | "system"` overrides it for a subtree. Because `light-dark()` resolves where a colour is used, themes, palettes and modes nest independently of each other. This needs Chrome 123, Safari 17.5 or Firefox 120.

### Global styles

`@krelborn/stylesui/styles.css` contains the reset, ramps, tokens, themes, palettes and modes. Apps import it once at the root. Playful's fonts are a separate, opt-in import, `@krelborn/stylesui/fonts/playful.css`, so apps that don't use them don't bundle them. Component CSS still loads per component, and every token read has a fallback, so components render sensibly without it.

## Components

### Box

The Box component forms the base wrapper around all DOM elements. Never render DOM elements directly, instead render them using Box or use a pre-existing wrapper component that itself renders a Box.

The one exception is Link. Its `as` also accepts a component that renders an anchor, such as a router's link, and Link renders that component directly. That component must pass on the `className` and `data-*` attributes Link gives it, or the link is unstyled.

### Links

Link is an anchor in the primary colour with an underline. `underline="hover"` shows the underline only on hover and keyboard focus, and is for navigation: in running text a link needs its underline to be told apart from the text around it (WCAG 1.4.1). Hover changes only the underline, so links need no colour pairing of their own and work inside an Alert. `aria-current` (any value but `"false"`) makes the current link bold.

`--sui-link-color` recolours every Link with the default tone and every link inside Prose. Link and Prose read it without declaring it, so an ancestor can set it for everything inside, and Alert does: it sets it to `currentColor`, so links inside an Alert take its text colour.

SkipLink is an anchor to a fragment. It stays out of sight until it takes keyboard focus, then shows pinned to the top-left of the page. Render it first in the page.

NavList is a named navigation landmark holding a list. NavListGroup puts a muted `xs` heading, at the level the page outline needs, above a nested list that the heading names. NavListItem renders a link by default, a button for switching views inside one window, or a router's link component, and every prop but `trailing` goes to that element. A button item defaults to `type="button"`, so it does not submit a surrounding form unless given another `type`. Trailing content such as a Counter is separated from the label by a space, so it is read after it. A trailing slot that renders nothing, such as a Counter of 0, takes no room. A long label wraps inside its item, even where it has no break to wrap at, and leaves the trailing content in view. The current item is marked with a native `aria-current` (any value but `"false"`): primary text on the primary tint, bold, with a primary bar on its start edge, cues beyond colour; the bar keeps 3:1 against the tint and the page. The bar springs in; under reduced motion it does not move, and under forced colours it is `Highlight`. The list is padded and each item keeps a scroll margin, so a focus ring is not clipped inside a scrolling sidebar, including when Tab scrolls an item into view.

### Prose

Prose styles the raw HTML inside it (headings, paragraphs, links, lists, quotes, code, images, figures and tables) for content that can't be written one component per element, such as rendered markdown. Headings follow Heading's level sizes and links look like Link. Text is spaced by `--sui-prose-line-height`, which defaults to `--sui-line-height-normal` (1.5, the spacing WCAG 1.4.8 asks for within a paragraph). The right spacing depends on the length of a line, which the app sets and Prose cannot see, so Prose reads the property without declaring it: an app with long lines sets it on the prose or an ancestor, at any specificity. Code keeps `--sui-line-height-normal`, so loosening the text leaves code and diagrams drawn in text as they were.

Code blocks wrap by default, because a scrolling region needs a `tabindex`, which CSS cannot add, before Safari lets a keyboard reach it. With `codeOverflow="scroll"` a code block keeps each line whole and scrolls sideways instead, as GitHub's do, so wrapping cannot break indentation or a diagram drawn in text. A table always scrolls, because fitting its columns to the width would break their words: it is as wide as its content, and one wider than the column scrolls sideways inside its own box. The content must give a table or code block that scrolls `tabindex="0"`, and prose draws a focus ring around it. Header cells sit on the sunken colour.

Every descendant rule is `:where(.prose)`, or a variant of it such as `:where(.prose[data-code-overflow="scroll"])`, followed by type selectors only. That puts it above the reset and below every component class, so a StylesUI component inside prose keeps its own styles. Heading and Text declare `margin: 0` for this reason: without it, prose's heading and paragraph margins would beat the reset's. Prose has no opt-out, and four limits follow:

- A raw element inside a nested component is styled as prose, for example a bare `p` inside a Card.
- A component rendered with `as` as an element prose styles, such as `<Text as="code">`, still takes the prose properties its own class does not set.
- A component placed directly in prose gets no flow spacing, because the spacing rules match raw elements and Heading and Text set their own margin to 0.
- A Prose nested inside one whose `codeOverflow` is `scroll` scrolls its code blocks too, whatever its own `codeOverflow`.

### Code and keys

Code is inline code in the monospace font on the sunken colour, the look Prose gives a raw `code`. It wraps a long value rather than push its column wider. Kbd is a key: the same font and sunken colour with a border whose bottom edge is twice as thick, so a shortcut reads as keys rather than as code. Write a combination as one Kbd per key. Prose draws a raw `kbd` with Kbd's declarations, and a unit test keeps the two identical.

### Alerts and badges

Alert and Badge use the status grades. An Alert draws its border, icon and title in `--sui-color-<status>-text` on `--sui-color-<status>-subtle`, with body text in `--sui-color-text`. A subtle Badge is `<tone>-subtle` with `<tone>-text`, and a solid Badge is the fill with its `on-*` colour. The primary Badge uses `primary` and `primary-subtle`, and the neutral Badge uses `secondary` and `secondary-subtle`. Alert sets no role, so it is read in place; the docs show `role="alert"` for an error raised by an action and `aria-live="polite"` for a quiet update.

Counter is a Badge shaped as a pill, at least 1.25rem across, with fixed-width digits. A count above `max` shows as the maximum followed by "+" ("99+"), and a count equal to `max` shows as it is. It marks a lower bound with `capped` ("30+"), and adds `hiddenSuffix` for screen readers only. It renders nothing below 1.

StatusDot is a small circle in `currentColor`. Its tones use the status text grades, primary, and `--sui-color-input-border` for neutral, so every dot keeps 3:1 against the page and a surface (WCAG 1.4.11). The status fills do not all reach 3:1: in the default light theme warning on white is 1.92:1. `ring` draws only the border, so a ring and a solid dot differ by shape as well as colour. `--sui-status-dot-color`, set on a container, gives every dot inside it that colour in place of its tone's: StatusDot reads it without declaring it, and `currentColor` takes the container's text colour, for a selected row filled with the primary colour, where no tone keeps 3:1. With a `label` the dot is an image named by it; without one, or with an empty one, it is hidden from assistive technology, so put text beside a dot that carries meaning. Under forced colours a dot takes the surrounding text colour (`CanvasText` on the page, `HighlightText` on a selection) and ignores its tone and `--sui-status-dot-color`; a solid dot is filled by its border, because forced colours replace a background colour.

### Avatars

Avatar is an image named by `name`, drawn as the person's picture or their initials on the secondary colour. A picture that fails to load gives way to the initials, and that URL is not requested again while the Avatar stays mounted, even if `src` changes to another URL and back. An empty `src` counts as missing, so the initials show. Initials are the first letters of the first two words, or the first two letters of a single word, splitting on anything that is not a letter, mark or digit in any script, so "@plee" gives "PL" and "acme/web-team" gives "AW". An `xs` avatar shows one letter. Its outline is `--sui-color-control-border`, invisible in `default` and an ink ring in `playful`. Under forced colours the outline is `CanvasText`, and it is what separates grouped avatars once forced colours drop the ring's box-shadow. When the name is printed beside it, the avatar takes `aria-hidden` so the name is read once.

AvatarGroup is a named group of avatars that overlap by a quarter of their size, each ringed in `--sui-avatar-group-ring` (the page background by default) at `--sui-avatar-group-ring-width` (2px by default). AvatarGroup reads both without declaring them, so an ancestor can set them for every group inside it. A Card does not set them, so the ring on a Card is the page background unless you set `--sui-avatar-group-ring` on the Card (or another ancestor) to `var(--sui-color-surface)`. `max` is at least 1, so a group never shows a count alone. Past `max`, avatars are hidden on screen inside VisuallyHidden, so screen readers still read every name, and a muted "+n" that they skip stands in for them. A group with no more avatars than `max` shows no count.

### Listbox

Listbox follows the WAI-ARIA listbox pattern for a single selection that shows details, such as a list of pull requests. Focus stays on the listbox, and `aria-activedescendant` points at the active option, which is tracked apart from the selection. As focus enters, the selected option becomes active, or with none the first, without being selected; Space selects it. The arrow keys, Home and End move without wrapping, and type-ahead (characters typed within 500ms of each other) moves to the next option whose `textValue` starts with them. Each move selects its target unless it is disabled: disabled options are reached but never selected. Enter, once per press, or a double-click calls `onAction`, except on a disabled option. A click makes the option active and focuses the listbox, and selects the option unless it is disabled. As in a native listbox, a double-click does not select a word of an option's text.

A rich option is named by its title through `aria-labelledby` and described by its metadata through `aria-describedby`, and holds no interactive content. Content outside the elements `aria-labelledby` and `aria-describedby` name is not announced, so every element carrying meaning (badges, counts, a labelled StatusDot) goes in `aria-describedby` too, in reading order. `textValue` is the text type-ahead matches. It defaults to the text of the elements `aria-labelledby` names, else the option's text content, so an `aria-hidden` Avatar's initials stay out of it for an option named by its title. Type-ahead ignores case and trims each option's text. A one-character query starts after the active option, so a character typed again once the query has reset moves on, and longer text starts at the active option, so it keeps matching while it can. While a query is live, its last character typed within 500ms, Space joins it, so titles that share a first word, such as "Fix the build" and "Fix the tests", can be told apart; otherwise Space selects the active option. A key pressed with Alt, Ctrl or Meta is left to the browser.

Keyboard moves and focus that no press caused scroll the option into its nearest scroll container, which may be a pane around the listbox; a browser that ignores `container` scrolls the container's ancestors too, as far as the option needs. Clicks and taps never scroll the list, because the focus a press causes would move another option under the pointer before the click landed. A flag set when the pointer goes down and cleared on click, blur and pointer cancel holds the scroll back, as Tab's press flag does for selecting. Each option keeps a scroll margin, so a keyboard move never parks one under the inset ring.

Only a rendered option becomes active, so `aria-activedescendant` never names a missing option. An active option that unmounts lets go, such as when a refresh drops a closed pull request, and the next arrow key moves from the selected option if it is still listed. When neither is, the listbox carries on from where the active option was: it remembers the position each option had when it became active, and Down moves to the option now in that position, the one that followed the dropped option, and Up to the one before it, clamped to the list. Home, End and type-ahead work as usual. While the listbox has focus, a selection made from outside through `value`, or a selected option remounting under a new key, becomes the active option, so an app that drops the active option and selects its neighbour in the same render keeps the user on the neighbour. A `value` of `null` selects nothing and keeps the active option.

With focus, the selected option is `--sui-listbox-selection` (primary) with `--sui-listbox-on-selection`; without it, `--sui-listbox-inactive-selection` (the primary tint) with `--sui-listbox-on-inactive-selection` (primary) and a start bar in `--sui-listbox-inactive-selection-bar` (primary). These tokens are read but never declared, so an app that greys its selection while its window is inactive sets the focused ones to the inactive ones on an ancestor. A selected option sets `--sui-color-text-muted` and `--sui-status-dot-color` to `currentColor`, so muted text and a StatusDot follow the selection's text colour and keep their contrast on it, at the cost of the dot's tone. An unselected, enabled option is tinted `--sui-color-secondary-subtle` under the pointer.

The listbox draws its focus ring inside its edge and pads its options clear of it, so a scrolling pane cannot clip it. An active option that is not selected shows an inset ring while the listbox has keyboard focus, and it can be hovered, so the focus ring keeps 3:1 against `secondary-subtle`, a pairing the Contrast stories assert.

A disabled option is dimmed without dimming its focus ring, which `opacity` on the option would dim below 3:1 when the option is active. Its own text is `--sui-color-text` mixed down to half strength, and its element children have 50% `opacity` with their colour reset to the text colour, so they are dimmed once. The reset has no specificity, so a child's own colour still wins. This differs from a plain 50% `opacity` on the option. A disabled option that `value` selects keeps the selection's look. Under forced colours everything in a disabled option is `GrayText` at full opacity, including elements with their own colour, such as a Badge, a Counter or an Avatar, which forced colours would otherwise turn into `CanvasText`, making the row look enabled.

Under forced colours the selected option is `Highlight` with `HighlightText`, and its start bar takes the fill's colour. It sets `forced-color-adjust: none`, because Chromium would otherwise draw a `Canvas` text backplate that hides `HighlightText`. That setting reaches the option's content, so content that sets its own colour and no background keeps that colour on `Highlight`; let it inherit, or give it a colour that reads there.

### Forms

Field wraps one form control with its label, description and error message, and shares its state with the control. The control takes its `id`, `aria-describedby`, `aria-invalid`, `required` and `disabled` from the Field around it, so the association between label, error and control is written once. Field's id for the control always wins over one set on the control, so the label reaches it. A value set on the control for `aria-invalid`, `required` or `disabled` wins over the Field's, and the control's own `aria-describedby` is listed after the Field's. A control outside a Field works on its own and needs its own accessible name, for example an `aria-label`.

TextInput, Textarea and Select are each a single native element, so they behave in a form, with the keyboard and with assistive technology as the platform's own controls do.

- **Sizes**: `sm`, `md` and `lg` use the same spacing and font size tokens as Button, so a TextInput or Select is as tall as a button of the same size. `size` takes the place of the native `size` attribute.
- **State**: styles follow native and ARIA state (`:disabled`, `:focus-visible`, `[aria-invalid="true"]`) rather than extra props. An invalid control draws its border in `--sui-color-danger-text`.
- **Depth**: text controls are flat in every theme. They have no lip and no spring, which are kept for controls that are pressed.

Checkbox, Switch and Radio each render a `label` around a native `input` and its text. `className` and `style` go to the label, and `ref` and every other prop go to the input. The box, dot or track is drawn on the input itself, so it stays a native control, and follows `:checked`, `:disabled` and `[aria-invalid="true"]`. The focus ring is drawn on the input, which holds focus. A checked control fills with `--sui-color-primary` and takes `--sui-color-control-border`, and an unchecked one has an `--sui-color-input-border` border. A Switch is a checkbox input with the `switch` role. Give one of them either children or a Field `label`, not both.

Fieldset groups controls under a legend. Its `label` is the `legend`, `aria-labelledby` points at it, `description` and `error` are linked to the fieldset with `aria-describedby`, and the native `disabled` disables every control inside. It clears the surrounding Field's state, so a control inside a Fieldset does not take the state of a Field around the Fieldset. RadioGroup is a Fieldset that sets the `radiogroup` role itself, so `role` is not one of its props. It holds no state: `value` controls the radios, `defaultValue` selects one at first, and it passes the value, `defaultValue`, `name`, `required`, `invalid` (whether it has an `error`) and `onValueChange` to its Radios through `RadioGroupContext`, so they share one name. A radio is not marked `aria-invalid`, so a group's `error` sets `aria-invalid` on the group and `data-invalid` on each radio, which draws the danger border.

SegmentedControl is a horizontal RadioGroup around a track, so it takes RadioGroup's props except `orientation`, adds `size`, and keeps the native radio group's keyboard pattern and form submission. Each Segment is a `label` holding a native radio input that covers the segment and draws its fill and focus ring; the text sits above it and lets clicks through. Radio and Segment share `useRadioGroupItem`. The track has the 3:1 form control border, in `--sui-color-danger-text` with an error. The checked segment is primary with `--sui-color-on-primary` text and, with depth, sits on a lip that springs in. Sizes match Button's heights. A Segment without children needs its own accessible name, such as an `aria-label`. A disabled Segment is a native disabled radio at half `opacity`, so Tab skips it, and `disabled` on the control disables every Segment. Under forced colours the checked segment is filled with `Highlight` and its label is `HighlightText` with `forced-color-adjust: none`, because Chromium would otherwise draw a `Canvas` text backplate that hides it. Use a SegmentedControl to choose a value, and pill Tabs to switch between views.

`required` on a Field or RadioGroup adds an asterisk to the label. The asterisk is `aria-hidden`, because assistive technology announces the control's own required state. A required Checkbox or Switch shows its own asterisk after its label, and a Radio shows none, because its group does.

An `error` renders below the control in `--sui-color-danger-text` and is linked with `aria-describedby`. It is not a live region, so a form's summary of errors is an Alert with `role="alert"`.

The text controls share the internal TextControl, and the choice controls share the internal ChoiceControl. RequiredIndicator draws the asterisk. Shared code lives in `src/forms/`: the `ControlSize` type, the two contexts, the `useFieldControl` and `useRadioGroupItem` hooks and `hasContent`, which tells whether a `description` or `error` has anything to render.

### Overlays

An overlay floats beside the element that opens it, its trigger. A hook owns each kind of overlay: it holds the open state, opens and closes the overlay in response to the trigger, and hands out prop getters, `getTriggerProps()` for the trigger and `getOverlayProps()` for the overlay component. A getter merges the consumer's own props with the hook's: where both set a handler, both run, the consumer's first; the hook's `aria-describedby` or `aria-labelledby` id comes before the consumer's; and `style` objects merge, except that both `anchorName`s are kept, so one trigger can anchor a tooltip and a popover.

A tooltip is a `popover="manual"` element, and a popover a `popover="auto"` one, in the top layer, so no `overflow` clips either and no stacking context covers either. Each stays in place in the DOM, so it inherits the theme and mode around it: render it inside the same `Theme` as its trigger. CSS anchor positioning places it on the side of the trigger given by `placement`, where `start` and `end` follow the writing direction around the trigger, and flips it to the opposite side when there is no room. `top` and `bottom` centre it on the trigger. `top-start`, `top-end`, `bottom-start` and `bottom-end` line its start or end edge up with the trigger's instead, so it grows away from that edge, as from a button at the start of a narrow panel. An aligned overlay narrows when it is short of room, and flips to the other edge only when even its narrowest width does not fit. Overlays need Chrome 129, Firefox 147 or Safari 26.

Tooltip is the first overlay. `useTooltip` opens it after a delay when a mouse or pen rests on the trigger, and at once when the trigger takes keyboard focus (`:focus-visible`). A text field matches `:focus-visible` however it takes focus, so its tooltip also opens when it is clicked into. It hides after a delay once the pointer leaves both the trigger and the tooltip, so the pointer can move onto the tooltip, and at once on blur, on Escape and when the trigger is pressed. A tooltip that keyboard focus opened stays open when the pointer leaves, until blur or Escape. An Escape that hides a tooltip has its default action prevented, so a native dialog around the trigger stays open until the next Escape. One tooltip is open at a time, and while one is open, or for 300ms after it closes, the next opens without its delay.

A tooltip describes its trigger (`aria-describedby`), or names it with `relationship: "label"` (`aria-labelledby`) when the trigger has no text of its own, such as an icon-only button. It holds text only, nothing interactive. A native `disabled` button cannot take focus, so keyboard users never reach its tooltip: use `aria-disabled` on a trigger whose tooltip they need. On a `Checkbox`, `Radio` or `Switch` trigger, only the box itself responds to hover, not its label text.

The tooltip's colours are `--sui-color-tooltip` and `--sui-color-on-tooltip`, which each palette sets to the inverse of body text on the page background. `--sui-tooltip-max-width` (default `20rem`) sets how wide a tooltip grows before its text wraps.

Popover is the second overlay. Its trigger, a Button or IconButton, gets `popoverTarget`, which makes it the popover's native invoker, so the browser opens and closes the popover on click, closes it on Escape and on a click outside, returns focus to the trigger when closing from the keyboard, and closes any other open popover. The trigger also carries `aria-expanded` and `aria-controls`. `usePopover` follows the native `toggle` event. Controlled, it cancels an opening in `beforetoggle` and reports it through `onOpenChange`, and reports a close after the browser makes it, showing the popover again if the parent keeps `open` true. Only one popover is open at a time, so two controlled popovers both held open would keep closing each other. Popover has no role; give it `role="dialog"` and a name when it holds a form. It takes the overlay colour with a border, the large radius and the small shadow, at most `--sui-popover-max-width` (default `20rem`) wide, and fades in while moving out from the trigger, or only fades under reduced motion.

### Tabs

Tabs follows the WAI-ARIA tabs pattern. `Tabs` holds the selection, controlled with `value` or uncontrolled with `defaultValue`, and one is always required, so a tab is always selected. `TabList` is the named `tablist`, each `Tab` a native button, and each `TabPanel` is named by its tab. Only the selected tab is in the tab order. The arrow keys (Left and Right, or Up and Down when `orientation` is `vertical`) move between tabs and wrap, Home and End go to either end, and a right-to-left writing direction, set with `dir`, swaps Left and Right. With `automatic` activation a tab is selected as it takes focus; with `manual`, a click, Enter or Space selects it. A disabled tab is `aria-disabled`: the arrow keys reach it but it is never selected, and it ignores clicks, so a consumer's `onClick` does not run. Every `Tab` needs a `TabPanel` with the same `value`, because its `aria-controls` points at the panel. Every panel is always rendered, so that reference resolves, but only the selected panel renders its children. A panel is in the tab order, so pass `tabIndex={-1}` when it starts with a control.

`underline` tabs are muted text that turns to the text colour when selected, over a primary bar twice the border width on the list's rule. `pill` tabs fill the selected tab with the primary colour and lift it onto a lip of `--sui-control-depth`, like a Button. Both selected states meet 3:1 against the page. Sizes match Button's. Selecting springs; deselecting eases out, and under reduced motion only colours transition (the lift and the bar still change, instantly). A disabled tab is dimmed by mixing its label colour down to half strength, not by `opacity`, so its focus ring stays at full strength. Under forced colours the bar is `Highlight`, the selected pill is filled with `Highlight` under `HighlightText`, and a disabled tab is `GrayText`.

### Buttons

The status variants, `danger`, `warning`, `info` and `success`, fill a Button with the status's fill grade: `--sui-color-<status>` at rest and `--sui-color-<status>-hover` on hover, with `--sui-color-on-<status>` text. Otherwise they behave as `primary`, with its control border, lip, sizes and states. `danger` is for an action that destroys something, such as deleting a draft.

Every colour also has an outline variant, `outline-<colour>`, transparent at rest and filled with the colour's subtle on hover. A status outline draws its text and border in `--sui-color-<status>-text` and `outline-primary` in `--sui-color-primary`. Secondary has no text grade, so `outline-secondary` draws body text inside the 3:1 `--sui-color-input-border` and hovers to `--sui-color-secondary-subtle`.

A ghost Button has no fill or border at rest. Hovering tints it with its text colour at 8% and pressing at 16%, laid over whatever is behind it, so both states show on the page, on a surface and on any tint, and its text keeps its colour. A fixed fill would vanish on a background of the same colour.

A busy Button (`busy`) is running its action. It is `aria-disabled`, so it stays in the tab order, and it ignores clicks and a form's submission, including Enter in a field. Its content stays in place but hidden, so it keeps its width and its accessible name: the text is transparent and every child element has `opacity: 0`, which also hides a child with colours of its own, such as a Kbd, a Counter or an icon. A Spinner in the button's text colour covers it. The spinner rotates; under reduced motion it pulses its opacity. A button's children are presentational, so the spinner cannot announce itself: pair `busy` with a status message for the outcome, as for an Alert. A busy button does not lift on hover or press down.

Under forced colours a transparent label would be replaced by a system colour that shows through the spinner, so a busy Button sets `forced-color-adjust: none` and draws a `ButtonFace` fill, a `ButtonBorder` border, a transparent label and no shadow. Its focus ring is `Highlight`, because `forced-color-adjust: none` stops the browser forcing the ring to a system colour, and its spinner is `ButtonText`.

IconButton shows only an icon. Its `label` is both the text of its tooltip and its accessible name, so the two cannot differ, and `aria-label` and `aria-labelledby` are typed `never` so a JSX attribute is rejected. The button's `aria-labelledby` points at a span inside the tooltip that holds the label alone, not at the tooltip: Chromium includes hidden descendants of an `aria-labelledby` target that is itself hidden, so a closed tooltip would put its `aria-hidden` shortcut into the name. A non-empty `shortcut` shows after the label as an `aria-hidden` Kbd, and the `aria-keyshortcuts` the consumer sets announces it. It is a ghost Button by default and square at every size. While it is busy its icon is hidden by the same `opacity: 0` rule as any other child of a busy Button.

### Icons

Each icon is its own component, such as CloseIcon and SendIcon, so a bundle holds only the icons it imports. Its name says what it means, not what it shows, so a theme can draw a meaning differently. An icon is an inline-block `svg` 1em square, drawn in round strokes in `currentColor` on a 24 by 24 grid, so it sits on the line in running text, takes the size and colour of the text around it, and keeps its size in a flex row too narrow for its content. Inside an IconButton it is 1.25em. Its stroke weight is `--sui-icon-stroke-width`, which each theme sets (2 in both) and any element can override for the icons inside it. Without a `label`, or with an empty one, an icon is hidden from assistive technology, which suits an icon beside text or inside a named button; with one it is an image named by it. An icon that points the way the text runs, such as SendIcon, is mirrored in right-to-left text. Under forced colours its stroke takes the forced text colour.

The artwork is Lucide's, copied into each component from the `lucide-static` devDependency and checked against it by a unit test, under the ISC licence (and Feather's MIT licence, for the icons Lucide took from Feather) in `LICENSE`, which follows StylesUI's own MIT licence with them and is published with the package. Per-theme artwork is not supported. A theme that needs it could declare `--sui-icon-set`, and an icon with a variant could render one glyph per set and show the one for the nearest theme with `@container style(--sui-icon-set: <name>)`, which needs Firefox 151.
