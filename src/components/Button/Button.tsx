import type { JSX, MouseEvent } from "react";
import { clsx } from "clsx";

import type { BoxProps } from "../Box";
import { Box } from "../Box";
import { Spinner } from "../Spinner";

import styles from "./Button.module.css";

/**
 * Button sizes, controlling padding and font size
 */
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Button styles: filled primary, filled secondary, primary-coloured outline, `ghost`, which has no border and no fill
 * until it is hovered, and never sits on a lip, or filled in a status colour: `danger` for an action that destroys
 * something, such as deleting, and `success`, `warning` or `info` for an action tied to that status
 */
export type ButtonVariant = "danger" | "ghost" | "info" | "outline" | "primary" | "secondary" | "success" | "warning";

/**
 * Props for `Button`: its own props plus every native button prop
 */
export interface ButtonProps extends Omit<BoxProps<"button">, "as"> {
  /**
   * Whether the button's action is running. A busy button shows a spinner in place of its content, keeps its width
   * and accessible name, stays focusable, and ignores presses, including a form's submission. The spinner is not
   * announced, so pair `busy` with a status message that announces the outcome. Defaults to `false`.
   */
  busy?: boolean;

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
 *
 * @example
 * <Button busy={isSaving} type="submit">Save</Button>
 */
export function Button({
  "aria-disabled": ariaDisabled,
  busy = false,
  children,
  className,
  onClick,
  size = "md",
  type = "button",
  variant = "primary",
  ...rest
}: ButtonProps): JSX.Element {
  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    if (busy) {
      event.preventDefault();

      return;
    }

    onClick?.(event);
  }

  return (
    <Box
      {...rest}
      as="button"
      className={clsx(styles.button, className)}
      onClick={handleClick}
      type={type}
      aria-disabled={busy ? true : ariaDisabled}
      data-busy={busy ? "" : undefined}
      data-size={size}
      data-variant={variant}
    >
      {children}
      {busy && <Spinner className={styles.spinner} />}
    </Box>
  );
}
