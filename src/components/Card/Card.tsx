import type { JSX } from "react";
import { clsx } from "clsx";

import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Card.module.css";

/**
 * Inner spacing of a card, mapped to the `--sui-space-*` tokens
 */
export type CardPadding = "sm" | "md" | "lg";

interface CardOwnProps {
  /**
   * Inner spacing. Defaults to `md`.
   */
  padding?: CardPadding;
}

/**
 * Props for `Card`: its own props plus every prop supported by the element given in `as`
 */
// Spelled out rather than PolymorphicProps<E, CardOwnProps>, whose own props react-docgen cannot read for the docs
export type CardProps<E extends BoxElement = "div"> = CardOwnProps & Omit<BoxProps<E>, keyof CardOwnProps>;

/**
 * Raised surface that groups related content
 *
 * @example
 * <Card as="article" padding="lg">...</Card>
 */
export function Card<E extends BoxElement = "div">({
  as,
  className,
  padding = "md",
  ...rest
}: CardProps<E>): JSX.Element {
  // Widened as in Box: CardProps<E> already guarantees the props match `as`
  const boxProps = rest as BoxProps<"div">;

  return <Box {...boxProps} as={as as "div"} className={clsx(styles.card, className)} data-padding={padding} />;
}
