# Spec: Menus, `menu` module

The first module of the [menus capability map](2026-10-21-menus.md): the [menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) and [menu](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) patterns, with submenus, and the internal surface every later popup list draws. It follows every decision, the visual language and the accessibility baseline in the map; this spec adds the API, the behaviour in full and the criteria it is tested against.

## Objective

App developers get a menu of commands from a button: "⋯" row actions, a user menu from an avatar, "New ▾", and sort and view options. A menu holds actions, links, checkbox items, groups of radio items, separators and submenus, and every row can carry an icon, a description, a shortcut, a danger tone or a disabled state. The developer writes no focus, keyboard or ARIA code.

Success: the row actions and user menu from the design mockups are built from `useMenu`, the menu parts and `Button` or `IconButton` alone, and pass their keyboard stories and axe in all four storybook projects.

## Decisions

- **Built on `usePopover`'s machinery.** `useMenu` keeps `usePopover`'s open state, controlled mode, `close()` and focus return, and adds moving focus in, the keyboard and submenus. `Menu` renders the internal `Overlay` as `popover="auto"`, so the browser closes it on Escape and on a click outside, and closes it when another popover opens.
- **Submenus are nested popovers.** Each submenu is a `popover="auto"` element inside its parent menu in the DOM, so opening it keeps the parent open and opening a sibling's closes it, with no `source` option, which not every browser takes.
- **Spike results.** A throwaway page checked in Playwright's Chromium and WebKit (Firefox would not launch, as for every story), and the hook covers the gaps it found:
  - Escape closes only the innermost menu, and a click on an item of the parent closes only the submenu. Both are what the pattern needs.
  - After Escape closes a submenu opened with `showPopover()`, focus stays in the hidden submenu, so the hook moves it to the submenu's item.
  - Tab moves focus out but leaves the menu open, so the menu closes itself when focus leaves it.
  - Opening a menu with Enter on its trigger, then closing it, returns focus to the trigger in both browsers.
- **Naming.** `getMenuProps()` names the menu by its trigger through `aria-labelledby`. That fails for an `IconButton`, whose name comes from its own `aria-labelledby`, because accessible-name computation does not follow a second one: the spike measured an empty name in Chromium. `getMenuProps({ "aria-label": … })` therefore names the menu instead, dropping the hook's `aria-labelledby`, and the docs and the `IconButton` story show it.
- **Activation is a click.** Every way of choosing an item (a click, Enter, or Space where it activates) clicks the item element, so the item's own `onClick` runs and a link navigates, and then every open menu closes. There is no `onAction`. A button item whose `onClick` calls `preventDefault()` keeps the menus open.
- **Checkbox and radio items.** Enter and a click toggle and close, and Space toggles and keeps the menu open, as the Authoring Practices allow. Agreed in the capability map's review.
- **Focus on opening.** Opened from the keyboard (Enter, Space or ↓ on the trigger), focus goes to the first item, and with ↑ to the last. Opened by a pointer, focus goes to the menu itself, so no item is highlighted under a pointer that is still on the trigger, and the next ↓ or ↑ goes to the first or last item. Opened any other way, such as a controlled `open` from a shortcut, focus goes to the first item. A press flag set on `pointerdown` and cleared on `click`, `blur` and `pointercancel` tells the two apart, as `Tab` and `Listbox` do.
- **Wrapping.** ↑ and ↓ wrap from one end to the other, which the pattern allows and desktop menus do.
- **Disabled items are reachable.** A disabled item is `aria-disabled`, not natively disabled, so the arrow keys and type-ahead reach it and a screen reader announces it. It ignores clicks, so a consumer's `onClick` does not run, as a disabled `Tab` does.
- **Radio dot drawn by a border.** The dot is a circle filled by its border, as a solid StatusDot is, so forced colours keep it. The check is a new `CheckIcon`, and the submenu chevron a new `ChevronRightIcon` that mirrors in right-to-left text.

## API

```ts
// src/components/Menu/useMenu.ts
export interface UseMenuOptions {
  /** Whether the menu starts open when uncontrolled. Defaults to `false`. */
  defaultOpen?: boolean;
  /** Called with the new open state; when controlled, also with `true` when the user asks to open it */
  onOpenChange?: (open: boolean) => void;
  /** Controls whether the menu is open, as `usePopover`'s `open` does */
  open?: boolean;
  /** Side of the trigger the menu opens on. Defaults to `bottom-start`. */
  placement?: OverlayPlacement;
}

export interface UseMenuResult {
  /** Closes every open menu, returning focus as Escape does */
  close: () => void;
  /** Props for the `Menu`: anchor, id, name, placement, open state and toggle handlers */
  getMenuProps: <Props extends object>(props?: Props & Partial<MenuOverlayProps>) => …;
  /** Props for the trigger, which must be a button: `aria-controls`, `aria-expanded`, `aria-haspopup="menu"`, `id`,
   * `popoverTarget`, the anchor name, and the key and pointer handlers that open it */
  getTriggerProps: <Props extends object>(props?: Props & Partial<MenuTriggerProps>) => …;
  /** Whether the menu is open */
  open: boolean;
}
```

The getters merge as `usePopover`'s do, through `mergeProps`. The parts, each in `src/components/Menu/`:

- **`Menu`** renders a `div` with the `menu` role. Props: `MenuOverlayProps`, `density?: "compact" | "default"` (default `default`, inherited by its submenus), and every `div` prop except `as`, `popover`, `ref`, `role`, `tabIndex`, `aria-activedescendant` and `aria-orientation`.
- **`MenuItem`** renders a `button` by default, or with `as` an `a` or a component that renders an anchor, typed as `NavListItem`'s `as` is. Props: `children` (the label), `description?`, `icon?`, `shortcut?`, `tone?: "danger"`, `disabled?`, and the element's own props except `role`, `tabIndex`, `type`, `aria-disabled` and `dangerouslySetInnerHTML`. A button item is `type="button"`.
- **`MenuItemCheckbox`** renders a `button` with the `menuitemcheckbox` role. Props: `children`, `checked?`, `defaultChecked?`, `onCheckedChange?: (checked: boolean) => void`, `description?`, `shortcut?`, `disabled?`, and `button` props except `role`, `tabIndex`, `type`, `aria-checked` and `aria-disabled`. No `icon`, because the check takes the leading slot.
- **`MenuRadioGroup`** renders a `div` with the `group` role, named by its visible `label`. Props: `label: ReactNode` (required), `value?`, `defaultValue?`, `onValueChange?: (value: string) => void`, and `div` props except `role`. Its context lives in `MenuRadioGroupContext.ts`.
- **`MenuItemRadio`** renders a `button` with the `menuitemradio` role. Props: `value: string`, `children`, `description?`, `shortcut?`, `disabled?`, and `button` props except those `MenuItemCheckbox` omits. It throws `MissingContextError` outside a `MenuRadioGroup`.
- **`MenuGroup`** renders a `div` with the `group` role. Props: `label?: ReactNode`, which shows a group heading and names the group, and `div` props except `role`.
- **`MenuSeparator`** renders an `hr`, whose role is `separator`. Props: `hr` props except `children`.
- **`Submenu`** renders a `menuitem` with `aria-haspopup="menu"`, `aria-expanded` and `aria-controls`, and a nested `Menu` named by that item, inside a wrapper with the `none` role. Props: `label: ReactNode`, `icon?`, `disabled?` and `children` (the submenu's items).

Every part but `Menu` throws `MissingContextError` outside a `Menu`. `MenuContext.ts` and `useMenuContext.ts` hold the menu's state, each alone in its module. All are exported from `src/index.ts` with their props types, except the contexts.

A row renders its parts in this order: the leading slot (`aria-hidden`, holding the icon, check or dot, and rendered only by an item with an icon and by every checkbox and radio item), the label (named by `aria-labelledby`), the description (linked by `aria-describedby`) and the trailing slot (`aria-hidden`, holding the shortcut or chevron). A non-empty `shortcut` is shown and hidden from assistive technology, and the `aria-keyshortcuts` the consumer sets announces it, as `IconButton` does. The menu binds no shortcuts.

## Behaviour

### Keys

On the trigger:

- **Enter, Space or ↓:** open and focus the first item.
- **↑:** open and focus the last item.

In a menu:

- **↓ / ↑:** the next or previous item, wrapping. From the menu itself, the first or last item.
- **Home / End:** the first or last item.
- **Enter:** activate the item; on a submenu item, open the submenu and focus its first item.
- **Space:** as Enter, except that a checkbox or radio item toggles and the menu stays open, and that while a type-ahead query is live, its last character within 500ms, Space joins the query.
- **→ (← in right-to-left text):** on a submenu item, open the submenu and focus its first item. Elsewhere, nothing.
- **← (→ in right-to-left text):** in a submenu, close it and focus its item. In the top menu, nothing.
- **Escape:** close the innermost menu and focus its item, or the trigger for the top menu.
- **Tab / Shift+Tab:** close every menu. Tab moves to the element after the trigger in the tab order, and Shift+Tab to the trigger.
- **A printable character:** type-ahead through `src/collections`, matching each item's label text (not its description or shortcut), with Listbox's rules.
- **Any key with Alt, Ctrl or Meta:** left to the browser and the app.

The writing direction is read from `:dir(rtl)` on the menu.

### Pointer

- Moving the pointer onto an item focuses it without scrolling, so the arrow keys carry on from it. A disabled item is focused too, but does nothing when clicked.
- Resting on a submenu item for 100ms opens its submenu, without moving focus into it. A click opens it at once.
- Moving onto another item of the parent closes an open submenu after 100ms, unless the pointer is moving through the triangle between where it left the submenu item and the submenu's near edge. The submenu then stays open while the pointer keeps moving, and closes 400ms after it stops outside the submenu.
- Leaving the menu leaves the focused item and any open submenu as they are.
- Items act on `click`, never on `pointerdown` (2.5.2).

### Closing and focus

- Every menu closes on activating an item, Escape from the top menu, Tab, a click outside, focus moving outside the menus (such as to an iframe), another popover opening, a click on the trigger and `close()`.
- Focus returns to the trigger when the menus close with focus inside them, by Escape, Tab, activation or `close()`, unless the code that ran moved it elsewhere, such as into a dialog an item opened. After a click outside, focus stays where the click put it. This is `usePopover`'s rule, extended to submenus.
- An item that unmounts while focused, such as when a menu's items change, moves focus to the menu itself.

### Placement and size

- The menu opens on `placement` (default `bottom-start`) and flips as any overlay does.
- A submenu opens on the inline-end side of its item, with its first item level with its item, by offsetting the surface's padding and border. It flips to the inline-start side when there is no room, and short of room below its item it grows upwards from the item's bottom edge, as desktop menus do (agreed at Checkpoint C). With no room on either side, it opens below its item over the parent menu (`@position-try`), so it fits a 320px viewport.
- A menu is at least 12rem wide and at most `min(20rem, 100vw - 2 × --sui-space-2)`. A label longer than that wraps rather than clipping. A menu is at most `--sui-menu-max-block-size` tall (default 24rem, and never taller than the window), so the placement fallbacks can find a side it fits on, and in a window too short for either side it shrinks to the room it has (`@position-try --sui-menu-shrink`). Beyond its height it scrolls inside its own box, and a keyboard move scrolls the focused item into view (`block: "nearest"`). The menu has `tabindex="0"`, so a menu that scrolls is a focusable scroll region; focus is already inside an open menu and Tab leaves it from there, so this adds no tab stop. Chromium's `position-try-order: most-block-size` would pick the roomier side by itself, but ignores it for an element with a block margin, which the gap from the trigger needs (found in a spike at Phase 4).

## Styling

The visual language in the capability map, implemented in the internal `MenuSurface` CSS module, which `Menu` applies:

- **Surface:** Popover's: `--sui-color-overlay`, a `--sui-border-width` `--sui-color-border` border, `--sui-radius-lg`, `--sui-shadow-sm` and `--sui-space-1` padding, with Popover's entrance (a fade and a short move out from the trigger, only the fade under reduced motion).
- **Rows:** a flex row with `--sui-space-2` gaps and `--sui-radius-md` corners, at least 2rem tall (`default`), 1.625rem (`compact`), and 2.75rem under `(pointer: coarse)` whatever the density, in `--sui-font-size-sm` at `--sui-line-height-tight`. A 1rem leading column, shown only when one of the menu's own items has a leading slot; then every label in that menu starts after the column, so labels line up, and a menu with no icons, checks or dots has no column at all. Agreed at Checkpoint A. Icons, descriptions, shortcuts and the chevron are `--sui-color-text-muted`; the check and dot are `--sui-color-text`.
- **Highlight:** the focused item, and the item whose submenu is open, take `--sui-menu-highlight` (falling back to `--sui-color-secondary-subtle`) with `--sui-menu-on-highlight` text (falling back to `--sui-color-text`), and a danger item `--sui-menu-danger-highlight` (falling back to `--sui-color-danger-subtle`). The three are read and never declared. Under `:focus-visible` the item also draws an inset focus ring, `--sui-focus-ring-width` of `--sui-color-focus-ring` at a negative offset of its own width, and keeps a scroll margin so a scrolled item's ring is not clipped.
- **Danger:** `--sui-color-danger-text` for the label and icon.
- **Disabled:** the label mixed to half strength, keeping a danger item's hue, and the slots at 50% `opacity`, as Listbox's disabled options are, so the focus ring keeps full strength.
- **Group heading:** `--sui-font-size-xs`, bold, muted, inset to line up with the labels. **Separator:** a `--sui-border-width` `--sui-color-border` rule across the surface's full width.
- **Forced colours:** the highlight is `Highlight` with `HighlightText` (with `forced-color-adjust: none` on the item, as Listbox's selection needs), a disabled item is `GrayText`, and the check, dot and chevron take the text colour.

Every token read keeps a literal fallback equal to Bright's light value.

## Tech Stack

As the capability map: React 19, TypeScript 7, Vite 8, CSS modules, the Popover API and CSS anchor positioning, Vitest, Storybook 10, oxlint and oxfmt, pnpm. No new dependencies; `CheckIcon` and `ChevronRightIcon` come from the existing `lucide-static` devDependency.

## Commands

```sh
pnpm verify                                                  # before every commit
pnpm test:unit src/components/Menu/Menu.test.tsx             # one unit test file
pnpm test:storybook src/components/Menu/Menu.stories.tsx     # one story file, in all four projects
pnpm build                                                   # dist/
fallow audit --format json --quiet --explain --gate-marker agent  # before every commit
```

## Project Structure

```
src/menus/                         ← internal: menu keyboard, the menu tree, pointer intent, rendered items
src/components/MenuSurface/        ← internal: MenuSurface.module.css (surface, rows, highlight)
src/components/Menu/               ← useMenu, Menu, MenuItem, MenuItemCheckbox, MenuRadioGroup, MenuItemRadio,
                                     MenuGroup, MenuSeparator, Submenu, MenuContext.ts, useMenuContext.ts,
                                     MenuRadioGroupContext.ts, useMenuRadioGroupContext.ts, tests, stories, index.ts
src/components/Icon/               ← CheckIcon, ChevronRightIcon, with their table rows in Icon.test.tsx and Icon.stories.tsx
src/index.ts                       ← the public parts and their props types
src/styles/Contrast.stories.tsx    ← new pairings (below)
.oxlintrc.json                     ← jsx-a11y entries for every part and the two icons
docs/design/concepts.md, AGENTS.md ← a Menus section and the architecture entries
```

## Code Style

Follow `docs/standards/`, the overlay hooks and the compound components (`Tabs`, `Listbox`). A user menu, the shape the stories and docs use:

```tsx
const menu = useMenu({ placement: "bottom-end" });

<IconButton label="Account" {...menu.getTriggerProps()}>
  <Avatar name="Matt Styles" aria-hidden />
</IconButton>
<Menu {...menu.getMenuProps({ "aria-label": "Account" })}>
  <MenuItem as="a" href="/profile">
    Your profile
  </MenuItem>
  <Submenu icon={<ColorModeIcon />} label="Appearance">
    <MenuRadioGroup label="Appearance" onValueChange={setMode} value={mode}>
      <MenuItemRadio value="light">Light</MenuItemRadio>
      <MenuItemRadio value="dark">Dark</MenuItemRadio>
      <MenuItemRadio value="system">System</MenuItemRadio>
    </MenuRadioGroup>
  </Submenu>
  <MenuSeparator />
  <MenuItem onClick={signOut}>Sign out</MenuItem>
</Menu>
```

## Testing Strategy

- **Unit (jsdom), `src/components/Menu/*.test.tsx` and `src/menus/*.test.ts`:**
  - Roles, names and states: `aria-haspopup`, `aria-expanded`, `aria-controls`, the menu's name from its trigger and from `aria-label`, `aria-checked`, `aria-disabled`, `aria-keyshortcuts` left to the consumer, and description and label ids.
  - Every key in the table, in both writing directions, with focus asserted after each, including wrapping, type-ahead and Space joining a live query, and modified keys left alone.
  - Focus on opening from each source, focus return on each way of closing, and focus after the focused item unmounts.
  - Activation: `onClick` runs once, links are clicked, every menu closes, `preventDefault()` keeps them open, a disabled item ignores clicks, and checkbox and radio items toggle and close or stay open as the decision says, controlled and uncontrolled.
  - Pointer intent with fake timers: the 100ms open and close delays and the triangle.
  - Type-level rules through `// @ts-expect-error`: omitted props, `MenuItemCheckbox` without `icon`, `MenuRadioGroup` without `label`, and `as` typed as `NavListItem`'s.
- **Stories (Chromium, all four projects), `Menu.stories.tsx` with `a11y.test: "error"`:** row actions with an `IconButton`, a user menu with a radio submenu, checkbox items, descriptions and shortcuts, danger and disabled items, links, both densities, a long scrolling menu, right-to-left, controlled, and:
  - `KeyboardInteraction`: opens with each trigger key, walks every key in the table with real input from `trustedInput()`, and asserts `focusRingContrast >= 3` on a focused item, a focused danger item and the trigger after focus returns.
  - `PointerInteraction`: real hover opens a submenu after its delay and a diagonal move keeps it open; a click outside closes everything and leaves focus where it landed.
  - `Placement`: a menu at the window's edge flips, and a submenu with no room on either side opens below its item, in a 320px frame.
  - `HoverContrast`: `textContrast` of the label, a muted description and a shortcut on the highlight is at least 4.5:1, and danger text on the danger highlight.
- **Contrast stories:** muted text on `secondary-subtle` (4.5:1), and the focus ring on `danger-subtle` (3:1), for every palette.
- **By hand:** every fallback colour pair, and the user menu and row actions in VoiceOver on macOS and iOS and in NVDA with Chrome, recorded in the pull request.

## Boundaries

- **Always:** the capability map's boundaries. Run `pnpm verify` and the fallow audit before every commit; add every new part and icon to the jsx-a11y map; keep docs in the same commit as their behaviour.
- **Ask first:** changing `usePopover`'s or `Popover`'s public behaviour while extracting what `useMenu` shares; any public prop not listed here.
- **Never:** `role="menu"` outside this module and the menubar; a hover delay on anything but a submenu; `opacity` on a disabled item's row.

## Success Criteria

### API

1. `useMenu`, `Menu`, `MenuItem`, `MenuItemCheckbox`, `MenuRadioGroup`, `MenuItemRadio`, `MenuGroup`, `MenuSeparator`, `Submenu`, `CheckIcon`, `ChevronRightIcon` and their props types are exported from `src/index.ts`; the contexts and `MenuSurface` are not.
2. Each part renders the element and role in the API section, omits the props listed, and throws `MissingContextError` outside its provider. Proven by unit tests and `// @ts-expect-error`.
3. `getTriggerProps()` sets `aria-controls`, `aria-expanded`, `aria-haspopup="menu"`, `id`, `popoverTarget` and the anchor name; `getMenuProps()` names the menu by the trigger, or by a given `aria-label` alone.

### Keyboard and focus

4. Every key in the Keys section does what it says, in both writing directions, proven by unit tests and the `KeyboardInteraction` story with real input.
5. Focus goes to the first item when opened from the keyboard or controlled, the last on ↑, and the menu itself when opened by a pointer.
6. Focus returns to the trigger, or a submenu's item, on every close listed with focus inside, and stays put after a click outside or when the closing code moved it.
7. Tab and Shift+Tab close every menu and leave focus on the element after the trigger, or the trigger.
8. `focusRingContrast` of a focused item, a focused danger item and the trigger is at least 3 in all four projects.

### Pointer

9. Hovering focuses an item without scrolling; a submenu opens after 100ms of rest and stays open through the triangle; items act on `click` only.

### Items

10. Activation clicks the item once and closes every menu; `preventDefault()` in a button item's `onClick` keeps them open; a disabled item stays reachable and ignores clicks.
11. A checkbox item and a radio group work controlled and uncontrolled; Enter and click toggle and close, and Space toggles and stays open.
12. Shortcuts are `aria-hidden`, descriptions are linked by `aria-describedby`, and the item's name is its label alone.

### Look and layout

13. The surface, rows, highlight, danger, disabled, group heading, separator and density render as the Styling section says in every theme, palette and mode, reading the three highlight tokens without declaring them.
14. A submenu lines its first item up with its item, flips, and opens below it when neither side fits, in a 320px frame; a long menu scrolls and keeps the focused item in view.
15. `HoverContrast` and the new Contrast pairings pass in all four projects, and every fallback pair is checked by hand.
16. Under forced colours the highlight is `Highlight` with `HighlightText`, a disabled item is `GrayText`, and the check and dot stay visible, checked by hand in Chromium's forced-colours emulation.

### Whole module

17. Every `Menu` story passes axe with `a11y.test: "error"` in all four projects.
18. `docs/design/concepts.md` has a Menus section; AGENTS.md lists the parts in its architecture and jsx-a11y sections; every part and story has JSDoc.
19. `pnpm verify`, `pnpm build` and the fallow audit pass, and a throwaway consumer that imports only `Popover` bundles no menu code.

## Open Questions

- **Hover timings.** 100ms to open or switch a submenu and 400ms of grace after the pointer stops are common desktop values. Adjust if they feel slow or twitchy once the story runs.
