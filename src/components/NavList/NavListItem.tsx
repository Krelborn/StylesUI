import { clsx } from "clsx";
import type { ComponentPropsWithRef, JSX, JSXElementConstructor, ReactNode } from "react";

import { hasContent } from "../../forms";
import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./NavList.module.css";

/**
 * What a `NavListItem` can render: a link, a button for switching views, or a component that renders an anchor, such
 * as a router's link
 */
// `never` props accept a component whatever props it requires
export type NavListItemElement = "a" | "button" | JSXElementConstructor<never>;

interface NavListItemOwnProps {
  /**
   * Shown after the label, such as a `Counter`. A space separates it from the label, so it is read after it.
   */
  trailing?: ReactNode;
}

interface NavListItemElementOwnProps<E extends NavListItemElement> {
  /**
   * What to render: `a`, `button`, or a component that renders an anchor. Defaults to `a`.
   */
  as?: E;

  /**
   * Class names merged with the item's base class
   */
  className?: string;
}

// ComponentPropsWithRef<E> cannot be used: it requires an ElementType, which a component with `never` props is not
type NavListItemElementProps<E extends NavListItemElement> =
  E extends JSXElementConstructor<infer Props>
    ? Props
    : E extends "button"
      ? ComponentPropsWithRef<"button">
      : ComponentPropsWithRef<"a">;

// Omit on its own keeps only the props every member of a union has, which loses a component's union props
type OmitFromEach<Props, Name extends PropertyKey> = Props extends unknown ? Omit<Props, Name> : never;

/**
 * Props for `NavListItem`: `trailing` plus every prop of the link, button or component given in `as`
 */
export type NavListItemProps<E extends NavListItemElement = "a"> = NavListItemOwnProps &
  NavListItemElementOwnProps<E> &
  OmitFromEach<NavListItemElementProps<E>, keyof NavListItemOwnProps | keyof NavListItemElementOwnProps<E>>;

/**
 * One item in a `NavList`. Every prop goes to the link or button, not the list item around it. Mark the current item
 * with `aria-current` (`"page"` for a link, `"true"` for a view switched by a button).
 *
 * @example
 * <NavListItem href="/needs-you" trailing={<Counter count={3} />} aria-current="page">Needs you</NavListItem>
 *
 * @example
 * <NavListItem as="button" onClick={() => setView("mine")} aria-current={view === "mine"}>Mine</NavListItem>
 */
export function NavListItem<E extends NavListItemElement = "a">({
  as,
  children,
  className,
  trailing,
  ...rest
}: NavListItemProps<E>): JSX.Element {
  const itemClassName = clsx(styles.item, className);
  const content = (
    <>
      <Box as="span" className={styles.label}>
        {children}
      </Box>
      {hasContent(trailing) && (
        <>
          {" "}
          <Box as="span" className={styles.trailing}>
            {trailing}
          </Box>
        </>
      )}
    </>
  );

  return <Box as="li">{renderControl(as, itemClassName, content, rest)}</Box>;
}

function renderControl(
  as: NavListItemElement | undefined,
  className: string,
  content: JSX.Element,
  props: object
): JSX.Element {
  if (as === "button") {
    // Widened as in Box: NavListItemProps<E> already guarantees the props match `as`
    const { type = "button", ...buttonProps } = props as BoxProps<"button">;

    return (
      <Box {...buttonProps} as="button" className={className} type={type}>
        {content}
      </Box>
    );
  }

  if (as === undefined || as === "a") {
    return (
      <Box {...(props as BoxProps<"a">)} as="a" className={className}>
        {content}
      </Box>
    );
  }

  // Narrowed to the props NavListItem adds: NavListItemProps<E> already guarantees the rest match the component
  const Component = as as JSXElementConstructor<{ children: ReactNode; className: string }>;

  return (
    <Component {...props} className={className}>
      {content}
    </Component>
  );
}
