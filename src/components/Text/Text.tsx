import type { JSX } from "react";
import { clsx } from "clsx";

import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Text.module.css";

/**
 * Body text sizes, mapped to the `--sui-font-size-*` tokens
 */
export type TextSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Text colour; `default` inherits the surrounding text colour
 */
export type TextTone = "default" | "muted";

/**
 * Font weights, mapped to the `--sui-font-weight-*` tokens
 */
export type TextWeight = "bold" | "medium" | "regular";

interface TextOwnProps {
  /**
   * Font size. Defaults to `md`.
   */
  size?: TextSize;

  /**
   * Text colour. Defaults to `default`.
   */
  tone?: TextTone;

  /**
   * Font weight. Defaults to `regular`.
   */
  weight?: TextWeight;
}

/**
 * Props for `Text`: its own props plus every prop supported by the element given in `as`
 */
// Spelled out rather than PolymorphicProps<E, TextOwnProps>, whose own props react-docgen cannot read for the docs
export type TextProps<E extends BoxElement = "span"> = TextOwnProps & Omit<BoxProps<E>, keyof TextOwnProps>;

/**
 * Body text in the theme's body font
 *
 * @example
 * <Text as="p" size="sm" tone="muted">Last updated today</Text>
 */
export function Text<E extends BoxElement = "span">({
  as,
  className,
  size = "md",
  tone = "default",
  weight = "regular",
  ...rest
}: TextProps<E>): JSX.Element {
  // Widened as in Box: TextProps<E> already guarantees the props match `as`
  const boxProps = rest as BoxProps<"span">;

  return (
    <Box
      {...boxProps}
      as={(as ?? "span") as "span"}
      className={clsx(styles.text, className)}
      data-size={size}
      data-tone={tone}
      data-weight={weight}
    />
  );
}
