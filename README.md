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

<Theme mode="dark" name="playful">
  <Card>
    <Heading level={2}>Hello</Heading>
    <Button>Get started</Button>
  </Card>
</Theme>;
```

`Theme` only sets `data-sui-theme` and `data-sui-mode` attributes, so you can also put them on any element yourself, e.g. `<html data-sui-theme="playful" data-sui-mode="dark">`. To customise, override `--sui-*` custom properties. The playful theme names the Nunito font first; load it yourself if you want it, otherwise it falls back to the system font.

Themes use CSS `light-dark()`, which needs Chrome 123, Safari 17.5 or Firefox 120.

## Requirements

- React 19

## Development

| Script                 | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `pnpm storybook`       | Run Storybook on port 6006                             |
| `pnpm build-storybook` | Build a static Storybook to `storybook-static/`        |
| `pnpm build`           | Build the library to `dist/` (ESM + type declarations) |
| `pnpm test`            | Run tests once (`pnpm test:watch` to watch)            |
| `pnpm typecheck`       | Type-check the project                                 |
| `pnpm lint`            | Lint with oxlint                                       |
| `pnpm format`          | Format with oxfmt (`pnpm format:check` to check only)  |

A Husky pre-commit hook runs lint-staged, which lints (`oxlint --fix`) and formats (`oxfmt`) staged files and blocks the commit on lint errors.

### Adding a component

Create `src/components/<Name>/` with `<Name>.tsx`, `<Name>.module.css`, `<Name>.test.tsx`, `<Name>.stories.tsx` and an `index.ts`, then export it from `src/index.ts`. Build on `Box` where possible.

Tree-shaking relies on the build preserving one output module per source module and on `"sideEffects": ["**/*.css"]` in `package.json`. Avoid top-level side effects in component modules.
