import type { ChangeEvent, JSX, ReactNode } from "react";
import { useContext } from "react";

import { RadioGroupContext } from "../../forms";
import type { BoxProps } from "../Box";
import { ChoiceControl } from "../ChoiceControl";

/**
 * Props for `Radio`: its own props plus every native input prop. `className` and `style` go to the wrapping
 * label; `ref` and every other prop go to the input.
 */
export interface RadioProps extends Omit<BoxProps<"input">, "as" | "children" | "type" | "value"> {
  /**
   * Label shown beside the button, which names the radio. Without it, give the radio an accessible name, for
   * example with `aria-label`.
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
  const group = useContext(RadioGroupContext);

  if (group === null) {
    return (
      <ChoiceControl {...rest} kind="radio" onChange={onChange} value={value}>
        {children}
      </ChoiceControl>
    );
  }

  const selection: Pick<RadioProps, "checked" | "defaultChecked"> = {};

  if (group.value !== undefined) {
    selection.checked = group.value === value;
  } else if (group.defaultValue !== undefined) {
    selection.defaultChecked = group.defaultValue === value;
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange?.(event);
    group.onValueChange?.(value);
  };

  return (
    <ChoiceControl
      {...rest}
      {...selection}
      kind="radio"
      name={group.name}
      onChange={handleChange}
      required={group.required}
      value={value}
      data-invalid={group.invalid ? "" : undefined}
    >
      {children}
    </ChoiceControl>
  );
}
