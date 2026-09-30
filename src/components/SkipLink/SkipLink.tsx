import { clsx } from "clsx";
import type { JSX } from "react";

import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./SkipLink.module.css";

/**
 * Props for `SkipLink`: its own props plus every native anchor prop
 */
export interface SkipLinkProps extends Omit<BoxProps<"a">, "as" | "href"> {
  /**
   * Fragment naming the element to skip to, such as `#main`. That element needs the matching `id`.
   */
  href: `#${string}`;
}

/**
 * Link that skips past repeated content to the page's main content. It stays out of sight until it
 * receives keyboard focus, then shows pinned to the top-left of the page. Render it first in the
 * page so it is the first Tab stop.
 *
 * @example
 * <SkipLink href="#main">Skip to main content</SkipLink>
 */
export function SkipLink({ children, className, ...rest }: SkipLinkProps): JSX.Element {
  return (
    <Box {...rest} as="a" className={clsx(styles.skipLink, className)}>
      {children}
    </Box>
  );
}
