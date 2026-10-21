import type { FocusEvent, JSX, KeyboardEvent, PointerEvent, ReactNode, ToggleEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";

import { focusItem, renderedItems } from "../../menus";
import { anchorNameFor } from "../../overlays";
import { Box } from "../Box";
import { ChevronRightIcon } from "../Icon";
import styles from "../MenuSurface/MenuSurface.module.css";

import { Menu } from "./Menu";
import { useMenuContext } from "./useMenuContext";
import { useMenuItemContent } from "./useMenuItemContent";

// How long the pointer must rest on a submenu's item before the submenu opens
const hoverOpenDelay = 100;

/**
 * Props for `Submenu`
 */
export interface SubmenuProps {
  /**
   * The submenu's items
   */
  children?: ReactNode;

  /**
   * Whether the submenu cannot be opened. Its item stays reachable with the arrow keys, so its label is read. Defaults
   * to `false`.
   */
  disabled?: boolean;

  /**
   * An icon before the label, hidden from assistive technology
   */
  icon?: ReactNode;

  /**
   * The label of the item that opens the submenu, which names both
   */
  label: ReactNode;
}

/**
 * An item in a `Menu` that opens another menu beside it, such as "Move to" opening a list of folders. Right Arrow
 * (Left Arrow in right-to-left text), Enter or Space opens it on its first item, and a click opens it with focus left
 * on its item. Left Arrow (Right Arrow in right-to-left text) or Escape closes it and returns focus to its item.
 * Choosing an item inside closes every open menu. Its items are any menu parts, including another `Submenu`.
 *
 * @example
 * <Submenu label="Move to">
 *   <MenuItem onClick={() => move("inbox")}>Inbox</MenuItem>
 *   <MenuItem onClick={() => move("projects")}>Projects</MenuItem>
 * </Submenu>
 */
export function Submenu({ children, disabled = false, icon, label }: SubmenuProps): JSX.Element {
  const parent = useMenuContext("Submenu");
  const itemId = useId();
  const menuId = useId();
  const anchorName = anchorNameFor(menuId);
  const [open, setOpen] = useState(false);
  const pressedByPointerRef = useRef(false);
  const focusesFirstItemRef = useRef(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const item = useMenuItemContent({
    describedBy: undefined,
    description: undefined,
    label,
    leading: icon,
    trailing: <ChevronRightIcon />,
  });

  useEffect(() => () => clearTimeout(hoverTimerRef.current), []);

  function openSubmenu(page: Document, focusesFirstItem: boolean): void {
    const submenu = page.getElementById(menuId);

    if (disabled || submenu === null) {
      return;
    }

    if (open && focusesFirstItem) {
      focusFirstItem(submenu);
    }

    focusesFirstItemRef.current = focusesFirstItem;
    setOpen(true);
  }

  function handleItemClick(event: { currentTarget: HTMLElement }): void {
    openSubmenu(event.currentTarget.ownerDocument, !pressedByPointerRef.current);
    pressedByPointerRef.current = false;
  }

  function handleItemPointerMove(event: PointerEvent<HTMLButtonElement>): void {
    const page = event.currentTarget.ownerDocument;

    if (event.pointerType !== "touch" && !open && hoverTimerRef.current === undefined) {
      hoverTimerRef.current = setTimeout(() => {
        hoverTimerRef.current = undefined;
        openSubmenu(page, false);
      }, hoverOpenDelay);
    }
  }

  function handleItemPointerLeave(event: PointerEvent<HTMLButtonElement>): void {
    const submenu = event.currentTarget.ownerDocument.getElementById(menuId);

    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = undefined;

    if (open && submenu !== null) {
      parent.startPointerGrace({ x: event.clientX, y: event.clientY }, submenu);
    }
  }

  function handleItemKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key === openingKey(event.currentTarget) && !hasModifier(event)) {
      event.preventDefault();
      openSubmenu(event.currentTarget.ownerDocument, true);
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.defaultPrevented || event.key !== closingKey(event.currentTarget) || hasModifier(event)) {
      return;
    }

    // Also keeps the menus around this one from handling the key
    event.preventDefault();
    setOpen(false);
    event.currentTarget.ownerDocument.getElementById(itemId)?.focus();
  }

  function handleMenuBeforeToggle(event: ToggleEvent<HTMLElement>): void {
    keepToSubmenu(event);
  }

  function handleMenuToggle(event: ToggleEvent<HTMLElement>): void {
    const submenu = event.currentTarget;

    keepToSubmenu(event);

    if (event.newState === "open") {
      if (focusesFirstItemRef.current) {
        focusFirstItem(submenu);
      }
    } else {
      setOpen(false);
      returnFocusToItem(submenu);
    }

    focusesFirstItemRef.current = false;
  }

  function handleWrapperBlur(event: FocusEvent<HTMLElement>): void {
    const next = event.relatedTarget;

    if (next !== null && !event.currentTarget.contains(next)) {
      setOpen(false);
    }
  }

  /**
   * Moves focus to the submenu's item when the browser closes the submenu with focus inside it, as on Escape, and
   * leaves it alone when every menu is closing
   */
  function returnFocusToItem(submenu: HTMLElement): void {
    const page = submenu.ownerDocument;
    const submenuItem = page.getElementById(itemId);
    const focused = page.activeElement;
    const focusIsInside = focused === null || focused === page.body || submenu.contains(focused);

    if (submenuItem?.closest('[role="menu"]')?.matches(":popover-open") === true && focusIsInside) {
      submenuItem.focus();
    }
  }

  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- only notices focus leaving the item and its submenu
    <Box className={styles.submenu} onBlur={handleWrapperBlur} role="none">
      <Box
        as="button"
        className={styles.item}
        id={itemId}
        onClick={handleItemClick}
        onKeyDown={handleItemKeyDown}
        onPointerCancel={() => {
          pressedByPointerRef.current = false;
        }}
        onPointerDown={() => {
          pressedByPointerRef.current = true;
        }}
        onPointerLeave={handleItemPointerLeave}
        onPointerMove={handleItemPointerMove}
        role="menuitem"
        style={{ anchorName }}
        tabIndex={-1}
        type="button"
        aria-controls={menuId}
        aria-disabled={disabled ? true : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-labelledby={item.labelId}
      >
        {item.content}
      </Box>
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- Menu sets the menu role itself */}
      <Menu
        anchorName={anchorName}
        className={styles.submenuMenu}
        close={parent.closeAll}
        id={menuId}
        onBeforeToggle={handleMenuBeforeToggle}
        onKeyDown={handleMenuKeyDown}
        onToggle={handleMenuToggle}
        open={open}
        placement="end"
        aria-labelledby={item.labelId}
      >
        {children}
      </Menu>
    </Box>
  );
}

/**
 * Stops a submenu's toggle event at the submenu. React passes it on to the menus around it, as though it bubbled, and
 * their handlers would take it for their own.
 *
 * @param event the submenu's `beforetoggle` or `toggle` event
 */
function keepToSubmenu(event: ToggleEvent<HTMLElement>): void {
  event.stopPropagation();
}

/**
 * Moves focus to a submenu's first item
 *
 * @param submenu the submenu element
 */
function focusFirstItem(submenu: HTMLElement): void {
  const first = renderedItems(submenu).at(0);

  if (first !== undefined) {
    focusItem(first);
  }
}

/**
 * The arrow key that opens a submenu: the one pointing the way the text runs
 *
 * @param element an element in the menu
 * @returns `ArrowRight`, or `ArrowLeft` in right-to-left text
 */
function openingKey(element: HTMLElement): string {
  return element.matches(":dir(rtl)") ? "ArrowLeft" : "ArrowRight";
}

/**
 * The arrow key that closes a submenu: the one pointing back against the text
 *
 * @param element an element in the submenu
 * @returns `ArrowLeft`, or `ArrowRight` in right-to-left text
 */
function closingKey(element: HTMLElement): string {
  return element.matches(":dir(rtl)") ? "ArrowRight" : "ArrowLeft";
}

/**
 * Whether a key was pressed with Alt, Ctrl or Meta, which leaves it to the browser and the app
 *
 * @param event the key event
 * @returns true when any of the three was held
 */
function hasModifier(event: KeyboardEvent<HTMLElement>): boolean {
  return event.altKey || event.ctrlKey || event.metaKey;
}
