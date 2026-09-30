import { createContext } from "react";

/**
 * State a `RadioGroup` shares with the radios it holds
 */
interface RadioGroupContextValue {
  /**
   * The value selected at first when the group is uncontrolled, or undefined when the group sets none
   */
  defaultValue: string | undefined;

  /**
   * Whether the group shows an error, which each radio draws on its own box
   */
  invalid: boolean;

  /**
   * The `name` every radio renders, so the browser lets only one of them be selected
   */
  name: string;

  /**
   * Called with the value of the radio the user selects, after that radio's own `onChange`
   */
  onValueChange: ((value: string) => void) | undefined;

  /**
   * Whether one radio must be selected, which each radio renders as the native `required`
   */
  required: boolean;

  /**
   * The value selected when the group is controlled, or undefined when the group is uncontrolled
   */
  value: string | undefined;
}

/**
 * Carries a `RadioGroup`'s state to its radios; null when a radio is not inside a `RadioGroup`
 */
export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);
