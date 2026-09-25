# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project

StylesUI is a React 19 component library built with Vite 8 (rolldown), TypeScript, pnpm and oxlint. It must stay fully tree-shakable. Styling uses CSS modules and CSS custom properties only (no Sass, no Tailwind).

## Commands

- `pnpm build`: `vite build` (JS + CSS to `dist/`) then `tsc -p tsconfig.build.json` (declarations only)
- `pnpm typecheck`: `tsc -b` over app and node tsconfigs (includes tests, stories, `.storybook`)
- `pnpm lint`: oxlint
- `pnpm test`: Vitest run once; `pnpm test:watch` to watch
- Single test file: `pnpm test src/components/Box/Box.test.tsx`; single test by name: `pnpm test -t "renders a div by default"`
- `pnpm storybook` (port 6006) / `pnpm build-storybook`

Install dependencies via `pnpm add` without hand-written versions so the latest release is resolved.

## Architecture

- `src/index.ts` is the only package entry. Each component lives in `src/components/<Name>/` (`<Name>.tsx`, `<Name>.module.css`, `<Name>.test.tsx`, `<Name>.stories.tsx`, `index.ts`) and is re-exported from `src/index.ts`.
- `Box` is the polymorphic primitive other components should build on. `as` is constrained to `keyof JSX.IntrinsicElements`, and all other props (including `ref`, React 19 ref-as-prop, no `forwardRef`) are typed from the chosen element via `ComponentPropsWithRef`.
- Components read CSS custom properties with fallbacks (e.g. `var(--sui-space-2, 0.5rem)`) so consumers theme by overriding variables.
- The React Compiler runs at build time (`@rolldown/plugin-babel` + `reactCompilerPreset`), so output imports `react/compiler-runtime`. Don't add manual `useMemo`/`useCallback` for memoization.

### Tree-shaking and CSS delivery (`vite.config.ts`, `package.json`)

These pieces work together; changing one can silently break consumers:

- `preserveModules` + `preserveModulesRoot: 'src'` emit one file per source module; React (`/^react(-dom)?($|\/)/`) is external.
- `vite-plugin-lib-inject-css` adds `import './X.css'` to each emitted chunk, so consumers only get CSS for components they import.
- `assetFileNames` strips `.module` from emitted CSS. If the file were published as `X.module.css`, the consumer's bundler would reprocess it as a side-effect-free CSS module and tree-shake the styles away.
- `"sideEffects": ["**/*.css"]` in `package.json` lets bundlers drop unused JS while keeping CSS imports. Component modules must not have other top-level side effects.
- Scoped class names are `sui-[local]-[hash:base64:5]`.

To verify tree-shaking after build changes, build a throwaway consumer app that imports the package with and without using a component, and check the unused case contains no component JS/CSS.

## Testing

Vitest with jsdom, Testing Library and `@testing-library/jest-dom` matchers. Globals are off (import `describe`/`it`/`expect`/`vi` explicitly), so `src/test/setup.ts` registers Testing Library's `cleanup` in `afterEach`. Type-level expectations use `// @ts-expect-error` inside tests and are enforced by `pnpm typecheck`.

## Storybook

Storybook 10 with `@storybook/react-vite`, configured manually in `.storybook/` (stories glob `src/**/*.stories.tsx`). Import `Meta`/`StoryObj` from `@storybook/react-vite` and `fn` from `storybook/test`.
