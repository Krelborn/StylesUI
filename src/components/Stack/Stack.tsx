import type { JSX } from "react";
import { clsx } from "clsx";

import type { Alignment, Space } from "../../layout";
import { listRole, spaceValue, withCustomProperties } from "../../layout";
import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Stack.module.css";

interface StackOwnProps {
  /**
   * Cross-axis placement of children. Defaults to `stretch`.
   */
  align?: Alignment;

  /**
   * Space between children. Defaults to `4`.
   */
  gap?: Space;
}

/**
 * Props for `Stack`: its own props plus every prop supported by the element given in `as`
 */
export type StackProps<E extends BoxElement = "div"> = StackOwnProps & Omit<BoxProps<E>, keyof StackOwnProps>;

/**
 * Vertical flow with a consistent gap between children
 *
 * @example
 * <Stack as="article" gap={6}>...</Stack>
 */
export function Stack<E extends BoxElement = "div">({
  align = "stretch",
  as,
  className,
  gap = 4,
  ...rest
}: StackProps<E>): JSX.Element {
  // Widened as in Box: StackProps<E> already guarantees the props match `as`
  const { role, style, ...boxProps } = rest as BoxProps<"div">;
  const element = as ?? "div";

  return (
    <Box
      {...boxProps}
      as={element as "div"}
      className={clsx(styles.stack, className)}
      role={listRole(element, role)}
      style={withCustomProperties({ "--sui-stack-gap": spaceValue(gap) }, style)}
      data-align={align}
    />
  );
}
