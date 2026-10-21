import { clsx } from "clsx";
import type { JSX, JSXElementConstructor, MouseEvent, ReactNode } from "react";
import { useId } from "react";

import { hasContent } from "../../forms";
import type { LinkOrButtonElement, LinkOrButtonProps } from "../../links";
import type { BoxProps } from "../Box";
import { Box } from "../Box";
import styles from "../MenuSurface/MenuSurface.module.css";

import { useMenuContext } from "./useMenuContext";

/**
 * What a `MenuItem` can render: a button for an action, a link, or a component that renders an anchor, such as a
 * router's link
 */
export type MenuItemElement = LinkOrButtonElement;

interface MenuItemOwnProps {
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
   * and Space do nothing: your `onClick` does not run and a link is not followed. Defaults to `false`.
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

interface MenuItemElementOwnProps<E extends MenuItemElement> {
  /**
   * What to render: `button`, `a`, or a component that renders an anchor. Defaults to `button`.
   */
  as?: E;

  /**
   * Class names merged with the item's base class
   */
  className?: string;
}

/**
 * Props for `MenuItem`: its own props plus every other prop of the button, link or component given in `as`, except
 * those the menu pattern sets. When `as` may be either a link or a button, only props both accept are allowed.
 */
export type MenuItemProps<E extends MenuItemElement = "button"> =
  // Distributed over E, so an `as` that may be either element accepts only props that suit each one
  E extends MenuItemElement ? MenuItemPropsFor<E> : never;

type MenuItemPropsFor<E extends MenuItemElement> = MenuItemOwnProps &
  MenuItemElementOwnProps<E> &
  LinkOrButtonProps<
    E,
    | "aria-disabled"
    | "dangerouslySetInnerHTML"
    | "disabled"
    | "role"
    | "tabIndex"
    | "type"
    | keyof MenuItemElementOwnProps<E>
    | keyof MenuItemOwnProps
  >;

/**
 * Props the item sets on the element it renders, which a component given in `as` must pass on to its anchor
 */
interface ItemElementProps {
  "aria-describedby": string | undefined;
  "aria-disabled": true | undefined;
  "aria-labelledby": string;
  children: ReactNode;
  className: string;
  "data-tone": "danger" | undefined;
  onClick: (event: MouseEvent<HTMLElement>) => void;
  role: "menuitem";
  tabIndex: -1;
}

/**
 * One command in a `Menu`: a button by default, or a link with `as="a"` or a router's link component. Choosing it,
 * with a click, Enter or Space, runs your `onClick`, or follows the link, and then closes every open menu, returning
 * focus to the trigger; calling `preventDefault()` in a button's `onClick` keeps the menus open. A component given in
 * `as` must pass the props it is given on to its anchor, or the item is neither styled nor reachable.
 *
 * @example
 * <MenuItem icon={<AddIcon />} onClick={duplicate} shortcut="⌘D" aria-keyshortcuts="Meta+D">
 *   Duplicate
 * </MenuItem>
 *
 * @example
 * <MenuItem as="a" href="/settings">Settings</MenuItem>
 */
export function MenuItem<E extends MenuItemElement = "button">({
  as,
  children,
  className,
  description,
  disabled = false,
  icon,
  shortcut,
  tone,
  ...rest
}: MenuItemProps<E>): JSX.Element {
  const menu = useMenuContext("MenuItem");
  const labelId = useId();
  const descriptionId = useId();
  const hasDescription = hasContent(description);
  // Widened as in Box: MenuItemProps<E> already guarantees the props match `as`
  const {
    "aria-describedby": describedBy,
    onClick,
    ...elementProps
  } = rest as {
    "aria-describedby"?: string;
    onClick?: (event: MouseEvent<HTMLElement>) => void;
  };
  const describedByIds = [hasDescription ? descriptionId : undefined, describedBy]
    .filter((id) => id !== undefined && id !== "")
    .join(" ");

  function handleClick(event: MouseEvent<HTMLElement>): void {
    if (disabled) {
      // Also stops a link being followed
      event.preventDefault();
      return;
    }

    onClick?.(event);

    // A router's link prevents the default to navigate by itself, so a link always closes the menus
    if (!event.defaultPrevented || event.currentTarget instanceof HTMLAnchorElement) {
      menu.close();
    }
  }

  const itemProps: ItemElementProps = {
    ...elementProps,
    "aria-describedby": describedByIds === "" ? undefined : describedByIds,
    "aria-disabled": disabled ? true : undefined,
    "aria-labelledby": labelId,
    children: (
      <>
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
      </>
    ),
    className: clsx(styles.item, className),
    "data-tone": tone,
    onClick: handleClick,
    role: "menuitem",
    tabIndex: -1,
  };

  return renderItem(as, itemProps);
}

/**
 * Renders the element a menu item's `as` names
 *
 * @param as the button, link or component to render, or undefined for a button
 * @param props the item's props for it
 * @returns the element
 */
function renderItem(as: MenuItemElement | undefined, { children, ...props }: ItemElementProps): JSX.Element {
  if (as === undefined || as === "button") {
    return (
      <Box {...(props as BoxProps<"button">)} as="button" type="button">
        {children}
      </Box>
    );
  }

  if (as === "a") {
    return (
      <Box {...(props as BoxProps<"a">)} as="a">
        {children}
      </Box>
    );
  }

  // Narrowed to the props the item sets: MenuItemProps<E> already guarantees the rest match the component
  const Component = as as JSXElementConstructor<ItemElementProps>;

  return <Component {...props}>{children}</Component>;
}
