import type { JSX, ReactNode } from "react";
import { clsx } from "clsx";

import { hasContent } from "../../forms";
import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Alert.module.css";
import { AlertIcon } from "./AlertIcon";

/**
 * Alert colours and icons: the theme's four status colours
 */
export type AlertTone = "danger" | "info" | "success" | "warning";

interface AlertOwnProps {
  /**
   * Icon shown before the content. Defaults to the icon for the tone; `null` or `false` shows none.
   */
  icon?: ReactNode;

  /**
   * Bold first line above the children. It replaces the native `title` attribute, so it never
   * reaches the DOM as an attribute.
   */
  title?: ReactNode;

  /**
   * Alert colour and default icon. Defaults to `info`.
   */
  tone?: AlertTone;
}

/**
 * Props for `Alert`: its own props plus every prop supported by the element given in `as`
 */
// Spelled out rather than PolymorphicProps<E, AlertOwnProps>, whose own props react-docgen cannot read for the docs
export type AlertProps<E extends BoxElement = "div"> = AlertOwnProps & Omit<BoxProps<E>, keyof AlertOwnProps>;

/**
 * Inline message in one of four tones, with an icon for the tone and an optional title. It has no
 * role, so screen readers read it in place. Set `role="alert"` for an error raised by an action, or
 * `aria-live="polite"` for a quiet update.
 *
 * @example
 * <Alert title="Scheduled maintenance" tone="warning">
 *   The dashboard is read-only on Saturday from 02:00 to 03:00 UTC.
 * </Alert>
 *
 * @example
 * <Alert tone="success" aria-live="polite">Draft saved</Alert>
 *
 * @example
 * <Alert role="alert" title="Payment failed" tone="danger">
 *   The card was declined. Check the details and try again.
 * </Alert>
 */
export function Alert<E extends BoxElement = "div">({
  as,
  className,
  icon,
  title,
  tone = "info",
  ...rest
}: AlertProps<E>): JSX.Element {
  // Widened as in Box: AlertProps<E> already guarantees the props match `as`
  const { children, ...boxProps } = rest as BoxProps<"div">;
  const showIcon = icon !== null && icon !== false;

  return (
    <Box {...boxProps} as={as as "div"} className={clsx(styles.alert, className)} data-tone={tone}>
      {showIcon ? (
        <Box as="span" className={styles.icon}>
          {icon === undefined ? <AlertIcon tone={tone} /> : icon}
        </Box>
      ) : null}
      <Box className={styles.content}>
        {hasContent(title) ? <Box className={styles.title}>{title}</Box> : null}
        {children}
      </Box>
    </Box>
  );
}
