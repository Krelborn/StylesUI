# Building with StylesUI

## Setup and theming

- No provider is required. Linking `styles.css` applies the `default` theme in `system` colour mode to the whole page (tokens are declared on `:root`), and sets body background, text colour and font.
- To switch theme or mode, wrap a subtree (or the whole app) in `Theme`: `<Theme theme="playful" mode="dark">`. `theme` is `"default" | "playful"`, `mode` is `"light" | "dark" | "system"`. `Theme` renders a `div` that paints its own background and text colour, and themes can be nested as islands.
- The `playful` theme uses the bundled "Nunito Variable" (body) and "Fredoka Variable" (heading) fonts; `default` uses the system font stack.
- Colours are defined with `light-dark()`, so never hard-code a light or dark colour: use the tokens and both modes work.

## Styling idiom

There are no utility classes. Compose layout with the layout components and their props; style your own elements with the `--sui-*` CSS custom properties via `style` or your own CSS.

- Spacing props (`gap`, `padding`, `gutter`) take a step `0`-`8` on the `--sui-space-1` ... `--sui-space-8` scale, not CSS lengths.
- Every component except `Button` and `Heading` is polymorphic: pass `as="ul"`, `as="section"` etc. to change the rendered element. All components accept `className`, `style` and the native props of the element they render.
- Layout: `Stack` (vertical, `gap`, `align`), `Row` (horizontal, no wrap by default), `Cluster` (horizontal, wraps), `Grid` (`minimumItemWidth`), `Switcher` (`threshold`), `Sidebar` (`side`, `sideWidth`, `contentMinimumWidth`), `Center` (`width="content" | "prose" | "wide"`, `gutter`, `intrinsic`), `Cover` (`top`, `bottom`, `minimumHeight`), `Frame` (`ratio="16 / 9"`), `PageLayout` (full-height shell; give it `header`, `main`, `footer` children, typically `Center as="main"`).
- Surfaces and controls: `Card` (`padding="sm" | "md" | "lg"`), `Button` (`variant="primary" | "secondary" | "outline"`, `size="sm" | "md" | "lg"`).
- Type: `Heading` (`level` 1-6 is required and sets the element; `size` overrides the visual size), `Text` (`size`, `weight="regular" | "medium" | "bold"`, `tone="default" | "muted"`; renders a `span` unless `as` is given).

Tokens for your own glue styles:

| Family | Names                                                                                                                                                                                                                                                                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colour | `--sui-color-background`, `--sui-color-surface`, `--sui-color-text`, `--sui-color-text-muted`, `--sui-color-border`, `--sui-color-primary`, `--sui-color-on-primary`, `--sui-color-primary-subtle`, `--sui-color-secondary`, `--sui-color-on-secondary`, `--sui-color-danger`, `--sui-color-success`, `--sui-color-warning`, `--sui-color-info`, `--sui-color-focus-ring` |
| Space  | `--sui-space-1` ... `--sui-space-8`                                                                                                                                                                                                                                                                                                                                       |
| Type   | `--sui-font-body`, `--sui-font-heading`, `--sui-font-mono`, `--sui-font-size-xs` ... `--sui-font-size-3xl`, `--sui-font-weight-regular`, `--sui-font-weight-medium`, `--sui-font-weight-bold`, `--sui-line-height-normal`, `--sui-line-height-tight`                                                                                                                      |
| Shape  | `--sui-radius-sm`, `--sui-radius-md`, `--sui-radius-lg`, `--sui-radius-full`, `--sui-radius-control`, `--sui-border-width`, `--sui-shadow-sm`                                                                                                                                                                                                                             |
| Width  | `--sui-width-content`, `--sui-width-prose`, `--sui-width-wide`                                                                                                                                                                                                                                                                                                            |

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
