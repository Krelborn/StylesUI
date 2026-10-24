# Spec: Menus, `menubar` module

The fourth module of the [menus capability map](2026-10-21-menus.md): the [menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) pattern, a row of items that each open a `Menu`, as in a desktop app's "File Edit View". It follows every decision, the visual language and the accessibility baseline in the map, and reuses the [`menu` module](2026-10-21-menus-menu.md) for everything inside a menu: the same parts, keys, pointer behaviour, submenus and surface. This spec adds the bar, how focus and open state move across it, the API and the criteria it is tested against.

## Objective

App developers building app-like tools, such as editors, design tools and admin consoles, get a menubar of commands. The developer writes a `Menubar` holding one `MenubarMenu` per menu, each holding the existing menu parts, and writes no focus, keyboard, pointer or ARIA code.

Success: an editor's "File Edit View Format" menubar, with a submenu, checkbox items and a radio group, built from `Menubar`, `MenubarMenu` and the menu parts alone, passing its keyboard story and axe in all four storybook projects.

Content sites are not users of this module: their headers are navigation, which is `NavBar`'s disclosure pattern, and the docs say so.

## Decisions

- **Two parts.** `Menubar` renders the bar, and each `MenubarMenu` renders an item in it and the `Menu` that item opens, with its children as the menu's items, as `Submenu` does for a submenu. A hook in the style of `useMenu` was not chosen: the bar's state (its tab stop and which menu is open) spans every item, so it belongs to a parent component with a context, as `Tabs` and `Accordion` have, and a hook would leave the consumer wiring each item to it.
- **Every bar item opens a menu.** A command directly in the bar, a disabled bar item, a vertical menubar and access keys (Alt+F, F10) are out of scope. The bar binds no shortcuts.
- **One tab stop.** The bar items use a roving `tabindex`. Tab first lands on the first item, and afterwards on the item that last had focus, which the pattern allows. If that item unmounts, the first item takes the tab stop.
- **Moving across the bar keeps focus on the bar.** With one of the bar's menus open, moving to another bar item, by ← or →, Home, End, type-ahead or the pointer, closes the open menu and opens that item's menu, with focus on the bar item. Focus moves into a menu only with ↓, ↑, Enter or Space. This is the pattern's recommended option and what its editor example does. A screen reader announces the bar item as expanded, and ↓ goes in.
- **A pointer opening leaves focus on the bar item.** A click on a bar item opens its menu with focus on the item, not on the menu itself as `useMenu` puts it. In a bar, the item is where ← and → act. Like `useMenu`'s rule, it leaves no item highlighted under a pointer still on the bar, and the next ↓ or ↑ goes to the first or last item.
- **Hover only moves an open menu.** While one of the bar's menus is open, a mouse or pen moving onto another bar item opens that item's menu at once, as desktop menubars and the editor example do. With no menu open, hovering a bar item opens nothing. The capability map's menubar scope sets this as the one exception to "open nothing but a submenu on hover". A click opened the first menu, so nothing appears as the pointer passes over a closed bar.
- **→ and ← in a menu cross the bar.** In a bar's menu, the key pointing the way the text runs opens a submenu from a submenu item, as in any menu. Anywhere else in the bar's menus, at any depth, it closes every menu and moves to the next bar item. The key pointing back closes a submenu, as in any menu, and in the bar's own menu moves to the previous bar item. Either way the new item's menu opens with focus on the bar item, as in the decision above.
- **Built on what `useMenu` has.** Each bar item and its menu use the same machinery as `useMenu`: `usePopover`'s open state and focus return, and the shared logic in `src/menus/` for focus on opening, removal watching, Tab and focus leaving. Where the menubar needs something `useMenu` keeps to itself, such as an opening that leaves focus on the trigger, that code moves to `src/menus/`, as the context menu's did, and `useMenu`'s tests and stories pass unchanged. `useMenu` gets no new public option.
- **Compact.** Every menu in the bar takes the `compact` density, and its submenus inherit it. `MenubarMenu` has no `density` prop.
- **No bar surface.** The bar has no background, border or padding of its own. It sits in whatever header or toolbar the app draws, as the story shows. Bar items look like ghost buttons and share the menu items' highlight tokens.
- **Named.** `Menubar` requires `aria-label` or `aria-labelledby` through `RequiredAccessibleName`, as the pattern asks for and as `TabList` and `NavBar` do. Each menu is named by its bar item, as `useMenu` names a menu by its trigger.

## API

```tsx
// src/components/Menubar/Menubar.tsx
export type MenubarProps = RequiredAccessibleName &
  Omit<BoxProps<"div">, "aria-activedescendant" | "aria-orientation" | "as" | "role" | "tabIndex">;

// src/components/Menubar/MenubarMenu.tsx
export interface MenubarMenuProps {
  /** The menu's items: any menu parts, including `Submenu` */
  children?: ReactNode;
  /** The bar item's label, which names the menu too */
  label: ReactNode;
}
```

- **`Menubar`** renders a `div` with the `menubar` role, holding its `MenubarMenu`s. Its props go to that `div`.
- **`MenubarMenu`** renders a wrapper with the `none` role holding the bar item and its menu. The bar item is a `button` with the `menuitem` role, `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`, the roving `tabIndex` and `type="button"`, labelled by its `label`. The menu is a compact `Menu` named by the bar item and placed `bottom-start` against it, flipping as any menu does. Like `Submenu`, it takes no other props. It throws `MissingContextError` outside a `Menubar`.

`MenubarContext.ts` and `useMenubarContext.ts` hold the bar's state: the tab stop and which of its menus is open. Each sits alone in its own module. `Menubar`, `MenubarMenu` and their props types are exported from `src/index.ts`; the context is not. There are no new icons.

## Behaviour

### Keys on a bar item

- **→ / ← (swapped in right-to-left text):** the next or previous bar item, wrapping. If one of the bar's menus is open, the new item's menu opens and the old one closes, with focus staying on the bar item.
- **Home / End:** the first or last bar item, opening its menu in the same case.
- **↓, Enter or Space:** open the item's menu and focus its first item. With that menu already open, focus its first item instead of closing it.
- **↑:** open the menu and focus its last item, or focus its last item if it's open.
- **A printable character:** type-ahead through `src/collections` over the bar items' labels, with Listbox's rules, opening the matched item's menu in the same case as →.
- **Escape:** with the item's menu open, close it, with focus staying on the item. Otherwise the key is left alone.
- **Tab / Shift+Tab:** close any open menu and leave the bar, to the element after or before it.
- **Any key with Alt, Ctrl or Meta:** left to the browser and the app.

### Keys in a bar's menu

Every key in the `menu` spec, unchanged, except:

- **→ (← in right-to-left text):** on a submenu item, open the submenu (unchanged). On any other item, or on the menu itself, at any depth, close every menu, move to the next bar item and open its menu, with focus on the bar item.
- **← (→ in right-to-left text):** in a submenu, close it and focus its item (unchanged). In the bar's own menu, close it, move to the previous bar item and open its menu, with focus on the bar item.

Escape closes the innermost menu; from the bar's own menu, focus returns to its bar item. Tab and Shift+Tab close every menu: Tab moves to the element after the bar, and Shift+Tab stops on the bar item, as `useMenu`'s Shift+Tab stops on the trigger.

### Pointer

- A click on a bar item toggles its menu. Opening it leaves focus on the bar item.
- While one of the bar's menus is open, moving a mouse or pen onto another bar item opens that item's menu at once, closes the other and moves focus to the bar item. With no menu open, hovering a bar item only shows the hover look.
- A tap on another bar item while a menu is open closes the open menu and opens the tapped item's menu.
- Inside a menu, everything is as in the `menu` spec: focus follows the pointer, submenus open after 100ms, and the grace triangle applies.
- Bar items act on `click`, never on `pointerdown` (2.5.2).

### Closing and focus

- Choosing an item closes every menu and returns focus to the bar item, unless the item's `onClick` moved it elsewhere, as an editor moving focus back to its document would. The docs suggest doing that.
- A click outside closes the open menu and leaves focus where the click put it. Focus leaving the bar and its menus closes the open menu.
- An item that unmounts while focused moves focus as in the `menu` spec.

### Layout

- The bar is a row of items in their DOM order. Where they don't fit, as at 320px, they wrap onto another line rather than scroll (1.4.10). ← and → still follow DOM order.
- Each menu opens below its bar item, aligned with its start edge, and flips above at the window's bottom and to the other side at the inline end, as any menu does.

## Styling

In a new `Menubar.module.css`. The menus themselves are the `menu` module's surface, unchanged.

- **Bar:** a wrapping flex row, `--sui-space-1` between items, with no background, border or padding.
- **Bar items:** `--sui-font-size-sm` at `--sui-line-height-tight` in `--sui-color-text`, `--sui-space-2` inline padding and `--sui-radius-md` corners, on a transparent background. They are at least 1.625rem tall, the compact row height, and 2.75rem under `(pointer: coarse)` (2.5.8). Bar items have no chevron, as desktop menubars have none.
- **Highlight:** a hovered bar item, and the item whose menu is open, take `--sui-menu-highlight` with `--sui-menu-on-highlight` text, read and never declared, with the menu's fallbacks. Under `:focus-visible` the item draws the menu items' inset focus ring. These are the menu's existing pairings, so the Contrast stories gain nothing new.
- **Forced colours:** the highlight is `Highlight` with `HighlightText` and `forced-color-adjust: none`, as on menu items, and the focus ring stays visible.

Every token read keeps a literal fallback equal to Bright's light value.

## Tech Stack

As the capability map: React 19, TypeScript 7, Vite 8, CSS modules, the Popover API and CSS anchor positioning, Vitest, Storybook 10, oxlint and oxfmt, pnpm. No new dependencies.

## Commands

```sh
pnpm verify                                                        # before every commit
pnpm test:unit src/components/Menubar/Menubar.test.tsx             # one unit test file
pnpm test:storybook src/components/Menubar/Menubar.stories.tsx     # one story file, in all four projects
pnpm build                                                         # dist/
fallow audit --format json --quiet --explain --gate-marker agent   # before every commit
```

## Project Structure

```
src/components/Menubar/            ← Menubar, MenubarMenu, MenubarContext.ts, useMenubarContext.ts,
                                     Menubar.module.css, tests, stories, index.ts
src/menus/                         ← anything the bar shares with useMenu, moved out of useMenu
src/index.ts                       ← Menubar, MenubarMenu and their props types
.oxlintrc.json                     ← jsx-a11y entries for Menubar and MenubarMenu
docs/design/concepts.md, AGENTS.md ← a Menubars paragraph and the architecture entry
```

## Code Style

Follow `docs/standards/` and the compound components (`Tabs`, `Accordion`). An editor's menubar, the shape the stories and docs use:

```tsx
<Menubar aria-label="Editor">
  <MenubarMenu label="File">
    <MenuItem onClick={create} shortcut="⌘N" aria-keyshortcuts="Meta+N">
      New
    </MenuItem>
    <Submenu label="Open recent">
      {recent.map((file) => (
        <MenuItem key={file.id} onClick={() => open(file)}>
          {file.name}
        </MenuItem>
      ))}
    </Submenu>
    <MenuSeparator />
    <MenuItem onClick={closeDocument}>Close</MenuItem>
  </MenubarMenu>
  <MenubarMenu label="View">
    <MenuItemCheckbox checked={showRuler} onCheckedChange={setShowRuler}>
      Ruler
    </MenuItemCheckbox>
    <MenuRadioGroup label="Zoom" onValueChange={setZoom} value={zoom}>
      <MenuItemRadio value="fit">Fit</MenuItemRadio>
      <MenuItemRadio value="100">100%</MenuItemRadio>
    </MenuRadioGroup>
  </MenubarMenu>
</Menubar>
```

## Testing Strategy

- **Unit (jsdom), `src/components/Menubar/Menubar.test.tsx`:**
  - Roles, names and states: `menubar` named by `aria-label` and `aria-labelledby`; bar items as `menuitem`s with `aria-haspopup`, `aria-expanded` and `aria-controls`; each menu named by its bar item; every menu, and a submenu in it, `compact`.
  - The tab stop: the first item at first, the last focused item afterwards, and the first again when that one unmounts.
  - Every key in both key lists, in both writing directions, with focus and open state asserted after each. That covers wrapping, type-ahead, the open menu following the bar, Enter, Space, ↓ and ↑ on an item whose menu is open, → on a plain item, on a submenu item, on the menu itself and in a nested submenu, ← in the bar's menu and in a submenu, and modified keys left alone.
  - Pointer: a click toggles and leaves focus on the bar item; hover opens another item's menu only while one is open, and only for a mouse or pen.
  - Closing: choosing an item returns focus to its bar item unless `onClick` moved it, and Escape, Tab, Shift+Tab, a click outside and focus leaving each close the menu.
  - `MenubarMenu` outside a `Menubar` throws `MissingContextError`.
  - Type-level rules through `// @ts-expect-error`: `Menubar` without `aria-label` or `aria-labelledby`, `role` and `tabIndex` on `Menubar`, and `MenubarMenu` without `label`.
  - `useMenu`'s tests pass unchanged after any shared code moves.
- **Stories (Chromium, all four projects), `Menubar.stories.tsx` with `a11y.test: "error"`:** the editor menubar in an app header, right-to-left, and:
  - `KeyboardInteraction`: with real input, Tab lands on the first bar item. ← and → move and wrap, ↓ opens on the first item, → in the menu opens the next bar item's menu with focus on the bar item, ← goes back, Escape returns to the bar item, and Tab leaves the bar. It asserts `focusRingContrast >= 3` on a focused bar item and a focused menu item.
  - `PointerInteraction`: a real click opens a menu, and hovering another bar item opens that item's menu and closes the first. Hovering with no menu open opens nothing, and a click outside closes the menu and leaves focus where it landed.
  - `Narrow`: in a 320px frame the bar wraps, and an open menu fits the window.
  - `HoverContrast`: `textContrast` of a hovered bar item's label on the highlight is at least 4.5:1.
- **By hand:** the editor menubar in VoiceOver on macOS and iOS and in NVDA with Chrome, and its placement in Firefox and WebKit, recorded in the pull request.

## Boundaries

- **Always:** the capability map's boundaries. Run `pnpm verify` and the fallow audit before every commit; add `Menubar` and `MenubarMenu` to the jsx-a11y map; keep docs in the same commit as their behaviour.
- **Ask first:** any change to `useMenu`'s, `Menu`'s or `usePopover`'s public behaviour or props while sharing code; any public prop not listed here, such as `disabled` or `density` on `MenubarMenu`, or a controlled open state.
- **Never:** use a menubar in a StylesUI navigation component; open a bar item's menu on hover when none of the bar's menus is open; put a `menu` role on the bar or a `menubar` role anywhere but `Menubar`.

## Success Criteria

### API

1. `Menubar`, `MenubarMenu`, `MenubarProps` and `MenubarMenuProps` are exported from `src/index.ts`, and the context is not. A consumer importing only `Menu` and `useMenu` bundles no menubar code.
2. `Menubar` without `aria-label` or `aria-labelledby` fails to type-check, and `MenubarMenu` outside a `Menubar` throws `MissingContextError`.
3. The bar, its items and their menus carry the roles, states and names in the API section.

### Keyboard and focus

4. The bar is one tab stop: the first item at first, then the item that last had focus.
5. Every key in the Behaviour section does what it says, in both writing directions, proven by unit tests and the `KeyboardInteraction` story with real input.
6. Moving across the bar with a menu open opens the new item's menu with focus on the bar item, by key, from inside a menu and by hover.
7. Focus returns to the bar item on choosing an item and on Escape from the bar's menu, stays put after a click outside, and leaves the bar on Tab.
8. `focusRingContrast` of a focused bar item and a focused menu item is at least 3 in all four projects.

### Pointer

9. A click toggles a bar item's menu, and hovering another bar item opens its menu only while one of the bar's menus is open.

### Look and layout

10. Bar items look as the Styling section says in every theme, palette and mode, sharing the menu's highlight tokens, and every menu in the bar is `compact`.
11. The bar wraps in a 320px frame and its menus fit the window.
12. `HoverContrast` passes in all four projects, and under forced colours the highlight is `Highlight` with `HighlightText`. The forced-colours look is checked by hand in Chromium's emulation.

### Whole module

13. `useMenu`'s unit tests and stories pass unchanged.
14. Every `Menubar` story passes axe with `a11y.test: "error"` in all four projects.
15. `docs/design/concepts.md` describes menubars, steers content sites to `NavBar`, and suggests moving focus back to the work after a command. AGENTS.md lists both parts in its architecture and jsx-a11y sections, and every part and story has JSDoc.
16. `pnpm verify`, `pnpm build` and the fallow audit pass.

## Open Questions

Resolved in review on 2026-10-24:

- **[Issue #65](https://github.com/Krelborn/StylesUI/issues/65):** `usePopover` leaves its close request set after Tab closes a menu, which the menubar's Tab path would inherit. It is fixed first, in its own pull request, before the menubar is built.
- **Focus on a pointer opening:** it stays on the bar item, unlike `useMenu`'s (see Decisions).
