import { clsx } from "clsx";
import type { JSX } from "react";
import { useState } from "react";

import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Avatar.module.css";
import { initialsOf } from "./initialsOf";

/**
 * Avatar sizes: `xs` is 1rem across, `sm` 1.5rem, `md` 2rem and `lg` 3rem
 */
export type AvatarSize = "lg" | "md" | "sm" | "xs";

/**
 * Props for `Avatar`: its own props plus every `span` prop except `children` and `role`
 */
export interface AvatarProps extends Omit<BoxProps<"span">, "as" | "children" | "dangerouslySetInnerHTML" | "role"> {
  /**
   * The person's or team's name. It names the avatar for screen readers, unless `aria-label` replaces it, and gives
   * the initials shown when there is no image.
   */
  name: string;

  /**
   * Avatar size. `xs` shows one initial. Defaults to `md`.
   */
  size?: AvatarSize;

  /**
   * Image URL. Initials show while it is missing or empty, and after it fails to load until `src` changes to a URL
   * that has not failed.
   */
  src?: string;
}

/**
 * A person or team, shown as their image or their initials in a circle. Screen readers read it as an image named by
 * `name`. When the name is printed beside it, pass `aria-hidden={true}` so the name is not read twice.
 *
 * @example
 * <Avatar name="Pat Lee" size="sm" src={pat.avatarUrl} />
 */
export function Avatar({
  "aria-label": ariaLabel,
  className,
  name,
  size = "md",
  src,
  ...rest
}: AvatarProps): JSX.Element {
  const [failedSource, setFailedSource] = useState<string | undefined>(undefined);
  const initials = initialsOf(name);
  const shownInitials = size === "xs" ? (Array.from(initials)[0] ?? "") : initials;
  const showsImage = src !== undefined && src !== "" && src !== failedSource;

  return (
    <Box
      {...rest}
      as="span"
      className={clsx(styles.avatar, className)}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- an img element cannot show initials in place of a missing image
      role="img"
      aria-label={ariaLabel ?? name}
      data-size={size}
    >
      {showsImage ? (
        <Box alt="" as="img" className={styles.image} onError={() => setFailedSource(src)} src={src} />
      ) : (
        shownInitials
      )}
    </Box>
  );
}
