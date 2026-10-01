import type { JSX } from "react";
import { clsx } from "clsx";

import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Divider.module.css";

/**
 * Direction a divider runs: `horizontal` between stacked content, `vertical` between items in a row
 */
export type DividerOrientation = "horizontal" | "vertical";

/**
 * Props for `Divider`: its own props plus every native hr prop
 */
export interface DividerProps extends Omit<BoxProps<"hr">, "as" | "children" | "dangerouslySetInnerHTML"> {
  /**
   * Direction the divider runs. A vertical divider needs a flex row to stretch. Defaults to `horizontal`.
   */
  orientation?: DividerOrientation;
}

/**
 * Thin rule that separates content, exposed to assistive technology as a separator
 *
 * @example
 * <Divider />
 */
export function Divider({ className, orientation = "horizontal", ...rest }: DividerProps): JSX.Element {
  return (
    <Box
      {...rest}
      as="hr"
      className={clsx(styles.divider, className)}
      aria-orientation={orientation === "vertical" ? "vertical" : undefined}
      data-orientation={orientation}
    />
  );
}
