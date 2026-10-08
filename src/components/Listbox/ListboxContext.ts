import type { Dispatch, SetStateAction } from "react";
import { createContext } from "react";

/**
 * State a `Listbox` shares with its options
 */
export interface ListboxContextValue {
  /**
   * Acts on an option, as Enter does
   */
  act: (value: string) => void;

  /**
   * The value of the option keyboard focus is on, or null for none
   */
  activeValue: string | null;

  /**
   * The generated id every option id starts with
   */
  baseId: string;

  /**
   * Handles a click on an option: focuses the listbox, makes the option active and selects it unless it is disabled
   */
  choose: (option: HTMLElement, value: string, disabled: boolean) => void;

  /**
   * Makes the option with this value active while the listbox has focus, as a newly selected option does
   */
  claim: (value: string) => void;

  /**
   * The selected option's value, or null for none
   */
  selectedValue: string | null;

  /**
   * Sets the value of the option keyboard focus is on, or null for none
   */
  setActiveValue: Dispatch<SetStateAction<string | null>>;
}

/**
 * Carries a `Listbox`'s state to its options; null outside a `Listbox`
 */
export const ListboxContext = createContext<ListboxContextValue | null>(null);
