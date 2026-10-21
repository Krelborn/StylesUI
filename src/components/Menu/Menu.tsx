import { clsx } from "clsx";
import type { JSX, KeyboardEvent, ToggleEventHandler } from "react";

import { targetIndexForKey } from "../../collections";
import { focusItem, renderedItems } from "../../menus";
import type { OverlayPlacement } from "../../overlays";
import type { BoxProps } from "../Box";
import styles from "../MenuSurface/MenuSurface.module.css";
import { Overlay } from "../Overlay";

import { MenuContext } from "./MenuContext";

/**
 * Props `getMenuProps` from `useMenu` returns, which every `Menu` takes
 */
export interface MenuOverlayProps {
  /**
   * `anchor-name` of the trigger the menu is positioned against. From `getMenuProps`.
   */
  anchorName: string;

  /**
   * Closes every open menu, as choosing an item does. From `getMenuProps`.
   */
  close: () => void;

  /**
   * The menu's id, which the trigger's `popoverTarget` and `aria-controls` point at. From `getMenuProps`.
   */
  id: string;

  /**
   * Cancels an opening the parent of a controlled menu has not asked for. From `getMenuProps`.
   */
  onBeforeToggle: ToggleEventHandler<HTMLElement>;

  /**
   * Keeps the hook's state in step with the browser and moves focus in as the menu opens. From `getMenuProps`.
   */
  onToggle: ToggleEventHandler<HTMLElement>;

  /**
   * Whether the menu is shown. From `getMenuProps`.
   */
  open: boolean;

  /**
   * Side of the trigger the menu opens on. From `getMenuProps`.
   */
  placement: OverlayPlacement;
}

/**
 * Props for `Menu`: the props `getMenuProps` returns plus every `div` prop except those the menu pattern sets
 */
export interface MenuProps
  extends
    MenuOverlayProps,
    Omit<
      BoxProps<"div">,
      | "aria-activedescendant"
      | "aria-orientation"
      | "as"
      | "popover"
      | "ref"
      | "role"
      | "tabIndex"
      | keyof MenuOverlayProps
    > {}

/**
 * A menu of commands that opens from a button, such as the actions on a row or the options of a view. `useMenu`
 * connects the two: spread `getTriggerProps()` on a `Button` or `IconButton` and `getMenuProps()` on the menu, inside
 * the same `Theme`. Opened from the keyboard, focus moves to the first item; opened with a pointer, to the menu itself.
 * Choosing an item runs its `onClick` and closes the menu, and Escape or a click outside closes it too. Focus then goes
 * back to the trigger, unless a click outside put it elsewhere.
 *
 * The menu is named by its trigger. An `IconButton` takes its name from its tooltip, which the menu cannot reach, so
 * give the menu the same name with `getMenuProps({ "aria-label": … })`.
 *
 * @example
 * const menu = useMenu();
 *
 * <Button {...menu.getTriggerProps()} variant="secondary">Actions</Button>
 * <Menu {...menu.getMenuProps()}>
 *   <MenuItem onClick={edit}>Edit</MenuItem>
 *   <MenuItem onClick={duplicate}>Duplicate</MenuItem>
 * </Menu>
 */
export function Menu({ className, close, onKeyDown, ...rest }: MenuProps): JSX.Element {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    onKeyDown?.(event);

    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const items = renderedItems(event.currentTarget);
    const target = targetIndexForKey({
      count: items.length,
      currentIndex: items.indexOf(event.target as HTMLElement),
      key: event.key,
      orientation: "vertical",
      wraps: true,
    });

    if (target !== null) {
      event.preventDefault();
      focusItem(items[target]);
    }
  }

  return (
    <MenuContext.Provider value={{ close }}>
      <Overlay
        {...rest}
        as="div"
        className={clsx(styles.menu, className)}
        onKeyDown={handleKeyDown}
        popover="auto"
        role="menu"
        tabIndex={-1}
      />
    </MenuContext.Provider>
  );
}
