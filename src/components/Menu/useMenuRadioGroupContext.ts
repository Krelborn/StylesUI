import { useContext } from "react";

import { MissingContextError } from "../../errors";

import type { MenuRadioGroupContextValue } from "./MenuRadioGroupContext";
import { MenuRadioGroupContext } from "./MenuRadioGroupContext";

/**
 * Reads the state of the surrounding `MenuRadioGroup`
 *
 * @param part the name of the part reading it, for the error message
 * @returns the surrounding `MenuRadioGroup`'s state
 * @throws MissingContextError when the part is not inside a `MenuRadioGroup`
 */
export function useMenuRadioGroupContext(part: string): MenuRadioGroupContextValue {
  const context = useContext(MenuRadioGroupContext);

  if (context === null) {
    throw new MissingContextError(part, "MenuRadioGroup");
  }

  return context;
}
