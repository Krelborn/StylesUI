import { clsx } from "clsx";
import type { JSX, MouseEvent, ReactNode } from "react";
import { useId } from "react";

import type { BoxProps } from "../Box";
import { Box } from "../Box";
import styles from "../MenuSurface/MenuSurface.module.css";

import { useMenuContext } from "./useMenuContext";

/**
 * Props for `MenuItem`: its label plus every native button prop except those the menu pattern sets and the name its
 * label gives it
 */
export interface MenuItemProps extends Omit<
  BoxProps<"button">,
  | "aria-disabled"
  | "aria-label"
  | "aria-labelledby"
  | "as"
  | "children"
  | "dangerouslySetInnerHTML"
  | "role"
  | "tabIndex"
  | "type"
> {
  /**
   * Not accepted: the label names the item
   */
  "aria-label"?: never;

  /**
   * Not accepted: the label names the item
   */
  "aria-labelledby"?: never;

  /**
   * The label, which names the item
   */
  children?: ReactNode;
}

/**
 * One command in a `Menu`. Choosing it, with a click, Enter or Space, runs your `onClick` and then closes every open
 * menu, returning focus to the trigger; calling `preventDefault()` in `onClick` keeps the menus open.
 *
 * @example
 * <MenuItem onClick={duplicate}>Duplicate</MenuItem>
 */
export function MenuItem({ children, className, onClick, ...rest }: MenuItemProps): JSX.Element {
  const menu = useMenuContext("MenuItem");
  const labelId = useId();

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    onClick?.(event);

    if (!event.defaultPrevented) {
      menu.close();
    }
  }

  return (
    <Box
      {...rest}
      as="button"
      className={clsx(styles.item, className)}
      onClick={handleClick}
      role="menuitem"
      tabIndex={-1}
      type="button"
      aria-labelledby={labelId}
    >
      <Box as="span" className={styles.leading} aria-hidden={true} />
      <Box as="span" className={styles.label} id={labelId}>
        {children}
      </Box>
    </Box>
  );
}
