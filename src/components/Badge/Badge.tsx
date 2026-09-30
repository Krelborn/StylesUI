import { clsx } from "clsx";
import type { JSX } from "react";

import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Badge.module.css";

/**
 * Elements a `Badge` can render: a `span`, or an `a` or `button` for a badge that links or acts
 */
export type BadgeElement = "a" | "button" | "span";

/**
 * Badge colours: the theme's status colours, its primary colour, or its secondary colour for `neutral`
 */
export type BadgeTone = "danger" | "info" | "neutral" | "primary" | "success" | "warning";

/**
 * Badge styles: a solid tone fill, or a subtle tinted background with tone-coloured text
 */
export type BadgeVariant = "solid" | "subtle";

interface BadgeOwnProps {
  /**
   * Badge colour. Defaults to `neutral`.
   */
  tone?: BadgeTone;

  /**
   * Visual style. Defaults to `subtle`.
   */
  variant?: BadgeVariant;
}

/**
 * Props for `Badge`: its own props plus every prop supported by the element given in `as`
 */
// Spelled out rather than PolymorphicProps<E, BadgeOwnProps>, whose own props react-docgen cannot read for the docs
export type BadgeProps<E extends BadgeElement = "span"> = BadgeOwnProps & Omit<BoxProps<E>, keyof BadgeOwnProps>;

/**
 * Small label for a tag, a status or a count
 *
 * @example
 * <Badge tone="success" variant="solid">Published</Badge>
 */
export function Badge<E extends BadgeElement = "span">({
  as,
  className,
  tone = "neutral",
  variant = "subtle",
  ...rest
}: BadgeProps<E>): JSX.Element {
  // Widened as in Box: BadgeProps<E> already guarantees the props match `as`
  const boxProps = rest as BoxProps<"span">;

  return (
    <Box
      {...boxProps}
      as={(as ?? "span") as "span"}
      className={clsx(styles.badge, className)}
      data-tone={tone}
      data-variant={variant}
    />
  );
}
