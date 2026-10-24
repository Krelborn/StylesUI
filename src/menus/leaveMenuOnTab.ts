import { hasModifier } from "./hasModifier";

/**
 * Closes a menu on Tab or Shift+Tab, moving focus back to where the menu was opened from. Tab then moves on from
 * there, as though the menu were not there, and Shift+Tab stops there.
 *
 * @param event the key event the menu received
 * @param returnTo the element focus goes back to; with none, the key is left alone
 * @param close closes the menu
 */
export function leaveMenuOnTab(
  event: Pick<
    KeyboardEvent,
    "altKey" | "ctrlKey" | "defaultPrevented" | "key" | "metaKey" | "preventDefault" | "shiftKey"
  >,
  returnTo: HTMLElement | null,
  close: () => void
): void {
  if (event.key !== "Tab" || returnTo === null || event.defaultPrevented || hasModifier(event)) {
    return;
  }

  if (event.shiftKey) {
    event.preventDefault();
  }

  returnTo.focus();
  close();
}
