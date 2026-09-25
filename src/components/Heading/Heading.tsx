import type { JSX } from "react";
import { clsx } from "clsx";

import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Heading.module.css";

/**
 * Heading level, rendered as the matching `h1`–`h6` element
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Heading sizes, mapped to the `--sui-font-size-*` tokens
 */
export type HeadingSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

/**
 * Props for `Heading`: its own props plus every heading element prop
 */
export interface HeadingProps extends Omit<BoxProps<"h1">, "as"> {
  /**
   * Heading level; decides the rendered element
   */
  level: HeadingLevel;

  /**
   * Font size. Defaults to a size matching the level (1 is `3xl`, 6 is `sm`).
   */
  size?: HeadingSize;
}

const defaultSizes = {
  1: "3xl",
  2: "2xl",
  3: "xl",
  4: "lg",
  5: "md",
  6: "sm",
} as const satisfies Record<HeadingLevel, HeadingSize>;

/**
 * Section heading in the theme's heading font
 *
 * @example
 * <Heading level={2}>Settings</Heading>
 */
export function Heading({ className, level, size, ...rest }: HeadingProps): JSX.Element {
  return (
    <Box
      {...rest}
      as={`h${level}` as const}
      className={clsx(styles.heading, className)}
      data-size={size ?? defaultSizes[level]}
    />
  );
}
