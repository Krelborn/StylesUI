import { clsx } from "clsx";
import type { JSX, ReactNode } from "react";

import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Icon.module.css";

/**
 * Props for every icon: its own props plus every `svg` prop except those its artwork and `label` decide. It is 1em
 * square, so `font-size` sizes it, its colour follows `color`, and its stroke weight follows `--sui-icon-stroke-width`.
 */
export interface IconProps extends Omit<
  BoxProps<"svg">,
  | "aria-hidden"
  | "aria-label"
  | "aria-labelledby"
  | "as"
  | "children"
  | "dangerouslySetInnerHTML"
  | "fill"
  | "height"
  | "role"
  | "stroke"
  | "strokeLinecap"
  | "strokeLinejoin"
  | "strokeWidth"
  | "viewBox"
  | "width"
> {
  /**
   * Not accepted: the icon is hidden from assistive technology exactly when it has no `label`
   */
  "aria-hidden"?: never;

  /**
   * Not accepted: the `label` names the icon
   */
  "aria-label"?: never;

  /**
   * Not accepted: the `label` names the icon
   */
  "aria-labelledby"?: never;

  /**
   * What the icon means, read by screen readers. Without it, or with an empty one, the icon is hidden from them, which
   * suits an icon beside text or inside a named button.
   */
  label?: string;
}

interface IconBaseProps extends IconProps {
  /**
   * The glyph's shapes, drawn in round strokes on a 24 by 24 grid
   */
  children: ReactNode;

  /**
   * Whether the glyph points the way the text runs, so it is mirrored in right-to-left text
   */
  mirrored?: boolean;
}

/**
 * The svg element every icon renders: 1em square, stroked in `currentColor`, and decorative unless it has a `label`
 */
export function Icon({ children, className, label, mirrored = false, ...rest }: IconBaseProps): JSX.Element {
  const decorative = !label;

  return (
    <Box
      {...rest}
      as="svg"
      className={clsx(styles.icon, { [styles.mirrored]: mirrored }, className)}
      fill="none"
      role={decorative ? undefined : "img"}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
    >
      {children}
    </Box>
  );
}
