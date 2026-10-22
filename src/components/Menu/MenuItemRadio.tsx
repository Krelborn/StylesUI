import { clsx } from "clsx";
import type { JSX, MouseEvent, ReactNode } from "react";

import type { BoxProps } from "../Box";
import { Box } from "../Box";
import styles from "../MenuSurface/MenuSurface.module.css";

import { useMenuContext } from "./useMenuContext";
import { useMenuItemContent } from "./useMenuItemContent";
import { useMenuRadioGroupContext } from "./useMenuRadioGroupContext";

/**
 * Props for `MenuItemRadio`: its own props plus every native button prop except those the menu pattern sets and the
 * name its label gives it
 */
export interface MenuItemRadioProps extends Omit<
  BoxProps<"button">,
  | "aria-checked"
  | "aria-disabled"
  | "aria-label"
  | "aria-labelledby"
  | "as"
  | "children"
  | "dangerouslySetInnerHTML"
  | "disabled"
  | "role"
  | "tabIndex"
  | "type"
  | "value"
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
  children: ReactNode;

  /**
   * A line of muted text below the label, which describes the item
   */
  description?: ReactNode;

  /**
   * Whether the item cannot be checked. It stays reachable with the arrow keys, so its label and state are read, but
   * clicks, Enter and Space do nothing. Defaults to `false`.
   */
  disabled?: boolean;

  /**
   * A keyboard shortcut shown after the label, such as "⌘1". It is hidden from assistive technology: announce it with
   * `aria-keyshortcuts`. The menu does not bind it.
   */
  shortcut?: string;

  /**
   * The value this item stands for in its `MenuRadioGroup`
   */
  value: string;
}

/**
 * One choice in a `MenuRadioGroup`, shown checked by a dot before its label. A click or Enter checks it and closes
 * every open menu; Space checks it and leaves them open. Your `onClick` runs first, and calling `preventDefault()` in
 * it keeps the menus open.
 *
 * @example
 * <MenuItemRadio value="name">Name</MenuItemRadio>
 */
export function MenuItemRadio({
  children,
  className,
  description,
  disabled = false,
  onClick,
  shortcut,
  value,
  "aria-describedby": describedBy,
  ...rest
}: MenuItemRadioProps): JSX.Element {
  const menu = useMenuContext("MenuItemRadio");
  const group = useMenuRadioGroupContext("MenuItemRadio");
  const item = useMenuItemContent({
    describedBy,
    description,
    label: children,
    leading: <Box as="span" className={styles.radioDot} />,
    trailing: shortcut,
  });

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    if (disabled) {
      return;
    }

    onClick?.(event);
    group.select(value);

    if (!event.defaultPrevented) {
      menu.closeAfterChoosing();
    }
  }

  return (
    <Box
      {...rest}
      as="button"
      className={clsx(styles.item, className)}
      onClick={handleClick}
      role="menuitemradio"
      tabIndex={-1}
      type="button"
      aria-checked={group.value === value}
      aria-describedby={item.describedBy}
      aria-disabled={disabled ? true : undefined}
      aria-labelledby={item.labelId}
      data-leading={true}
    >
      {item.content}
    </Box>
  );
}
