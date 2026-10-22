# StylesUI

A React component library styled with CSS modules and CSS custom properties.

> [!WARNING]
> StylesUI is in beta and, for now, a personal project. It works, but expect rough edges, and expect components, props and tokens to change between releases until 1.0.

## Installation

```sh
pnpm add @krelborn/stylesui
```

## Usage

```tsx
import { Button, Card, Checkbox, Field, Heading, Stack, TextInput } from "@krelborn/stylesui";

export function SignIn({ error, saving }: { error?: string; saving: boolean }) {
  return (
    <Card padding="lg">
      <Stack as="form" gap={4}>
        <Heading level={1}>Sign in</Heading>
        <Field description="We'll never share it." error={error} label="Email" required>
          <TextInput autoComplete="email" type="email" />
        </Field>
        <Field label="Password" required>
          <TextInput autoComplete="current-password" type="password" />
        </Field>
        <Checkbox>Remember me</Checkbox>
        <Button busy={saving} type="submit">
          Sign in
        </Button>
      </Stack>
    </Card>
  );
}
```

Components accept every prop of the element they render, including `ref`. Layout components such as `Stack` render the element given in `as`. `Field` labels the control inside it and links its description and error to it, and marks it required, invalid or disabled. A `busy` `Button` shows a spinner and ignores clicks while keeping focus.

### CSS and themes

Import the global stylesheet once at your app root. It provides the reset, colour ramps, design tokens, themes and palettes:

```tsx
import "@krelborn/stylesui/styles.css";
```

Each component's compiled JS imports its own CSS file, so only styles for components you use end up in your bundle. Your bundler must handle CSS imports from `node_modules` (Vite, Next.js and webpack do by default).

The `default` theme and its `bright` palette apply to the whole page, and colour mode follows the OS. Use `Theme` to switch the theme, palette or mode for any subtree; they nest:

```tsx
import { Button, Card, Heading, Theme } from "@krelborn/stylesui";

<Theme mode="dark" theme="playful">
  <Card>
    <Heading level={2}>Hello</Heading>
    <Button>Get started</Button>
  </Card>
</Theme>;
```

A theme sets shape (radius, borders, shadows, spacing, motion and fonts) and a palette sets colour. Each theme brings a companion palette, `bright` for `default` and `pop` for `playful`, and `palette` swaps it for any of the five: `bright` (a white page), `mist` (a cool grey page with white cards), `paper` (a warm off-white page), `dusk` (the dimmest light mode and a softer dark mode) and `pop`. For example, `<Theme palette="mist">` keeps default's shapes on a less bright page. Set `palette` beside `theme`, because a palette on an outer element doesn't reach through an inner `Theme` that sets a theme.

`Theme` sets `data-sui-theme`, `data-sui-palette` and `data-sui-mode` attributes; `styles.css` paints the background, text colour and font of any element carrying them, so you can also put them on any element yourself, e.g. `<html data-sui-theme="playful" data-sui-mode="dark">`, and it behaves the same way. To customise, override `--sui-*` custom properties. Semantic tokens such as `--sui-color-primary` can be overridden on any element, since components read them directly. Form controls, popovers and code chips read their own layer tokens (`--sui-color-field`, `--sui-color-overlay` and `--sui-color-sunken`), so `--sui-color-background` recolours only the page and `--sui-color-surface` only panels such as `Card`. Base tokens others are built from — `--sui-space-unit`, ramp steps like `--sui-blue-600`, the palette's `--sui-color-ink`, `--sui-color-shadow-soft` and `--sui-color-shadow-hard`, and the theme's `--sui-control-outline`, `--sui-shadow-hardness` and `--sui-shadow-sm-offset` — only take effect when overridden on `:root` or an element with `data-sui-theme` or `data-sui-palette`, since that's where the derived tokens (`--sui-space-*`, `--sui-color-control-border`, `--sui-color-shadow`, `--sui-shadow-sm`, the semantic colours) resolve their `var()`s.

The `playful` theme uses Fredoka for headings and Nunito for body text. They're self-hosted and kept out of `styles.css`, so import them alongside it if you use playful; without them it falls back to the system's rounded font:

```tsx
import "@krelborn/stylesui/styles.css";
import "@krelborn/stylesui/fonts/playful.css";
```

Fredoka and Nunito are licensed under the SIL Open Font License 1.1 and come from the [Fontsource](https://fontsource.org) packages `@fontsource-variable/fredoka` and `@fontsource-variable/nunito`.

Playful's buttons lift on hover and press down when clicked. When the OS asks for reduced motion, only their colours transition.

Themes and palettes use CSS `light-dark()`, which needs Chrome 123, Safari 17.5 or Firefox 120.

`Tooltip` and `Popover` use the Popover API and CSS anchor positioning, which need Chrome/Edge 129, Firefox 147 or Safari 26. `NavBar` collapses with a container style query, which needs Firefox 151; Firefox 147 to 150 show its wide layout at every width. With Vite, the CSS target below leaves their anchor positioning styles unchanged.

### Bundler CSS target

Set your bundler's CSS target to at least Chrome/Edge 123, Firefox 120, Safari 17.5, or colour modes stop nesting: a lower target makes lightningcss rewrite `light-dark()` into fallback variables resolved once at `:root`. With Vite:

```ts
export default defineConfig({
  build: { cssTarget: ["chrome123", "edge123", "firefox120", "safari17.5"] },
});
```

Other lightningcss-based tools need the equivalent `targets`.

## Requirements

- React 19.2 or later

## Development

| Script                 | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `pnpm storybook`       | Run Storybook and its component docs on port 6006      |
| `pnpm build-storybook` | Build a static Storybook to `storybook-static/`        |
| `pnpm build`           | Build the library to `dist/` (ESM + type declarations) |
| `pnpm test`            | Run tests once (`pnpm test:watch` to watch)            |
| `pnpm typecheck`       | Type-check the project                                 |
| `pnpm lint`            | Lint with oxlint                                       |
| `pnpm format`          | Format with oxfmt (`pnpm format:check` to check only)  |

A Husky pre-commit hook runs lint-staged, which lints (`oxlint --fix`) and formats (`oxfmt`) staged files and blocks the commit on lint errors.

### Adding a component

Create `src/components/<Name>/` with `<Name>.tsx`, `<Name>.module.css`, `<Name>.test.tsx`, `<Name>.stories.tsx` and an `index.ts`, then export it from `src/index.ts`. Build on `Box` where possible. JSDoc on the component, its props and each story becomes the component's Docs page in Storybook.

Form components share code in `src/forms/`: the `ControlSize` type, the `FieldContext` and `RadioGroupContext` contexts (each in its own module), the `useFieldControl` hook that merges a `Field`'s state into a control's props, the `useRadioGroupItem` hook that gives `Radio` and `Segment` their `RadioGroup`'s name and selection, and `hasContent`. Only `ControlSize` is exported from the package. `TextControl` (behind `TextInput`, `Textarea` and `Select`), `ChoiceControl` (behind `Checkbox`, `Switch` and `Radio`) and `RequiredIndicator` are internal components: they are not exported from `src/index.ts` and have no stories or tests of their own, since the public components built on them cover them. `TextControl` and `ChoiceControl` own the one CSS module their wrappers share, so those wrappers have none.

Tree-shaking relies on the build preserving one output module per source module and on `"sideEffects": ["**/*.css"]` in `package.json`. Avoid top-level side effects in component modules.

## Feedback

Bug reports, questions and ideas are very welcome: please [open an issue](https://github.com/Krelborn/StylesUI/issues).

I'm not accepting pull requests. StylesUI is a personal project I maintain in my spare time, and for now I want to keep its design in one place. If you have a fix in mind, describe it in an issue and I'll take it from there.

## Licence

MIT. The icons are [Lucide](https://lucide.dev)'s, under the ISC licence, and some of those are Feather's, under the MIT licence. `LICENSE` holds all three.
