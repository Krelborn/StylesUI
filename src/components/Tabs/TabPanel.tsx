import { clsx } from "clsx";
import type { JSX } from "react";

import type { BoxProps } from "../Box";
import { Box } from "../Box";

import { panelId, tabId } from "./tabIds";
import styles from "./Tabs.module.css";
import { useTabsContext } from "./useTabsContext";

/**
 * Props for `TabPanel`: its own props plus every `div` prop except those the tab pattern sets
 */
export interface TabPanelProps extends Omit<BoxProps<"div">, "aria-labelledby" | "as" | "hidden" | "id" | "role"> {
  /**
   * Whether the panel is in the tab order. Keep the default, 0, when the panel starts with text, and pass -1 when its
   * first content is a control that takes focus itself.
   */
  tabIndex?: number;

  /**
   * The value of the `Tab` that shows this panel
   */
  value: string;
}

/**
 * The content shown while its `Tab` is selected. It is named by its tab, and renders its children only while
 * selected, so a panel's content mounts when its tab is selected.
 *
 * @example
 * <TabPanel value="issues">…</TabPanel>
 */
export function TabPanel({ children, className, tabIndex = 0, value, ...rest }: TabPanelProps): JSX.Element {
  const tabs = useTabsContext("TabPanel");
  const selected = tabs.selectedValue === value;

  return (
    <Box
      {...rest}
      className={clsx(styles.tabPanel, className)}
      hidden={!selected}
      id={panelId(tabs.baseId, value)}
      role="tabpanel"
      tabIndex={tabIndex}
      aria-labelledby={tabId(tabs.baseId, value)}
    >
      {selected ? children : null}
    </Box>
  );
}
