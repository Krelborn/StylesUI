import { clsx } from "clsx";
import type { JSX, MouseEvent, ReactNode } from "react";
import { useState } from "react";

import type { BoxProps } from "../Box";
import { Box } from "../Box";
import { CheckIcon } from "../Icon";
import styles from "../MenuSurface/MenuSurface.module.css";

import { useMenuContext } from "./useMenuContext";
import { useMenuItemContent } from "./useMenuItemContent";

/**
 * Props for `MenuItemCheckbox`: its own props plus every native button prop except those the menu pattern sets and the
 * name its label gives it
 */
export interface MenuItemCheckboxProps extends Omit<
  BoxProps<"button">,
  | "aria-checked"
  | "aria-disabled"
  | "aria-label"
  | "aria-labelledby"
  | "as"
  | "children"
  | "dangerouslySetInnerHTML"
  | "defaultChecked"
  | "disabled"
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
   * Controls whether the item is checked. Without it, the item holds its own state, starting from `defaultChecked`.
   */
  checked?: boolean;

  /**
   * The label, which names the item
   */
  children?: ReactNode;

  /**
   * Whether an uncontrolled item starts checked. Defaults to `false`.
   */
  defaultChecked?: boolean;

  /**
   * A line of muted text below the label, which describes the item
   */
  description?: ReactNode;

  /**
   * Whether the item cannot be toggled. It stays reachable with the arrow keys, so its label and state are read, but
   * clicks, Enter and Space do nothing. Defaults to `false`.
   */
  disabled?: boolean;

  /**
   * Not accepted: the check takes the icon's place
   */
  icon?: never;

  /**
   * Called with the new state when the user toggles the item
   */
  onCheckedChange?: (checked: boolean) => void;

  /**
   * A keyboard shortcut shown after the label, such as "⇧⌘H". It is hidden from assistive technology: announce it with
   * `aria-keyshortcuts`. The menu does not bind it.
   */
  shortcut?: string;
}

/**
 * An option in a `Menu` that is on or off, shown by a check before its label. A click or Enter toggles it and closes
 * every open menu; Space toggles it and leaves them open, so several can be set at once. Your `onClick` runs first, and
 * calling `preventDefault()` in it keeps the menus open.
 *
 * @example
 * <MenuItemCheckbox checked={showArchived} onCheckedChange={setShowArchived}>
 *   Show archived
 * </MenuItemCheckbox>
 */
export function MenuItemCheckbox({
  checked,
  children,
  className,
  defaultChecked = false,
  description,
  disabled = false,
  onCheckedChange,
  onClick,
  shortcut,
  "aria-describedby": describedBy,
  ...rest
}: MenuItemCheckboxProps): JSX.Element {
  const menu = useMenuContext("MenuItemCheckbox");
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
  const isChecked = checked ?? uncontrolledChecked;
  const item = useMenuItemContent({
    describedBy,
    description,
    label: children,
    leading: <CheckIcon />,
    trailing: shortcut,
  });

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    if (disabled) {
      return;
    }

    onClick?.(event);

    if (checked === undefined) {
      setUncontrolledChecked(!isChecked);
    }

    onCheckedChange?.(!isChecked);

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
      role="menuitemcheckbox"
      tabIndex={-1}
      type="button"
      aria-checked={isChecked}
      aria-describedby={item.describedBy}
      aria-disabled={disabled ? true : undefined}
      aria-labelledby={item.labelId}
      data-leading={true}
    >
      {item.content}
    </Box>
  );
}
