import { clsx } from "clsx";
import type { JSX, ReactNode } from "react";

import type { LinkOrButtonProps } from "../../links";
import { Box } from "../Box";
import type { LinkElement } from "../Link";

import styles from "./NavBar.module.css";
import { renderNavBarLink } from "./renderNavBarLink";
import { useNavBarContext } from "./useNavBarContext";

interface NavBarItemOwnProps<E extends LinkElement> {
  /**
   * What to render: `a`, or a component that renders an anchor, such as a router's link. Defaults to `a`.
   */
  as?: E;

  /**
   * The label
   */
  children?: ReactNode;

  /**
   * Class names merged with the link's base class
   */
  className?: string;
}

/**
 * Props for `NavBarItem`: its own props plus every other prop of the anchor or component given in `as`, except
 * `dangerouslySetInnerHTML`
 */
export type NavBarItemProps<E extends LinkElement = "a"> =
  // Distributed over E, so an `as` that may be either an anchor or a component accepts only props that suit each one
  E extends LinkElement
    ? NavBarItemOwnProps<E> & LinkOrButtonProps<E, "dangerouslySetInnerHTML" | keyof NavBarItemOwnProps<E>>
    : never;

/**
 * A top-level link in a `NavBar`. Every prop but `children` goes to the link, not the list item around it, and a
 * component given in `as` must pass the `className` it is given on to its anchor. Mark the current page with
 * `aria-current="page"`.
 *
 * @example
 * <NavBarItem href="/articles" aria-current="page">Articles</NavBarItem>
 */
export function NavBarItem<E extends LinkElement = "a">({
  as,
  children,
  className,
  ...rest
}: NavBarItemProps<E>): JSX.Element {
  useNavBarContext("NavBarItem");

  return <Box as="li">{renderNavBarLink(as, clsx(styles.control, className), children, rest)}</Box>;
}
