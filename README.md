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

### CSS

Each component's compiled JS imports its own CSS file, so only styles for components you use end up in your bundle. Your bundler must handle CSS imports from `node_modules` (Vite, Next.js and webpack do by default).

Components read CSS custom properties with fallbacks, so themes are applied by overriding variables.

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
