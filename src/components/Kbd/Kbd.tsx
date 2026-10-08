import { clsx } from "clsx";
import type { JSX } from "react";

import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Kbd.module.css";

/**
 * Props for `Kbd`: every native `kbd` prop
 */
export type KbdProps = Omit<BoxProps<"kbd">, "as">;

/**
 * A key on the keyboard, drawn as a small keycap. Write a combination as one `Kbd` per key.
 *
 * @example
 * <Text as="p">Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search.</Text>
 */
export function Kbd({ className, ...rest }: KbdProps): JSX.Element {
  return <Box {...rest} as="kbd" className={clsx(styles.kbd, className)} />;
}
