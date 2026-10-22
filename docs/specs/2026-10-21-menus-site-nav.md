# Spec: Menus, `site-nav` module

The second module of the [menus capability map](2026-10-21-menus.md): the [disclosure navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/) pattern for the headers of content sites, such as blogs, docs and marketing sites. It follows every decision, the visual language and the accessibility baseline in the map. It needs nothing from the `menu` module and uses no `menu` role.

## Objective

Site developers get a header navigation whose top-level entries are links or sections. A section ("Topics ▾") opens a panel of links, in a list or in columns with descriptions. On a narrow header, the whole navigation collapses behind one "Menu" button and pushes the page down when opened. Links stay links: screen readers announce them as links, Tab walks them, and nothing switches a screen reader into application mode.

Success: the blog header from the design mockups, wide and narrow, is built from these components inside the site's `header`, and passes its keyboard story and axe in all four storybook projects at both widths.

## Decisions

- **Names.** `NavBar` (the bar, its landmark and its "Menu" toggle), `NavBarItem` (a top-level link), `NavBarMenu` (a section and its panel), `NavBarMenuItem` (a link in a panel) and `NavBarMenuGroup` (a headed column of panel links). They sit beside `NavList`, the sidebar navigation, and the docs say which to use where.
- **One DOM, laid out by a container query.** A spike in Playwright's Chromium and WebKit checked it: a section's panel is a positioned element anchored to its button with CSS anchor positioning, so on a wide bar it floats below the button, start edges aligned, and flips to end-aligned at the window's edge. Below the bar's collapse width a container query makes the same panel static, so it pushes the page down. Built, the panel is `position: fixed`: absolutely positioned in a sticky header, the header was its containing block, and the browser shifted the panel back inside it, over its button. No markup changes between the two, so nothing flashes or remounts as the width changes.
- **Not a popover.** A popover is always in the top layer, so it can't push the page down. Being fixed instead, a wide panel is shifted or clipped only by a transformed ancestor, which becomes its containing block. The docs say so, and a story checks the common case, a sticky header.
- **Behaviour the browser doesn't give.** Without a popover there is no built-in light dismiss, so the components handle Escape, clicks outside and focus leaving themselves. Behaviour that differs between wide and narrow reads which layout applies when the event happens.
- **The toggle sits outside the landmark.** On a narrow bar, the "Menu" button sits in the bar's first row, beside the site's own start and end content, and the navigation drops to a full-width row below it. The button is therefore outside the `nav`, and points at it with `aria-controls`. While collapsed and closed, the `nav` is hidden, so landmark navigation reaches the button rather than an empty landmark.
- **Tab only.** Arrow keys between top-level entries are optional in the pattern and left out, so the bar behaves like any row of links.
- **Collapse width is a prop.** CSS can't tell whether the entries fit, and a container query condition can't read a custom property, so `collapse` picks one of a few fixed widths. Each width sets a private flag from its own container query, and one container style query on the flag holds every collapsed rule, so they are written once. Style queries on custom properties need Firefox 151, above the overlays' floor of 147: Firefox 147 to 150 show the wide bar at every width, with its entries wrapping. Detecting overflow with a `ResizeObserver` would collapse exactly when needed, but it runs only after the first paint, so a phone would first see the wide layout. It is a possible later option.

## API

```ts
// src/components/NavBar/NavBar.tsx
export type NavBarCollapse = "always" | "lg" | "md" | "never" | "sm";

type NavBarProps = RequiredAccessibleName & {
  /** Below which width of the bar the navigation collapses behind "Menu": `sm` 30rem, `md` 48rem, `lg` 64rem.
   * Defaults to `md`. */
  collapse?: NavBarCollapse;
  /** The entries: `NavBarItem`s and `NavBarMenu`s */
  children: ReactNode;
  /** Content after the navigation in the bar, such as a search button. Stays in the first row when collapsed. */
  end?: ReactNode;
  /** The toggle's visible label. Defaults to "Menu". */
  menuLabel?: string;
  /** Content before the navigation in the bar, such as the site's name. Stays in the first row when collapsed. */
  start?: ReactNode;
} & Omit<BoxProps<"div">, "as" | "children" | "dangerouslySetInnerHTML">;
```

- **`NavBar`** renders a `div` (the bar, a size container) holding `start`, the toggle `button`, a `nav` named by `aria-label` or `aria-labelledby` holding a `ul` with `role="list"`, and `end`. Its own props go to the bar, except the name, which goes to the `nav`. It provides `NavBarContext` (one section open at a time on a wide bar, and closing every section).
- **`NavBarItem`** renders an `li` holding a link, typed and polymorphic as `NavListItem` is (`"a"` or a component that renders an anchor). `aria-current="page"` marks the current page. Props go to the link.
- **`NavBarMenu`** renders an `li` holding a `button` with `aria-expanded` and `aria-controls`, and its panel, a `div` holding a `ul` with `role="list"`. Props: `label: ReactNode` (the button's text), `columns?: 1 | 2 | 3` (default 1, wide only), `children` (`NavBarMenuItem`s or `NavBarMenuGroup`s), and `li` props except `children` and `dangerouslySetInnerHTML`. Uncontrolled.
- **`NavBarMenuItem`** renders an `li` holding a link, polymorphic as `NavBarItem` is, with `children` (the title) and `description?`, linked with `aria-describedby`.
- **`NavBarMenuGroup`** renders an `li` holding a `Heading` and a nested `ul` the heading names with `aria-labelledby`, as `NavListGroup` does. Props: `title: ReactNode`, `headingLevel` (required, as `NavListGroup`'s is) and `children`.

`NavBarItem`, `NavBarMenu`, `NavBarMenuItem` and `NavBarMenuGroup` throw `MissingContextError` outside a `NavBar`. `NavBarContext.ts` and `useNavBarContext.ts` hold the state. Everything but the contexts is exported from `src/index.ts`, and nothing imports from the `menu` module.

## Behaviour

### Wide bar

- A section's button toggles its panel on a click, Enter or Space, as a native button does. Opening one section closes any other.
- Escape, with focus on the button or in its panel, closes the panel and focuses the button. Its default action is prevented, so a surrounding dialog stays open.
- A click outside the section, or focus moving outside it, closes the panel. Focus stays where it went, so an open panel never covers the focused element (2.4.11).
- Clicking a link in a panel closes it, so a client-side route change doesn't leave it open.
- The panel opens below its button, start edges aligned, and flips to end-aligned when there is no room. It is at most `100vw - 2 × --sui-space-2` wide, and `columns` lays its links out in that many columns.

### Narrow bar

- The navigation is hidden behind the toggle, which shows `menuLabel` beside a `MenuIcon`, swapped for `CloseIcon` while open, and carries `aria-expanded` and `aria-controls`.
- Opening it shows the entries in a full-width column below the bar's first row, pushing the page down. Sections expand in place, indented, and any number may be open.
- Escape closes the innermost open section, or the navigation when focus is on a top-level entry, and focuses the button that opened it.
- Focus leaving and clicks outside close nothing, because nothing is covered.
- Clicking a link closes the navigation.
- Switching between narrow and wide closes every section and the navigation.

### Current page

- `aria-current="page"` on a link marks it. On a wide bar, a current top-level link and a section holding the current page are underlined in `--sui-color-primary`. On a narrow bar, a current link takes NavList's current-item look: primary text on the primary tint, bold, with a start bar. Neither is shown by colour alone.

## Styling

- **Wide entries:** `--sui-font-size-sm`, `--sui-font-weight-medium`, `--sui-space-1` by `--sui-space-2` padding, `--sui-radius-md`, at least 2rem tall. Hover tints `--sui-color-secondary-subtle`. The open section's button keeps the tint, and its `ChevronDownIcon` turns. The focus ring is outside the entry, `--sui-focus-ring-width` of `--sui-color-focus-ring` at a 2px offset. The current-page underline is `calc(--sui-border-width × 2)` thick at a 6px offset.
- **Panel:** the capability map's surface (`--sui-color-overlay`, border, `--sui-radius-lg`, `--sui-shadow-sm`, `--sui-space-2` padding). Its rows have the title in `--sui-font-weight-medium` and the description in `--sui-font-size-xs` muted text, hover in `--sui-color-secondary-subtle`, and an inset focus ring, as menu items do. A group heading is NavListGroup's muted `xs` `Heading`.
- **Narrow:** rows at least 2.75rem tall in `--sui-font-size-md`, a section's rows indented by `--sui-space-4`, and NavList's current-item style.
- **Motion:** a wide panel fades in and moves a short way out from its button, only fading under reduced motion. A narrow section opens without animating its height.
- **Forced colours:** the current-page underline and bar are `Highlight`, and the panel keeps a `CanvasText` border.

Every token read keeps a literal fallback equal to Bright's light value.

## Tech Stack

As the capability map: React 19, TypeScript 7, Vite 8, CSS modules, CSS anchor positioning and container queries, Vitest, Storybook 10, oxlint and oxfmt, pnpm. No new dependencies. `MenuIcon` (Lucide's `menu`) is added; `ChevronDownIcon` and `CloseIcon` already exist.

## Commands

```sh
pnpm verify                                                      # before every commit
pnpm test:unit src/components/NavBar/NavBar.test.tsx             # one unit test file
pnpm test:storybook src/components/NavBar/NavBar.stories.tsx     # one story file, in all four projects
pnpm build                                                       # dist/
fallow audit --format json --quiet --explain --gate-marker agent  # before every commit
```

## Project Structure

```
src/components/NavBar/       ← NavBar, NavBarItem, NavBarMenu, NavBarMenuItem, NavBarMenuGroup, NavBarContext.ts,
                               useNavBarContext.ts, NavBar.module.css, tests, stories, index.ts
src/components/Icon/         ← MenuIcon, with its rows in the Icon test and story tables
src/index.ts                 ← the parts and their props types
.oxlintrc.json               ← jsx-a11y entries for each part and MenuIcon
docs/design/concepts.md, AGENTS.md ← a Site navigation section beside Links, and the architecture entries
```

## Code Style

Follow `docs/standards/` and NavList's polymorphic links. The blog header from the mockups:

```tsx
<Box as="header">
  <NavBar
    aria-label="Main"
    end={<IconButton label="Search">…</IconButton>}
    start={
      <Link href="/" underline="hover">
        The Long Read
      </Link>
    }
  >
    <NavBarItem aria-current="page" href="/articles">
      Articles
    </NavBarItem>
    <NavBarMenu columns={2} label="Topics">
      <NavBarMenuItem description="Typography, colour, systems" href="/topics/design">
        Design
      </NavBarMenuItem>
      <NavBarMenuItem description="Front-end, performance, tooling" href="/topics/engineering">
        Engineering
      </NavBarMenuItem>
    </NavBarMenu>
    <NavBarItem href="/about">About</NavBarItem>
  </NavBar>
</Box>
```

## Testing Strategy

- **Unit (jsdom), `NavBar.test.tsx`:** roles, names, `aria-expanded`, `aria-controls` and `aria-describedby`; one section open at a time; Escape, clicks outside, focus leaving and link clicks on a wide bar; the narrow rules through a stubbed layout read; switching layout closing everything; `MissingContextError`; and type rules (a required name, `headingLevel`, omitted props) through `// @ts-expect-error`.
- **Stories (Chromium, all four projects), `NavBar.stories.tsx` with `a11y.test: "error"`:** each layout rendered in a container of the right width (container queries follow the container, not the viewport): a simple panel, a two-column panel with groups, a current page in each layout, a sticky header, right-to-left, and:
  - `KeyboardInteraction` on a wide bar: Tab order through entries and an open panel, Enter and Space toggling, Escape with real input returning focus, Tab out of a panel closing it, and `focusRingContrast >= 3` on an entry and on a panel link.
  - `KeyboardInteraction` on a narrow bar: the toggle, sections expanding in place, Escape closing the innermost, and the rings.
  - `Layout`: on a wide bar the panel's start edge meets its button's and flips at the window's edge; on a narrow bar the content after the bar moves down when the navigation opens; in a sticky header the panel isn't clipped.
  - `HoverContrast`: text and descriptions on the hover tint at 4.5:1.
- **By hand:** every fallback colour pair; VoiceOver on macOS and iOS and NVDA with Chrome, at both widths, recorded in the pull request.

## Boundaries

- **Always:** the capability map's boundaries. Run `pnpm verify` and the fallow audit before every commit; add each part and `MenuIcon` to the jsx-a11y map; keep docs in the same commit as their behaviour.
- **Ask first:** changing `NavList`'s or `Link`'s behaviour or look; any public prop not listed here.
- **Never:** a `menu`, `menubar` or `menuitem` role; opening on hover; importing from the `menu` module.

## Success Criteria

1. `NavBar`, `NavBarItem`, `NavBarMenu`, `NavBarMenuItem`, `NavBarMenuGroup`, `MenuIcon` and their props types are exported from `src/index.ts`; the contexts are not.
2. Each part renders the elements in the API section, requires and omits the props listed, and throws `MissingContextError` outside a `NavBar`. Proven by unit tests and `// @ts-expect-error`.
3. No part renders a `menu`, `menubar`, `menuitem`, `menuitemcheckbox` or `menuitemradio` role. Proven by a unit test.
4. On a wide bar, every rule in Behaviour holds, proven by unit tests and the wide `KeyboardInteraction` story with real input.
5. On a narrow bar, every rule in Behaviour holds, proven by unit tests and the narrow `KeyboardInteraction` story.
6. The `Layout` story passes: alignment, flip, push-down and the sticky header.
7. `focusRingContrast` is at least 3 on a top-level entry, a section button and a panel link, at both widths, and `HoverContrast` passes, in all four projects.
8. The current page is underlined on a wide bar and takes NavList's current look on a narrow one; a section holding the current page is underlined.
9. Rows are at least 2.75rem tall on a narrow bar, and wide entries at least 24px tall (2.5.8).
10. Every `NavBar` story passes axe with `a11y.test: "error"` in all four projects.
11. A throwaway consumer that imports only `NavBar` bundles no code from the `menu` module.
12. `docs/design/concepts.md` describes site navigation and when to use `NavBar` rather than `NavList` or `Menu`; AGENTS.md lists the parts; every part and story has JSDoc.
13. `pnpm verify`, `pnpm build` and the fallow audit pass.

## Open Questions

- **Collapse widths.** `sm` 30rem, `md` 48rem (the default) and `lg` 64rem match common breakpoints. Change them if your sites need others.
