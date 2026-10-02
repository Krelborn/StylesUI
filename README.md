# StylesUI

A tree-shakable React component library styled with CSS modules and CSS custom properties.

## Installation

The package is published to GitHub Packages. Add an `.npmrc` to your project:

```
@krelborn:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Set `GITHUB_TOKEN` to a classic personal access token with the `read:packages` scope, then install:

```sh
pnpm add @krelborn/stylesui
```

## Usage

```tsx
import { Box } from "@krelborn/stylesui";

export function App() {
  return (
    <Box as="button" onClick={() => console.log("Clicked")}>
      Click Me
    </Box>
  );
}
```

`Box` renders the DOM element given in `as` (default `div`) and accepts every prop that element supports, including `ref`.

### CSS and themes

Import the global stylesheet once at your app root. It provides the reset, colour palette, design tokens and themes:

```tsx
import "@krelborn/stylesui/styles.css";
```

Each component's compiled JS imports its own CSS file, so only styles for components you use end up in your bundle. Your bundler must handle CSS imports from `node_modules` (Vite, Next.js and webpack do by default).

The `default` theme applies to the whole page, and colour mode follows the OS. Use `Theme` to switch the theme or mode for any subtree; themes and modes nest:

```tsx
import { Button, Card, Heading, Theme } from "@krelborn/stylesui";

<Theme mode="dark" theme="playful">
  <Card>
    <Heading level={2}>Hello</Heading>
    <Button>Get started</Button>
  </Card>
</Theme>;
```

`Theme` sets `data-sui-theme` and `data-sui-mode` attributes; `styles.css` paints the background, text colour and font of any element carrying them, so you can also put them on any element yourself, e.g. `<html data-sui-theme="playful" data-sui-mode="dark">`, and it behaves the same way. To customise, override `--sui-*` custom properties. Semantic tokens such as `--sui-color-primary` can be overridden on any element, since components read them directly. Base tokens they're built from — `--sui-space-unit`, palette steps like `--sui-blue-600`, `--sui-color-shadow` — only take effect when overridden on `:root` or an element with `data-sui-theme`, since that's where the derived tokens (`--sui-space-*`, `--sui-shadow-sm`, the semantic colours) resolve their `var()`s.

The `playful` theme uses Fredoka for headings and Nunito for body text. They're self-hosted and kept out of `styles.css`, so import them alongside it if you use playful; without them it falls back to the system's rounded font:

```tsx
import "@krelborn/stylesui/styles.css";
import "@krelborn/stylesui/fonts/playful.css";
```

Fredoka and Nunito are licensed under the SIL Open Font License 1.1 and come from the [Fontsource](https://fontsource.org) packages `@fontsource-variable/fredoka` and `@fontsource-variable/nunito`.

Playful's buttons lift on hover and press down when clicked. When the OS asks for reduced motion, only their colours transition.

Themes use CSS `light-dark()`, which needs Chrome 123, Safari 17.5 or Firefox 120.

`Tooltip` uses the Popover API and CSS anchor positioning, which need Chrome/Edge 129, Firefox 147 or Safari 26. With Vite, the CSS target below leaves its anchor positioning styles unchanged.

### Bundler CSS target

Set your bundler's CSS target to at least Chrome/Edge 123, Firefox 120, Safari 17.5, or colour modes stop nesting: a lower target makes lightningcss rewrite `light-dark()` into fallback variables resolved once at `:root`. With Vite:

```ts
export default defineConfig({
  build: { cssTarget: ["chrome123", "edge123", "firefox120", "safari17.5"] },
});
```

Other lightningcss-based tools need the equivalent `targets`.

## Requirements

- React 19

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

Form components share code in `src/forms/`: the `ControlSize` type, the `FieldContext` and `RadioGroupContext` contexts (each in its own module), the `useFieldControl` hook that merges a `Field`'s state into a control's props, and `hasContent`. Only `ControlSize` is exported from the package. `TextControl` (behind `TextInput`, `Textarea` and `Select`), `ChoiceControl` (behind `Checkbox`, `Switch` and `Radio`) and `RequiredIndicator` are internal components: they are not exported from `src/index.ts` and have no stories or tests of their own, since the public components built on them cover them. `TextControl` and `ChoiceControl` own the one CSS module their wrappers share, so those wrappers have none.

Tree-shaking relies on the build preserving one output module per source module and on `"sideEffects": ["**/*.css"]` in `package.json`. Avoid top-level side effects in component modules.
