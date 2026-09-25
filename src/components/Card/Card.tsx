import type { JSX } from "react";
import { clsx } from "clsx";

import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Card.module.css";

/**
 * Inner spacing of a card, mapped to the `--sui-space-*` tokens
 */
export type CardPadding = "sm" | "md" | "lg";

interface CardOwnProps<E extends BoxElement> {
  /**
   * DOM element to render. Defaults to `div`.
   */
  as?: E;

  /**
   * Class names merged with the Card base class
   */
  className?: string;

  /**
   * Inner spacing. Defaults to `md`.
   */
  padding?: CardPadding;
}

/**
 * Props for `Card`: its own props plus every prop supported by the element given in `as`
 */
export type CardProps<E extends BoxElement = "div"> = CardOwnProps<E> & Omit<BoxProps<E>, keyof CardOwnProps<E>>;

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

  return (
    <Box {...boxProps} as={(as ?? "div") as "div"} className={clsx(styles.card, className)} data-padding={padding} />
  );
}
