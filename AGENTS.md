# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project

StylesUI is a React 19 component library built with Vite 8 (rolldown), TypeScript, pnpm and oxlint. It must stay fully tree-shakable. Styling uses CSS modules and CSS custom properties only (no Sass, no Tailwind).

## Commands

- `pnpm build`: `vite build` (JS + CSS to `dist/`) then `tsc -p tsconfig.build.json` (declarations only)
- `pnpm typecheck`: `tsc -b` over app and node tsconfigs (includes tests, stories, `.storybook`)
- `pnpm lint`: oxlint
- `pnpm format`: oxfmt (config in `.oxfmtrc.json`); `pnpm format:check` to check without writing
- `pnpm test`: Vitest run once over every project; `pnpm test:unit` (jsdom unit tests) and `pnpm test:storybook` (stories in browser mode) run one side; `pnpm test:watch` to watch
- `pnpm verify`: lint, format check, typecheck and all tests
- `pnpm test:hooks`: `node:test` tests for the Claude Code hook scripts in `.claude/hooks/`
- Single unit test file: `pnpm test:unit src/components/Box/Box.test.tsx`; single test by name: `pnpm test:unit -t "renders a div by default"`; a single story file: `pnpm test:storybook <story file>`
- `pnpm storybook` (port 6006) / `pnpm build-storybook`

A Husky pre-commit hook (`.husky/pre-commit`) runs lint-staged (`.lintstagedrc.json`): `oxlint --fix` then `oxfmt` on staged JS/TS files, `oxfmt` on everything else. `pnpm install` sets it up via the `prepare` script.

The fallow commit gate (see the end of this file) fails on a new file or export that nothing reachable from `src/index.ts` imports (`.fallowrc.json` lists the entry points), so a shared module cannot be committed before its first consumer. Commit them together.

Publishing: `.github/workflows/publish.yml` lints, typechecks, tests, builds and publishes `@krelborn/stylesui` to GitHub Packages when a GitHub Release is published. Bump `version` in `package.json` first (`pnpm version patch|minor|major`); a published version can't be republished. Prereleases use `-beta.N` versions (not `+N` build metadata, which npm strips) and a GitHub Release marked as a pre-release, which publishes under the `beta` dist-tag instead of `latest`.

Install dependencies via `pnpm add` without hand-written versions so the latest release is resolved.

## Architecture

- `src/index.ts` is the only package entry. Each component lives in `src/components/<Name>/` (`<Name>.tsx`, `<Name>.module.css`, `<Name>.test.tsx`, `<Name>.stories.tsx`, `index.ts`) and is re-exported from `src/index.ts`.
- `Box` is the polymorphic primitive other components should build on. `as` is constrained to `keyof JSX.IntrinsicElements`, and all other props (including `ref`, React 19 ref-as-prop, no `forwardRef`) are typed from the chosen element via `ComponentPropsWithRef`.
- Polymorphic components take `as` and type their props from it: `Box`, `Card`, `Center`, `Cluster`, `Cover`, `Frame`, `Grid`, `PageLayout`, `Row`, `Sidebar`, `Stack`, `Switcher`, `Text`, `Theme`, `Field`, `Prose` and `VisuallyHidden`. `Badge` takes `as` too, but only `a`, `button` or `span` (`BadgeElement`).
- Fixed-element components render one element, omit `as` and type their props from it: `Alert` (`div`), `Button`, `Divider` (`hr`), `Fieldset` and `RadioGroup` (`fieldset`), `Heading` (`h1` to `h6`, from `level`), `Select`, `SkipLink` (`a`), `Textarea` and `TextInput`. `Checkbox`, `Radio` and `Switch` render an `input` inside the `label` that names it: `className` and `style` go to the label, `ref` and every other prop to the input. `RadioGroup` omits `role` because it sets `radiogroup` itself.
- `Link` is the one exception to `as` being an element name: its `as` is `"a"` or a component that renders an anchor, such as a router's link. Its props are typed from that component, which it renders directly rather than through `Box`.
- Internal components (`TextControl`, `ChoiceControl`, `RequiredIndicator`, `HorizontalFlow`, and `AlertIcon` inside `Alert/`) are not exported from `src/index.ts` and have no stories or tests of their own; the public components built on them cover them. `TextControl` (behind `TextInput`, `Textarea` and `Select`) and `ChoiceControl` (behind `Checkbox`, `Switch` and `Radio`) each own the one CSS module their wrappers share, so the wrappers have none.
- `src/forms/` holds what the form components share: the `ControlSize` type (the only one of these exported from `src/index.ts`), `FieldContext`, `RadioGroupContext`, the `useFieldControl` hook that merges a surrounding `Field`'s id, description, invalid, required and disabled state into a control's props, and `hasContent`. `Field` provides `FieldContext` (`Fieldset` clears it for its children) and a control reads it only through the hook. `RadioGroup` provides `RadioGroupContext` to its `Radio`s, and the type of its value is not exported.
- Each React context lives alone in its own `.ts` module under `src/forms/`, never in a component file and never imported through a component barrel. A control can then read a context without pulling the component that provides it into a consumer's bundle.
- Components read CSS custom properties with fallbacks (e.g. `var(--sui-space-2, 0.5rem)`) so consumers theme by overriding variables.
- Global styles live in `src/styles/` (palette, tokens, `themes/`, modes, reset) and are built to `dist/styles.css`, exported as `@krelborn/stylesui/styles.css`. Themes set semantic tokens with `light-dark()`; `docs/design/concepts.md` describes the token tiers. `src/styles/themeTokens.test.ts` checks that every theme declares the same tokens; `--_sui-*` properties are private helpers of one theme and exempt.
- The React Compiler runs at build time (`@rolldown/plugin-babel` + `reactCompilerPreset`), so output imports `react/compiler-runtime`. Don't add manual `useMemo`/`useCallback` for memoization.

### Tree-shaking and CSS delivery (`vite.config.ts`, `package.json`)

These pieces work together; changing one can silently break consumers:

- `preserveModules` + `preserveModulesRoot: 'src'` emit one file per source module; React and `clsx` (`/^(react(-dom)?|clsx)($|\/)/`) are external.
- `vite-plugin-lib-inject-css` adds `import './X.css'` to each emitted chunk, so consumers only get CSS for components they import.
- `assetFileNames` strips `.module` from emitted CSS. If the file were published as `X.module.css`, the consumer's bundler would reprocess it as a side-effect-free CSS module and tree-shake the styles away.
- `"sideEffects": ["**/*.css"]` in `package.json` lets bundlers drop unused JS while keeping CSS imports. Component modules must not have other top-level side effects.
- Scoped class names are `sui-[local]-[hash:base64:5]`.
- `build.cssTarget` is pinned to the `light-dark()` support floor (Chrome/Edge 123, Firefox 120, Safari 17.5). A lower target makes lightningcss rewrite `light-dark()` into fallback variables, which breaks theme and mode nesting. `.storybook/main.ts` reuses the same target through `viteFinal`, and consumers must match it (the README documents this).
- `fonts/playful.css` lives outside `src/` and is published unbuilt through `files` and `exports`, because library mode inlines every asset and would base64 each font subset. The consumer's bundler resolves its `@fontsource-variable/*` imports, so those packages are `dependencies`.

To verify tree-shaking after build changes, build a throwaway consumer app that imports the package with and without using a component, and check the unused case contains no component JS/CSS.

## Testing

Vitest with jsdom, Testing Library and `@testing-library/jest-dom` matchers. Globals are off (import `describe`/`it`/`expect`/`vi` explicitly), so `src/test/setup.ts` registers Testing Library's `cleanup` in `afterEach`. Type-level expectations use `// @ts-expect-error` inside tests and are enforced by `pnpm typecheck`.

Vitest has a `unit` project (jsdom, `src/**/*.test.{ts,tsx}`) and four `storybook-<mode>-<theme>` projects (defined in `vite.config.ts`) that run every story in headless Chromium through `@storybook/addon-vitest`, once per light/dark mode and default/playful theme. Each run executes the story's play function and an axe check limited to WCAG 2.0/2.1/2.2 A and AA rules. Playwright's Chromium must be installed (`pnpm exec playwright install chromium`). Chromium is the only browser the story tests run in (`instances` in `vite.config.ts`), so Firefox and Safari rendering is covered by no test.

## Accessibility

- oxlint's `jsx-a11y` plugin is enabled with the fixed-element components mapped to the element they render (`settings.jsx-a11y.components` in `.oxlintrc.json`: `Alert`, `Button`, `Checkbox`, `Divider`, `Fieldset`, `Link`, `Radio`, `RadioGroup`, `Select`, `SkipLink`, `Switch`, `Textarea` and `TextInput`) and `as` read as the rendered element, so rules see through the polymorphic components. Add an entry when adding a fixed-element component.
- `.storybook/preview.tsx` sets `a11y.test: "todo"` globally (violations reported, not failing). A story file whose stories have no violations sets `a11y.test: "error"` in its meta, so new violations fail the test run.
- Interactive components get a `KeyboardInteraction` story whose play function checks tab order, visible focus, keyboard activation and any WAI-ARIA APG keyboard pattern and ARIA state the widget has. Assert `focusRingContrast(element) >= 3` (WCAG 1.4.11) on the focused element, `borderContrast(element) >= 3` (WCAG 1.4.11) on a form control's border, and use `textContrast(element, background)` for states axe can't reach, such as hover (WCAG 1.4.3); all three live in `src/test/colorContrast.ts`, and the four storybook projects cover every mode and theme.
- Draw the focus ring on the element that holds focus, and assert it there: the `input` inside a `Checkbox`, `Switch` or `Radio`, not the `label` around it.
- `userEvent.tab()` from `storybook/test` (Testing Library's user-event) only treats a radio group as one tab stop when one of its radios is checked; with none checked it stops at every radio. Start a `RadioGroup` story with a `defaultValue` when it tests tab order.
- `src/styles/Contrast.stories.tsx` asserts every semantic colour pairing a theme guarantees (text 4.5:1, focus ring 3:1, form control border 3:1) in every mode and theme. When a component starts relying on a new pairing, add it there.
- Every token read has a literal fallback (`var(--sui-color-text, #111827)`), and every story loads `styles.css`, so no test renders a fallback colour. Check each fallback colour pair for contrast by hand.
- Every interactive target is at least 24px in both dimensions, or spaced to pass axe's `target-size` rule (WCAG 2.5.8), which runs on every story.

## Storybook

Storybook 10 with `@storybook/react-vite`, configured manually in `.storybook/` (globs `src/**/*.mdx` and `src/**/*.stories.tsx`). Import `Meta`/`StoryObj` from `@storybook/react-vite` and `fn` from `storybook/test`.

### Docs

`@storybook/addon-docs` generates a Docs page for every story file (`tags: ["autodocs"]` in `.storybook/preview.tsx`):

- The component's JSDoc is the page description; `src/docs/componentDescription.ts` renders its `@example` tags as code blocks. Prop JSDoc and defaults fill the prop table, and each story export's JSDoc is shown above that story, so give every story one.
- Prop tables come from react-docgen, since the TypeScript-based extractors need the TypeScript JS API that TypeScript 7 lacks. It can't see props inherited from `Box` or substitute generic type parameters, so polymorphic components spell out `OwnProps & Omit<BoxProps<E>, keyof OwnProps>` instead of `PolymorphicProps<E, OwnProps>`, and stories add `argTypes` for inherited props they document (`asArgType`/`childrenArgType` in `src/docs/argTypes.ts`).
- Guides are standalone MDX pages in `src/docs/` (`<Meta title="Guides/..." />`), with sidebar order set by `options.storySort`. Embed stories with `<Canvas of={...} />` rather than duplicating examples. MDX files and docs pages don't run in the Vitest storybook projects.
- Don't embed with `<Canvas>` a story rendered in an iframe (`docs: { story: { inline: false } }`) whose play function moves focus: it scrolls the docs page to the focused element and takes focus as the page opens. Link to it instead, as the Forms guide does for the contact form example.
- This Storybook has no `remark-gfm` (`.storybook/main.ts` sets no MDX plugins), so MDX tables render as raw text. Guides use lists.
- On a docs page, `ThemeDocsContainer` keeps the document light and default to match Storybook's docs UI, and `ThemeRoot` renders each story in a `Theme` island carrying the toolbar's theme and mode.

## Coding standards

`docs/standards/` holds the coding standards. `.claude/standards.json` maps each document to the file suffixes it applies to (for example `.tsx` gets comments, typescript and react; `.test.tsx` adds vitest-unit-testing).

The JSX prop order in `docs/standards/react.md` (alphabetical, then `aria-*`, then `data-*`) is enforced by neither oxlint nor oxfmt, so keep it by hand.

Claude Code hooks in `.claude/settings.json` run `.claude/hooks/standards.mjs` so matching standards are in an agent's context whenever it reads, writes or edits a file:

- **PreToolUse (`Read|Write|Edit`)**: adds any matching document not yet in that agent's context, in full. A Write or Edit made before its standards were in context is denied once, with the standards attached, so the change is redone following them. A Write or Edit issued in the same assistant message as the tool call whose hook loaded its standards (matched by `message.id` in the transcript, or loaded under 3 seconds ago when either call is not in the transcript yet) is also denied, without the standards attached, since that other call delivers them.
- **PostToolUse (`Bash`)**: after `git diff`, `git show`, `git log` or `gh pr diff`, adds the standards for existing project files named in the output (raw or rtk-compacted), so diff-based reviews get them too. Output cut short by a pipe such as `| head` may name no files.
- **Per-context tracking**: state lives in `$TMPDIR/claude-standards/<session_id>/<agent_id or main>.json`, so each subagent is tracked separately. A `compact_boundary` entry in the agent's transcript clears its state, so documents are sent again on its next matching tool call.
- **SessionStart (`compact`)**: re-sends every loaded document to the main agent straight after compaction; `clear` resets its state. **SubagentStart (`fork`)**: a fork inherits the main agent's loaded documents.
- **Size limit**: Claude Code moves any single `additionalContext` string over 10,000 characters to a file and leaves only a 2,000-character preview in context, so each event has `slotCount` handlers (`... standards.mjs <mode> <slot>`) that each emit one chunk. Parallel slots share one plan per event via a lock in the state directory. Keep `slotCount` in `standards.json` and the number of handlers in `settings.json` equal; `pnpm test:hooks` checks this.

To add a standard, add the document under `docs/standards/` and a rule in `.claude/standards.json`.

---

<!-- fallow:setup-hooks:start -->

## Fallow local gate

Before any `git commit` or `git push`, run `fallow audit --format json --quiet --explain --gate-marker agent`. If the verdict is `fail`, fix the reported findings before retrying. Treat JSON runtime errors like `{ "error": true, ... }` as non-blocking.

Audit defaults to `gate=new-only`: only findings introduced by the current changeset affect the verdict. Inherited findings on touched files are reported under `attribution` and annotated with `introduced: false`, but do not block the commit. Set `[audit] gate = "all"` in `fallow.toml` to gate every finding in changed files.

For non-skill agents, treat the task map below as the local onboarding source: run the listed fallow command before destructive edits, before commits, and before pull request handoff.

## Fallow task map

| When the agent is about to...                                     | Run                                                                                                                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| delete an "unused" export or file                                 | `fallow dead-code --trace <file>:<export>`                                                                                                              |
| prove a TypeScript symbol's exact consumers before refactoring    | `fallow dead-code --type-aware --symbol-impact <file>:<export-or-class.method>`                                                                         |
| find how one module reaches another                               | `fallow trace --path <from> <to>` (Reports `reachable: false` instead of failing when no import path exists; type-only hops are reported, not skipped.) |
| delete an "unused" dependency                                     | `fallow dead-code --trace-dependency <name>`                                                                                                            |
| commit or open a PR                                               | `fallow audit --base <ref>`                                                                                                                             |
| read a diff before approving it                                   | `fallow review --base <ref> --brief` (orientation, never gates: deterministic and always exit 0, unlike the audit row)                                  |
| prioritize refactoring                                            | `fallow health --hotspots --targets`                                                                                                                    |
| ask who owns code                                                 | `fallow health --ownership`                                                                                                                             |
| check untested-but-reachable code                                 | `fallow health --coverage-gaps`                                                                                                                         |
| consolidate duplication                                           | `fallow dupes --trace dup:<fingerprint>`                                                                                                                |
| find feature flags                                                | `fallow flags`                                                                                                                                          |
| check which architecture rules apply to a file before changing it | `fallow guard <files>`                                                                                                                                  |
| surface security candidates                                       | `fallow security`                                                                                                                                       |
| understand a finding                                              | `fallow explain <issue-type>`                                                                                                                           |
| scope a monorepo                                                  | `--workspace <glob> / --changed-workspaces <ref>` (global flags, prefix any command)                                                                    |

<!-- fallow:setup-hooks:end -->
