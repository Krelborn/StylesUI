import { useContext } from "react";

import { MissingContextError } from "../../errors";

import type { MenuContextValue } from "./MenuContext";
import { MenuContext } from "./MenuContext";

/**
 * Reads the state of the surrounding `Menu`
 *
 * @param part the name of the part reading it, for the error message
 * @returns the surrounding `Menu`'s state
 * @throws MissingContextError when the part is not inside a `Menu`
 */
export function useMenuContext(part: string): MenuContextValue {
  const context = useContext(MenuContext);

  if (context === null) {
    throw new MissingContextError(part, "Menu");
  }

  return context;
}
