import type { ComponentPropsWithRef, ElementType, JSX } from "react";
import { clsx } from "clsx";

import styles from "./Box.module.css";

/**
 * Intrinsic element names that `Box` can render
 */
export type BoxElement = keyof JSX.IntrinsicElements;

type BoxOwnProps<E extends BoxElement> = {
  /** DOM element to render. Defaults to `div`. */
  as?: E;
  /** Class names merged with the Box base class. */
  className?: string;
};

/** Props for `Box`: its own props plus every prop supported by the element given in `as`. */
export type BoxProps<E extends BoxElement = "div"> = BoxOwnProps<E> &
  Omit<ComponentPropsWithRef<E>, keyof BoxOwnProps<E>>;

/**
 * Props for a polymorphic component built on `Box`: `OwnProps` plus every prop `Box` accepts for
 * the element given in `as`, minus any name `OwnProps` already declares.
 */
export type PolymorphicProps<E extends BoxElement, OwnProps extends object> = OwnProps &
  Omit<BoxProps<E>, keyof OwnProps>;

/**
 * Polymorphic primitive that renders the DOM element given in `as` and forwards all of its props.
 * Foundation for other StylesUI components.
 *
 * @example
 * <Box as="button" onClick={() => console.log('Clicked')}>Click Me</Box>
 */
export function Box<E extends BoxElement = "div">({ as, className, ...rest }: BoxProps<E>): JSX.Element {
  // Widened so TS does not intersect every intrinsic element's ref type; BoxProps<E> already guarantees props match `as`
  const Component = (as ?? "div") as ElementType;

  return <Component className={clsx(styles.box, className)} {...rest} />;
}
