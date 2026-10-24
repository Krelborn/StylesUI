import { createContext } from "react";

/**
 * State a `Field` shares with the control it holds
 */
export interface FieldContextValue {
  /**
   * The `id` the control must render, so the label points at it
   */
  controlId: string;

  /**
   * Space-separated ids of the description and error, or undefined when the field renders neither
   */
  describedBy: string | undefined;

  /**
   * Whether the field disables its control
   */
  disabled: boolean;

  /**
   * Whether the field shows an error for its control
   */
  invalid: boolean;

  /**
   * The label's `id`, for a part of the control that the label names but cannot point at, such as a combobox's list;
   * undefined when the field has no label
   */
  labelId: string | undefined;

  /**
   * Whether the control must be filled in
   */
  required: boolean;
}

/**
 * Carries a `Field`'s state to its control; null when the control is not inside a `Field`
 */
export const FieldContext = createContext<FieldContextValue | null>(null);
