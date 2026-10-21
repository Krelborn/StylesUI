import { createContext } from "react";

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
}

/**
 * Carries a `Menu`'s state to its items; null outside a `Menu`
 */
export const MenuContext = createContext<MenuContextValue | null>(null);
