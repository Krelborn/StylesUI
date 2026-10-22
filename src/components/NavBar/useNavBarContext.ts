import { useContext } from "react";

import { MissingContextError } from "../../errors";

import type { NavBarContextValue } from "./NavBarContext";
import { NavBarContext } from "./NavBarContext";

/**
 * Reads the state of the surrounding `NavBar`
 *
 * @param part the name of the part reading it, for the error message
 * @returns the surrounding `NavBar`'s state
 * @throws MissingContextError when the part is not inside a `NavBar`
 */
export function useNavBarContext(part: string): NavBarContextValue {
  const context = useContext(NavBarContext);

  if (context === null) {
    throw new MissingContextError(part, "NavBar");
  }

  return context;
}
