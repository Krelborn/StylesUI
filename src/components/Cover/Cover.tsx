import type { JSX, ReactNode } from "react";
import { clsx } from "clsx";

import type { Space } from "../../layout";
import { spaceValue, withCustomProperties } from "../../layout";
import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Cover.module.css";

interface CoverOwnProps {
  /**
   * Content pinned to the bottom of the cover
   */
  bottom?: ReactNode;

  /**
   * Minimum space between the top, centred and bottom content. Defaults to `4`.
   */
  gap?: Space;

  /**
   * Minimum height of the cover, as a CSS length. Defaults to `100dvh`.
   */
  minimumHeight?: string;

  /**
   * Space inside the cover's edges. Defaults to `4`.
   */
  padding?: Space;

  /**
   * Content pinned to the top of the cover
   */
  top?: ReactNode;
}

/**
 * Props for `Cover`: its own props plus every prop supported by the element given in `as`
 */
export type CoverProps<E extends BoxElement = "div"> = CoverOwnProps & Omit<BoxProps<E>, keyof CoverOwnProps>;

/**
 * Minimum-height area that vertically centres its children, with optional content pinned above
 * and below. The children render inside a `div`.
 *
 * @example
 * <Cover as="section" minimumHeight="60vh" top={<Text>Featured</Text>} aria-label="Welcome">
 *   <Heading level={1}>Notes on layout</Heading>
 * </Cover>
 */
export function Cover<E extends BoxElement = "div">({
  as,
  bottom,
  className,
  gap = 4,
  minimumHeight = "100dvh",
  padding = 4,
  top,
  ...rest
}: CoverProps<E>): JSX.Element {
  // Widened as in Box: CoverProps<E> already guarantees the props match `as`
  const { children, style, ...boxProps } = rest as BoxProps<"div">;

  return (
    <Box
      {...boxProps}
      as={as as "div"}
      className={clsx(styles.cover, className)}
      style={withCustomProperties(
        {
          "--sui-cover-gap": spaceValue(gap),
          "--sui-cover-minimum-height": minimumHeight,
          "--sui-cover-padding": spaceValue(padding),
        },
        style
      )}
    >
      {top}
      <div className={styles.principal}>{children}</div>
      {bottom}
    </Box>
  );
}
