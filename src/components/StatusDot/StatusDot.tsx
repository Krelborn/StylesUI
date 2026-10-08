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
 * Props for `StatusDot`: its own props plus every `span` prop except `children`, `role` and the ARIA props that name or
 * hide it, which `label` decides
 */
export interface StatusDotProps extends Omit<
  BoxProps<"span">,
  "aria-hidden" | "aria-label" | "aria-labelledby" | "as" | "children" | "dangerouslySetInnerHTML" | "role"
> {
  /**
   * Not accepted: the dot is hidden from assistive technology exactly when it has no `label`
   */
  "aria-hidden"?: never;

  /**
   * Not accepted: the `label` names the dot
   */
  "aria-label"?: never;

  /**
   * Not accepted: the `label` names the dot
   */
  "aria-labelledby"?: never;

  /**
   * What the dot means, read by screen readers. Without it, or with an empty one, the dot is hidden from them, so give
   * it a label, or put text beside it, whenever it carries meaning.
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
 * A container sets `--sui-status-dot-color` (for example to `currentColor`) to recolour every dot inside it, such as on
 * a selected row filled with the primary colour.
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
  const decorative = !label;

  return (
    <Box
      {...rest}
      as="span"
      className={clsx(styles.statusDot, className)}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
      data-size={size}
      data-tone={tone}
      data-variant={variant}
    />
  );
}
