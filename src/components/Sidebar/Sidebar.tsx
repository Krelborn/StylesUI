import type { JSX } from "react";
import { clsx } from "clsx";

import type { Space } from "../../layout";
import { spaceValue, withCustomProperties } from "../../layout";
import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Sidebar.module.css";

interface SidebarOwnProps {
  /**
   * Cross-axis placement of the panes; `start` lets a sticky sidebar work. Defaults to `stretch`.
   */
  align?: "start" | "stretch";

  /**
   * Minimum width of the main pane before the panes stack, as a CSS length. Defaults to `50%`.
   */
  contentMinimumWidth?: string;

  /**
   * Space between the panes. Defaults to `4`.
   */
  gap?: Space;

  /**
   * Which child is the sidebar: the first (`start`) or last (`end`). Defaults to `end`.
   */
  side?: "start" | "end";

  /**
   * Ideal width of the sidebar, as a CSS length. Defaults to the sidebar's content width.
   */
  sideWidth?: string;
}

/**
 * Props for `Sidebar`: its own props plus every prop supported by the element given in `as`
 */
export type SidebarProps<E extends BoxElement = "div"> = SidebarOwnProps & Omit<BoxProps<E>, keyof SidebarOwnProps>;

/**
 * Main pane and side pane that sit side by side when there is room and stack when there is not.
 * Expects exactly two children.
 *
 * @example
 * <Sidebar sideWidth="18rem">
 *   <article>...</article>
 *   <aside>...</aside>
 * </Sidebar>
 */
export function Sidebar<E extends BoxElement = "div">({
  align = "stretch",
  as,
  className,
  contentMinimumWidth = "50%",
  gap = 4,
  side = "end",
  sideWidth,
  ...rest
}: SidebarProps<E>): JSX.Element {
  // Widened as in Box: SidebarProps<E> already guarantees the props match `as`
  const { style, ...boxProps } = rest as BoxProps<"div">;

  return (
    <Box
      {...boxProps}
      as={as as "div"}
      className={clsx(styles.sidebar, className)}
      style={withCustomProperties(
        {
          "--sui-sidebar-content-minimum-width": contentMinimumWidth,
          "--sui-sidebar-gap": spaceValue(gap),
          "--sui-sidebar-side-width": sideWidth,
        },
        style
      )}
      data-align={align}
      data-side={side}
    />
  );
}
