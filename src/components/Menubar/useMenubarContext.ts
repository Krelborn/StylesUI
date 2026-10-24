import { useContext } from "react";

import { MissingContextError } from "../../errors";

import type { MenubarContextValue } from "./MenubarContext";
import { MenubarContext } from "./MenubarContext";

/**
 * Reads the state of the surrounding `Menubar`
 *
 * @param part the name of the part reading it, for the error message
 * @returns the surrounding `Menubar`'s state
 * @throws MissingContextError when the part is not inside a `Menubar`
 */
export function useMenubarContext(part: string): MenubarContextValue {
  const context = useContext(MenubarContext);

  if (context === null) {
    throw new MissingContextError(part, "Menubar");
  }

  return context;
}
