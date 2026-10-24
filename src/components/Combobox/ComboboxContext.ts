import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createContext } from "react";

/**
 * What made an option active: a key, which shows the focus ring, or the pointer, which shows only the tint
 */
export type ActiveSource = "keyboard" | "pointer";

/**
 * The option the keys act on, which `aria-activedescendant` names
 */
export interface ActiveOption {
  /**
   * What made it active
   */
  source: ActiveSource;

  /**
   * Its value
   */
  value: string;
}

/**
 * What the selected option shows in the field
 */
export interface SelectedContent {
  /**
   * The option's label
   */
  label: ReactNode;

  /**
   * The option's leading content, such as an avatar
   */
  leading: ReactNode;

  /**
   * The option's text, which an `Autocomplete`'s input shows
   */
  text: string;

  /**
   * The option's value
   */
  value: string;
}

/**
 * Tests whether an option shows for the typed text
 */
export type ComboboxFilter = (textValue: string, inputValue: string) => boolean;

/**
 * State a combobox shares with its options
 */
export interface ComboboxContextValue {
  /**
   * The option the keys act on, or null for none
   */
  active: ActiveOption | null;

  /**
   * Makes an option active under the pointer
   */
  activateFromPointer: (value: string) => void;

  /**
   * The generated id every option id starts with
   */
  baseId: string;

  /**
   * Commits an option's value and closes the list
   */
  commit: (value: string) => void;

  /**
   * Whether an option shows for the typed text, or null to show every option
   */
  filter: ComboboxFilter | null;

  /**
   * The text the options are filtered by; empty shows every option
   */
  query: string;

  /**
   * The selected option's value, or null for none
   */
  selectedValue: string | null;

  /**
   * Sets the option the keys act on
   */
  setActive: Dispatch<SetStateAction<ActiveOption | null>>;

  /**
   * Sets what the selected option shows in the field
   */
  setSelectedContent: Dispatch<SetStateAction<SelectedContent | null>>;
}

/**
 * Carries a `Combobox`'s or `Autocomplete`'s state to its options; null outside one
 */
export const ComboboxContext = createContext<ComboboxContextValue | null>(null);
