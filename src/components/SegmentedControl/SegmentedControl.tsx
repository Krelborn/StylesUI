import { clsx } from "clsx";
import type { JSX } from "react";

import type { ControlSize } from "../../forms";
import { Box } from "../Box";
import type { RadioGroupProps } from "../RadioGroup";
import { RadioGroup } from "../RadioGroup";

import styles from "./SegmentedControl.module.css";

/**
 * Props for `SegmentedControl`: `RadioGroup`'s props except `orientation`, plus `size`
 */
export interface SegmentedControlProps extends Omit<RadioGroupProps, "orientation"> {
  /**
   * Height of the control, matching the `Button` sizes. Defaults to `md`.
   */
  size?: ControlSize;
}

/**
 * Chooses one value from a few, drawn as a row of joined `Segment`s. It is a `RadioGroup`, so it takes the same
 * label, description, error and value props, and works with the keyboard and in a form as native radios do. To switch
 * between views rather than choose a value, use pill `Tabs`.
 *
 * @example
 * <SegmentedControl defaultValue="system" label="Appearance" onValueChange={setAppearance}>
 *   <Segment value="light">Light</Segment>
 *   <Segment value="dark">Dark</Segment>
 *   <Segment value="system">System</Segment>
 * </SegmentedControl>
 */
export function SegmentedControl({ children, className, size = "md", ...rest }: SegmentedControlProps): JSX.Element {
  return (
    <RadioGroup {...rest} className={clsx(styles.segmentedControl, className)} orientation="horizontal">
      <Box className={styles.track} data-size={size}>
        {children}
      </Box>
    </RadioGroup>
  );
}
