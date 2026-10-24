import { clsx } from "clsx";
import type { JSX, KeyboardEvent } from "react";
import { useRef, useState } from "react";

import type { RequiredAccessibleName } from "../../accessibility";
import type { TypeAheadQuery } from "../../collections";
import { extendTypeAheadQuery, isTypeAheadQueryLive, targetIndexForKey, typeAheadTarget } from "../../collections";
import { hasModifier, itemText } from "../../menus";
import { syncPopover } from "../../overlays";
import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Menubar.module.css";
import { MenubarContext } from "./MenubarContext";
import { menubarItems } from "./menubarItems";
import { findOpenMenubarItem } from "./findOpenMenubarItem";

/**
 * Props for `Menubar`: a required `aria-label` or `aria-labelledby` and every other `div` prop except those the
 * menubar pattern sets
 */
export type MenubarProps = RequiredAccessibleName &
  Omit<
    BoxProps<"div">,
    "aria-activedescendant" | "aria-label" | "aria-labelledby" | "aria-orientation" | "as" | "role" | "tabIndex"
  >;

/**
 * A row of menus for an app-like tool, such as an editor's "File Edit View", holding one `MenubarMenu` per menu. Name
 * it with `aria-label` or `aria-labelledby`. The bar is one stop in the tab order: Left and Right Arrow move along it,
 * and Down Arrow, Enter or Space open a menu. While a menu is open, moving along the bar, by key or by pointer, opens
 * the next one instead, with focus left on the bar. A content site's header is navigation, which `NavBar` is for.
 *
 * @example
 * <Menubar aria-label="Editor">
 *   <MenubarMenu label="File">
 *     <MenuItem onClick={create}>New</MenuItem>
 *   </MenubarMenu>
 *   <MenubarMenu label="Edit">…</MenubarMenu>
 * </Menubar>
 */
export function Menubar({ className, onKeyDown, ...rest }: MenubarProps): JSX.Element {
  const [tabStopId, setTabStop] = useState<string | null>(null);
  const opensMenuOnFocusRef = useRef(false);
  const typeAheadQueryRef = useRef<TypeAheadQuery | null>(null);

  function moveFocus(item: HTMLElement, opensMenu: boolean): void {
    opensMenuOnFocusRef.current = opensMenu;

    try {
      item.focus();
    } finally {
      opensMenuOnFocusRef.current = false;
    }
  }

  function opensMenuOnFocus(): boolean {
    return opensMenuOnFocusRef.current;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    onKeyDown?.(event);

    const bar = event.currentTarget;
    const items = menubarItems(bar);
    const currentIndex = items.indexOf(event.target as HTMLElement);

    // Keys pressed in the menus bubble here too, and are theirs
    if (event.defaultPrevented || hasModifier(event) || currentIndex === -1) {
      return;
    }

    if (event.key === "Tab") {
      closeMenuOf(items[currentIndex]);
    } else {
      moveAlongBar(event, items, currentIndex);
    }
  }

  /**
   * Moves focus along the bar for an arrow key, Home, End or a typed character, opening the new item's menu when one
   * of the bar's menus is open
   */
  function moveAlongBar(event: KeyboardEvent<HTMLDivElement>, items: HTMLElement[], currentIndex: number): void {
    const target =
      targetIndexForKey({
        count: items.length,
        currentIndex,
        direction: event.currentTarget.matches(":dir(rtl)") ? "rtl" : "ltr",
        key: event.key,
        orientation: "horizontal",
        wraps: true,
      }) ?? typeAheadIndex(event.key, items, currentIndex);

    if (target === undefined) {
      return;
    }

    event.preventDefault();

    // Checked before focus moves, which closes the open menu
    if (target !== null) {
      moveFocus(items[target], findOpenMenubarItem(event.currentTarget) !== undefined);
    }
  }

  /**
   * Finds the bar item a typed character moves to
   *
   * @returns its index; null for a character that matches no item; undefined for a key type-ahead leaves alone, such
   *   as Space when no query is being typed, which opens the focused item's menu
   */
  function typeAheadIndex(key: string, items: HTMLElement[], currentIndex: number): number | null | undefined {
    const time = Date.now();

    if (Array.from(key).length !== 1 || (key === " " && !isTypeAheadQueryLive(typeAheadQueryRef.current, time))) {
      return undefined;
    }

    typeAheadQueryRef.current = extendTypeAheadQuery(typeAheadQueryRef.current, key, time);

    return typeAheadTarget(items.map(itemText), currentIndex, typeAheadQueryRef.current.text);
  }

  return (
    <MenubarContext.Provider value={{ moveFocus, opensMenuOnFocus, setTabStop, tabStopId }}>
      <Box {...rest} className={clsx(styles.menubar, className)} onKeyDown={handleKeyDown} role="menubar" />
    </MenubarContext.Provider>
  );
}

/**
 * Hides a bar item's open menu before Tab moves on, so Tab leaves the bar rather than entering the menu
 *
 * @param item the bar item
 */
function closeMenuOf(item: HTMLElement): void {
  const menu = item.ownerDocument.getElementById(item.getAttribute("aria-controls") ?? "");

  if (menu !== null) {
    syncPopover(menu, false);
  }
}
