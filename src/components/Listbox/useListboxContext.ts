import { useContext } from "react";

import { MissingContextError } from "../../errors";

import type { ListboxContextValue } from "./ListboxContext";
import { ListboxContext } from "./ListboxContext";

/**
 * Reads the state of the surrounding `Listbox`
 *
 * @param part the name of the part reading it, for the error message
 * @returns the surrounding `Listbox`'s state
 * @throws MissingContextError when the part is not inside a `Listbox`
 */
export function useListboxContext(part: string): ListboxContextValue {
  const context = useContext(ListboxContext);

  if (context === null) {
    throw new MissingContextError(part, "Listbox");
  }

  return context;
}
