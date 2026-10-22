import { createContext } from "react";

import type { Point } from "../../menus";

import type { MenuDensity } from "./Menu";

/**
 * State a `Menu` shares with its items
 */
export interface MenuContextValue {
  /**
   * Closes every open menu once an item has been chosen, unless Space chose a checkbox or radio item, which leaves
   * them open
   */
  closeAfterChoosing: () => void;

  /**
   * Closes every open menu, from the top menu down
   */
  closeAll: () => void;

  /**
   * How tightly the menu's rows are spaced, which its submenus share
   */
  density: MenuDensity;

  /**
   * Lets the pointer cross the menu's other items on its way into an open submenu, from the point where it left the
   * submenu's item
   */
  startPointerGrace: (exit: Point, submenu: HTMLElement) => void;
}

/**
 * Carries a `Menu`'s state to its items; null outside a `Menu`
 */
export const MenuContext = createContext<MenuContextValue | null>(null);
