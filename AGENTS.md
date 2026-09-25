# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project

StylesUI is a React 19 component library built with Vite 8 (rolldown), TypeScript, pnpm and oxlint. It must stay fully tree-shakable. Styling uses CSS modules and CSS custom properties only (no Sass, no Tailwind).

## Commands

- `pnpm build`: `vite build` (JS + CSS to `dist/`) then `tsc -p tsconfig.build.json` (declarations only)
- `pnpm typecheck`: `tsc -b` over app and node tsconfigs (includes tests, stories, `.storybook`)
- `pnpm lint`: oxlint
- `pnpm test`: Vitest run once over `src/`; `pnpm test:watch` to watch
- `pnpm test:hooks`: `node:test` tests for the Claude Code hook scripts in `.claude/hooks/`
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

## Coding standards

`docs/standards/` holds the coding standards. `.claude/standards.json` maps each document to the file suffixes it applies to (for example `.tsx` gets comments, typescript and react; `.test.tsx` adds vitest-unit-testing).

Claude Code hooks in `.claude/settings.json` run `.claude/hooks/standards.mjs` so matching standards are in an agent's context whenever it reads, writes or edits a file:

- **PreToolUse (`Read|Write|Edit`)**: adds any matching document not yet in that agent's context, in full. A Write or Edit made before its standards were in context is denied once, with the standards attached, so the change is redone following them.
- **PostToolUse (`Bash`)**: after `git diff`, `git show`, `git log` or `gh pr diff`, adds the standards for existing project files named in the output (raw or rtk-compacted), so diff-based reviews get them too. Output cut short by a pipe such as `| head` may name no files.
- **Per-context tracking**: state lives in `$TMPDIR/claude-standards/<session_id>/<agent_id or main>.json`, so each subagent is tracked separately. A `compact_boundary` entry in the agent's transcript clears its state, so documents are sent again on its next matching tool call.
- **SessionStart (`compact`)**: re-sends every loaded document to the main agent straight after compaction; `clear` resets its state. **SubagentStart (`fork`)**: a fork inherits the main agent's loaded documents.
- **Size limit**: Claude Code moves any single `additionalContext` string over 10,000 characters to a file and leaves only a 2,000-character preview in context, so each event has `slotCount` handlers (`... standards.mjs <mode> <slot>`) that each emit one chunk. Parallel slots share one plan per event via a lock in the state directory. Keep `slotCount` in `standards.json` and the number of handlers in `settings.json` equal; `pnpm test:hooks` checks this.

To add a standard, add the document under `docs/standards/` and a rule in `.claude/standards.json`.
