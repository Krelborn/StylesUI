import { useContext } from "react";

import { MissingContextError } from "../../errors";

import type { AccordionContextValue } from "./AccordionContext";
import { AccordionContext } from "./AccordionContext";

/**
 * Reads the state of the surrounding `Accordion`
 *
 * @param part the name of the part reading it, for the error message
 * @returns the surrounding `Accordion`'s state
 * @throws MissingContextError when the part is not inside an `Accordion`
 */
export function useAccordionContext(part: string): AccordionContextValue {
  const context = useContext(AccordionContext);

  if (context === null) {
    throw new MissingContextError(part, "Accordion");
  }

  return context;
}
