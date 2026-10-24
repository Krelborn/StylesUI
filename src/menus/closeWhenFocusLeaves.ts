import { syncPopover } from "../overlays";

/**
 * Hides an open menu when focus moves out of it, as a light dismiss would, leaving focus where it went
 *
 * @param menu the menu that lost focus
 * @param relatedTarget the element taking focus, or `null` when focus is between elements or lost with an item that
 *   was removed, in which case the menu waits a task to see where it lands
 * @param staysOn whether focus on an element outside the menu keeps it open, such as on its trigger
 */
export function closeWhenFocusLeaves(
  menu: HTMLElement,
  relatedTarget: Element | null,
  staysOn: (focused: Element) => boolean
): void {
  if (!menu.matches(":popover-open")) {
    return;
  }

  if (relatedTarget === null) {
    setTimeout(() => {
      closeUnlessFocusStays(menu, menu.ownerDocument.activeElement, staysOn);
    }, 0);
  } else {
    closeUnlessFocusStays(menu, relatedTarget, staysOn);
  }
}

function closeUnlessFocusStays(
  menu: HTMLElement,
  focused: Element | null,
  staysOn: (focused: Element) => boolean
): void {
  const stays = focused !== null && (menu.contains(focused) || staysOn(focused));

  // Not through usePopover's close(), which takes focus lost to the page for a press inside the menu and returns it
  if (!stays && menu.matches(":popover-open")) {
    syncPopover(menu, false);
  }
}
