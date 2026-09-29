import type { JSX } from "react";

import type { Alignment, Justification, Space } from "../../layout";
import type { BoxElement, BoxProps } from "../Box";
import type { HorizontalFlowProps } from "../HorizontalFlow";
import { HorizontalFlow } from "../HorizontalFlow";

interface ClusterOwnProps {
  /**
   * Cross-axis placement of children. Defaults to `center`.
   */
  align?: Alignment;

  /**
   * Space between children and between wrapped lines. Defaults to `2`.
   */
  gap?: Space;

  /**
   * Main-axis distribution of children. Defaults to `start`.
   */
  justify?: Justification;
}

/**
 * Props for `Cluster`: its own props plus every prop supported by the element given in `as`
 */
export type ClusterProps<E extends BoxElement = "div"> = ClusterOwnProps & Omit<BoxProps<E>, keyof ClusterOwnProps>;

/**
 * Horizontal flow that wraps its children onto new lines when they run out of room
 *
 * @example
 * <Cluster as="ul" aria-label="Tags">...</Cluster>
 */
export function Cluster<E extends BoxElement = "div">({
  align = "center",
  gap = 2,
  justify = "start",
  ...rest
}: ClusterProps<E>): JSX.Element {
  // Widened as in Box: ClusterProps<E> already guarantees the props match `as`
  const flowProps = rest as Omit<HorizontalFlowProps<"div">, "align" | "gap" | "justify" | "wrap">;

  return <HorizontalFlow {...flowProps} align={align} gap={gap} justify={justify} wrap={true} />;
}
