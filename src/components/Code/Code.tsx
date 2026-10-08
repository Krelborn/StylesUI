import { clsx } from "clsx";
import type { JSX } from "react";

import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Code.module.css";

/**
 * Props for `Code`: every native `code` prop
 */
export type CodeProps = Omit<BoxProps<"code">, "as">;

/**
 * Inline code, such as a command, a file name or a value, in the theme's monospace font on the surface colour
 *
 * @example
 * <Text as="p">Run <Code>pnpm install</Code> first.</Text>
 */
export function Code({ className, ...rest }: CodeProps): JSX.Element {
  return <Box {...rest} as="code" className={clsx(styles.code, className)} />;
}
