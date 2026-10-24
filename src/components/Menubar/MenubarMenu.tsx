import type { FocusEvent, JSX, KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";

import { closeWhenFocusLeaves, hasModifier } from "../../menus";
import { Box } from "../Box";
import { Menu } from "../Menu";
// The Menu barrel leaves this internal hook out, since it is not public
import { useMenuButton } from "../Menu/useMenuButton";

import styles from "./Menubar.module.css";
import { menubarItems } from "./menubarItems";
import { findOpenMenubarItem } from "./findOpenMenubarItem";
import { useMenubarContext } from "./useMenubarContext";

/**
 * Props for `MenubarMenu`
 */
export interface MenubarMenuProps {
  /**
   * The menu's items: any menu parts, including `Submenu`
   */
  children?: ReactNode;

  /**
   * The label of the bar item that opens the menu, which names both
   */
  label: ReactNode;
}

/**
 * One menu in a `Menubar`: an item in the bar and the compact `Menu` it opens below it, holding its children. Down
 * Arrow, Enter or Space opens it on its first item, Up Arrow on its last, and a click with focus left on the bar item.
 * In the menu, Right and Left Arrow move to the next or previous menu in the bar, except where they open or close a
 * submenu. Escape closes it and returns focus to the bar item, and choosing an item closes it too.
 *
 * @example
 * <MenubarMenu label="View">
 *   <MenuItemCheckbox checked={showRuler} onCheckedChange={setShowRuler}>Ruler</MenuItemCheckbox>
 * </MenubarMenu>
 */
export function MenubarMenu({ children, label }: MenubarMenuProps): JSX.Element {
  const menubar = useMenubarContext("MenubarMenu");
  const { setTabStop } = menubar;
  const itemRef = useRef<HTMLButtonElement>(null);
  const menu = useMenuButton({ pointerOpeningFocus: "trigger" });
  const triggerProps = menu.getTriggerProps();
  const itemId = triggerProps.id;

  // Before paint, so the bar always has a tab stop
  useLayoutEffect(() => {
    const item = itemRef.current;
    const bar = item?.closest('[role="menubar"]');

    if (menubar.tabStopId === null && bar !== null && bar !== undefined && menubarItems(bar).at(0) === item) {
      setTabStop(itemId);
    }
  });

  useLayoutEffect(
    () => () => {
      setTabStop((current) => (current === itemId ? null : current));
    },
    [itemId, setTabStop]
  );

  function handleItemFocus(event: FocusEvent<HTMLElement>): void {
    setTabStop(itemId);

    if (menubar.opensMenuOnFocus()) {
      menu.show(event.currentTarget, "trigger");
    }
  }

  function handleItemBlur(event: FocusEvent<HTMLElement>): void {
    const item = event.currentTarget;
    const menuElement = item.ownerDocument.getElementById(triggerProps["aria-controls"]);

    if (menuElement !== null) {
      closeWhenFocusLeaves(menuElement, event.relatedTarget, (focused) => focused === item);
    }
  }

  function handleItemClick(event: MouseEvent<HTMLElement>): void {
    const item = event.currentTarget;
    const isMenuOpen = item.ownerDocument.getElementById(triggerProps["aria-controls"])?.matches(":popover-open");

    // Enter or Space on an item whose menu opened as focus moved along the bar goes into the menu, rather than closing it
    if (event.detail === 0 && isMenuOpen === true) {
      event.preventDefault();
      menu.show(item, "first");
    }

    triggerProps.onClick(event);
  }

  function handleItemPointerMove(event: PointerEvent<HTMLElement>): void {
    const item = event.currentTarget;
    const bar = item.closest('[role="menubar"]');
    const openItem = bar === null ? undefined : findOpenMenubarItem(bar);

    // Focus follows the pointer along the bar while one of its menus is open, opening this item's menu instead
    if (event.pointerType !== "touch" && openItem !== undefined && openItem !== item) {
      menubar.moveFocus(item, true);
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLElement>): void {
    const item = event.currentTarget.ownerDocument.getElementById(itemId);
    const bar = item?.closest('[role="menubar"]');
    const step = stepAlongBar(event.key, event.currentTarget);

    // A submenu's item or a submenu has already handled a key that opens or closes the submenu
    if (
      event.defaultPrevented ||
      hasModifier(event) ||
      step === 0 ||
      item === null ||
      bar === null ||
      bar === undefined
    ) {
      return;
    }

    const items = menubarItems(bar);
    const next = items.at((items.indexOf(item) + step) % items.length);

    event.preventDefault();

    if (next !== undefined) {
      menubar.moveFocus(next, true);
    }
  }

  return (
    <Box className={styles.entry} role="none">
      <Box
        {...triggerProps}
        as="button"
        className={styles.item}
        onBlur={handleItemBlur}
        onClick={handleItemClick}
        onFocus={handleItemFocus}
        onPointerMove={handleItemPointerMove}
        ref={itemRef}
        role="menuitem"
        tabIndex={menubar.tabStopId === itemId ? 0 : -1}
        type="button"
      >
        {label}
      </Box>
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- Menu sets the menu role itself */}
      <Menu {...menu.getMenuProps({ onKeyDown: handleMenuKeyDown })} density="compact">
        {children}
      </Menu>
    </Box>
  );
}

/**
 * How far along the bar an arrow key pressed in a menu moves
 *
 * @param key the pressed key
 * @param menu the menu, whose writing direction decides which arrow points forward
 * @returns 1 for the next bar item, -1 for the previous one, and 0 for any other key
 */
function stepAlongBar(key: string, menu: HTMLElement): number {
  const forward = menu.matches(":dir(rtl)") ? "ArrowLeft" : "ArrowRight";
  const back = forward === "ArrowLeft" ? "ArrowRight" : "ArrowLeft";

  if (key === forward) {
    return 1;
  }

  return key === back ? -1 : 0;
}
