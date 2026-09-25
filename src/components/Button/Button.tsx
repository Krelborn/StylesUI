import type { JSX } from "react";
import { clsx } from "clsx";

import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Button.module.css";

/**
 * Button sizes, controlling padding and font size
 */
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Button styles: filled primary, filled secondary, or primary-coloured outline
 */
export type ButtonVariant = "outline" | "primary" | "secondary";

/**
 * Props for `Button`: its own props plus every native button prop
 */
export interface ButtonProps extends Omit<BoxProps<"button">, "as"> {
  /**
   * Button size. Defaults to `md`.
   */
  size?: ButtonSize;

  /**
   * Visual style. Defaults to `primary`.
   */
  variant?: ButtonVariant;
}

/**
 * Themed button. `type` defaults to `"button"`, so it never submits a form unless asked to.
 *
 * @example
 * <Button onClick={save} variant="secondary">Save</Button>
 */
export function Button({
  className,
  size = "md",
  type = "button",
  variant = "primary",
  ...rest
}: ButtonProps): JSX.Element {
  return (
    <Box
      {...rest}
      as="button"
      className={clsx(styles.button, className)}
      type={type}
      data-size={size}
      data-variant={variant}
    />
  );
}
