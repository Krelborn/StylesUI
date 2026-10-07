import { clsx } from "clsx";
import type { JSX, ReactNode } from "react";
import { Children } from "react";

import type { RequiredAccessibleName } from "../../accessibility";
import type { BoxProps } from "../Box";
import { Box } from "../Box";
import { VisuallyHidden } from "../VisuallyHidden";

import styles from "./AvatarGroup.module.css";

interface AvatarGroupOwnProps {
  /**
   * The `Avatar`s, as direct children or an array of them
   */
  children: ReactNode;

  /**
   * How many avatars show, at least 1. The rest are hidden on screen behind a "+n" count, but screen readers still
   * read their names. Shows every avatar when left out or not a number.
   */
  max?: number;
}

/**
 * Props for `AvatarGroup`: its own props, a required `aria-label` or `aria-labelledby`, and every other `span` prop
 * except `role`
 */
export type AvatarGroupProps = AvatarGroupOwnProps &
  RequiredAccessibleName &
  Omit<BoxProps<"span">, "aria-label" | "aria-labelledby" | "as" | "role" | keyof AvatarGroupOwnProps>;

/**
 * A row of overlapping avatars, such as a pull request's reviewers. Give it a name. Past `max`, avatars are hidden
 * on screen behind a "+n" count, but screen readers read every name.
 *
 * @example
 * <AvatarGroup max={3} aria-label="Reviewers">
 *   {reviewers.map((reviewer) => <Avatar key={reviewer.login} name={reviewer.login} size="sm" />)}
 * </AvatarGroup>
 */
export function AvatarGroup({ children, className, max, ...rest }: AvatarGroupProps): JSX.Element {
  const avatars = Children.toArray(children);
  const shownCount = max === undefined || Number.isNaN(max) ? avatars.length : Math.max(1, max);
  const hiddenAvatars = avatars.slice(shownCount);

  return (
    <Box
      {...rest}
      as="span"
      className={clsx(styles.avatarGroup, className)}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- the elements with the group role are for forms and details
      role="group"
    >
      {avatars.slice(0, shownCount)}
      {hiddenAvatars.length > 0 && (
        <>
          <VisuallyHidden>{hiddenAvatars}</VisuallyHidden>
          <Box as="span" className={styles.overflow} aria-hidden={true}>
            {`+${hiddenAvatars.length}`}
          </Box>
        </>
      )}
    </Box>
  );
}
