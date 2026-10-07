import { clsx } from "clsx";
import type { JSX } from "react";

import type { BadgeTone } from "../Badge";
import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./StatusDot.module.css";

/**
 * Dot sizes: `sm` is 0.375rem across and `md` is 0.5rem
 */
export type StatusDotSize = "md" | "sm";

/**
 * Dot styles: a filled circle, or a ring that gives a second cue beside the colour
 */
export type StatusDotVariant = "ring" | "solid";

/**
 * Props for `StatusDot`: its own props plus every `span` prop except `children` and `role`
 */
export interface StatusDotProps extends Omit<BoxProps<"span">, "as" | "children" | "dangerouslySetInnerHTML" | "role"> {
  /**
   * What the dot means, read by screen readers. Without it the dot is hidden from them, so give it a label, or put
   * text beside it, whenever it carries meaning.
   */
  label?: string;

  /**
   * Dot size. Defaults to `md`.
   */
  size?: StatusDotSize;

  /**
   * Colour. Each tone keeps 3:1 against the page and a surface. Defaults to `neutral`.
   */
  tone?: BadgeTone;

  /**
   * Filled or ring. Defaults to `solid`.
   */
  variant?: StatusDotVariant;
}

/**
 * A small coloured dot for a status, such as the result of a check. Colour alone must not tell two states apart, so
 * pair states with different variants or with text.
 *
 * @example
 * <StatusDot label="Checks running" tone="warning" variant="ring" />
 */
export function StatusDot({
  className,
  label,
  size = "md",
  tone = "neutral",
  variant = "solid",
  ...rest
}: StatusDotProps): JSX.Element {
  const decorative = label === undefined;

  return (
    <Box
      {...rest}
      as="span"
      className={clsx(styles.statusDot, className)}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={label}
      data-size={size}
      data-tone={tone}
      data-variant={variant}
    />
  );
}
