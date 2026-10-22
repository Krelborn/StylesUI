import { createContext } from "react";

/**
 * State a `NavBar` shares with its entries
 */
export interface NavBarContextValue {
  /**
   * Closes every section, and the navigation when it is collapsed
   */
  closeAll: () => void;

  /**
   * Closes the section with the given id
   */
  closeSection: (id: string) => void;

  /**
   * Ids of the open sections
   */
  openSections: readonly string[];

  /**
   * Opens or closes the section with the given id. On a wide bar, opening it closes any other.
   */
  toggleSection: (id: string, button: Element) => void;
}

/**
 * Carries a `NavBar`'s state to its entries; null outside a `NavBar`
 */
export const NavBarContext = createContext<NavBarContextValue | null>(null);
