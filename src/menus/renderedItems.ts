const itemSelector = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

/**
 * Reads the items a menu renders
 *
 * @param menu the menu element
 * @returns the menu's own items that are not hidden or inert, in document order, leaving out the items of any menu
 *   nested inside it
 */
export function renderedItems(menu: HTMLElement): HTMLElement[] {
  return Array.from(menu.querySelectorAll<HTMLElement>(itemSelector)).filter(
    (item) => item.parentElement?.closest('[role="menu"]') === menu && item.closest("[hidden], [inert]") === null
  );
}
