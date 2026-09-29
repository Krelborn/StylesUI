import type { JSX } from "react";
import { clsx } from "clsx";

import type { Space } from "../../layout";
import { spaceValue, withCustomProperties } from "../../layout";
import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./PageLayout.module.css";

interface PageLayoutOwnProps {
  /**
   * Space between the page regions. Defaults to `0`.
   */
  gap?: Space;
}

/**
 * Props for `PageLayout`: its own props plus every prop supported by the element given in `as`
 */
export type PageLayoutProps<E extends BoxElement = "div"> = PageLayoutOwnProps &
  Omit<BoxProps<E>, keyof PageLayoutOwnProps>;

/**
 * Full-height page shell that keeps the footer at the bottom of short pages. Pass the page
 * regions as direct children; a direct `main` child grows to fill the free space.
 *
 * @example
 * <PageLayout>
 *   <header>...</header>
 *   <main>...</main>
 *   <footer>...</footer>
 * </PageLayout>
 */
export function PageLayout<E extends BoxElement = "div">({
  as,
  className,
  gap = 0,
  ...rest
}: PageLayoutProps<E>): JSX.Element {
  // Widened as in Box: PageLayoutProps<E> already guarantees the props match `as`
  const { style, ...boxProps } = rest as BoxProps<"div">;

  return (
    <Box
      {...boxProps}
      as={as as "div"}
      className={clsx(styles.pageLayout, className)}
      style={withCustomProperties({ "--sui-page-layout-gap": spaceValue(gap) }, style)}
    />
  );
}
