import type { JSX } from "react";
import { clsx } from "clsx";

import type { Space } from "../../layout";
import { listRole, spaceValue, withCustomProperties } from "../../layout";
import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Grid.module.css";

interface GridOwnProps {
  /**
   * Space between items in both directions. Defaults to `4`.
   */
  gap?: Space;

  /**
   * Narrowest an item may get before the grid drops a column, as a CSS length. Defaults to `16rem`.
   */
  minimumItemWidth?: string;
}

/**
 * Props for `Grid`: its own props plus every prop supported by the element given in `as`
 */
export type GridProps<E extends BoxElement = "div"> = GridOwnProps & Omit<BoxProps<E>, keyof GridOwnProps>;

/**
 * Responsive grid that fits as many equal columns as its width allows, without breakpoints
 *
 * @example
 * <Grid as="ul" minimumItemWidth="18rem">...</Grid>
 */
export function Grid<E extends BoxElement = "div">({
  as,
  className,
  gap = 4,
  minimumItemWidth = "16rem",
  ...rest
}: GridProps<E>): JSX.Element {
  // Widened as in Box: GridProps<E> already guarantees the props match `as`
  const { role, style, ...boxProps } = rest as BoxProps<"div">;
  const element = as ?? "div";

  return (
    <Box
      {...boxProps}
      as={element as "div"}
      className={clsx(styles.grid, className)}
      role={listRole(element, role)}
      style={withCustomProperties(
        { "--sui-grid-gap": spaceValue(gap), "--sui-grid-minimum-item-width": minimumItemWidth },
        style
      )}
    />
  );
}
