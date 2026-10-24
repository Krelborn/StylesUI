import type { Dispatch, SetStateAction } from "react";
import { createContext } from "react";

/**
 * State a `Menubar` shares with its `MenubarMenu`s
 */
export interface MenubarContextValue {
  /**
   * Moves focus to a bar item
   *
   * @param item the bar item
   * @param opensMenu whether the item opens its menu as it takes focus, with focus left on it
   */
  moveFocus: (item: HTMLElement, opensMenu: boolean) => void;

  /**
   * Whether the bar item taking focus now opens its menu
   */
  opensMenuOnFocus: () => boolean;

  /**
   * Gives the tab stop to a bar item, by its id
   */
  setTabStop: Dispatch<SetStateAction<string | null>>;

  /**
   * The id of the bar item that is the bar's tab stop, or null before one is
   */
  tabStopId: string | null;
}

/**
 * Carries a `Menubar`'s state to its menus; null outside a `Menubar`
 */
export const MenubarContext = createContext<MenubarContextValue | null>(null);
