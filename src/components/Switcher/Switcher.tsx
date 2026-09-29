import type { JSX } from "react";
import { clsx } from "clsx";

import type { Space } from "../../layout";
import { listRole, spaceValue, withCustomProperties } from "../../layout";
import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Switcher.module.css";

interface SwitcherOwnProps {
  /**
   * Space between items. Defaults to `4`.
   */
  gap?: Space;

  /**
   * Container width below which the items stack, as a CSS length. Defaults to `30rem`.
   */
  threshold?: string;
}

/**
 * Props for `Switcher`: its own props plus every prop supported by the element given in `as`
 */
export type SwitcherProps<E extends BoxElement = "div"> = SwitcherOwnProps & Omit<BoxProps<E>, keyof SwitcherOwnProps>;

/**
 * Equal-width items in a row that all stack at once when the container is narrower than the
 * threshold
 *
 * @example
 * <Switcher as="nav" threshold="36rem" aria-label="More posts">...</Switcher>
 */
export function Switcher<E extends BoxElement = "div">({
  as,
  className,
  gap = 4,
  threshold = "30rem",
  ...rest
}: SwitcherProps<E>): JSX.Element {
  // Widened as in Box: SwitcherProps<E> already guarantees the props match `as`
  const { role, style, ...boxProps } = rest as BoxProps<"div">;
  const element = as ?? "div";

  return (
    <Box
      {...boxProps}
      as={element as "div"}
      className={clsx(styles.switcher, className)}
      role={listRole(element, role)}
      style={withCustomProperties(
        { "--sui-switcher-gap": spaceValue(gap), "--sui-switcher-threshold": threshold },
        style
      )}
    />
  );
}
