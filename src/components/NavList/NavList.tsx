import { clsx } from "clsx";
import type { JSX } from "react";

import type { RequiredAccessibleName } from "../../accessibility";
import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./NavList.module.css";

/**
 * Props for `NavList`: a required `aria-label` or `aria-labelledby` and every other `nav` prop
 */
export type NavListProps = RequiredAccessibleName & Omit<BoxProps<"nav">, "aria-label" | "aria-labelledby" | "as">;

/**
 * A navigation landmark holding a list of `NavListItem`s, optionally in `NavListGroup`s, such as an app's sidebar.
 * Name it with `aria-label` or `aria-labelledby`.
 *
 * @example
 * <NavList aria-label="Lists">
 *   <NavListGroup headingLevel={2} title="For review">
 *     <NavListItem href="/needs-you" aria-current="page">Needs you</NavListItem>
 *   </NavListGroup>
 * </NavList>
 */
export function NavList({ children, className, ...rest }: NavListProps): JSX.Element {
  return (
    <Box {...rest} as="nav" className={clsx(styles.navList, className)}>
      <Box
        as="ul"
        className={styles.list}
        // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit drops the list role of a ul without markers
        role="list"
      >
        {children}
      </Box>
    </Box>
  );
}
