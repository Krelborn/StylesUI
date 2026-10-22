import { createContext } from "react";

/**
 * State a `MenuRadioGroup` shares with its radio items
 */
export interface MenuRadioGroupContextValue {
  /**
   * Checks the item with the given value, reporting it to `onValueChange` when it differs from the checked one
   */
  select: (value: string) => void;

  /**
   * The checked item's value, if any
   */
  value: string | undefined;
}

/**
 * Carries a `MenuRadioGroup`'s state to its radio items; null outside a `MenuRadioGroup`
 */
export const MenuRadioGroupContext = createContext<MenuRadioGroupContextValue | null>(null);
