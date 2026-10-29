import { clsx } from "clsx";
import type { JSX } from "react";

import type { BadgeTone, BadgeVariant } from "../Badge";
import { Badge } from "../Badge";
import type { BoxProps } from "../Box";
import { VisuallyHidden } from "../VisuallyHidden";

import styles from "./Counter.module.css";

/**
 * Props for `Counter`: its own props plus every `span` prop except `children`
 */
export interface CounterProps extends Omit<BoxProps<"span">, "as" | "children" | "dangerouslySetInnerHTML"> {
  /**
   * Whether the count is only a lower bound, which adds "+" after it, as in "30+". Defaults to `false`.
   */
  capped?: boolean;

  /**
   * The number shown. Below 1 the counter renders nothing.
   */
  count: number;

  /**
   * Words screen readers read after the count, hidden on screen, so that "3" reads as "3 new"
   */
  hiddenSuffix?: string;

  /**
   * The largest count shown, at least 1. A count above it shows as the maximum followed by "+", as in "99+".
   */
  max?: number;

  /**
   * Colour, from Badge's tones. Defaults to `neutral`.
   */
  tone?: BadgeTone;

  /**
   * Style, from Badge's variants. Defaults to `subtle`.
   */
  variant?: BadgeVariant;
}

/**
 * A small pill showing a count, such as the unread items in a list. It renders nothing for a count below 1.
 *
 * @example
 * <Counter count={unread} hiddenSuffix="unread" max={99} tone="primary" variant="solid" />
 */
export function Counter({
  capped = false,
  className,
  count,
  hiddenSuffix,
  max,
  tone = "neutral",
  variant = "subtle",
  ...rest
}: CounterProps): JSX.Element | null {
  if (!(count >= 1)) {
    return null;
  }

  const limit = max === undefined ? undefined : Math.max(1, max);
  const overMax = limit !== undefined && count > limit;
  const shownCount = overMax ? limit : count;

  return (
    <Badge {...rest} className={clsx(styles.counter, className)} tone={tone} variant={variant}>
      {overMax || capped ? `${shownCount}+` : shownCount}
      {hiddenSuffix !== undefined && <VisuallyHidden>{` ${hiddenSuffix}`}</VisuallyHidden>}
    </Badge>
  );
}
