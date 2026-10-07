import { useContext } from "react";

import { MissingContextError } from "../../errors";

import type { TabsContextValue } from "./TabsContext";
import { TabsContext } from "./TabsContext";

/**
 * Reads the state of the surrounding `Tabs`
 *
 * @param part the name of the part reading it, for the error message
 * @returns the surrounding `Tabs`'s state
 * @throws MissingContextError when the part is not inside a `Tabs`
 */
export function useTabsContext(part: string): TabsContextValue {
  const context = useContext(TabsContext);

  if (context === null) {
    throw new MissingContextError(part, "Tabs");
  }

  return context;
}
