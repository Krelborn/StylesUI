import { menubarItems } from "./menubarItems";

/**
 * Finds the bar item whose menu is open
 *
 * @param menubar the menubar element
 * @returns the bar item, or undefined when none of the bar's menus is open
 */
export function openMenubarItem(menubar: Element): HTMLElement | undefined {
  return menubarItems(menubar).find((item) =>
    item.ownerDocument.getElementById(item.getAttribute("aria-controls") ?? "")?.matches(":popover-open")
  );
}
