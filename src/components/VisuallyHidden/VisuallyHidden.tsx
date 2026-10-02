import { clsx } from "clsx";
import type { JSX } from "react";

import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./VisuallyHidden.module.css";

/**
 * Props for `VisuallyHidden`: every prop supported by the element given in `as`
 */
export type VisuallyHiddenProps<E extends BoxElement = "span"> = BoxProps<E>;

/**
 * Hides its content from view while keeping it in the accessibility tree, for text that only
 * assistive technology needs, such as the name of an icon-only button
 *
 * @example
 * <Button><span aria-hidden={true}>×</span><VisuallyHidden>Close</VisuallyHidden></Button>
 */
export function VisuallyHidden<E extends BoxElement = "span">({
  as,
  className,
  ...rest
}: VisuallyHiddenProps<E>): JSX.Element {
  // Widened as in Box: VisuallyHiddenProps<E> already guarantees the props match `as`
  const boxProps = rest as BoxProps<"span">;

  return <Box {...boxProps} as={(as ?? "span") as "span"} className={clsx(styles.visuallyHidden, className)} />;
}
