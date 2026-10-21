import { createContext } from "react";

/**
 * State a `Menu` shares with its items
 */
export interface MenuContextValue {
  /**
   * Closes every open menu
   */
  close: () => void;
}

/**
 * Carries a `Menu`'s state to its items; null outside a `Menu`
 */
export const MenuContext = createContext<MenuContextValue | null>(null);
