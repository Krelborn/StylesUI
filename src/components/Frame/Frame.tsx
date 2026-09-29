import type { JSX } from "react";
import { clsx } from "clsx";

import { withCustomProperties } from "../../layout";
import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Frame.module.css";

interface FrameOwnProps {
  /**
   * Width-to-height ratio, for example `"4 / 3"`. Defaults to `"16 / 9"`.
   */
  ratio?: `${number} / ${number}`;
}

/**
 * Props for `Frame`: its own props plus every prop supported by the element given in `as`
 */
export type FrameProps<E extends BoxElement = "div"> = FrameOwnProps & Omit<BoxProps<E>, keyof FrameOwnProps>;

/**
 * Fixed aspect-ratio box that crops a single `img`, `video` or `iframe` child to fill it. For a
 * captioned image, put the frame inside a `figure` beside the `figcaption`.
 *
 * @example
 * <Frame ratio="4 / 3">
 *   <img alt="Mountain lake at dawn" src="lake.jpg" />
 * </Frame>
 */
export function Frame<E extends BoxElement = "div">({
  as,
  className,
  ratio = "16 / 9",
  ...rest
}: FrameProps<E>): JSX.Element {
  // Widened as in Box: FrameProps<E> already guarantees the props match `as`
  const { style, ...boxProps } = rest as BoxProps<"div">;

  return (
    <Box
      {...boxProps}
      as={as as "div"}
      className={clsx(styles.frame, className)}
      style={withCustomProperties({ "--sui-frame-ratio": ratio }, style)}
    />
  );
}
