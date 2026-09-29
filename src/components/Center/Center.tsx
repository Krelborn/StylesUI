import type { JSX } from "react";
import { clsx } from "clsx";

import type { Space } from "../../layout";
import { spaceValue, withCustomProperties } from "../../layout";
import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Center.module.css";

/**
 * Maximum column width, mapped to the `--sui-width-*` tokens
 */
export type CenterWidth = "prose" | "content" | "wide";

interface CenterOwnProps {
  /**
   * Inline padding that keeps content off the viewport edges. Defaults to `4`.
   */
  gutter?: Space;

  /**
   * Also centres children narrower than the column. Defaults to `false`.
   */
  intrinsic?: boolean;

  /**
   * Maximum width of the column. Defaults to `content`.
   */
  width?: CenterWidth;
}

/**
 * Props for `Center`: its own props plus every prop supported by the element given in `as`
 */
export type CenterProps<E extends BoxElement = "div"> = CenterOwnProps & Omit<BoxProps<E>, keyof CenterOwnProps>;

/**
 * Horizontally centred column with a maximum width and side gutters. Override a
 * `--sui-width-*` token to change a width.
 *
 * @example
 * <Center as="main" width="prose">...</Center>
 */
export function Center<E extends BoxElement = "div">({
  as,
  className,
  gutter = 4,
  intrinsic = false,
  width = "content",
  ...rest
}: CenterProps<E>): JSX.Element {
  // Widened as in Box: CenterProps<E> already guarantees the props match `as`
  const { style, ...boxProps } = rest as BoxProps<"div">;

  return (
    <Box
      {...boxProps}
      as={as as "div"}
      className={clsx(styles.center, className)}
      style={withCustomProperties({ "--sui-center-gutter": spaceValue(gutter) }, style)}
      data-intrinsic={intrinsic ? "" : undefined}
      data-width={width}
    />
  );
}
