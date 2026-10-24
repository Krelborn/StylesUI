import type { UseMenuOptions, UseMenuResult } from "./useMenuButton";
import { useMenuButton } from "./useMenuButton";

export type { UseMenuOptions, UseMenuResult } from "./useMenuButton";

/**
 * Connects a `Menu` to the button that opens it. Clicking the button toggles the menu, and Escape or a click outside
 * closes it, all handled by the browser. Opened from the keyboard, or by a controlled `open`, focus moves to the first
 * item; opened with a pointer, to the menu itself, so no item is highlighted under a pointer still on the button.
 * Closing the menu with focus inside returns focus to the button.
 *
 * @param options open state, the change callback and placement
 * @returns prop getters for the trigger and the `Menu`, whether it is open, and `close`
 *
 * @example
 * const menu = useMenu({ placement: "bottom-end" });
 *
 * <IconButton {...menu.getTriggerProps()} label="Row actions"><MoreHorizontalIcon /></IconButton>
 * <Menu {...menu.getMenuProps({ "aria-label": "Row actions" })}>…</Menu>
 */
export function useMenu(options: UseMenuOptions = {}): UseMenuResult {
  const { close, getMenuProps, getTriggerProps, open } = useMenuButton({ ...options, pointerOpeningFocus: "menu" });

  return { close, getMenuProps, getTriggerProps, open };
}
