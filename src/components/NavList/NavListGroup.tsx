import { clsx } from "clsx";
import type { JSX, ReactNode } from "react";
import { useId } from "react";

import type { BoxProps } from "../Box";
import { Box } from "../Box";
import type { HeadingLevel } from "../Heading";
import { Heading } from "../Heading";

import styles from "./NavList.module.css";

/**
 * Props for `NavListGroup`: its own props plus every `li` prop except `title`
 */
export interface NavListGroupProps extends Omit<BoxProps<"li">, "as" | "title"> {
  /**
   * The group's heading level, which the page outline decides: in a sidebar beside the page's `h1`, usually 2
   */
  headingLevel: HeadingLevel;

  /**
   * The group's heading, which also names its list
   */
  title: ReactNode;
}

/**
 * A titled group of `NavListItem`s inside a `NavList`
 *
 * @example
 * <NavListGroup headingLevel={2} title="For review">
 *   <NavListItem href="/needs-you">Needs you</NavListItem>
 * </NavListGroup>
 */
export function NavListGroup({ children, className, headingLevel, title, ...rest }: NavListGroupProps): JSX.Element {
  const headingId = useId();

  return (
    <Box {...rest} as="li" className={clsx(styles.group, className)}>
      <Heading className={styles.groupTitle} id={headingId} level={headingLevel} size="xs" tone="muted">
        {title}
      </Heading>
      <Box
        as="ul"
        className={styles.list}
        // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit drops the list role of a ul without markers
        role="list"
        aria-labelledby={headingId}
      >
        {children}
      </Box>
    </Box>
  );
}
