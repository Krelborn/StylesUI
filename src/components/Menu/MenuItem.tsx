import { clsx } from "clsx";
import type { JSX, MouseEvent, ReactNode } from "react";
import { useId } from "react";

import { hasContent } from "../../forms";
import type { BoxProps } from "../Box";
import { Box } from "../Box";
import styles from "../MenuSurface/MenuSurface.module.css";

import { useMenuContext } from "./useMenuContext";

/**
 * Props for `MenuItem`: its own props plus every native button prop except those the menu pattern sets and the name its
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
   * The label, which names the item
   */
  children?: ReactNode;

  /**
   * A line of muted text below the label, which describes the item
   */
  description?: ReactNode;

  /**
   * Whether the item cannot be chosen. It stays reachable with the arrow keys, so its label is read, but clicks, Enter
   * and Space do nothing, and your `onClick` does not run. Defaults to `false`.
   */
  disabled?: boolean;

  /**
   * An icon before the label, hidden from assistive technology. Once any item in the menu has one, every label lines
   * up after the icons.
   */
  icon?: ReactNode;

  /**
   * A keyboard shortcut shown after the label, such as "⌘D". It is hidden from assistive technology: announce it with
   * `aria-keyshortcuts`. The menu does not bind it.
   */
  shortcut?: string;

  /**
   * `danger` for an item that destroys something, which also needs to say so in its label
   */
  tone?: "danger";
}

/**
 * One command in a `Menu`. Choosing it, with a click, Enter or Space, runs your `onClick` and then closes every open
 * menu, returning focus to the trigger; calling `preventDefault()` in `onClick` keeps the menus open.
 *
 * @example
 * <MenuItem icon={<CopyIcon />} onClick={duplicate} shortcut="⌘D" aria-keyshortcuts="Meta+D">
 *   Duplicate
 * </MenuItem>
 */
export function MenuItem({
  children,
  className,
  description,
  disabled = false,
  icon,
  onClick,
  shortcut,
  tone,
  "aria-describedby": describedBy,
  ...rest
}: MenuItemProps): JSX.Element {
  const menu = useMenuContext("MenuItem");
  const labelId = useId();
  const descriptionId = useId();
  const hasDescription = hasContent(description);
  const describedByIds = [hasDescription ? descriptionId : undefined, describedBy]
    .filter((id) => id !== undefined && id !== "")
    .join(" ");

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    if (disabled) {
      return;
    }

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
      aria-describedby={describedByIds === "" ? undefined : describedByIds}
      aria-disabled={disabled ? true : undefined}
      aria-labelledby={labelId}
      data-tone={tone}
    >
      {hasContent(icon) && (
        <Box as="span" className={styles.leading} aria-hidden={true}>
          {icon}
        </Box>
      )}
      <Box as="span" className={styles.text}>
        <Box as="span" className={styles.label} id={labelId}>
          {children}
        </Box>
        {hasDescription && (
          <Box as="span" className={styles.description} id={descriptionId}>
            {description}
          </Box>
        )}
      </Box>
      {shortcut !== undefined && shortcut !== "" && (
        <Box as="span" className={styles.trailing} aria-hidden={true}>
          {shortcut}
        </Box>
      )}
    </Box>
  );
}
