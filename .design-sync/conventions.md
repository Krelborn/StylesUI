# Building with StylesUI

## Setup and theming

- No provider is required. Linking `styles.css` applies the `default` theme in `system` colour mode to the whole page (tokens are declared on `:root`), and sets body background, text colour and font.
- To switch theme or mode, wrap a subtree (or the whole app) in `Theme`: `<Theme theme="playful" mode="dark">`. `theme` is `"default" | "playful"`, `mode` is `"light" | "dark" | "system"`. `Theme` renders a `div` that paints its own background and text colour, and themes can be nested as islands.
- The `playful` theme uses the bundled "Nunito Variable" (body) and "Fredoka Variable" (heading) fonts; `default` uses the system font stack.
- Colours are defined with `light-dark()`, so never hard-code a light or dark colour: use the tokens and both modes work.

## Styling idiom

There are no utility classes. Compose layout with the layout components and their props; style your own elements with the `--sui-*` CSS custom properties via `style` or your own CSS.

- Spacing props (`gap`, `padding`, `gutter`) take a step `0`-`8` on the `--sui-space-1` ... `--sui-space-8` scale, not CSS lengths.
- Most components are polymorphic: pass `as="ul"`, `as="section"` etc. to change the rendered element. These are `Alert`, `Badge`, `Box`, `Card`, `Center`, `Cluster`, `Cover`, `Field`, `Frame`, `Grid`, `PageLayout`, `Prose`, `Row`, `Sidebar`, `Stack`, `Switcher`, `Text`, `Theme` and `VisuallyHidden`.
- The rest render a fixed element and take no `as`: `Button` (`button`), `Divider` (`hr`), `Fieldset` and `RadioGroup` (`fieldset`), `Heading` (`h1`-`h6`), `Select`, `SkipLink` (`a`), `Textarea` and `TextInput`. `Checkbox`, `Radio` and `Switch` render an `input` inside the `label` that names it: `className` and `style` go to the label, and every other prop to the input. `Link` renders an `a`, or the component given in `as`, such as a router's link.
- All components accept `className`, `style` and the native props of the element they render.
- Layout: `Stack` (vertical, `gap`, `align`), `Row` (horizontal, no wrap by default), `Cluster` (horizontal, wraps), `Grid` (`minimumItemWidth`), `Switcher` (`threshold`), `Sidebar` (`side`, `sideWidth`, `contentMinimumWidth`), `Center` (`width="content" | "prose" | "wide"`, `gutter`, `intrinsic`), `Cover` (`top`, `bottom`, `minimumHeight`), `Frame` (`ratio="16 / 9"`), `PageLayout` (full-height shell; give it `header`, `main`, `footer` children, typically `Center as="main"`).
- Surfaces and controls: `Card` (`padding="sm" | "md" | "lg"`), `Button` (`variant="primary" | "secondary" | "outline"`, `size="sm" | "md" | "lg"`).
- Type: `Heading` (`level` 1-6 is required and sets the element; `size` overrides the visual size), `Text` (`size`, `weight="regular" | "medium" | "bold"`, `tone="default" | "muted"`; renders a `span` unless `as` is given), `Prose` (`size="sm" | "md" | "lg"`; styles the raw `h1`-`h6`, `p`, `a`, `ul`, `ol`, `blockquote`, `code`, `pre`, `img` and `table` elements inside it, for rendered markdown or CMS output).
- Rules and hidden text: `Divider` (`orientation="horizontal" | "vertical"`; a vertical one needs a flex row to stretch), `VisuallyHidden` (text for assistive technology only, such as the name of an icon-only `Button`).
- Links: `Link` (`tone="primary" | "inherit"`, `underline="always" | "hover"`; use `hover` for navigation, not running text), `SkipLink` (`href="#main"`; render it first in the page, and give the target the matching `id`).
- Feedback: `Alert` (`tone="info" | "success" | "warning" | "danger"`, `title`, `icon`; it has no role, so add `role="alert"` for an error raised by an action or `aria-live="polite"` for a quiet update), `Badge` (`tone="neutral" | "primary" | "info" | "success" | "warning" | "danger"`, `variant="subtle" | "solid"`).
- Forms: `Field` wraps one control with a `label`, `description`, `error`, `required`, `disabled` and `controlId`, and links them to it. Controls are `TextInput` (`size="sm" | "md" | "lg"`, `type`), `Textarea`, `Select` (native `option` children), `Checkbox`, `Switch` and `Radio` (`value` is required; children are the label). `Fieldset` (`label` is required) groups controls, and `RadioGroup` (`label`, `defaultValue` or `value` with `onValueChange`, `name`, `orientation="vertical" | "horizontal"`, `required`, `error`) groups `Radio`s. A control outside a `Field` needs its own accessible name, such as `aria-label`.

Tokens for your own glue styles:

| Family | Names                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colour | `--sui-color-background`, `--sui-color-surface`, `--sui-color-text`, `--sui-color-text-muted`, `--sui-color-border`, `--sui-color-primary`, `--sui-color-on-primary`, `--sui-color-primary-subtle`, `--sui-color-secondary`, `--sui-color-on-secondary`, `--sui-color-danger`, `--sui-color-on-danger`, `--sui-color-success`, `--sui-color-on-success`, `--sui-color-warning`, `--sui-color-on-warning`, `--sui-color-info`, `--sui-color-on-info`, `--sui-color-focus-ring`, `--sui-color-input-border`, `--sui-color-danger-text`, `--sui-color-danger-subtle`, `--sui-color-success-text`, `--sui-color-success-subtle`, `--sui-color-warning-text`, `--sui-color-warning-subtle`, `--sui-color-info-text`, `--sui-color-info-subtle` |
| Space  | `--sui-space-1` ... `--sui-space-8`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Type   | `--sui-font-body`, `--sui-font-heading`, `--sui-font-mono`, `--sui-font-size-xs` ... `--sui-font-size-3xl`, `--sui-font-weight-regular`, `--sui-font-weight-medium`, `--sui-font-weight-bold`, `--sui-line-height-normal`, `--sui-line-height-tight`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Shape  | `--sui-radius-sm`, `--sui-radius-md`, `--sui-radius-lg`, `--sui-radius-full`, `--sui-radius-control`, `--sui-border-width`, `--sui-shadow-sm`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Width  | `--sui-width-content`, `--sui-width-prose`, `--sui-width-wide`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

Text on a `primary`, `secondary`, `danger`, `success`, `warning` or `info` background uses the matching `--sui-color-on-*` token; only those pairings have guaranteed contrast in every theme and mode. Status text (`--sui-color-<status>-text`) is for text, borders and icons on the page, a surface or its own `-subtle` background, and `--sui-color-text` also sits on a subtle; primary-coloured text must not sit on a status subtle. `--sui-color-input-border` is the 3:1 boundary of form controls.

`--sui-link-color`, set on an element, recolours every `Link` with the default tone and every link in a `Prose` inside it.

## Where the truth lives

- `styles.css` and `_ds_bundle.css`: every token and theme definition. Read before inventing a colour or size.
- `components/<group>/<Name>/<Name>.prompt.md` and `<Name>.d.ts`: props and examples per component.
- `guidelines/`: the token tiers and theming concepts.

## Example

```jsx
const { Theme, PageLayout, Center, Stack, Row, Card, Heading, Text, Button } = window.StylesUI;

<Theme theme="default" mode="light">
  <PageLayout>
    <Center as="header">
      <Text weight="bold">Field Notes</Text>
    </Center>
    <Center as="main">
      <Card padding="lg">
        <Stack gap={3}>
          <Heading level={2}>Project update</Heading>
          <Text tone="muted">The theme system now ships with default and playful themes.</Text>
          <Row gap={2}>
            <Button>Open</Button>
            <Button variant="outline">Dismiss</Button>
          </Row>
        </Stack>
      </Card>
    </Center>
    <Center as="footer">
      <Text tone="muted" style={{ fontSize: "var(--sui-font-size-sm)" }}>
        Written in the open
      </Text>
    </Center>
  </PageLayout>
</Theme>;
```
