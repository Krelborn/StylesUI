# Spec: Menus, `context-menu` module

The third module of the [menus capability map](2026-10-21-menus.md): a `Menu` opened by the `contextmenu` gesture rather than a button. It follows every decision, the visual language and the accessibility baseline in the map, and reuses the [`menu` module](2026-10-21-menus-menu.md) whole: the same `Menu`, parts, keys, pointer behaviour and surface. This spec adds how the menu opens, where it sits, where focus goes, the API and the criteria it is tested against.

## Objective

App developers get secondary actions on a file, a row or a canvas object with a right-click, a long-press on touch, or Shift+F10 or the ContextMenu key on the focused element. The developer spreads one set of props on the region and renders a `Menu` as they would for a button, writing no event, timer, focus or positioning code.

Success: a file list whose rows open a menu of row actions, and a canvas whose menu acts on the selected shape, built from `useContextMenu`, `Menu` and its parts, passing their keyboard stories and axe in all four storybook projects. A text field inside the region keeps the browser's own menu.

## Decisions

- **One region per hook.** `getTargetProps()` goes on one element, the region: a list, a grid, a canvas. The hook reports the element the menu opened for as `target`, so one menu serves every row, and the consumer finds the row from it, for example with `closest("[data-id]")`. A menu per row would put a hidden menu in the DOM for every row.
- **Anchored to the region, offset to the point.** The map asked for a zero-size point at the pointer. A spike in Playwright's Chromium and WebKit found a simpler equivalent: the region is the anchor (`anchor-name` from `getTargetProps()`, as a trigger's is), and the menu sets its start corner at `anchor(top)` and `anchor(start)` plus the point's offset within the region, from custom properties the hook sets when it opens. Three `@position-try` rules flip it above the point, before it, or both, using the point's distance from the region's other edges. Both browsers placed it on the point and flipped it at each edge of the window, in both writing directions and inside a size container, so the point needs no element of its own, no extra rendering and no `position: fixed`, which a `container-type` or `transform` on an ancestor would break. Because the menu follows its anchor, it scrolls with the region.
- **Placed by props the hook already returns.** `getMenuProps()` adds the offsets to `style` and marks the menu with a `data-` attribute that `MenuSurface.module.css` reads to swap the placement rules for the point's. `Menu` gets no new public prop and `OverlayPlacement` no new value.
- **Opening.**
  - **Pointer:** a `contextmenu` from a mouse or pen opens at the pointer, and focus goes to the menu itself, as `useMenu` does for a pointer, so the next ↓ or ↑ goes to the first or last item.
  - **Keyboard:** Shift+F10 or the ContextMenu key on an element in the region opens at that element's start edge, just below it, as a `bottom-start` menu from a button would, with the point moved into the window when that edge is off it. Focus goes to the first item. A `contextmenu` that the browser or assistive technology sends with no pointer (`pointerType` empty), as Windows browsers do for these keys and as screen readers do for their own command, opens the same way.
  - **Touch:** a press held 500ms without moving more than 10px, Android's and iOS's own long-press, opens at the press, focus on the menu. On a platform that sends its own `contextmenu` for a long-press, as Android does, whichever comes first opens it and the other is ignored. The click that ends the press does nothing, so releasing over a row doesn't also activate it. A scroll, a second finger or lifting the finger first cancels it.
  - A gesture while the menu is open reopens it at the new point, for the new target.
- **Left to the browser.** A `contextmenu`, Shift+F10 or ContextMenu key from an editable element (a text input, `textarea`, `select` or `contenteditable`) is left alone, so its native menu, with cut, copy, paste and spelling, still opens. The same goes for one another region inside this one has already handled (`defaultPrevented`), so the innermost region wins. A right-click in the open menu opens neither the browser's menu nor the region's, as a click in a native menu does nothing (changed from leaving it alone while building, so no native menu covers this one). A right-click with Shift held is left alone too, in every browser, as Firefox already does, as a way back to copy and inspect; a `contextmenu` with no pointer (`pointerType` empty) is never one, so Shift+F10 still opens the menu wherever a browser marks its event with `shiftKey`. Agreed in review.
- **Naming.** A context menu has no trigger to name it, so `getMenuProps()` requires `aria-label` or `aria-labelledby` through `RequiredAccessibleName`, for example "Actions for report.pdf". The region gets no `aria-haspopup`, because it is not a button and the attribute would announce every row as one.
- **Closing and focus.** The menu closes as a `useMenu` menu does: on choosing an item, Escape, a click outside, focus leaving it, another popover opening and `close()`. Focus then returns to the element that had it when the menu opened, which a right-click sets to the focusable element it landed in, unless the closing code moved focus elsewhere or a click outside put it somewhere. Tab and Shift+Tab return focus to that element and then move on from it, as though the menu were not there.
- **Built on what `useMenu` has.** The hook uses `usePopover`'s open state and focus return, and shares `useMenu`'s focus on opening, removal watching, Tab and focus-leaving handling, moved where both can use them without changing how `useMenu` behaves. `Submenu`, checkbox and radio items, groups and type-ahead work unchanged, because they belong to `Menu`.
- **Long-press on iOS.** iOS Safari shows its callout on a held link or image, and starts a text selection on held text. The region sets `-webkit-touch-callout: none`, and the hook cancels `selectstart` while a touch press is held. If that doesn't stop the selection on a device, which is checked by hand, the region also takes `-webkit-user-select: none` under `(pointer: coarse)`, so touch users can't select its text; that suits rows and canvases. Agreed in review.

## API

```ts
// src/components/ContextMenu/useContextMenu.ts
export interface UseContextMenuOptions {
  /** Called with the new open state when the menu opens or closes */
  onOpenChange?: (open: boolean) => void;
}

export interface UseContextMenuResult {
  /** Closes the menu, returning focus as Escape does, and reports `false` through `onOpenChange` */
  close: () => void;
  /** Props for the `Menu`, which must be named by `aria-label` or `aria-labelledby`: anchor, id, the point's offsets,
   * open state and toggle handlers */
  getMenuProps: <Props extends object>(props: Props & RequiredAccessibleName & Partial<ContextMenuOverlayProps>) => …;
  /** Props for the region: its anchor name, the touch callout, and the context menu, key and pointer handlers */
  getTargetProps: <Props extends object>(props?: Props & Partial<ContextMenuTargetProps>) => …;
  /** Whether the menu is open */
  open: boolean;
  /** The element the menu opened for: the one under the pointer or press, or the focused one; `null` until it opens */
  target: Element | null;
}
```

The getters merge as `useMenu`'s do, through `mergeProps`. There is no controlled `open` or `defaultOpen`: a context menu opens only from a gesture, which gives it its point. `useContextMenu` and its types are exported from `src/index.ts`; there are no new components and no new icons.

## Behaviour

### Opening

| Source                                                             | Where it opens                         | Focus          |
| ------------------------------------------------------------------ | -------------------------------------- | -------------- |
| Right-click (mouse or pen `contextmenu`)                           | At the pointer                         | The menu       |
| Long-press, 500ms within 10px                                      | At the press                           | The menu       |
| Shift+F10, the ContextMenu key, or a `contextmenu` with no pointer | Below the focused element's start edge | The first item |

The menu's start corner sits on the point. With no room after it on either axis, it flips to end on the point instead, on that axis. A menu too tall for either side shrinks to the room it has, as `useMenu`'s does. In right-to-left text, start is the right.

### In the menu

Every key, pointer behaviour, submenu and item kind in the `menu` spec, unchanged.

### Closing and focus

- Closes on choosing an item, Escape, Tab, a click outside, focus leaving the menu, another popover opening, and `close()`.
- Focus returns to the element focused as the menu opened on every close with focus inside, unless the closing code moved it. After a click outside, focus stays where the click put it.
- Tab and Shift+Tab return focus to that element, then move on from it.
- `target` keeps the element the menu last opened for until it opens again.

## Styling

Nothing new to look at: the menu is the `menu` module's surface. `MenuSurface.module.css` gains the point placement: the start corner on the region's anchor plus the offsets, three `@position-try` flips and `--sui-menu-shrink`, with no margin between the point and the menu, since the pointer is not a trigger it could cover. The region's custom properties are private (`--_sui-context-menu-*`).

## Tech Stack

As the capability map: React 19, TypeScript 7, Vite 8, CSS modules, the Popover API and CSS anchor positioning, Vitest, Storybook 10, oxlint and oxfmt, pnpm. No new dependencies.

## Commands

```sh
pnpm verify                                                                   # before every commit
pnpm test:unit src/components/ContextMenu/useContextMenu.test.tsx             # one unit test file
pnpm test:storybook src/components/ContextMenu/ContextMenu.stories.tsx        # one story file, in all four projects
pnpm build                                                                    # dist/
fallow audit --format json --quiet --explain --gate-marker agent              # before every commit
```

## Project Structure

```
src/components/ContextMenu/        ← useContextMenu, its unit tests and stories, index.ts
src/components/Menu/               ← what useMenu and useContextMenu share, moved out of useMenu
src/components/MenuSurface/        ← the point placement rules
src/index.ts                       ← useContextMenu and its types
vite.config.ts, src/test/trustedInput.ts ← a contextClickByTestId browser command for the stories
docs/design/concepts.md, AGENTS.md ← a Context menus paragraph and the architecture entry
```

## Code Style

Follow `docs/standards/` and `useMenu`. A file list, the shape the stories and docs use:

```tsx
const contextMenu = useContextMenu();
const file = files.find(({ id }) => id === contextMenu.target?.closest("[data-id]")?.getAttribute("data-id"));

<ul {...contextMenu.getTargetProps()} aria-label="Files">
  {files.map(({ id, name }) => (
    <li data-id={id} key={id} tabIndex={-1}>
      {name}
    </li>
  ))}
</ul>
<Menu {...contextMenu.getMenuProps({ "aria-label": `Actions for ${file?.name ?? "file"}` })}>
  <MenuItem onClick={() => rename(file)}>Rename</MenuItem>
  <MenuItem onClick={() => duplicate(file)}>Duplicate</MenuItem>
  <MenuSeparator />
  <MenuItem onClick={() => remove(file)} tone="danger">
    Delete…
  </MenuItem>
</Menu>
```

## Testing Strategy

- **Unit (jsdom), `src/components/ContextMenu/useContextMenu.test.tsx`:**
  - Opening from each source in the table: a `contextmenu` with a mouse, pen and empty pointer type, Shift+F10, the ContextMenu key, and a long-press with fake timers, including the 10px tolerance, cancelling by moving, lifting, `pointercancel` and a second finger, Android's `contextmenu` arriving after or before the timer, and the click that ends a long-press doing nothing.
  - The offsets the hook sets for a point, against a mocked region rectangle, in both writing directions, and the keyboard point moved into the window.
  - Events left alone: from a text input, `textarea`, `select` and `contenteditable`, already prevented by an inner region, and a right-click with Shift held, while a no-pointer `contextmenu` with `shiftKey` still opens; Shift+F10 and the ContextMenu key with Alt, Ctrl or Meta.
  - Focus on opening from each source, focus return on each way of closing, Tab and Shift+Tab, and `target` for each source.
  - Reopening at a new point while open.
  - Type-level rules through `// @ts-expect-error`: `getMenuProps()` without `aria-label` or `aria-labelledby`.
  - `useMenu`'s tests pass unchanged after the shared code moves.
- **Stories (Chromium, all four projects), `ContextMenu.stories.tsx` with `a11y.test: "error"`:** a file list, a canvas whose menu acts on the selected shape, a region holding a text field, right-to-left, and:
  - `KeyboardInteraction`: Shift+F10 and the ContextMenu key with real input open on the focused row with focus on the first item; Escape and Tab return focus to the row; `focusRingContrast >= 3` on a focused item.
  - `PointerInteraction`: a real right-click (a new `contextClickByTestId` command) opens at the pointer with focus on the menu; a click outside closes it and leaves focus where it landed; a right-click on the text field leaves the event unprevented.
  - `Placement`: right-clicks near each corner of the frame open the menu flipped to fit, in both writing directions.
- **Long-press in Chromium:** a `LongPress` story holds a real touch through the DevTools protocol (a `longPressByTestId` command, added while building), so the menu staying open after the finger lifts and the ending tap doing nothing are tested in a browser.
- **By hand:** a long-press on iOS Safari and Android Chrome, including the callout and text selection; and the file list in VoiceOver on macOS (VO+Shift+M) and iOS, and NVDA with Chrome (Shift+F10 and the Applications key), recorded in the pull request.

## Boundaries

- **Always:** the capability map's boundaries. Run `pnpm verify` and the fallow audit before every commit; keep docs in the same commit as their behaviour; leave text fields' native menus alone.
- **Ask first:** any change to `useMenu`'s or `Menu`'s public behaviour or props while moving shared code; a new `OverlayPlacement`; any public option not listed here, such as a way to turn the hook off or a consumer-given keyboard point.
- **Never:** prevent the native menu on an editable element; open on anything but the three gestures; put `aria-haspopup` or a `menu` role on the region.

## Success Criteria

### API

1. `useContextMenu`, `UseContextMenuOptions` and `UseContextMenuResult` are exported from `src/index.ts`, and a consumer importing only `Menu` and `useMenu` bundles no context-menu code.
2. `getMenuProps()` without `aria-label` or `aria-labelledby` fails to type-check.
3. `target` is the element under the pointer or press, or the focused element, for each source.

### Opening and placement

4. Each source in the Opening table opens the menu where and with the focus the table says, proven by unit tests and, for the pointer and keys, by stories with real input.
5. A long-press cancels on moving more than 10px, lifting, `pointercancel` or a second finger, opens once when the platform also sends `contextmenu`, and its ending click does nothing.
6. The menu's start corner sits on the point and flips on each axis without room, in both writing directions, in Chromium in the `Placement` story; the spike's WebKit result is rechecked by hand.
7. Events from editable elements, already prevented, or from a right-click with Shift held are left alone, and a right-click in the open menu opens no menu at all.

### Closing and focus

8. Focus returns to the element focused at opening on every close with focus inside, stays put after a click outside, and Tab and Shift+Tab move on from that element.
9. `focusRingContrast` of a focused item is at least 3 in all four projects.

### Whole module

10. `useMenu`'s unit tests and stories pass unchanged after the shared code moves.
11. Every `ContextMenu` story passes axe with `a11y.test: "error"` in all four projects.
12. `docs/design/concepts.md` describes context menus, including that every action must also be reachable somewhere visible; AGENTS.md lists the hook in its architecture section; the hook and every story have JSDoc.
13. `pnpm verify`, `pnpm build` and the fallow audit pass.

## Open Questions

Resolved in review on 2026-10-24:

- **Text selection on iOS:** fall back to `-webkit-user-select: none` under `(pointer: coarse)` if cancelling `selectstart` is not enough (see Decisions).
- **Shift and a right-click:** left to the browser in every browser (see Decisions).
- **Long-press timing:** 500ms and 10px, to be adjusted only if trying it on devices calls for it.
