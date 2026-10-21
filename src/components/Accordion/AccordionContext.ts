import { createContext } from "react";

import type { HeadingLevel } from "../Heading";

import type { AccordionIndicator, AccordionVariant } from "./Accordion";

/**
 * State an `Accordion` shares with its items
 */
export interface AccordionContextValue {
  /**
   * The generated id every toggle and panel id starts with
   */
  baseId: string;

  /**
   * Level of every item's heading
   */
  headingLevel: HeadingLevel;

  /**
   * Shape of every item's indicator
   */
  indicator: AccordionIndicator;

  /**
   * Values of the open items
   */
  openValues: readonly string[];

  /**
   * Whether each open panel is a region named by its title
   */
  regions: boolean;

  /**
   * Opens the item with the given value if it is closed, or closes it if it is open, reporting the open items to
   * `onValueChange`
   */
  toggle: (value: string) => void;

  /**
   * Look of the accordion and its items
   */
  variant: AccordionVariant;
}

/**
 * Carries an `Accordion`'s state to its items; null outside an `Accordion`
 */
export const AccordionContext = createContext<AccordionContextValue | null>(null);
