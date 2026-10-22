import { clsx } from "clsx";
import type { JSX, ReactNode } from "react";
import { useId } from "react";

import { hasContent } from "../../forms";
import type { LinkOrButtonProps } from "../../links";
import { Box } from "../Box";
import type { LinkElement } from "../Link";

import styles from "./NavBar.module.css";
import { renderNavBarLink } from "./renderNavBarLink";
import { useNavBarContext } from "./useNavBarContext";

interface NavBarMenuItemOwnProps<E extends LinkElement> {
  /**
   * What to render: `a`, or a component that renders an anchor, such as a router's link. Defaults to `a`.
   */
  as?: E;

  /**
   * The title, which names the link
   */
  children?: ReactNode;

  /**
   * Class names merged with the link's base class
   */
  className?: string;

  /**
   * A line of muted text below the title, which describes the link
   */
  description?: ReactNode;
}

/**
 * Props for `NavBarMenuItem`: its own props plus every other prop of the anchor or component given in `as`, except
 * `dangerouslySetInnerHTML`
 */
export type NavBarMenuItemProps<E extends LinkElement = "a"> =
  // Distributed over E, so an `as` that may be either an anchor or a component accepts only props that suit each one
  E extends LinkElement
    ? NavBarMenuItemOwnProps<E> & LinkOrButtonProps<E, "dangerouslySetInnerHTML" | keyof NavBarMenuItemOwnProps<E>>
    : never;

/**
 * A link in a `NavBarMenu`'s panel, with an optional description below its title. Every prop but `children` and
 * `description` goes to the link, and a component given in `as` must pass the `className` and ARIA attributes it is
 * given on to its anchor. Mark the current page with `aria-current="page"`.
 *
 * @example
 * <NavBarMenuItem description="Typography, colour, systems" href="/topics/design">Design</NavBarMenuItem>
 */
export function NavBarMenuItem<E extends LinkElement = "a">({
  as,
  children,
  className,
  description,
  ...rest
}: NavBarMenuItemProps<E>): JSX.Element {
  useNavBarContext("NavBarMenuItem");

  const titleId = useId();
  const descriptionId = useId();
  // Widened as in Box: NavBarMenuItemProps<E> already guarantees the props match `as`
  const {
    "aria-describedby": describedBy,
    "aria-label": ownLabel,
    "aria-labelledby": labelledBy,
    ...linkProps
  } = rest as {
    "aria-describedby"?: string;
    "aria-label"?: string;
    "aria-labelledby"?: string;
  };
  const hasDescription = hasContent(description);
  const content = (
    <>
      <Box as="span" className={styles.title} id={titleId}>
        {children}
      </Box>
      {hasDescription && (
        <Box as="span" className={styles.description} id={descriptionId}>
          {description}
        </Box>
      )}
    </>
  );
  // The description is inside the link, so the title alone names it and the description describes it
  const describingProps = hasDescription
    ? {
        "aria-describedby": describedBy === undefined ? descriptionId : `${descriptionId} ${describedBy}`,
        "aria-label": ownLabel,
        "aria-labelledby": labelledBy ?? (ownLabel === undefined ? titleId : undefined),
      }
    : { "aria-describedby": describedBy, "aria-label": ownLabel, "aria-labelledby": labelledBy };

  return (
    <Box as="li">
      {renderNavBarLink(as, clsx(styles.panelLink, className), content, { ...linkProps, ...describingProps })}
    </Box>
  );
}
