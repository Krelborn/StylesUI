import { clsx } from "clsx";
import type { JSX, KeyboardEvent, ToggleEventHandler } from "react";
import { useRef } from "react";

import type { TypeAheadQuery } from "../../collections";
import { extendTypeAheadQuery, isTypeAheadQueryLive, targetIndexForKey, typeAheadTarget } from "../../collections";
import { focusItem, itemText, renderedItems } from "../../menus";
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
  const typeAheadQueryRef = useRef<TypeAheadQuery | null>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    onKeyDown?.(event);

    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const items = renderedItems(event.currentTarget);
    const currentIndex = items.indexOf(event.target as HTMLElement);

    if (moveFocus(event.key, items, currentIndex) || followLink(event.key, items.at(currentIndex))) {
      event.preventDefault();
    }
  }

  /**
   * Moves focus for an arrow key, Home, End or a typed character
   *
   * @returns whether the menu handled the key, even when a typed character matched no item
   */
  function moveFocus(key: string, items: HTMLElement[], currentIndex: number): boolean {
    const target =
      targetIndexForKey({ count: items.length, currentIndex, key, orientation: "vertical", wraps: true }) ??
      typeAheadIndex(key, items, currentIndex);

    if (target !== null && target !== undefined) {
      focusItem(items[target]);
    }

    return target !== undefined;
  }

  /**
   * Finds the item a typed character moves to
   *
   * @returns its index; null for a character that matches no item; undefined for a key type-ahead leaves alone, such
   *   as Space when no query is being typed, which chooses the focused item
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

/**
 * Follows a focused link item on Space, which a link, unlike a button, ignores by itself
 *
 * @param key the pressed key
 * @param item the focused item, if focus is on one
 * @returns whether it clicked the link
 */
function followLink(key: string, item: HTMLElement | undefined): boolean {
  if (key !== " " || item === undefined || item instanceof HTMLButtonElement) {
    return false;
  }

  item.click();

  return true;
}
