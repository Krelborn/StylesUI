# Spec: Palettes

Design and reasoning: [`docs/design/palettes.md`](docs/design/palettes.md). This spec turns it into acceptance criteria and does not repeat its arguments.

## Objective

StylesUI's `default` theme paints a white page, so apps built with it end up mostly white. This change makes colour an axis of its own, the **palette**, beside the theme (shape, type, motion, depth, spacing) and the mode (light or dark). It ships three softer palettes for default and lets any palette combine with any theme.

Users:

- **App developers** who want default's look with a less bright page: `<Theme palette="mist">`.
- **App developers** who want to mix palettes and themes: `<Theme theme="playful" palette="paper">`.
- **Existing apps**, which must see no change: default renders in Bright and playful in Pop unless a palette is chosen.

Success looks like this: an app opts into Mist, Paper or Dusk with one prop or attribute, every palette meets every contrast pairing StylesUI asserts in both modes, and no existing story, test or screenshot changes.

## Decisions

- Palettes: `bright` (default's colours), `mist`, `paper`, `dusk`, and `pop` (playful's colours).
- Each theme has a companion palette: default has Bright and playful has Pop. Companion colours apply at zero specificity on an element that sets a theme, and `data-sui-palette` on the same element or a descendant overrides them.
- New layer tokens: `--sui-color-field`, `--sui-color-overlay` and `--sui-color-sunken`. Sunken is a solid colour per palette.
- Theme-dependent colours are derived in `tokens.css` from palette inputs (`--sui-color-ink`, `--sui-color-shadow-soft`, `--sui-color-shadow-hard`) and theme inputs (`--sui-control-outline`, `--sui-shadow-hardness`, `--sui-shadow-sm-offset`).
- `palette.css` becomes `ramps.css`, and the token tier "Palette" becomes "Ramps".
- Default's dark-mode popover elevation is fixed in a follow-up, not here.
- One spec, delivered as three pull requests, one per phase, in order.

## Tech Stack

React 19, TypeScript 7, Vite 8 (rolldown) library mode with lightningcss at the pinned `cssTarget`, CSS modules and custom properties, `light-dark()` and `color-mix()`, Vitest 5 (jsdom unit project plus four Chromium storybook projects), Storybook 10, oxlint and oxfmt, pnpm. No new dependencies.

## Commands

```sh
pnpm install                                   # also installs the Husky pre-commit hook
pnpm verify                                    # lint, format check, typecheck, every test; run before every commit
pnpm lint                                      # oxlint
pnpm format                                    # oxfmt, writes
pnpm format:check                              # oxfmt --check
pnpm typecheck                                 # tsc -b
pnpm test:unit                                 # jsdom unit tests
pnpm test:unit src/styles/themeTokens.test.ts  # one unit test file
pnpm test:storybook                            # every story in the four mode × theme projects
pnpm test:storybook src/styles/Contrast.stories.tsx  # one story file
pnpm build                                     # dist/ (JS, CSS, styles.css) and declarations
pnpm storybook                                 # http://localhost:6006
fallow audit --format json --quiet --explain --gate-marker agent  # before every commit
```

The phase 2 spike also uses `pnpm exec playwright install firefox webkit` to check the CSS in browsers the story tests don't run.

## Project Structure

```
src/styles/
  ramps.css              ← renamed from palette.css (phase 2)
  tokens.css             ← derived block gains [data-sui-palette] and the theme-dependent colours (phase 2)
  themes/default.css     ← non-colour tokens and theme inputs only (phase 2)
  themes/playful.css     ← non-colour tokens and theme inputs only (phase 2)
  palettes/bright.css    ← default's colours (phase 2)
  palettes/pop.css       ← playful's colours (phase 2)
  palettes/mist.css      ← new (phase 3)
  palettes/paper.css     ← new (phase 3)
  palettes/dusk.css      ← new (phase 3)
  modes.css              ← paint rule matches [data-sui-palette] (phase 2)
  index.css              ← imports ramps, tokens, themes, palettes (Bright first), modes, reset
  tokenSource.ts         ← shared token parsing for tests and stories
  themeTokens.test.ts    ← splits into theme and palette checks (phase 2)
  modes.test.ts
  Contrast.stories.tsx   ← new layers (phase 1), one island per palette (phase 2)
  Tokens.stories.tsx     ← reads Bright's colours instead of default's (phase 2)
  PaletteShowcase.stories.tsx ← new (phase 3)
src/components/
  TextControl, ChoiceControl  ← read --sui-color-field (phase 1)
  Popover                     ← reads --sui-color-overlay (phase 1)
  Code, Kbd, Prose            ← read --sui-color-sunken (phase 1)
  Theme                       ← palette prop, PaletteName type (phase 2)
src/index.ts             ← exports PaletteName (phase 2)
.storybook/              ← palette toolbar global, ThemeRoot, ThemeDocsContainer (phase 2)
docs/design/concepts.md  ← layers (phase 1), tiers, palettes, companions, ramps (phase 2), new palettes (phase 3)
src/docs/Theming.mdx     ← palettes section (phase 2), showcase embed (phase 3)
README.md, AGENTS.md, .design-sync/conventions.md ← palette usage and architecture (phases 2 and 3)
```

## Code Style

Follow `docs/standards/` (comments, TypeScript, React, Vitest unit testing). The JSX prop order (alphabetical, then `aria-*`, then `data-*`) is kept by hand. Docs use British spelling and short declarative sentences, as `docs/design/concepts.md` does.

A palette file declares every colour token with `light-dark()`, names ramp steps rather than repeating their hex, and keeps off-ramp neutrals as private `--_sui-*` helpers:

```css
:where(:root, [data-sui-theme="default"]),
[data-sui-palette="bright"] {
  --sui-color-background: light-dark(var(--sui-white), var(--sui-gray-900));
  --sui-color-surface: light-dark(var(--sui-gray-100), var(--sui-gray-800));
  --sui-color-field: light-dark(var(--sui-white), var(--sui-gray-900));
  --sui-color-ink: light-dark(var(--sui-gray-900), var(--sui-gray-900));
  /* … every other colour token */
}
```

```css
[data-sui-palette="mist"] {
  /* Underscore-prefixed properties are private to this palette, so other palettes need not declare them */
  --_sui-mist-page: #eef1f5;
  --_sui-mist-night: #0f141b;

  --sui-color-background: light-dark(var(--_sui-mist-page), var(--_sui-mist-night));
}
```

Component CSS keeps a literal fallback equal to Bright's light value on every token read:

```css
.control {
  --sui-text-control-bg: var(--sui-color-field, #fff);
}
```

The prop follows `Theme`'s existing pattern:

```tsx
/**
 * Names of the palettes shipped in `styles.css`
 */
export type PaletteName = "bright" | "dusk" | "mist" | "paper" | "pop";

interface ThemeOwnProps {
  /**
   * Colour mode for this subtree. Inherited from the nearest ancestor when omitted.
   */
  mode?: ThemeMode;

  /**
   * Colour palette for this subtree. Defaults to the theme's companion palette on an element that sets `theme`,
   * and is inherited from the nearest ancestor otherwise.
   */
  palette?: PaletteName;

  // …
}
```

## Testing Strategy

- **Unit tests (Vitest, jsdom, `src/**/*.test.ts(x)`)** cover what can be read from CSS source and the DOM:
  - token declarations per theme and per palette, through `tokenSource.ts`
  - selector shapes in `tokens.css` and `modes.css`
  - `Theme` writing `data-sui-palette`
  - type-level rejection of an unknown palette, with `// @ts-expect-error`, enforced by `pnpm typecheck`
- **Story tests (Vitest browser mode, Chromium, four `storybook-<mode>-<theme>` projects)** cover anything that needs the cascade resolved: `light-dark()`, `color-mix()`, companions, nesting, and contrast ratios through `src/test/colorContrast.ts`. A story whose stories have no violations sets `a11y.test: "error"`. No storybook projects are added: palettes are covered by rendering one `Theme` island per palette inside a story.
- **Throwaway checks (not committed):**
  - the phase 2 spike in Firefox and WebKit
  - the before-and-after comparison of resolved colours that proves phases 1 and 2 change nothing
  - the build inspection of `dist/styles.css`
- **Manual checks:** fallback colour pairs, as AGENTS.md already requires.
- No coverage percentage is set. Every acceptance criterion below names the test or check that proves it.

## Boundaries

**Always:**

- Run `pnpm verify` and the fallow audit before every commit, and fix what they report.
- Keep default and playful pixel-identical through phases 1 and 2, and prove it with the resolved-colour comparison.
- Give every new token read a literal fallback equal to Bright's light value.
- Update `docs/design/concepts.md` and `AGENTS.md` in the same phase as the behaviour they describe.
- Keep palette values within the contrast pairings the Contrast stories assert, in both modes.
- Start phase 2 with the spike, and build nothing else in that phase until it passes.

**Ask first:**

- Pushing or opening a pull request. Commits on the working branch need no approval: one per task.
- Bumping the version or publishing.
- Running a Claude Design sync.
- Changing a design-doc colour by more than a contrast pairing needs, or changing the design itself (companion rule, token names, derivation).
- Adding a storybook project, a dependency, or a browser feature that raises the support floor (`@scope`, `if()`, style queries).
- Changing any public API other than `Theme`'s `palette` prop and the `PaletteName` type.
- Anything the spike shows doesn't work. Stop and report rather than working around it.

**Never:**

- Lower a contrast threshold, skip or delete an assertion, or set a story to `a11y.test: "todo"` to get a test green.
- Change Bright's or Pop's resolved colours.
- Edit `dist/` or `storybook-static/`, or hand-write a dependency version.
- Put palette CSS anywhere but `styles.css`, or give a component module a top-level side effect.

## Success Criteria

### Phase 1: Layer tokens

No visual change. This PR can ship on its own.

1. `themes/default.css` and `themes/playful.css` each declare `--sui-color-field`, `--sui-color-overlay` and `--sui-color-sunken` with `light-dark()`. `field` and `overlay` equal the theme's `--sui-color-background` value, and `sunken` equals its `--sui-color-surface` value. Proven by `pnpm test:unit src/styles/themeTokens.test.ts`, the existing same-tokens check, plus the resolved-colour comparison.
2. `TextControl` and `ChoiceControl` read `var(--sui-color-field, #fff)`, and `Popover` reads `var(--sui-color-overlay, #fff)`.
3. `Code`, `Kbd`, and Prose's `code`, `kbd`, `pre` and `th`, read `var(--sui-color-sunken, #f3f4f6)`. The unit test that keeps Prose's `kbd` identical to `Kbd` passes unchanged, and the Prose header-cell story asserts `--sui-color-sunken`.
4. The Contrast stories add these pairs:
   - `text` and `text-muted` on `field`, `overlay` and `sunken`
   - `primary` on `overlay`
   - the focus ring on `overlay` and `sunken`
   - the input border on `overlay`

   All of them pass in the four projects.

5. Every existing unit and story test passes unchanged, apart from the token names in criteria 3 and 4.
6. `docs/design/concepts.md` describes the five layers and which components read each.

### Phase 2: The palette axis

No visual change. Ships Bright and Pop, the companions, the derived colours and the `palette` prop.

1. **Spike.** A throwaway page shows two things work in Chromium, Firefox and WebKit: a `light-dark()` value inside `color-mix()` in a custom property, and a `color-mix()` percentage taken from `var()`. Both must survive `pnpm build`'s lightningcss output at the pinned `cssTarget`, and resolve to the expected colours in both modes. The result goes in the PR description. If either fails, stop and ask.
2. **Ramps rename.** `src/styles/palette.css` is `src/styles/ramps.css`, its imports and tests follow, and `docs/design/concepts.md` calls the tier "Ramps". Ramp token names are unchanged.
3. **Palette files.** `palettes/bright.css` and `palettes/pop.css` declare every `--sui-color-*` token the themes declared, with the same values, except the three derived ones. Each adds `--sui-color-ink`, `--sui-color-shadow-soft` and `--sui-color-shadow-hard`, and declares no `--sui-color-control-border`, `--sui-color-shadow` or `--sui-shadow-sm`. Their selectors are `:where(:root, [data-sui-theme="default"]), [data-sui-palette="bright"]` and `:where([data-sui-theme="playful"]), [data-sui-palette="pop"]`.
4. **Theme files.** The themes declare no `--sui-color-*` token. Each declares `--sui-control-outline`, `--sui-shadow-hardness` and `--sui-shadow-sm-offset`, and no longer declares `--sui-shadow-sm`.
5. **Derived tokens.** `tokens.css` declares `--sui-color-control-border`, `--sui-color-shadow` and `--sui-shadow-sm` in a block whose selector is `:root, [data-sui-theme], [data-sui-palette]`, as the design doc shows. The spacing block matches the same selectors.
6. **Paint rule.** `modes.css` paints background, text colour and font on `:where([data-sui-theme], [data-sui-mode], [data-sui-palette])`, and `modes.test.ts` asserts it.
7. **Token tests.** `themeTokens.test.ts` asserts:
   - every theme declares the same tokens, none of them `--sui-color-*`
   - every palette declares the same tokens, every one a `--sui-color-*` token or a `--_sui-*` helper
   - every palette colour uses `light-dark()` with different light and dark values, apart from a listed set of exceptions per palette that are identical in both
   - each palette's selector has its companion part inside `:where()`, if it has a companion
8. **No visual change.** The resolved-colour comparison shows identical values for every `--sui-color-*` token and for `--sui-shadow-sm`, in default/light, default/dark, playful/light and playful/dark, before and after.
9. **`Theme` prop.** `Theme` takes `palette?: PaletteName` and writes `data-sui-palette`, omitting it when `palette` is omitted. `PaletteName` is exported from `src/index.ts`. `Theme.test.tsx` covers both, and a `// @ts-expect-error` rejects an unknown name.
10. **Companion stories.** `Theme.stories.tsx` gains a story whose play function asserts these resolved values in the browser:
    - `<Theme theme="playful">`: Pop's `primary`.
    - `<Theme theme="playful" palette="bright">`: Bright's `primary`, a non-transparent `control-border` equal to Bright's ink, and Bright's hard shadow colour.
    - `<Theme theme="default" palette="pop">`: Pop's `primary`, a transparent `control-border` and a soft shadow colour.
    - `<Theme theme="playful">` around `<Theme palette="bright">`: Bright's colours and Bright's ink as the outline, which proves the derived tokens re-resolve on a palette element.
    - `<Theme palette="pop">` around `<Theme theme="default">`: Bright, because the companion is nearer.
11. **Contrast across palettes.** The Contrast stories run every pairing once per shipped palette, each in a `Theme` island that sets `palette`, and pass in all four projects. The lip pair (focus ring on `shadow` where controls have depth) therefore runs for every palette under playful.
12. **Storybook.** A `palette` toolbar global offers "theme" (the companion, the default), then each palette. `ThemeRoot` sets or removes `data-sui-palette` on the document and passes `palette` to its docs island, and `ThemeDocsContainer` removes the attribute so docs pages stay in Bright. `Tokens.stories.tsx` reads its swatch list from Bright.
13. **Docs.** These describe the palette axis, the companions, `palette`, `data-sui-palette`, the derived tokens and the overrides that move:
    - `docs/design/concepts.md`
    - `src/docs/Theming.mdx`
    - `README.md`, including its base-token note
    - `AGENTS.md`

### Phase 3: Mist, Paper and Dusk

1. `palettes/mist.css`, `paper.css` and `dusk.css` declare the same tokens as Bright, enforced by `themeTokens.test.ts`. They start from the values in the design doc, changing only what a failing contrast pairing needs, and each change goes in the PR description.
2. `PaletteName` and the toolbar include `mist`, `paper` and `dusk`.
3. The Contrast stories pass for all five palettes in all four projects.
4. A new `src/styles/PaletteShowcase.stories.tsx`, with `a11y.test: "error"`, renders the same set of components in each palette. The set is primary, secondary, outline and ghost Buttons, Badge tones, an Alert per status, TextInput in a Field, Checkbox, pill and underline Tabs, a Listbox, a Card holding Code and Kbd, and a NavList. It passes axe in all four projects.
5. `pnpm build` emits every palette in `dist/styles.css` and in no other CSS file, and the tree-shaking check in AGENTS.md shows an unused component still contributes no JS or CSS.
6. Every fallback colour pair is unchanged, so none needs a new hand check.
7. These describe the three palettes, what each is for, and the companion rule, and the Theming guide embeds the showcase:
   - `docs/design/concepts.md`
   - `src/docs/Theming.mdx`
   - `README.md`
   - `.design-sync/conventions.md`

## Open Questions

None blocking. Two are decided for now and noted for review:

- **The before-and-after comparison is throwaway.** A committed test of literal colours would fail on every intended palette change, so it is run per PR instead. Say if you want it kept as a test.
- **Toolbar label.** The `palette` toolbar's default item is labelled "theme" (the theme's companion). Alternatives: "companion", "auto".
