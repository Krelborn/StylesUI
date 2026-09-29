import type { JSX } from "react";

import type { Alignment, Justification, Space } from "../../layout";
import type { BoxElement, BoxProps } from "../Box";
import type { HorizontalFlowProps } from "../HorizontalFlow";
import { HorizontalFlow } from "../HorizontalFlow";

interface RowOwnProps {
  /**
   * Cross-axis placement of children. Defaults to `center`.
   */
  align?: Alignment;

  /**
   * Space between children. Defaults to `2`.
   */
  gap?: Space;

  /**
   * Main-axis distribution of children. Defaults to `start`.
   */
  justify?: Justification;
}

/**
 * Props for `Row`: its own props plus every prop supported by the element given in `as`
 */
export type RowProps<E extends BoxElement = "div"> = RowOwnProps & Omit<BoxProps<E>, keyof RowOwnProps>;

/**
 * Horizontal flow that keeps its children on one line. Use `Cluster` when they should wrap.
 *
 * @example
 * <Row as="header" justify="between">...</Row>
 */
export function Row<E extends BoxElement = "div">({
  align = "center",
  gap = 2,
  justify = "start",
  ...rest
}: RowProps<E>): JSX.Element {
  // Widened as in Box: RowProps<E> already guarantees the props match `as`
  const flowProps = rest as Omit<HorizontalFlowProps<"div">, "align" | "gap" | "justify" | "wrap">;

  return <HorizontalFlow {...flowProps} align={align} gap={gap} justify={justify} wrap={false} />;
}
