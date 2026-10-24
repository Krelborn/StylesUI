/**
 * Reads the items a menubar renders
 *
 * @param menubar the menubar element
 * @returns its own items in document order, leaving out the items of the menus they open
 */
export function menubarItems(menubar: Element): HTMLElement[] {
  return Array.from(menubar.querySelectorAll<HTMLElement>('[role="menuitem"]')).filter(
    (item) => item.parentElement?.closest('[role="menu"], [role="menubar"]') === menubar
  );
}
