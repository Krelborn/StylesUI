/**
 * Keeps focus inside a menu when the focused item is removed from it or from one of its submenus, by moving focus to
 * the innermost menu that held the item and is still open
 *
 * @param menu the open menu
 * @returns a function that stops watching, to call when the menu closes
 */
export function watchRemovals(menu: HTMLElement): () => void {
  let focusedElement: Element | null = null;
  let focusedMenus: HTMLElement[] = [];

  function noteFocusedMenus(event: Event): void {
    focusedElement = event.target instanceof Element ? event.target : null;
    focusedMenus = focusedElement === null ? [] : menusAround(focusedElement, menu);
  }

  const watcher = new MutationObserver(() => {
    const focused = menu.ownerDocument.activeElement;
    const focusLost = focused === null || focused === menu.ownerDocument.body;
    // Focus taken away on purpose, as by blur(), leaves the element in the menu
    const focusedWasRemoved = focusedElement !== null && !menu.contains(focusedElement);

    if (focusLost && focusedWasRemoved && menu.matches(":popover-open")) {
      const stillOpen = focusedMenus.find((candidate) => candidate.isConnected && candidate.matches(":popover-open"));

      (stillOpen ?? menu).focus();
    }
  });

  menu.addEventListener("focusin", noteFocusedMenus);
  watcher.observe(menu, { childList: true, subtree: true });

  return () => {
    menu.removeEventListener("focusin", noteFocusedMenus);
    watcher.disconnect();
  };
}

/**
 * Lists the menus around an element, innermost first
 *
 * @param element the element to start from, which may be a menu itself
 * @param root the outermost menu, the last listed
 * @returns the menus from the element's own out to `root`
 */
function menusAround(element: Element, root: HTMLElement): HTMLElement[] {
  const menus: HTMLElement[] = [];
  let candidate = element.closest<HTMLElement>('[role="menu"]');

  while (candidate !== null && root.contains(candidate)) {
    menus.push(candidate);
    candidate = candidate.parentElement?.closest<HTMLElement>('[role="menu"]') ?? null;
  }

  return menus;
}
