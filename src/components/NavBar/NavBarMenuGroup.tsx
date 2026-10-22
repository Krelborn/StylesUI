import { clsx } from "clsx";
import type { JSX, ReactNode } from "react";
import { useId } from "react";

import type { BoxProps } from "../Box";
import { Box } from "../Box";
import type { HeadingLevel } from "../Heading";
import { Heading } from "../Heading";

import styles from "./NavBar.module.css";
import { useNavBarContext } from "./useNavBarContext";

/**
 * Props for `NavBarMenuGroup`: its own props plus every `li` prop except `dangerouslySetInnerHTML` and `title`
 */
export interface NavBarMenuGroupProps extends Omit<BoxProps<"li">, "as" | "dangerouslySetInnerHTML" | "title"> {
  /**
   * The group's heading level, which the page outline decides: in a site's header before the page's `h1`, usually 2
   */
  headingLevel: HeadingLevel;

  /**
   * The group's heading, which also names its list
   */
  title: ReactNode;
}

/**
 * A headed column of `NavBarMenuItem`s in a `NavBarMenu`'s panel
 *
 * @example
 * <NavBarMenuGroup headingLevel={2} title="Topics">
 *   <NavBarMenuItem href="/topics/design">Design</NavBarMenuItem>
 * </NavBarMenuGroup>
 */
export function NavBarMenuGroup({
  children,
  className,
  headingLevel,
  title,
  ...rest
}: NavBarMenuGroupProps): JSX.Element {
  useNavBarContext("NavBarMenuGroup");

  const headingId = useId();

  return (
    <Box {...rest} as="li" className={clsx(styles.group, className)}>
      <Heading className={styles.groupTitle} id={headingId} level={headingLevel} size="xs" tone="muted">
        {title}
      </Heading>
      <Box
        as="ul"
        className={styles.groupList}
        // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit drops the list role of a ul without markers
        role="list"
        aria-labelledby={headingId}
      >
        {children}
      </Box>
    </Box>
  );
}
