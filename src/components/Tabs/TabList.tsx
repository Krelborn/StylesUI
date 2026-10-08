import { clsx } from "clsx";
import type { JSX } from "react";

import type { RequiredAccessibleName } from "../../accessibility";
import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Tabs.module.css";
import { useTabsContext } from "./useTabsContext";

/**
 * Props for `TabList`: a required `aria-label` or `aria-labelledby` and every other `div` prop except `role`
 */
export type TabListProps = RequiredAccessibleName &
  Omit<BoxProps<"div">, "aria-label" | "aria-labelledby" | "aria-orientation" | "as" | "role">;

/**
 * The row or column of `Tab`s inside `Tabs`. Name it with `aria-label` or `aria-labelledby`.
 *
 * @example
 * <TabList aria-label="Repository">
 *   <Tab value="code">Code</Tab>
 * </TabList>
 */
export function TabList({ className, ...rest }: TabListProps): JSX.Element {
  const tabs = useTabsContext("TabList");

  return (
    <Box
      {...rest}
      className={clsx(styles.tabList, className)}
      role="tablist"
      aria-orientation={tabs.orientation === "vertical" ? "vertical" : undefined}
      data-variant={tabs.variant}
    />
  );
}
