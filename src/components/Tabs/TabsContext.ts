import { createContext } from "react";

import type { ControlSize } from "../../forms";

import type { TabsActivation, TabsOrientation, TabsVariant } from "./Tabs";

/**
 * State a `Tabs` shares with its tab list, tabs and panels
 */
export interface TabsContextValue {
  /**
   * Whether a tab is selected as it takes focus, or only when it is pressed
   */
  activation: TabsActivation;

  /**
   * The generated id every tab and panel id starts with
   */
  baseId: string;

  /**
   * Direction the tabs run in, which decides the arrow keys
   */
  orientation: TabsOrientation;

  /**
   * Selects the tab with the given value, reporting it to `onValueChange` when it changes
   */
  select: (value: string) => void;

  /**
   * The selected tab's value
   */
  selectedValue: string | undefined;

  /**
   * Size of every tab
   */
  size: ControlSize;

  /**
   * Look of the tab list and its tabs
   */
  variant: TabsVariant;
}

/**
 * Carries a `Tabs`'s state to its parts; null outside a `Tabs`
 */
export const TabsContext = createContext<TabsContextValue | null>(null);
