import { clsx } from "clsx";
import type { JSX, KeyboardEvent, PointerEvent, ToggleEvent, ToggleEventHandler } from "react";
import { useRef } from "react";

import type { TypeAheadQuery } from "../../collections";
import { extendTypeAheadQuery, isTypeAheadQueryLive, targetIndexForKey, typeAheadTarget } from "../../collections";
import { focusItem, hasModifier, itemText, renderedItems } from "../../menus";
import type { OverlayPlacement } from "../../overlays";
import type { BoxProps } from "../Box";
import styles from "../MenuSurface/MenuSurface.module.css";
import { Overlay } from "../Overlay";

import { MenuContext } from "./MenuContext";
import { useMenuPointer } from "./useMenuPointer";

/**
 * How tightly a menu's rows are spaced: `default` for menus from buttons, `compact` for menubars and dense tools
 */
export type MenuDensity = "compact" | "default";

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
    > {
  /**
   * How tightly the rows are spaced, which the menu's submenus share. Rows are at least 44px tall on a touch screen,
   * whatever the density. Defaults to `default`.
   */
  density?: MenuDensity;
}

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
export function Menu({
  className,
  close,
  density = "default",
  onKeyDown,
  onPointerMove,
  onPointerOut,
  onToggle,
  ...rest
}: MenuProps): JSX.Element {
  const typeAheadQueryRef = useRef<TypeAheadQuery | null>(null);
  const keepsOpenAfterChoosingRef = useRef(false);
  const pointer = useMenuPointer();

  function closeAfterChoosing(): void {
    if (!keepsOpenAfterChoosingRef.current) {
      close();
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>): void {
    onPointerMove?.(event);
    pointer.handlePointerMove(event);
  }

  function handlePointerOut(event: PointerEvent<HTMLDivElement>): void {
    onPointerOut?.(event);
    pointer.handlePointerOut(event);
  }

  function handleToggle(event: ToggleEvent<HTMLDivElement>): void {
    onToggle(event);

    // The menu stays mounted while closed, so a query typed before it closed would otherwise carry into its next opening
    if (event.newState === "closed" && event.target === event.currentTarget) {
      typeAheadQueryRef.current = null;
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    onKeyDown?.(event);

    const menu = event.currentTarget;
    // Keys pressed in a submenu bubble here too, and are the submenu's
    const isInSubmenu = (event.target as Element).closest('[role="menu"]') !== menu;

    if (event.defaultPrevented || hasModifier(event) || isInSubmenu) {
      return;
    }

    const items = renderedItems(menu);
    const currentIndex = items.indexOf(event.target as HTMLElement);
    const current = currentIndex === -1 ? undefined : items[currentIndex];

    if (moveFocus(event.key, items, currentIndex) || chooseOnSpace(event, current)) {
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
   * Chooses the focused item on Space where the browser would not, or would close the menu: a link ignores Space by
   * itself, and Space toggles a checkbox or radio item and leaves the menu open. A held Space chooses once, as it
   * does a button.
   *
   * @returns whether it handled the key
   */
  function chooseOnSpace(event: KeyboardEvent<HTMLDivElement>, item: HTMLElement | undefined): boolean {
    const checkable = item?.getAttribute("role") !== "menuitem";

    if (event.key !== " " || item === undefined || (!checkable && item instanceof HTMLButtonElement)) {
      return false;
    }

    if (!event.repeat) {
      keepsOpenAfterChoosingRef.current = checkable;
      item.click();
      keepsOpenAfterChoosingRef.current = false;
    }

    return true;
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
    <MenuContext.Provider
      value={{ closeAfterChoosing, closeAll: close, density, startPointerGrace: pointer.startPointerGrace }}
    >
      <Overlay
        {...rest}
        as="div"
        className={clsx(styles.menu, className)}
        onKeyDown={handleKeyDown}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onToggle={handleToggle}
        popover="auto"
        role="menu"
        // A long menu scrolls, and a scrolling region must be focusable; focus is already inside an open menu, and Tab
        // leaves it from there, so this adds no stop to the tab order
        tabIndex={0}
        data-density={density}
      />
    </MenuContext.Provider>
  );
}
