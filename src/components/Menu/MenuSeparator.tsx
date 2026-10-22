import { clsx } from "clsx";
import type { JSX } from "react";

import type { BoxProps } from "../Box";
import { Box } from "../Box";
import styles from "../MenuSurface/MenuSurface.module.css";

import { useMenuContext } from "./useMenuContext";

/**
 * Props for `MenuSeparator`: every `hr` prop except children
 */
export interface MenuSeparatorProps extends Omit<BoxProps<"hr">, "as" | "children" | "dangerouslySetInnerHTML"> {}

/**
 * A rule across a `Menu` between groups of items. The arrow keys pass over it.
 *
 * @example
 * <MenuItem onClick={archive}>Archive</MenuItem>
 * <MenuSeparator />
 * <MenuItem onClick={remove} tone="danger">Delete…</MenuItem>
 */
export function MenuSeparator({ className, ...rest }: MenuSeparatorProps): JSX.Element {
  useMenuContext("MenuSeparator");

  return <Box {...rest} as="hr" className={clsx(styles.separator, className)} />;
}
