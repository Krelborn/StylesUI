import { clsx } from "clsx";
import type { JSX, ReactNode } from "react";

import { hasContent } from "../../forms";
import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Alert.module.css";
import { AlertIcon } from "./AlertIcon";

/**
 * Alert colours and icons: the theme's four status colours
 */
export type AlertTone = "danger" | "info" | "success" | "warning";

/**
 * Props for `Alert`: its own props plus every native div prop
 */
export interface AlertProps extends Omit<BoxProps<"div">, "as" | "title"> {
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
 * Inline message in one of four tones, with an icon for the tone and an optional title. It has no
 * role, so screen readers read it in place. Set `role="alert"` for an error raised by an action, or
 * `aria-live="polite"` for a quiet update. Screen readers announce a polite region reliably only when
 * it is on the page before its content changes, so keep the element with `aria-live` rendered and
 * render the alert inside it.
 *
 * @example
 * <Alert title="Scheduled maintenance" tone="warning">
 *   The dashboard is read-only on Saturday from 02:00 to 03:00 UTC.
 * </Alert>
 *
 * @example
 * <Box aria-live="polite">
 *   {isSaved && <Alert tone="success">Draft saved</Alert>}
 * </Box>
 *
 * @example
 * <Alert role="alert" title="Payment failed" tone="danger">
 *   The card was declined. Check the details and try again.
 * </Alert>
 */
export function Alert({ children, className, icon, title, tone = "info", ...rest }: AlertProps): JSX.Element {
  const showIcon = icon !== null && icon !== false;

  return (
    <Box {...rest} className={clsx(styles.alert, className)} data-tone={tone}>
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
