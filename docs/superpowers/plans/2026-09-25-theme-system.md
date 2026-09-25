# Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a CSS-only theme system (`default` and `playful`, each light and dark) as `@krelborn/stylesui/styles.css`, plus `Theme`, `Text`, `Heading`, `Button` and `Card` components that demonstrate it.

**Architecture:** Three token tiers: a theme-agnostic palette, semantic tokens set per theme with `light-dark()`, and component tokens local to each CSS module. Themes are selected with `data-sui-theme`, and modes with `data-sui-mode` mapped to `color-scheme`. Global CSS is a separate build entry that the consumer imports explicitly. Components build on `Box` and expose variants as `data-*` attributes.

**Tech Stack:** React 19, TypeScript 7, Vite 8 (rolldown, lib mode), CSS modules, Vitest + Testing Library (jsdom), Storybook 10, pnpm, oxlint/oxfmt.

**Spec:** `docs/superpowers/specs/2026-09-25-theme-system-design.md`

## Global Constraints

- Browser floor: Chrome 123, Edge 123, Firefox 120, Safari 17.5 (required for `light-dark()`). The emitted CSS must contain `light-dark(` verbatim, never lightningcss fallback variables (`--lightningcss-light`).
- Styling is CSS modules and CSS custom properties only. No Sass, no Tailwind, no CSS-in-JS.
- All tokens are prefixed `--sui-`. Component CSS reads semantic tokens with a literal fallback, e.g. `var(--sui-color-primary, #2563eb)`.
- Data attribute names are exactly: `data-sui-theme`, `data-sui-mode`, `data-variant`, `data-size`, `data-tone`, `data-weight`, `data-padding`.
- Components render through `Box` and never render DOM elements directly. Stories follow the same rule.
- Component modules have no top-level side effects. The package stays tree-shakable.
- The React Compiler runs at build time, so add no manual `useMemo`/`useCallback`.
- Follow `docs/standards/*.md` (the `.claude` hooks attach them). In particular: full-word identifiers, props sorted alphabetically with `aria-*` then `data-*` last in JSX, multi-line JSDoc, explicit `: JSX.Element` return types on exported components, tests named `must <behaviour> when <condition>`, and `userEvent.setup()` for interactions.
- Add dependencies with `pnpm add <name>` and no hand-written version.
- Before every `git commit`, run `fallow audit --format json --quiet --explain --gate-marker agent`. If `"verdict":"fail"`, fix the findings first. A JSON `{ "error": true }` result does not block.
- End every commit message with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- **Addition beyond the spec:** `clsx` becomes a runtime dependency for class composition (Task 2), because `docs/standards/react.md` requires it and forbids ternaries. It is marked external in the build.

## File Map

| Path                                                                    | Responsibility                                                                       |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/styles/palette.css`                                                | Palette tier: hue ramps 100–900, black, white                                        |
| `src/styles/tokens.css`                                                 | Theme-agnostic scalars; space steps and shadow, recomputed per theme element         |
| `src/styles/modes.css`                                                  | `data-sui-mode` → `color-scheme`                                                     |
| `src/styles/themes/default.css`, `src/styles/themes/playful.css`        | Semantic tier per theme                                                              |
| `src/styles/reset.css`                                                  | Global reset; `body` uses theme tokens                                               |
| `src/styles/index.css`                                                  | Imports the above in order; built to `dist/styles.css`                               |
| `src/styles/themeTokens.test.ts`                                        | Guards that the themes declare the same tokens and use `light-dark()`                |
| `src/styles/Tokens.stories.tsx`, `src/styles/ThemeShowcase.stories.tsx` | Foundations stories                                                                  |
| `src/components/{Theme,Text,Heading,Button,Card}/`                      | Components, each with `.tsx`, `.module.css`, `.test.tsx`, `.stories.tsx`, `index.ts` |
| `src/components/Box/Box.tsx`, `index.ts`                                | Export `BoxElement`; use `clsx`                                                      |
| `src/index.ts`                                                          | Public exports                                                                       |
| `vite.config.ts`                                                        | CSS entry, `cssTarget`, `clsx` external                                              |
| `package.json`                                                          | `./styles.css` export, `clsx` dependency                                             |
| `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.build.json`        | Move `.storybook` into the app project, so JSX and DOM types apply                   |
| `.storybook/preview.tsx` (replaces `preview.ts`)                        | Global CSS, theme/mode toolbar, `Theme` decorator                                    |
| `docs/design/concepts.md`, `README.md`, `AGENTS.md`                     | Documentation                                                                        |

---

### Task 1: Global stylesheet and build output

**Files:**

- Create: `src/styles/palette.css`, `src/styles/tokens.css`, `src/styles/modes.css`, `src/styles/themes/default.css`, `src/styles/themes/playful.css`, `src/styles/reset.css`, `src/styles/index.css`
- Test: `src/styles/themeTokens.test.ts`
- Modify: `vite.config.ts`, `package.json`

**Interfaces:**

- Produces: every `--sui-*` token named in the spec, available once `styles.css` is loaded. The package export `@krelborn/stylesui/styles.css` resolves to `dist/styles.css`. Theme selectors are `:root, [data-sui-theme="default"]` and `[data-sui-theme="playful"]`.

- [ ] **Step 1: Write the failing test**

Create `src/styles/themeTokens.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import paletteCss from "./palette.css?raw";
import defaultThemeCss from "./themes/default.css?raw";
import playfulThemeCss from "./themes/playful.css?raw";

const hues = ["gray", "red", "orange", "yellow", "green", "blue", "indigo", "violet"] as const;
const steps = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

function declaredTokens(css: string): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const match of css.matchAll(/(--sui-[\w-]+):\s*([^;]+);/g)) {
    tokens.set(match[1], match[2].trim());
  }
  return tokens;
}

describe("theme tokens", () => {
  it("must define every hue step when the palette is loaded", () => {
    const palette = declaredTokens(paletteCss);

    const missing = hues
      .flatMap((hue) => steps.map((step) => `--sui-${hue}-${step}`))
      .filter((name) => !palette.has(name));

    expect(missing).toEqual([]);
    expect(palette.get("--sui-black")).toBe("#000");
    expect(palette.get("--sui-white")).toBe("#fff");
  });

  it("must declare the same tokens when playful is compared with default", () => {
    const defaultNames = [...declaredTokens(defaultThemeCss).keys()].sort();
    const playfulNames = [...declaredTokens(playfulThemeCss).keys()].sort();

    expect(playfulNames).toEqual(defaultNames);
  });

  it.each([
    { css: defaultThemeCss, name: "default" },
    { css: playfulThemeCss, name: "playful" },
  ])("must define every colour token with light-dark() when the theme is $name", ({ css }) => {
    const colourTokens = [...declaredTokens(css)].filter(([name]) => name.startsWith("--sui-color-"));

    expect(colourTokens.length).toBeGreaterThan(0);
    for (const [name, value] of colourTokens) {
      expect(value, name).toMatch(/^light-dark\(/);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/styles/themeTokens.test.ts`
Expected: FAIL, because `./palette.css?raw` cannot be resolved.

- [ ] **Step 3: Create the palette**

Create `src/styles/palette.css`. Values are the Tailwind CSS v3 steps 100–900.

```css
:root {
  --sui-black: #000;
  --sui-white: #fff;

  --sui-gray-100: #f3f4f6;
  --sui-gray-200: #e5e7eb;
  --sui-gray-300: #d1d5db;
  --sui-gray-400: #9ca3af;
  --sui-gray-500: #6b7280;
  --sui-gray-600: #4b5563;
  --sui-gray-700: #374151;
  --sui-gray-800: #1f2937;
  --sui-gray-900: #111827;

  --sui-red-100: #fee2e2;
  --sui-red-200: #fecaca;
  --sui-red-300: #fca5a5;
  --sui-red-400: #f87171;
  --sui-red-500: #ef4444;
  --sui-red-600: #dc2626;
  --sui-red-700: #b91c1c;
  --sui-red-800: #991b1b;
  --sui-red-900: #7f1d1d;

  --sui-orange-100: #ffedd5;
  --sui-orange-200: #fed7aa;
  --sui-orange-300: #fdba74;
  --sui-orange-400: #fb923c;
  --sui-orange-500: #f97316;
  --sui-orange-600: #ea580c;
  --sui-orange-700: #c2410c;
  --sui-orange-800: #9a3412;
  --sui-orange-900: #7c2d12;

  --sui-yellow-100: #fef9c3;
  --sui-yellow-200: #fef08a;
  --sui-yellow-300: #fde047;
  --sui-yellow-400: #facc15;
  --sui-yellow-500: #eab308;
  --sui-yellow-600: #ca8a04;
  --sui-yellow-700: #a16207;
  --sui-yellow-800: #854d0e;
  --sui-yellow-900: #713f12;

  --sui-green-100: #dcfce7;
  --sui-green-200: #bbf7d0;
  --sui-green-300: #86efac;
  --sui-green-400: #4ade80;
  --sui-green-500: #22c55e;
  --sui-green-600: #16a34a;
  --sui-green-700: #15803d;
  --sui-green-800: #166534;
  --sui-green-900: #14532d;

  --sui-blue-100: #dbeafe;
  --sui-blue-200: #bfdbfe;
  --sui-blue-300: #93c5fd;
  --sui-blue-400: #60a5fa;
  --sui-blue-500: #3b82f6;
  --sui-blue-600: #2563eb;
  --sui-blue-700: #1d4ed8;
  --sui-blue-800: #1e40af;
  --sui-blue-900: #1e3a8a;

  --sui-indigo-100: #e0e7ff;
  --sui-indigo-200: #c7d2fe;
  --sui-indigo-300: #a5b4fc;
  --sui-indigo-400: #818cf8;
  --sui-indigo-500: #6366f1;
  --sui-indigo-600: #4f46e5;
  --sui-indigo-700: #4338ca;
  --sui-indigo-800: #3730a3;
  --sui-indigo-900: #312e81;

  --sui-violet-100: #ede9fe;
  --sui-violet-200: #ddd6fe;
  --sui-violet-300: #c4b5fd;
  --sui-violet-400: #a78bfa;
  --sui-violet-500: #8b5cf6;
  --sui-violet-600: #7c3aed;
  --sui-violet-700: #6d28d9;
  --sui-violet-800: #5b21b6;
  --sui-violet-900: #4c1d95;
}
```

- [ ] **Step 4: Create the two themes**

Create `src/styles/themes/default.css`:

```css
:root,
[data-sui-theme="default"] {
  --sui-color-primary: light-dark(var(--sui-blue-600), var(--sui-blue-400));
  --sui-color-primary-hover: light-dark(var(--sui-blue-700), var(--sui-blue-300));
  --sui-color-primary-subtle: light-dark(var(--sui-blue-100), var(--sui-blue-900));
  --sui-color-on-primary: light-dark(var(--sui-white), var(--sui-gray-900));
  --sui-color-secondary: light-dark(var(--sui-gray-200), var(--sui-gray-700));
  --sui-color-secondary-hover: light-dark(var(--sui-gray-300), var(--sui-gray-600));
  --sui-color-secondary-subtle: light-dark(var(--sui-gray-100), var(--sui-gray-800));
  --sui-color-on-secondary: light-dark(var(--sui-gray-900), var(--sui-gray-100));
  --sui-color-background: light-dark(var(--sui-white), var(--sui-gray-900));
  --sui-color-surface: light-dark(var(--sui-gray-100), var(--sui-gray-800));
  --sui-color-border: light-dark(var(--sui-gray-300), var(--sui-gray-700));
  --sui-color-text: light-dark(var(--sui-gray-900), var(--sui-gray-100));
  --sui-color-text-muted: light-dark(var(--sui-gray-600), var(--sui-gray-400));
  --sui-color-focus-ring: light-dark(var(--sui-blue-500), var(--sui-blue-300));
  --sui-color-shadow: light-dark(rgb(0 0 0 / 0.12), rgb(0 0 0 / 0.5));
  --sui-color-success: light-dark(var(--sui-green-600), var(--sui-green-400));
  --sui-color-on-success: light-dark(var(--sui-white), var(--sui-gray-900));
  --sui-color-warning: light-dark(var(--sui-yellow-500), var(--sui-yellow-300));
  --sui-color-on-warning: light-dark(var(--sui-gray-900), var(--sui-gray-900));
  --sui-color-danger: light-dark(var(--sui-red-600), var(--sui-red-400));
  --sui-color-on-danger: light-dark(var(--sui-white), var(--sui-gray-900));
  --sui-color-info: light-dark(var(--sui-blue-500), var(--sui-blue-300));
  --sui-color-on-info: light-dark(var(--sui-white), var(--sui-gray-900));

  --sui-radius-sm: 2px;
  --sui-radius-md: 4px;
  --sui-radius-lg: 8px;
  --sui-radius-full: 9999px;

  --sui-space-unit: 0.25rem;

  --sui-font-body: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --sui-font-heading: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --sui-font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
}
```

Create `src/styles/themes/playful.css`:

```css
[data-sui-theme="playful"] {
  --sui-color-primary: light-dark(var(--sui-violet-600), var(--sui-violet-400));
  --sui-color-primary-hover: light-dark(var(--sui-violet-700), var(--sui-violet-300));
  --sui-color-primary-subtle: light-dark(var(--sui-violet-100), var(--sui-violet-900));
  --sui-color-on-primary: light-dark(var(--sui-white), var(--sui-gray-900));
  --sui-color-secondary: light-dark(var(--sui-orange-400), var(--sui-orange-400));
  --sui-color-secondary-hover: light-dark(var(--sui-orange-500), var(--sui-orange-300));
  --sui-color-secondary-subtle: light-dark(var(--sui-orange-100), var(--sui-orange-900));
  --sui-color-on-secondary: light-dark(var(--sui-gray-900), var(--sui-gray-900));
  --sui-color-background: light-dark(var(--sui-white), var(--sui-gray-900));
  --sui-color-surface: light-dark(var(--sui-violet-100), var(--sui-gray-800));
  --sui-color-border: light-dark(var(--sui-violet-200), var(--sui-gray-700));
  --sui-color-text: light-dark(var(--sui-gray-900), var(--sui-gray-100));
  --sui-color-text-muted: light-dark(var(--sui-gray-600), var(--sui-gray-400));
  --sui-color-focus-ring: light-dark(var(--sui-violet-500), var(--sui-violet-300));
  --sui-color-shadow: light-dark(rgb(76 29 149 / 0.15), rgb(0 0 0 / 0.5));
  --sui-color-success: light-dark(var(--sui-green-600), var(--sui-green-400));
  --sui-color-on-success: light-dark(var(--sui-white), var(--sui-gray-900));
  --sui-color-warning: light-dark(var(--sui-yellow-500), var(--sui-yellow-300));
  --sui-color-on-warning: light-dark(var(--sui-gray-900), var(--sui-gray-900));
  --sui-color-danger: light-dark(var(--sui-red-600), var(--sui-red-400));
  --sui-color-on-danger: light-dark(var(--sui-white), var(--sui-gray-900));
  --sui-color-info: light-dark(var(--sui-blue-500), var(--sui-blue-300));
  --sui-color-on-info: light-dark(var(--sui-white), var(--sui-gray-900));

  --sui-radius-sm: 6px;
  --sui-radius-md: 12px;
  --sui-radius-lg: 20px;
  --sui-radius-full: 9999px;

  --sui-space-unit: 0.3rem;

  --sui-font-body: "Nunito", ui-rounded, system-ui, sans-serif;
  --sui-font-heading: "Nunito", ui-rounded, system-ui, sans-serif;
  --sui-font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test src/styles/themeTokens.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Create tokens, modes, reset and the index**

Create `src/styles/tokens.css`:

```css
:root {
  --sui-font-size-xs: 0.75rem;
  --sui-font-size-sm: 0.875rem;
  --sui-font-size-md: 1rem;
  --sui-font-size-lg: 1.125rem;
  --sui-font-size-xl: 1.25rem;
  --sui-font-size-2xl: 1.5rem;
  --sui-font-size-3xl: 1.875rem;

  --sui-font-weight-regular: 400;
  --sui-font-weight-medium: 500;
  --sui-font-weight-bold: 700;

  --sui-line-height-tight: 1.25;
  --sui-line-height-normal: 1.5;
}

/* Custom properties resolve var() where they are declared, so these repeat on every theme element to pick up its unit and shadow colour */
:root,
[data-sui-theme] {
  --sui-space-1: calc(1 * var(--sui-space-unit));
  --sui-space-2: calc(2 * var(--sui-space-unit));
  --sui-space-3: calc(3 * var(--sui-space-unit));
  --sui-space-4: calc(4 * var(--sui-space-unit));
  --sui-space-5: calc(5 * var(--sui-space-unit));
  --sui-space-6: calc(6 * var(--sui-space-unit));
  --sui-space-7: calc(7 * var(--sui-space-unit));
  --sui-space-8: calc(8 * var(--sui-space-unit));

  --sui-shadow-sm: 0 1px 3px var(--sui-color-shadow);
}
```

Create `src/styles/modes.css`:

```css
:root,
[data-sui-mode="system"] {
  color-scheme: light dark;
}

[data-sui-mode="light"] {
  color-scheme: light;
}

[data-sui-mode="dark"] {
  color-scheme: dark;
}
```

Create `src/styles/reset.css`:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

* {
  margin: 0;
}

body {
  background-color: var(--sui-color-background);
  color: var(--sui-color-text);
  font-family: var(--sui-font-body);
  line-height: var(--sui-line-height-normal);
  -webkit-font-smoothing: antialiased;
}

img,
picture,
video,
canvas,
svg {
  display: block;
  max-width: 100%;
}

input,
button,
textarea,
select {
  font: inherit;
}

p,
h1,
h2,
h3,
h4,
h5,
h6 {
  overflow-wrap: break-word;
}
```

Create `src/styles/index.css`:

```css
@import "./palette.css";
@import "./tokens.css";
@import "./themes/default.css";
@import "./themes/playful.css";
@import "./modes.css";
@import "./reset.css";
```

- [ ] **Step 7: Add the CSS build entry, CSS target and package export**

In `vite.config.ts`, replace the `lib` block and add `cssTarget` to `build`:

```ts
  build: {
    lib: {
      entry: { index: "src/index.ts", styles: "src/styles/index.css" },
      formats: ["es"],
    },
    // Matches the light-dark() support floor; a lower target makes lightningcss rewrite light-dark() into fallback variables that break theme nesting
    cssTarget: ["chrome123", "edge123", "firefox120", "safari17.5"],
    cssCodeSplit: true,
```

(Keep `copyPublicDir` and `rolldownOptions` unchanged.)

In `package.json`, extend `exports`:

```json
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./styles.css": "./dist/styles.css"
  },
```

- [ ] **Step 8: Build and inspect the output**

Run:

```bash
rm -rf dist && pnpm build && ls dist && rg -c "@import" dist/styles.css; rg -o "light-dark\(" dist/styles.css | wc -l; rg -c "lightningcss" dist/styles.css; rg -o "sui-violet-600:[^;]+" dist/styles.css; rg "styles" dist/index.js; ls dist/styles.js 2>&1
```

Expected:

- `dist/styles.css` exists, with no `@import` matches (count output absent or 0).
- The `light-dark(` count (from `wc -l`) is 46 or more (23 colour tokens × 2 themes); `lightningcss` has no matches.
- `sui-violet-600:#7c3aed` (or equivalent) is present.
- `dist/index.js` does not reference `styles`.

If `dist/styles.js` exists, or `dist/styles.css` is missing or still has `@import`, apply Step 9. Otherwise skip Step 9.

- [ ] **Step 9 (only if Step 8 failed): Bundle the stylesheet with a script instead**

Revert `lib.entry` in `vite.config.ts` to `entry: "src/index.ts",` (keep `cssTarget`). Create `scripts/bundleStyles.mjs`:

```js
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const importPattern = /^@import\s+"(.+)";$/;

async function inlineImports(filePath) {
  const css = await readFile(filePath, "utf8");
  const lines = await Promise.all(
    css.split("\n").map((line) => {
      const match = importPattern.exec(line.trim());
      if (!match) {
        return line;
      }
      return inlineImports(path.resolve(path.dirname(filePath), match[1]));
    })
  );
  return lines.join("\n");
}

await mkdir("dist", { recursive: true });
await writeFile("dist/styles.css", await inlineImports("src/styles/index.css"));
```

Change the `build` script in `package.json` to `"vite build && node scripts/bundleStyles.mjs && tsc -p tsconfig.build.json"`, then re-run the Step 8 commands. Expected: the same results as in Step 8, and `light-dark(` is present because the file is copied unminified.

- [ ] **Step 10: Run the full checks**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: all pass. The Box tests are unchanged.

- [ ] **Step 11: Commit**

```bash
fallow audit --format json --quiet --explain --gate-marker agent
git add src/styles vite.config.ts package.json
# If Step 9 ran, also: git add scripts/bundleStyles.mjs
git commit -m "Add global stylesheet with palette, tokens and default/playful themes

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `clsx` and a shared `BoxElement` type

**Files:**

- Modify: `package.json` (dependency), `vite.config.ts:25` (external), `src/components/Box/Box.tsx`, `src/components/Box/index.ts`
- Test: `src/components/Box/Box.test.tsx` (existing; must stay green)

**Interfaces:**

- Produces: `export type BoxElement = keyof JSX.IntrinsicElements`, exported from `src/components/Box` (barrel). `clsx` is importable as `import { clsx } from "clsx";` and stays external in `dist`.

- [ ] **Step 1: Install clsx**

Run: `pnpm add clsx`
Expected: `clsx` is added under `dependencies` (not `devDependencies`) in `package.json`.

- [ ] **Step 2: Mark clsx external**

In `vite.config.ts`, change the `external` line and its surroundings to:

```ts
    rolldownOptions: {
      external: /^(react(-dom)?|clsx)($|\/)/,
```

- [ ] **Step 3: Update Box**

Replace `src/components/Box/Box.tsx` with:

```tsx
import type { ComponentPropsWithRef, ElementType, JSX } from "react";
import { clsx } from "clsx";

import styles from "./Box.module.css";

/**
 * Intrinsic element names that `Box` can render
 */
export type BoxElement = keyof JSX.IntrinsicElements;

type BoxOwnProps<E extends BoxElement> = {
  /** DOM element to render. Defaults to `div`. */
  as?: E;
  /** Class names merged with the Box base class. */
  className?: string;
};

/** Props for `Box`: its own props plus every prop supported by the element given in `as`. */
export type BoxProps<E extends BoxElement = "div"> = BoxOwnProps<E> &
  Omit<ComponentPropsWithRef<E>, keyof BoxOwnProps<E>>;

/**
 * Polymorphic primitive that renders the DOM element given in `as` and forwards all of its props.
 * Foundation for other StylesUI components.
 *
 * @example
 * <Box as="button" onClick={() => console.log('Clicked')}>Click Me</Box>
 */
export function Box<E extends BoxElement = "div">({ as, className, ...rest }: BoxProps<E>): JSX.Element {
  // Widened so TS does not intersect every intrinsic element's ref type; BoxProps<E> already guarantees props match `as`
  const Component = (as ?? "div") as ElementType;

  return <Component className={clsx(styles.box, className)} {...rest} />;
}
```

Replace `src/components/Box/index.ts` with:

```ts
export { Box } from "./Box";
export type { BoxElement, BoxProps } from "./Box";
```

- [ ] **Step 4: Run Box tests and typecheck**

Run: `pnpm test src/components/Box && pnpm typecheck && pnpm lint`
Expected: PASS. The existing "merges className with the base class" test still sees exactly two classes.

- [ ] **Step 5: Verify clsx is external in the build**

Run: `pnpm build && rg -n "from \"clsx\"" dist/components/Box/Box.js && ls dist | rg node_modules`
Expected: the first command prints an `import ... from "clsx"` line. The second prints nothing (clsx is not bundled into `dist`).

- [ ] **Step 6: Commit**

```bash
fallow audit --format json --quiet --explain --gate-marker agent
git add package.json pnpm-lock.yaml vite.config.ts src/components/Box
git commit -m "Compose Box class names with clsx and export BoxElement

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: `Theme` component

**Files:**

- Create: `src/components/Theme/Theme.tsx`, `Theme.module.css`, `Theme.test.tsx`, `Theme.stories.tsx`, `index.ts`
- Modify: `src/index.ts`

**Interfaces:**

- Consumes: `Box`, `BoxElement` and `BoxProps` from `../Box`; `clsx`.
- Produces: `Theme<E>(props: ThemeProps<E>): JSX.Element`; `type ThemeName = "default" | "playful"`; `type ThemeMode = "dark" | "light" | "system"`; `type ThemeProps<E extends BoxElement = "div">`. It renders `data-sui-theme={name}` and `data-sui-mode={mode}`, each omitted when undefined.

- [ ] **Step 1: Write the failing test**

Create `src/components/Theme/Theme.test.tsx`:

```tsx
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Theme } from "./Theme";

describe("Theme", () => {
  it("must render a div when as is omitted", () => {
    render(<Theme>Content</Theme>);

    expect(screen.getByText("Content").tagName).toBe("DIV");
  });

  it("must set the theme and mode attributes when name and mode are given", () => {
    render(
      <Theme mode="dark" name="playful">
        Content
      </Theme>
    );

    const theme = screen.getByText("Content");
    expect(theme).toHaveAttribute("data-sui-theme", "playful");
    expect(theme).toHaveAttribute("data-sui-mode", "dark");
  });

  it("must omit the theme and mode attributes when name and mode are omitted", () => {
    render(<Theme>Content</Theme>);

    const theme = screen.getByText("Content");
    expect(theme).not.toHaveAttribute("data-sui-theme");
    expect(theme).not.toHaveAttribute("data-sui-mode");
  });

  it("must render the element given in as when as is set", () => {
    render(
      <Theme aria-label="Island" as="section">
        Content
      </Theme>
    );

    expect(screen.getByRole("region", { name: "Island" })).toBeInTheDocument();
  });

  it("must merge className when one is given", () => {
    render(<Theme className="custom">Content</Theme>);

    expect(screen.getByText("Content")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLElement>();

    render(
      <Theme as="section" ref={ref}>
        Content
      </Theme>
    );

    expect(ref.current).toBe(screen.getByText("Content"));
  });

  it("must reject a theme name when it is not shipped", () => {
    // @ts-expect-error "ocean" is not a ThemeName
    render(<Theme name="ocean">Content</Theme>);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/Theme`
Expected: FAIL, because `./Theme` cannot be resolved.

- [ ] **Step 3: Implement**

Create `src/components/Theme/Theme.module.css`:

```css
.theme {
  background-color: var(--sui-color-background, #fff);
  color: var(--sui-color-text, #111827);
  font-family: var(--sui-font-body, system-ui, sans-serif);
}
```

Create `src/components/Theme/Theme.tsx`:

```tsx
import type { JSX } from "react";
import { clsx } from "clsx";

import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Theme.module.css";

/**
 * Names of the themes shipped in `styles.css`
 */
export type ThemeName = "default" | "playful";

/**
 * Colour mode; `system` follows the operating system preference
 */
export type ThemeMode = "dark" | "light" | "system";

interface ThemeOwnProps<E extends BoxElement> {
  /**
   * DOM element to render. Defaults to `div`.
   */
  as?: E;

  /**
   * Class names merged with the Theme base class
   */
  className?: string;

  /**
   * Colour mode for this subtree. Inherited from the nearest ancestor when omitted.
   */
  mode?: ThemeMode;

  /**
   * Theme for this subtree. Inherited from the nearest ancestor when omitted.
   */
  name?: ThemeName;
}

/**
 * Props for `Theme`: its own props plus every prop supported by the element given in `as`
 */
export type ThemeProps<E extends BoxElement = "div"> = ThemeOwnProps<E> & Omit<BoxProps<E>, keyof ThemeOwnProps<E>>;

/**
 * Applies a theme and colour mode to its subtree and paints the theme's background, text colour and font.
 * Needs `@krelborn/stylesui/styles.css` imported once by the app.
 *
 * @example
 * <Theme mode="dark" name="playful">...</Theme>
 */
export function Theme<E extends BoxElement = "div">({
  as,
  className,
  mode,
  name,
  ...rest
}: ThemeProps<E>): JSX.Element {
  // Widened as in Box: ThemeProps<E> already guarantees the props match `as`
  const boxProps = rest as BoxProps<"div">;

  return (
    <Box
      {...boxProps}
      as={(as ?? "div") as "div"}
      className={clsx(styles.theme, className)}
      data-sui-mode={mode}
      data-sui-theme={name}
    />
  );
}
```

Create `src/components/Theme/index.ts`:

```ts
export { Theme } from "./Theme";
export type { ThemeMode, ThemeName, ThemeProps } from "./Theme";
```

Replace `src/index.ts` with:

```ts
export { Box } from "./components/Box";
export type { BoxElement, BoxProps } from "./components/Box";
export { Theme } from "./components/Theme";
export type { ThemeMode, ThemeName, ThemeProps } from "./components/Theme";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/Theme && pnpm typecheck && pnpm lint`
Expected: PASS (7 tests). The typecheck confirms that the `@ts-expect-error` line is a real error.

- [ ] **Step 5: Add stories**

Create `src/components/Theme/Theme.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";

import { Theme } from "./Theme";

const meta = {
  title: "Theming/Theme",
  component: Theme,
  args: {
    children: "Themed content",
    style: { padding: "1rem" },
  },
} satisfies Meta<typeof Theme>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PlayfulDark: Story = {
  args: {
    mode: "dark",
    name: "playful",
  },
};

export const NestedIslands: Story = {
  render: () => (
    <Theme mode="light" name="default" style={{ padding: "1rem" }}>
      Default light
      <Theme mode="dark" name="playful" style={{ marginTop: "1rem", padding: "1rem" }}>
        Playful dark
        <Theme mode="light" style={{ marginTop: "1rem", padding: "1rem" }}>
          <Box as="span">Playful light (inherits theme, overrides mode)</Box>
        </Theme>
      </Theme>
    </Theme>
  ),
};
```

- [ ] **Step 6: Commit**

```bash
fallow audit --format json --quiet --explain --gate-marker agent
git add src/components/Theme src/index.ts
git commit -m "Add Theme component for theme and colour mode islands

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: `Text` component

**Files:**

- Create: `src/components/Text/Text.tsx`, `Text.module.css`, `Text.test.tsx`, `Text.stories.tsx`, `index.ts`
- Modify: `src/index.ts`

**Interfaces:**

- Consumes: `Box`, `BoxElement` and `BoxProps` from `../Box`; `clsx`.
- Produces: `Text<E>(props: TextProps<E>): JSX.Element`; `type TextSize = "xs" | "sm" | "md" | "lg" | "xl"`; `type TextTone = "default" | "muted"`; `type TextWeight = "bold" | "medium" | "regular"`; `type TextProps<E extends BoxElement = "span">`.

- [ ] **Step 1: Write the failing test**

Create `src/components/Text/Text.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Text } from "./Text";

describe("Text", () => {
  it("must render a span when as is omitted", () => {
    render(<Text>Hello</Text>);

    expect(screen.getByText("Hello").tagName).toBe("SPAN");
  });

  it("must apply the default size, tone and weight when they are omitted", () => {
    render(<Text>Hello</Text>);

    const text = screen.getByText("Hello");
    expect(text).toHaveAttribute("data-size", "md");
    expect(text).toHaveAttribute("data-tone", "default");
    expect(text).toHaveAttribute("data-weight", "regular");
  });

  it("must apply the given size, tone and weight when they are set", () => {
    render(
      <Text size="xl" tone="muted" weight="bold">
        Hello
      </Text>
    );

    const text = screen.getByText("Hello");
    expect(text).toHaveAttribute("data-size", "xl");
    expect(text).toHaveAttribute("data-tone", "muted");
    expect(text).toHaveAttribute("data-weight", "bold");
  });

  it("must render the element given in as and forward its props when as is set", () => {
    render(
      <Text as="a" href="https://example.com">
        Link
      </Text>
    );

    expect(screen.getByRole("link", { name: "Link" })).toHaveAttribute("href", "https://example.com");
  });

  it("must merge className when one is given", () => {
    render(<Text className="custom">Hello</Text>);

    expect(screen.getByText("Hello")).toHaveClass("custom");
  });

  it("must reject a size when it is only valid for headings", () => {
    // @ts-expect-error "2xl" is a HeadingSize, not a TextSize
    render(<Text size="2xl">Hello</Text>);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/Text`
Expected: FAIL, because `./Text` cannot be resolved.

- [ ] **Step 3: Implement**

Create `src/components/Text/Text.module.css`:

```css
.text {
  font-family: var(--sui-font-body, system-ui, sans-serif);
  line-height: var(--sui-line-height-normal, 1.5);
}

.text[data-size="xs"] {
  font-size: var(--sui-font-size-xs, 0.75rem);
}

.text[data-size="sm"] {
  font-size: var(--sui-font-size-sm, 0.875rem);
}

.text[data-size="md"] {
  font-size: var(--sui-font-size-md, 1rem);
}

.text[data-size="lg"] {
  font-size: var(--sui-font-size-lg, 1.125rem);
}

.text[data-size="xl"] {
  font-size: var(--sui-font-size-xl, 1.25rem);
}

.text[data-weight="regular"] {
  font-weight: var(--sui-font-weight-regular, 400);
}

.text[data-weight="medium"] {
  font-weight: var(--sui-font-weight-medium, 500);
}

.text[data-weight="bold"] {
  font-weight: var(--sui-font-weight-bold, 700);
}

.text[data-tone="muted"] {
  color: var(--sui-color-text-muted, #4b5563);
}
```

Create `src/components/Text/Text.tsx`:

```tsx
import type { JSX } from "react";
import { clsx } from "clsx";

import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Text.module.css";

/**
 * Body text sizes, mapped to the `--sui-font-size-*` tokens
 */
export type TextSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Text colour; `default` inherits the surrounding text colour
 */
export type TextTone = "default" | "muted";

/**
 * Font weights, mapped to the `--sui-font-weight-*` tokens
 */
export type TextWeight = "bold" | "medium" | "regular";

interface TextOwnProps<E extends BoxElement> {
  /**
   * DOM element to render. Defaults to `span`.
   */
  as?: E;

  /**
   * Class names merged with the Text base class
   */
  className?: string;

  /**
   * Font size. Defaults to `md`.
   */
  size?: TextSize;

  /**
   * Text colour. Defaults to `default`.
   */
  tone?: TextTone;

  /**
   * Font weight. Defaults to `regular`.
   */
  weight?: TextWeight;
}

/**
 * Props for `Text`: its own props plus every prop supported by the element given in `as`
 */
export type TextProps<E extends BoxElement = "span"> = TextOwnProps<E> & Omit<BoxProps<E>, keyof TextOwnProps<E>>;

/**
 * Body text in the theme's body font
 *
 * @example
 * <Text as="p" size="sm" tone="muted">Last updated today</Text>
 */
export function Text<E extends BoxElement = "span">({
  as,
  className,
  size = "md",
  tone = "default",
  weight = "regular",
  ...rest
}: TextProps<E>): JSX.Element {
  // Widened as in Box: TextProps<E> already guarantees the props match `as`
  const boxProps = rest as BoxProps<"span">;

  return (
    <Box
      {...boxProps}
      as={(as ?? "span") as "span"}
      className={clsx(styles.text, className)}
      data-size={size}
      data-tone={tone}
      data-weight={weight}
    />
  );
}
```

Create `src/components/Text/index.ts`:

```ts
export { Text } from "./Text";
export type { TextProps, TextSize, TextTone, TextWeight } from "./Text";
```

Add to `src/index.ts`, keeping exports in alphabetical order by component (`Box`, `Text`, `Theme`):

```ts
export { Text } from "./components/Text";
export type { TextProps, TextSize, TextTone, TextWeight } from "./components/Text";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/Text && pnpm typecheck && pnpm lint`
Expected: PASS (6 tests).

- [ ] **Step 5: Add stories**

Create `src/components/Text/Text.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";

import { Text } from "./Text";

const meta = {
  title: "Typography/Text",
  component: Text,
  args: {
    children: "The quick brown fox jumps over the lazy dog",
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Muted: Story = {
  args: {
    tone: "muted",
  },
};

export const Sizes: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "0.5rem" }}>
      <Text size="xs">Extra small</Text>
      <Text size="sm">Small</Text>
      <Text size="md">Medium</Text>
      <Text size="lg">Large</Text>
      <Text size="xl">Extra large</Text>
    </Box>
  ),
};

export const Weights: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "0.5rem" }}>
      <Text weight="regular">Regular</Text>
      <Text weight="medium">Medium</Text>
      <Text weight="bold">Bold</Text>
    </Box>
  ),
};
```

- [ ] **Step 6: Commit**

```bash
fallow audit --format json --quiet --explain --gate-marker agent
git add src/components/Text src/index.ts
git commit -m "Add Text component

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: `Heading` component

**Files:**

- Create: `src/components/Heading/Heading.tsx`, `Heading.module.css`, `Heading.test.tsx`, `Heading.stories.tsx`, `index.ts`
- Modify: `src/index.ts`

**Interfaces:**

- Consumes: `Box` and `BoxProps` from `../Box`; `clsx`.
- Produces: `Heading(props: HeadingProps): JSX.Element`; `type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6`; `type HeadingSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"`; `interface HeadingProps extends Omit<BoxProps<"h1">, "as">` with required `level` and optional `size`.

- [ ] **Step 1: Write the failing test**

Create `src/components/Heading/Heading.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Heading } from "./Heading";

describe("Heading", () => {
  it.each([
    { level: 1, size: "3xl" },
    { level: 2, size: "2xl" },
    { level: 3, size: "xl" },
    { level: 4, size: "lg" },
    { level: 5, size: "md" },
    { level: 6, size: "sm" },
  ] as const)("must render an h$level sized $size when the level is $level", ({ level, size }) => {
    render(<Heading level={level}>Title</Heading>);

    expect(screen.getByRole("heading", { level, name: "Title" })).toHaveAttribute("data-size", size);
  });

  it("must apply the given size when size overrides the level default", () => {
    render(
      <Heading level={1} size="md">
        Title
      </Heading>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toHaveAttribute("data-size", "md");
  });

  it("must merge className when one is given", () => {
    render(
      <Heading className="custom" level={2}>
        Title
      </Heading>
    );

    expect(screen.getByRole("heading", { name: "Title" })).toHaveClass("custom");
  });

  it("must reject rendering when level is missing", () => {
    // @ts-expect-error level is required so heading semantics are always explicit
    render(<Heading>Title</Heading>);
  });

  it("must reject as when it is given", () => {
    // @ts-expect-error the level decides the element, so as is not accepted
    render(
      <Heading as="p" level={1}>
        Title
      </Heading>
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/Heading`
Expected: FAIL, because `./Heading` cannot be resolved.

- [ ] **Step 3: Implement**

Create `src/components/Heading/Heading.module.css`:

```css
.heading {
  font-family: var(--sui-font-heading, system-ui, sans-serif);
  font-weight: var(--sui-font-weight-bold, 700);
  line-height: var(--sui-line-height-tight, 1.25);
}

.heading[data-size="xs"] {
  font-size: var(--sui-font-size-xs, 0.75rem);
}

.heading[data-size="sm"] {
  font-size: var(--sui-font-size-sm, 0.875rem);
}

.heading[data-size="md"] {
  font-size: var(--sui-font-size-md, 1rem);
}

.heading[data-size="lg"] {
  font-size: var(--sui-font-size-lg, 1.125rem);
}

.heading[data-size="xl"] {
  font-size: var(--sui-font-size-xl, 1.25rem);
}

.heading[data-size="2xl"] {
  font-size: var(--sui-font-size-2xl, 1.5rem);
}

.heading[data-size="3xl"] {
  font-size: var(--sui-font-size-3xl, 1.875rem);
}
```

Create `src/components/Heading/Heading.tsx`:

```tsx
import type { JSX } from "react";
import { clsx } from "clsx";

import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Heading.module.css";

/**
 * Heading level, rendered as the matching `h1`–`h6` element
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Heading sizes, mapped to the `--sui-font-size-*` tokens
 */
export type HeadingSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

/**
 * Props for `Heading`: its own props plus every heading element prop
 */
export interface HeadingProps extends Omit<BoxProps<"h1">, "as"> {
  /**
   * Heading level; decides the rendered element
   */
  level: HeadingLevel;

  /**
   * Font size. Defaults to a size matching the level (1 is `3xl`, 6 is `sm`).
   */
  size?: HeadingSize;
}

const defaultSizes = {
  1: "3xl",
  2: "2xl",
  3: "xl",
  4: "lg",
  5: "md",
  6: "sm",
} as const satisfies Record<HeadingLevel, HeadingSize>;

/**
 * Section heading in the theme's heading font
 *
 * @example
 * <Heading level={2}>Settings</Heading>
 */
export function Heading({ className, level, size, ...rest }: HeadingProps): JSX.Element {
  return (
    <Box
      {...rest}
      as={`h${level}` as const}
      className={clsx(styles.heading, className)}
      data-size={size ?? defaultSizes[level]}
    />
  );
}
```

Create `src/components/Heading/index.ts`:

```ts
export { Heading } from "./Heading";
export type { HeadingLevel, HeadingProps, HeadingSize } from "./Heading";
```

Add to `src/index.ts`, keeping exports in alphabetical order by component (`Box`, `Heading`, `Text`, `Theme`):

```ts
export { Heading } from "./components/Heading";
export type { HeadingLevel, HeadingProps, HeadingSize } from "./components/Heading";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/Heading && pnpm typecheck && pnpm lint`
Expected: PASS (10 tests).

- [ ] **Step 5: Add stories**

Create `src/components/Heading/Heading.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";

import { Heading } from "./Heading";

const meta = {
  title: "Typography/Heading",
  component: Heading,
  args: {
    children: "Heading",
    level: 2,
  },
} satisfies Meta<typeof Heading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Levels: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "0.5rem" }}>
      <Heading level={1}>Heading level 1</Heading>
      <Heading level={2}>Heading level 2</Heading>
      <Heading level={3}>Heading level 3</Heading>
      <Heading level={4}>Heading level 4</Heading>
      <Heading level={5}>Heading level 5</Heading>
      <Heading level={6}>Heading level 6</Heading>
    </Box>
  ),
};

export const SizeOverride: Story = {
  args: {
    children: "Level 1, small size",
    level: 1,
    size: "lg",
  },
};
```

- [ ] **Step 6: Commit**

```bash
fallow audit --format json --quiet --explain --gate-marker agent
git add src/components/Heading src/index.ts
git commit -m "Add Heading component

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: `Button` component

**Files:**

- Create: `src/components/Button/Button.tsx`, `Button.module.css`, `Button.test.tsx`, `Button.stories.tsx`, `index.ts`
- Modify: `src/index.ts`

**Interfaces:**

- Consumes: `Box` and `BoxProps` from `../Box`; `clsx`.
- Produces: `Button(props: ButtonProps): JSX.Element`; `type ButtonSize = "sm" | "md" | "lg"`; `type ButtonVariant = "outline" | "primary" | "secondary"`; `interface ButtonProps extends Omit<BoxProps<"button">, "as">`.

- [ ] **Step 1: Write the failing test**

Create `src/components/Button/Button.test.tsx`:

```tsx
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  it("must render a button of type button when type is omitted", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "button");
  });

  it("must use the given type when type is set", () => {
    render(<Button type="submit">Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "submit");
  });

  it("must apply the primary variant and medium size when they are omitted", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("data-variant", "primary");
    expect(button).toHaveAttribute("data-size", "md");
  });

  it.each(["primary", "secondary", "outline"] as const)("must apply the %s variant when it is set", (variant) => {
    render(<Button variant={variant}>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("data-variant", variant);
  });

  it.each(["sm", "md", "lg"] as const)("must apply the %s size when it is set", (size) => {
    render(<Button size={size}>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("data-size", size);
  });

  it("must call onClick when the button is clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Save</Button>);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("must not call onClick when the button is disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button disabled={true} onClick={handleClick}>
        Save
      </Button>
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("must merge className when one is given", () => {
    render(<Button className="custom">Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLButtonElement>();

    render(<Button ref={ref}>Save</Button>);

    expect(ref.current).toBe(screen.getByRole("button", { name: "Save" }));
  });

  it("must reject a variant when it is not supported", () => {
    // @ts-expect-error "danger" is not a ButtonVariant
    render(<Button variant="danger">Save</Button>);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/Button`
Expected: FAIL, because `./Button` cannot be resolved.

- [ ] **Step 3: Implement**

Create `src/components/Button/Button.module.css`:

```css
.button {
  --sui-button-bg: var(--sui-color-primary, #2563eb);
  --sui-button-bg-hover: var(--sui-color-primary-hover, #1d4ed8);
  --sui-button-fg: var(--sui-color-on-primary, #fff);
  --sui-button-border: transparent;
  --sui-button-radius: var(--sui-radius-md, 4px);
  --sui-button-padding-x: var(--sui-space-4, 1rem);
  --sui-button-padding-y: var(--sui-space-2, 0.5rem);
  --sui-button-font-size: var(--sui-font-size-md, 1rem);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sui-space-2, 0.5rem);
  padding: var(--sui-button-padding-y) var(--sui-button-padding-x);
  border: 1px solid var(--sui-button-border);
  border-radius: var(--sui-button-radius);
  background-color: var(--sui-button-bg);
  color: var(--sui-button-fg);
  font-family: var(--sui-font-body, system-ui, sans-serif);
  font-size: var(--sui-button-font-size);
  font-weight: var(--sui-font-weight-medium, 500);
  line-height: var(--sui-line-height-tight, 1.25);
  cursor: pointer;
  transition: background-color 120ms ease;
}

.button[data-variant="secondary"] {
  --sui-button-bg: var(--sui-color-secondary, #e5e7eb);
  --sui-button-bg-hover: var(--sui-color-secondary-hover, #d1d5db);
  --sui-button-fg: var(--sui-color-on-secondary, #111827);
}

.button[data-variant="outline"] {
  --sui-button-bg: transparent;
  --sui-button-bg-hover: var(--sui-color-primary-subtle, #dbeafe);
  --sui-button-fg: var(--sui-color-primary, #2563eb);
  --sui-button-border: var(--sui-color-primary, #2563eb);
}

.button[data-size="sm"] {
  --sui-button-padding-x: var(--sui-space-3, 0.75rem);
  --sui-button-padding-y: var(--sui-space-1, 0.25rem);
  --sui-button-font-size: var(--sui-font-size-sm, 0.875rem);
}

.button[data-size="lg"] {
  --sui-button-padding-x: var(--sui-space-6, 1.5rem);
  --sui-button-padding-y: var(--sui-space-3, 0.75rem);
  --sui-button-font-size: var(--sui-font-size-lg, 1.125rem);
}

.button:hover:not(:disabled) {
  background-color: var(--sui-button-bg-hover);
}

.button:focus-visible {
  outline: 2px solid var(--sui-color-focus-ring, #3b82f6);
  outline-offset: 2px;
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
```

Create `src/components/Button/Button.tsx`:

```tsx
import type { JSX } from "react";
import { clsx } from "clsx";

import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Button.module.css";

/**
 * Button sizes, controlling padding and font size
 */
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Button styles: filled primary, filled secondary, or primary-coloured outline
 */
export type ButtonVariant = "outline" | "primary" | "secondary";

/**
 * Props for `Button`: its own props plus every native button prop
 */
export interface ButtonProps extends Omit<BoxProps<"button">, "as"> {
  /**
   * Button size. Defaults to `md`.
   */
  size?: ButtonSize;

  /**
   * Visual style. Defaults to `primary`.
   */
  variant?: ButtonVariant;
}

/**
 * Themed button. `type` defaults to `"button"`, so it never submits a form unless asked to.
 *
 * @example
 * <Button onClick={save} variant="secondary">Save</Button>
 */
export function Button({
  className,
  size = "md",
  type = "button",
  variant = "primary",
  ...rest
}: ButtonProps): JSX.Element {
  return (
    <Box
      {...rest}
      as="button"
      className={clsx(styles.button, className)}
      type={type}
      data-size={size}
      data-variant={variant}
    />
  );
}
```

Create `src/components/Button/index.ts`:

```ts
export { Button } from "./Button";
export type { ButtonProps, ButtonSize, ButtonVariant } from "./Button";
```

Add to `src/index.ts`, after the `Box` exports:

```ts
export { Button } from "./components/Button";
export type { ButtonProps, ButtonSize, ButtonVariant } from "./components/Button";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/Button && pnpm typecheck && pnpm lint`
Expected: PASS (14 tests).

- [ ] **Step 5: Add stories**

Create `src/components/Button/Button.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Box } from "../Box";

import { Button } from "./Button";

const meta = {
  title: "Actions/Button",
  component: Button,
  args: {
    children: "Button",
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    variant: "secondary",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <Box style={{ alignItems: "center", display: "flex", gap: "0.5rem" }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </Box>
  ),
};
```

- [ ] **Step 6: Commit**

```bash
fallow audit --format json --quiet --explain --gate-marker agent
git add src/components/Button src/index.ts
git commit -m "Add Button component with primary, secondary and outline variants

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: `Card` component

**Files:**

- Create: `src/components/Card/Card.tsx`, `Card.module.css`, `Card.test.tsx`, `Card.stories.tsx`, `index.ts`
- Modify: `src/index.ts`

**Interfaces:**

- Consumes: `Box`, `BoxElement` and `BoxProps` from `../Box`; `clsx`. Stories use `Heading`, `Text` and `Button`.
- Produces: `Card<E>(props: CardProps<E>): JSX.Element`; `type CardPadding = "sm" | "md" | "lg"`; `type CardProps<E extends BoxElement = "div">`.

- [ ] **Step 1: Write the failing test**

Create `src/components/Card/Card.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card } from "./Card";

describe("Card", () => {
  it("must render a div with medium padding when as and padding are omitted", () => {
    render(<Card>Content</Card>);

    const card = screen.getByText("Content");
    expect(card.tagName).toBe("DIV");
    expect(card).toHaveAttribute("data-padding", "md");
  });

  it.each(["sm", "md", "lg"] as const)("must apply %s padding when it is set", (padding) => {
    render(<Card padding={padding}>Content</Card>);

    expect(screen.getByText("Content")).toHaveAttribute("data-padding", padding);
  });

  it("must render the element given in as when as is set", () => {
    render(<Card as="article">Content</Card>);

    expect(screen.getByRole("article")).toHaveTextContent("Content");
  });

  it("must merge className when one is given", () => {
    render(<Card className="custom">Content</Card>);

    expect(screen.getByText("Content")).toHaveClass("custom");
  });

  it("must reject button props when rendered as a div", () => {
    // @ts-expect-error type is not a valid div prop
    render(<Card type="submit">Content</Card>);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/Card`
Expected: FAIL, because `./Card` cannot be resolved.

- [ ] **Step 3: Implement**

Create `src/components/Card/Card.module.css`:

```css
.card {
  --sui-card-bg: var(--sui-color-surface, #f3f4f6);
  --sui-card-border: var(--sui-color-border, #d1d5db);
  --sui-card-radius: var(--sui-radius-lg, 8px);
  --sui-card-shadow: var(--sui-shadow-sm, 0 1px 3px rgb(0 0 0 / 0.12));
  --sui-card-padding: var(--sui-space-5, 1.25rem);

  padding: var(--sui-card-padding);
  border: 1px solid var(--sui-card-border);
  border-radius: var(--sui-card-radius);
  background-color: var(--sui-card-bg);
  box-shadow: var(--sui-card-shadow);
  color: var(--sui-color-text, #111827);
}

.card[data-padding="sm"] {
  --sui-card-padding: var(--sui-space-3, 0.75rem);
}

.card[data-padding="lg"] {
  --sui-card-padding: var(--sui-space-8, 2rem);
}
```

Create `src/components/Card/Card.tsx`:

```tsx
import type { JSX } from "react";
import { clsx } from "clsx";

import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Card.module.css";

/**
 * Inner spacing of a card, mapped to the `--sui-space-*` tokens
 */
export type CardPadding = "sm" | "md" | "lg";

interface CardOwnProps<E extends BoxElement> {
  /**
   * DOM element to render. Defaults to `div`.
   */
  as?: E;

  /**
   * Class names merged with the Card base class
   */
  className?: string;

  /**
   * Inner spacing. Defaults to `md`.
   */
  padding?: CardPadding;
}

/**
 * Props for `Card`: its own props plus every prop supported by the element given in `as`
 */
export type CardProps<E extends BoxElement = "div"> = CardOwnProps<E> & Omit<BoxProps<E>, keyof CardOwnProps<E>>;

/**
 * Raised surface that groups related content
 *
 * @example
 * <Card as="article" padding="lg">...</Card>
 */
export function Card<E extends BoxElement = "div">({
  as,
  className,
  padding = "md",
  ...rest
}: CardProps<E>): JSX.Element {
  // Widened as in Box: CardProps<E> already guarantees the props match `as`
  const boxProps = rest as BoxProps<"div">;

  return (
    <Box {...boxProps} as={(as ?? "div") as "div"} className={clsx(styles.card, className)} data-padding={padding} />
  );
}
```

Create `src/components/Card/index.ts`:

```ts
export { Card } from "./Card";
export type { CardPadding, CardProps } from "./Card";
```

Add to `src/index.ts`, after the `Button` exports:

```ts
export { Card } from "./components/Card";
export type { CardPadding, CardProps } from "./components/Card";
```

The final `src/index.ts` order is: Box, Button, Card, Heading, Text, Theme.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/Card && pnpm typecheck && pnpm lint`
Expected: PASS (7 tests).

- [ ] **Step 5: Add stories**

Create `src/components/Card/Card.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Heading } from "../Heading";
import { Text } from "../Text";

import { Card } from "./Card";

const meta = {
  title: "Layout/Card",
  component: Card,
  args: {
    children: "Card content",
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Paddings: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "1rem" }}>
      <Card padding="sm">Small padding</Card>
      <Card padding="md">Medium padding</Card>
      <Card padding="lg">Large padding</Card>
    </Box>
  ),
};

export const WithContent: Story = {
  render: () => (
    <Card as="article" style={{ maxWidth: "24rem" }}>
      <Heading level={3}>Project update</Heading>
      <Text as="p" style={{ marginTop: "0.5rem" }} tone="muted">
        The theme system now ships with default and playful themes.
      </Text>
      <Box style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        <Button>Open</Button>
        <Button variant="outline">Dismiss</Button>
      </Box>
    </Card>
  ),
};
```

- [ ] **Step 6: Commit**

```bash
fallow audit --format json --quiet --explain --gate-marker agent
git add src/components/Card src/index.ts
git commit -m "Add Card component

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Storybook theming and foundations stories

**Files:**

- Delete: `.storybook/preview.ts`
- Create: `.storybook/preview.tsx`, `src/styles/Tokens.stories.tsx`, `src/styles/ThemeShowcase.stories.tsx`
- Modify: `tsconfig.app.json` (`include`), `tsconfig.node.json` (`include`), `tsconfig.build.json` (add `include`)

**Interfaces:**

- Consumes: `Theme`, `ThemeMode`, `ThemeName`, `Box`, `Button`, `Card`, `Heading` and `Text` from their component barrels; `src/styles/index.css`.
- Produces: Storybook toolbar globals `theme` (`default` | `playful`) and `mode` (`system` | `light` | `dark`). Every story is wrapped in `<Theme>`.

- [ ] **Step 1: Move `.storybook` into the app TypeScript project**

`preview.tsx` needs JSX and DOM types, which only the app project has.

In `tsconfig.app.json`, change `"include": ["src"]` to `"include": ["src", ".storybook"]`.

In `tsconfig.node.json`, change `"include": ["vite.config.ts", ".storybook"]` to `"include": ["vite.config.ts"]`.

In `tsconfig.build.json`, add `"include": ["src"],` above `"exclude"`, so declaration builds keep `rootDir: "src"` valid.

- [ ] **Step 2: Replace the preview**

Run: `git rm .storybook/preview.ts`

Create `.storybook/preview.tsx`:

```tsx
import type { Preview } from "@storybook/react-vite";

import type { ThemeMode, ThemeName } from "../src/components/Theme";
import { Theme } from "../src/components/Theme";

import "../src/styles/index.css";

interface ThemeGlobals {
  mode: ThemeMode;
  theme: ThemeName;
}

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const { mode, theme } = context.globals as ThemeGlobals;

      return (
        <Theme mode={mode} name={theme} style={{ minHeight: "100vh", padding: "1rem" }}>
          <Story />
        </Theme>
      );
    },
  ],
  globalTypes: {
    mode: {
      description: "Colour mode",
      toolbar: {
        dynamicTitle: true,
        icon: "mirror",
        items: ["system", "light", "dark"],
      },
    },
    theme: {
      description: "Theme",
      toolbar: {
        dynamicTitle: true,
        icon: "paintbrush",
        items: ["default", "playful"],
      },
    },
  },
  initialGlobals: {
    mode: "system",
    theme: "default",
  },
};

export default preview;
```

- [ ] **Step 3: Add the tokens story**

Create `src/styles/Tokens.stories.tsx`:

```tsx
import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../components/Box";
import { Heading } from "../components/Heading";
import { Text } from "../components/Text";

const hues = ["gray", "red", "orange", "yellow", "green", "blue", "indigo", "violet"] as const;
const steps = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
const semanticColours = [
  "primary",
  "primary-hover",
  "primary-subtle",
  "on-primary",
  "secondary",
  "secondary-hover",
  "secondary-subtle",
  "on-secondary",
  "background",
  "surface",
  "border",
  "text",
  "text-muted",
  "focus-ring",
  "success",
  "warning",
  "danger",
  "info",
] as const;
const radii = ["sm", "md", "lg", "full"] as const;
const spaces = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const fontSizes = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"] as const;

interface SwatchProps {
  /**
   * Token name shown under the swatch
   */
  label: string;

  /**
   * CSS colour value painted in the swatch
   */
  value: string;
}

function Swatch({ label, value }: SwatchProps): JSX.Element {
  return (
    <Box style={{ display: "grid", gap: "0.25rem" }}>
      <Box
        style={{
          background: value,
          border: "1px solid var(--sui-color-border)",
          borderRadius: "var(--sui-radius-sm)",
          height: "2.5rem",
        }}
      />
      <Text size="xs" tone="muted">
        {label}
      </Text>
    </Box>
  );
}

const meta = {
  title: "Foundations/Tokens",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Palette: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "1rem" }}>
      {hues.map((hue) => (
        <Box key={hue} style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(9, 1fr)" }}>
          {steps.map((step) => (
            <Swatch key={step} label={`${hue}-${step}`} value={`var(--sui-${hue}-${step})`} />
          ))}
        </Box>
      ))}
    </Box>
  ),
};

export const SemanticColours: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fill, minmax(8rem, 1fr))" }}>
      {semanticColours.map((name) => (
        <Swatch key={name} label={name} value={`var(--sui-color-${name})`} />
      ))}
    </Box>
  ),
};

export const ShapeSpaceType: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "2rem" }}>
      <Heading level={3}>Radius</Heading>
      <Box style={{ display: "flex", gap: "1rem" }}>
        {radii.map((radius) => (
          <Box
            key={radius}
            style={{
              background: "var(--sui-color-primary-subtle)",
              border: "1px solid var(--sui-color-primary)",
              borderRadius: `var(--sui-radius-${radius})`,
              height: "4rem",
              width: "4rem",
            }}
          >
            <Text size="xs">{radius}</Text>
          </Box>
        ))}
      </Box>
      <Heading level={3}>Space</Heading>
      <Box style={{ display: "grid", gap: "0.5rem" }}>
        {spaces.map((space) => (
          <Box key={space} style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            <Text size="xs" style={{ width: "4rem" }} tone="muted">{`space-${space}`}</Text>
            <Box
              style={{ background: "var(--sui-color-primary)", height: "0.75rem", width: `var(--sui-space-${space})` }}
            />
          </Box>
        ))}
      </Box>
      <Heading level={3}>Type scale</Heading>
      <Box style={{ display: "grid", gap: "0.5rem" }}>
        {fontSizes.map((size) => (
          <Heading key={size} level={4} size={size}>{`${size}: The quick brown fox`}</Heading>
        ))}
      </Box>
    </Box>
  ),
};
```

- [ ] **Step 4: Add the theme showcase story**

Create `src/styles/ThemeShowcase.stories.tsx`:

```tsx
import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../components/Box";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Heading } from "../components/Heading";
import { Text } from "../components/Text";
import type { ThemeMode, ThemeName } from "../components/Theme";
import { Theme } from "../components/Theme";

const combinations: ReadonlyArray<{ mode: ThemeMode; name: ThemeName }> = [
  { mode: "light", name: "default" },
  { mode: "dark", name: "default" },
  { mode: "light", name: "playful" },
  { mode: "dark", name: "playful" },
];

function SampleCard(): JSX.Element {
  return (
    <Card as="article">
      <Heading level={3}>Project update</Heading>
      <Text as="p" style={{ marginTop: "0.5rem" }} tone="muted">
        Colours, radius, spacing and font all come from the active theme.
      </Text>
      <Box style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
      </Box>
    </Card>
  );
}

const meta = {
  title: "Foundations/Theme showcase",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllCombinations: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))" }}>
      {combinations.map(({ mode, name }) => (
        <Theme key={`${name}-${mode}`} mode={mode} name={name} style={{ padding: "1rem" }}>
          <Text size="sm" style={{ display: "block", marginBottom: "0.5rem" }} tone="muted" weight="medium">
            {`${name} / ${mode}`}
          </Text>
          <SampleCard />
        </Theme>
      ))}
    </Box>
  ),
};
```

- [ ] **Step 5: Typecheck, lint and build Storybook**

Run: `pnpm typecheck && pnpm lint && pnpm build-storybook`
Expected: all succeed. `storybook-static/` is produced (it is already excluded from standards tracking; do not commit it).

- [ ] **Step 6: Verify visually**

Start Storybook with `pnpm storybook` (background, port 6006). Then open `http://localhost:6006/?path=/story/foundations-theme-showcase--all-combinations`, using the `claude-in-chrome` or `playwright-cli` skill, and take a screenshot.

Check each of these, fixing the CSS if one fails:

- There are four panels. Both dark panels have dark backgrounds (`gray-900`) with light text; both light panels are white.
- The default panels have blue primary buttons and a small radius. The playful panels have violet primary buttons, orange secondary buttons, a visibly larger radius, roomier padding, and violet-tinted cards in light mode.
- Switching the toolbar `theme` to `playful` and `mode` to `dark` restyles the page background, but the four showcase panels stay as labelled (nesting works).
- `Foundations/Tokens` → `Palette` shows 8 rows of 9 swatches.

Stop the Storybook process afterwards.

- [ ] **Step 7: Commit**

```bash
fallow audit --format json --quiet --explain --gate-marker agent
git add .storybook tsconfig.app.json tsconfig.node.json tsconfig.build.json src/styles/Tokens.stories.tsx src/styles/ThemeShowcase.stories.tsx
git commit -m "Add Storybook theme toolbar and foundations stories

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Tree-shaking verification and documentation

**Files:**

- Modify: `docs/design/concepts.md`, `README.md`, `AGENTS.md`
- Temporary (not committed): `node_modules/.tmp/consumer/`

**Interfaces:**

- Consumes: the built `dist/` from all earlier tasks.

- [ ] **Step 1: Build the library**

Run: `rm -rf dist && pnpm build`
Expected: success. `dist/` contains `index.js`, `index.d.ts`, `styles.css`, and `components/{Box,Button,Card,Heading,Text,Theme}/`.

- [ ] **Step 2: Create a throwaway consumer that uses only Button**

The consumer lives under `node_modules/.tmp/`, so `react` resolves from the repo and git ignores it.

```bash
mkdir -p node_modules/.tmp/consumer
cat > node_modules/.tmp/consumer/index.html <<'EOF'
<!doctype html>
<html><body><div id="root"></div><script type="module" src="./main.js"></script></body></html>
EOF
cat > node_modules/.tmp/consumer/main.js <<'EOF'
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@krelborn/stylesui";

createRoot(document.getElementById("root")).render(createElement(Button, null, "Hi"));
EOF
cat > node_modules/.tmp/consumer/vite.config.mjs <<'EOF'
import path from "node:path";
import { defineConfig } from "vite";

const repository = path.resolve(import.meta.dirname, "../../..");

export default defineConfig({
  root: import.meta.dirname,
  build: { minify: false, outDir: "out", emptyOutDir: true },
  resolve: {
    alias: [
      { find: /^@krelborn\/stylesui$/, replacement: path.join(repository, "dist/index.js") },
      { find: /^@krelborn\/stylesui\/styles\.css$/, replacement: path.join(repository, "dist/styles.css") },
    ],
  },
});
EOF
pnpm exec vite build --config node_modules/.tmp/consumer/vite.config.mjs
```

Expected: the build succeeds and writes `node_modules/.tmp/consumer/out/assets/*.js` and `*.css`.

- [ ] **Step 3: Assert only Button's code and CSS are included**

Run:

```bash
cd node_modules/.tmp/consumer/out/assets && rg -c "sui-button-" *.css; rg -c "sui-card-|sui-heading-|sui-text-|sui-theme-" *.css *.js; rg -c -- "--sui-violet-600" *.css; cd -
```

Expected: `sui-button-` matches. The second and third commands print nothing, so no Card/Heading/Text/Theme CSS or JS and no global stylesheet are included.

- [ ] **Step 4: Assert the global stylesheet is included when imported**

```bash
sed -i '' '1i\
import "@krelborn/stylesui/styles.css";
' node_modules/.tmp/consumer/main.js
pnpm exec vite build --config node_modules/.tmp/consumer/vite.config.mjs
cd node_modules/.tmp/consumer/out/assets && rg -c -- "--sui-violet-600" *.css; rg -c "light-dark\(" *.css; rg -c "sui-card-" *.css *.js; cd -
```

Expected: `--sui-violet-600` and `light-dark(` both match; `sui-card-` still prints nothing.

Then run: `rm -rf node_modules/.tmp/consumer`

- [ ] **Step 5: Document the concepts**

Append to `docs/design/concepts.md`, after the Colours section and before `## Components` (and remove the trailing blank lines and `&nbsp;` at the end of the file):

```markdown
### Token tiers

Tokens are layered so themes only ever change one tier:

1. **Palette**: the colour ramps above (`--sui-blue-600`). Theme-agnostic.
2. **Semantic**: what a colour or measurement is for (`--sui-color-primary`, `--sui-color-surface`, `--sui-radius-md`, `--sui-space-3`, `--sui-font-body`). Themes set these, and components read only these.
3. **Component**: local to a component's CSS module (`--sui-button-bg`). They default to semantic tokens, and variants reassign them.

### Themes

A theme sets every semantic token: primary, secondary and status colours, surfaces, text, radius, spacing unit and fonts. StylesUI ships `default` (blue and gray, small radius, system font) and `playful` (violet and orange, large radius, roomier spacing, rounded font). `default` applies at `:root`; any subtree can switch with `data-sui-theme="playful"`, usually through the `Theme` component.

### Modes

Every semantic colour is defined once with `light-dark()`, so light and dark variants come from `color-scheme`. Mode follows the OS by default, and `data-sui-mode="light" | "dark" | "system"` overrides it for a subtree. Because `light-dark()` resolves where a colour is used, themes and modes nest independently of each other. This needs Chrome 123, Safari 17.5 or Firefox 120.

### Global styles

`@krelborn/stylesui/styles.css` contains the reset, palette, tokens, themes and modes. Apps import it once at the root. Component CSS still loads per component, and every token read has a fallback, so components render sensibly without it.
```

- [ ] **Step 6: Document usage in the README**

In `README.md`, replace the `### CSS` subsection with:

````markdown
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
````

Leave the rest of the README unchanged.

- [ ] **Step 7: Update AGENTS.md**

In `AGENTS.md`, under `## Architecture`, add this bullet after the `Components read CSS custom properties…` bullet:

```markdown
- Global styles live in `src/styles/` (palette, tokens, `themes/`, modes, reset) and are built to `dist/styles.css`, exported as `@krelborn/stylesui/styles.css`. Themes set semantic tokens with `light-dark()`; `docs/design/concepts.md` describes the token tiers. `src/styles/themeTokens.test.ts` checks that every theme declares the same tokens.
```

Under `### Tree-shaking and CSS delivery`, change the external bullet to:

```markdown
- `preserveModules` + `preserveModulesRoot: 'src'` emit one file per source module; React and `clsx` (`/^(react(-dom)?|clsx)($|\/)/`) are external.
```

Add to that section:

```markdown
- `build.cssTarget` is pinned to the `light-dark()` support floor (Chrome/Edge 123, Firefox 120, Safari 17.5). A lower target makes lightningcss rewrite `light-dark()` into fallback variables, which breaks theme and mode nesting.
```

If Task 1 used the Step 9 fallback, write this instead of the CSS-entry description: "`scripts/bundleStyles.mjs` inlines `src/styles/index.css` into `dist/styles.css` after `vite build`."

- [ ] **Step 8: Final verification**

Run: `pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:hooks`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
fallow audit --format json --quiet --explain --gate-marker agent
git add docs/design/concepts.md README.md AGENTS.md
git commit -m "Document theme system, global stylesheet and build constraints

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```
