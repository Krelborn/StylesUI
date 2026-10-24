import { useContext } from "react";

import { MissingContextError } from "../../errors";

import type { ComboboxContextValue } from "./ComboboxContext";
import { ComboboxContext } from "./ComboboxContext";

/**
 * Reads the state of the surrounding `Combobox` or `Autocomplete`
 *
 * @param part the name of the part reading it, for the error message
 * @returns the surrounding combobox's state
 * @throws MissingContextError when the part is not inside a `Combobox` or `Autocomplete`
 */
export function useComboboxContext(part: string): ComboboxContextValue {
  const context = useContext(ComboboxContext);

  if (context === null) {
    throw new MissingContextError(part, "Combobox or Autocomplete");
  }

  return context;
}
