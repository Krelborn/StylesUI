import { clsx } from "clsx";
import type { JSX, ReactNode } from "react";
import { useId, useState } from "react";

import type { ControlSize } from "../../forms";
import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Tabs.module.css";
import { TabsContext } from "./TabsContext";

/**
 * When a tab is selected: `automatic` as it takes focus, `manual` only when a click, Enter or Space activates it
 */
export type TabsActivation = "automatic" | "manual";

/**
 * Direction the tabs run in: `horizontal` in a row above the panels, `vertical` in a column beside them
 */
export type TabsOrientation = "horizontal" | "vertical";

/**
 * Tab looks: an `underline` under the selected tab, or a `pill` filled with the primary colour
 */
export type TabsVariant = "pill" | "underline";

interface TabsOwnProps {
  /**
   * When a tab is selected. Defaults to `automatic`.
   */
  activation?: TabsActivation;

  /**
   * One `TabList` and a `TabPanel` for each `Tab`
   */
  children?: ReactNode;

  /**
   * Called with the value of the tab the user selects, when it differs from the selected one
   */
  onValueChange?: (value: string) => void;

  /**
   * Direction the tabs run in. Defaults to `horizontal`.
   */
  orientation?: TabsOrientation;

  /**
   * Tab size, matching the `Button` sizes. Defaults to `md`.
   */
  size?: ControlSize;

  /**
   * Look of the tabs. Defaults to `underline`.
   */
  variant?: TabsVariant;
}

type TabsSelection =
  | {
      /**
       * The tab selected at first. It leaves `Tabs` uncontrolled.
       */
      defaultValue: string;

      /**
       * Not accepted with `defaultValue`
       */
      value?: never;
    }
  | {
      /**
       * Not accepted with `value`
       */
      defaultValue?: never;

      /**
       * The selected tab, which makes `Tabs` controlled: update it from `onValueChange`
       */
      value: string;
    };

/**
 * Props for `Tabs`: its own props, `value` or `defaultValue`, and every other `div` prop
 */
export type TabsProps = TabsOwnProps &
  TabsSelection &
  Omit<BoxProps<"div">, "as" | "defaultValue" | keyof TabsOwnProps>;

/**
 * Tabs that switch between panels of content, following the WAI-ARIA tabs pattern. Give it a `TabList` of `Tab`s and
 * a `TabPanel` for each, matched by `value`. One tab is always selected: pass `defaultValue`, or `value` with
 * `onValueChange`, matching a `Tab`.
 *
 * @example
 * <Tabs defaultValue="code" onValueChange={setTab}>
 *   <TabList aria-label="Repository">
 *     <Tab value="code">Code</Tab>
 *     <Tab value="issues">Issues</Tab>
 *   </TabList>
 *   <TabPanel value="code">…</TabPanel>
 *   <TabPanel value="issues">…</TabPanel>
 * </Tabs>
 */
export function Tabs({
  activation = "automatic",
  className,
  defaultValue,
  onValueChange,
  orientation = "horizontal",
  size = "md",
  value,
  variant = "underline",
  ...rest
}: TabsProps): JSX.Element {
  const baseId = useId();
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const selectedValue = value ?? uncontrolledValue;

  function select(nextValue: string): void {
    if (nextValue === selectedValue) {
      return;
    }

    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  return (
    <TabsContext.Provider value={{ activation, baseId, orientation, select, selectedValue, size, variant }}>
      <Box {...rest} className={clsx(styles.tabs, className)} data-orientation={orientation} />
    </TabsContext.Provider>
  );
}
