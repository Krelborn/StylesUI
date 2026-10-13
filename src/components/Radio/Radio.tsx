import type { JSX, ReactNode } from "react";

import { useRadioGroupItem } from "../../forms";
import type { BoxProps } from "../Box";
import { ChoiceControl } from "../ChoiceControl";

/**
 * Props for `Radio`: its own props plus every native input prop. `className` and `style` go to the wrapping
 * label; `ref` and every other prop go to the input.
 */
export interface RadioProps extends Omit<
  BoxProps<"input">,
  "as" | "children" | "dangerouslySetInnerHTML" | "type" | "value"
> {
  /**
   * Label shown beside the button, which names the radio. Without it, give the radio an accessible name, for
   * example with `aria-label`. It is inline content, as a `label` holds: a child laid out as a block drops below the
   * button, so put a description after the radio, padded by `var(--sui-space-6)`.
   */
  children?: ReactNode;

  /**
   * The value this radio stands for: what a form submits when it is selected, and what a `RadioGroup` reports
   * and matches against its own value
   */
  value: string;
}

/**
 * Themed native radio button inside the label that names it. On its own it is a plain native radio: radios
 * that share a `name` allow one selection. Inside a `RadioGroup` it takes its `name` and `required` state from
 * the group, its selection from the group's `value` or `defaultValue`, and reports its `value` to the group's
 * `onValueChange` after its own `onChange`.
 *
 * @example
 * <Radio name="plan" value="monthly">Pay monthly</Radio>
 */
export function Radio({ children, onChange, value, ...rest }: RadioProps): JSX.Element {
  const groupProps = useRadioGroupItem({ onChange, value });

  return (
    <ChoiceControl {...rest} {...groupProps} kind="radio" value={value}>
      {children}
    </ChoiceControl>
  );
}
