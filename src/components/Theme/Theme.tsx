import type { JSX } from "react";
import { clsx } from "clsx";

import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Theme.module.css";

/**
 * Names of the themes shipped in `styles.css`
 */
export type ThemeName = "default" | "playful";

/**
 * Colour mode; `system` follows the operating system preference
 */
export type ThemeMode = "dark" | "light" | "system";

interface ThemeOwnProps<E extends BoxElement> {
  /**
   * DOM element to render. Defaults to `div`.
   */
  as?: E;

  /**
   * Class names merged with the Theme base class
   */
  className?: string;

  /**
   * Colour mode for this subtree. Inherited from the nearest ancestor when omitted.
   */
  mode?: ThemeMode;

  /**
   * Theme for this subtree. Inherited from the nearest ancestor when omitted.
   */
  name?: ThemeName;
}

/**
 * Props for `Theme`: its own props plus every prop supported by the element given in `as`
 */
export type ThemeProps<E extends BoxElement = "div"> = ThemeOwnProps<E> & Omit<BoxProps<E>, keyof ThemeOwnProps<E>>;

/**
 * Applies a theme and colour mode to its subtree and paints the theme's background, text colour and font.
 * Needs `@krelborn/stylesui/styles.css` imported once by the app.
 *
 * @example
 * <Theme mode="dark" name="playful">...</Theme>
 */
export function Theme<E extends BoxElement = "div">({
  as,
  className,
  mode,
  name,
  ...rest
}: ThemeProps<E>): JSX.Element {
  // Widened as in Box: ThemeProps<E> already guarantees the props match `as`
  const boxProps = rest as BoxProps<"div">;

  return (
    <Box
      {...boxProps}
      as={(as ?? "div") as "div"}
      className={clsx(styles.theme, className)}
      data-sui-mode={mode}
      data-sui-theme={name}
    />
  );
}
