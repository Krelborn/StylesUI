import { clsx } from "clsx";
import type { JSX, ReactNode } from "react";

import { useRadioGroupItem } from "../../forms";
import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./SegmentedControl.module.css";

/**
 * Props for `Segment`: its own props plus every native input prop. `className` and `style` go to the label; `ref`
 * and every other prop go to the input.
 */
export interface SegmentProps extends Omit<
  BoxProps<"input">,
  "as" | "children" | "dangerouslySetInnerHTML" | "type" | "value"
> {
  /**
   * The segment's label, which names it. Without it, give the segment an accessible name, for example with
   * `aria-label`.
   */
  children?: ReactNode;

  /**
   * The value this segment stands for, which the `SegmentedControl` reports and a form submits
   */
  value: string;
}

/**
 * One choice in a `SegmentedControl`: a native radio drawn as a joined button
 *
 * @example
 * <Segment value="dark">Dark</Segment>
 */
export function Segment({ children, className, onChange, style, value, ...rest }: SegmentProps): JSX.Element {
  const groupProps = useRadioGroupItem({ onChange, value });

  return (
    <Box as="label" className={clsx(styles.segment, className)} style={style}>
      <Box {...rest} {...groupProps} as="input" className={styles.input} type="radio" value={value} />
      <Box as="span" className={styles.text}>
        {children}
      </Box>
    </Box>
  );
}
