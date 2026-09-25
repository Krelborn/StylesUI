# StylesUI

A tree-shakable React component library styled with CSS modules and CSS custom properties.

## Usage

```tsx
import { Box } from 'stylesui'

<Box as="button" onClick={() => console.log('Clicked')}>Click Me</Box>
```

`Box` renders the DOM element given in `as` (default `div`) and accepts every prop that element supports, including `ref`.

### CSS

Each component's compiled JS imports its own CSS file, so only styles for components you use end up in your bundle. Your bundler must handle CSS imports from `node_modules` (Vite, Next.js and webpack do by default).

Components read CSS custom properties with fallbacks, so themes are applied by overriding variables.

## Requirements

- React 19

## Development

| Script | Description |
| --- | --- |
| `pnpm storybook` | Run Storybook on port 6006 |
| `pnpm build-storybook` | Build a static Storybook to `storybook-static/` |
| `pnpm build` | Build the library to `dist/` (ESM + type declarations) |
| `pnpm test` | Run tests once (`pnpm test:watch` to watch) |
| `pnpm typecheck` | Type-check the project |
| `pnpm lint` | Lint with oxlint |

### Adding a component

Create `src/components/<Name>/` with `<Name>.tsx`, `<Name>.module.css`, `<Name>.test.tsx`, `<Name>.stories.tsx` and an `index.ts`, then export it from `src/index.ts`. Build on `Box` where possible.

Tree-shaking relies on the build preserving one output module per source module and on `"sideEffects": ["**/*.css"]` in `package.json`. Avoid top-level side effects in component modules.
