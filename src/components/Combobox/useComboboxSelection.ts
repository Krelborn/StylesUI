import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";

import type { SelectedContent } from "./ComboboxContext";

interface UseComboboxSelectionOptions {
  /**
   * The value selected at first when uncontrolled
   */
  defaultValue: string | null;

  /**
   * Called with the new selection
   */
  onValueChange: ((value: string | null) => void) | undefined;

  /**
   * The selected value when controlled, or undefined when uncontrolled
   */
  value: string | null | undefined;
}

/**
 * A combobox's selection and what its selected option shows
 */
export interface ComboboxSelection {
  /**
   * Selects a value, or none, reporting it unless it is already selected
   */
  select: (value: string | null) => void;

  /**
   * What the selected option shows in the field, or null when it has not rendered
   */
  selectedContent: SelectedContent | null;

  /**
   * The selected value, or null for none
   */
  selectedValue: string | null;

  /**
   * Sets what the selected option shows, which it hands over as it renders
   */
  setSelectedContent: Dispatch<SetStateAction<SelectedContent | null>>;
}

/**
 * Holds a combobox's selection, controlled or uncontrolled, and what the selected option shows in the field
 *
 * @param options the selection props and the change callback
 * @returns the selection and the ways it changes
 */
export function useComboboxSelection({
  defaultValue,
  onValueChange,
  value,
}: UseComboboxSelectionOptions): ComboboxSelection {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [selectedContent, setSelectedContent] = useState<SelectedContent | null>(null);
  const selectedValue = value === undefined ? uncontrolledValue : value;

  function select(nextValue: string | null): void {
    if (nextValue === selectedValue) {
      return;
    }

    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  return {
    select,
    // Content an option handed over before another value was selected, which may not have rendered
    selectedContent: selectedContent?.value === selectedValue ? selectedContent : null,
    selectedValue,
    setSelectedContent,
  };
}
