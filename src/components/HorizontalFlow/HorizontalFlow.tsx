import type { JSX } from "react";
import { clsx } from "clsx";

import type { Alignment, Justification, Space } from "../../layout";
import { listRole, spaceValue, withCustomProperties } from "../../layout";
import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./HorizontalFlow.module.css";

interface HorizontalFlowOwnProps {
  /**
   * Cross-axis placement of children
   */
  align: Alignment;

  /**
   * Space between children and between wrapped lines
   */
  gap: Space;

  /**
   * Main-axis distribution of children
   */
  justify: Justification;

  /**
   * Whether children wrap onto new lines when they run out of room
   */
  wrap: boolean;
}

/**
 * Props for `HorizontalFlow`: its own props plus every prop supported by the element given in `as`
 */
export type HorizontalFlowProps<E extends BoxElement = "div"> = HorizontalFlowOwnProps &
  Omit<BoxProps<E>, keyof HorizontalFlowOwnProps>;

/**
 * Horizontal flex flow shared by `Row` and `Cluster`
 */
export function HorizontalFlow<E extends BoxElement = "div">({
  align,
  as,
  className,
  gap,
  justify,
  wrap,
  ...rest
}: HorizontalFlowProps<E>): JSX.Element {
  // Widened as in Box: HorizontalFlowProps<E> already guarantees the props match `as`
  const { role, style, ...boxProps } = rest as BoxProps<"div">;
  const element = as ?? "div";

  return (
    <Box
      {...boxProps}
      as={element as "div"}
      className={clsx(styles.horizontalFlow, className)}
      role={listRole(element, role)}
      style={withCustomProperties({ "--sui-horizontal-flow-gap": spaceValue(gap) }, style)}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap ? "" : undefined}
    />
  );
}
