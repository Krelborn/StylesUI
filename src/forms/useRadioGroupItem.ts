import type { ChangeEvent, ChangeEventHandler } from "react";
import { useContext } from "react";

import { RadioGroupContext } from "./RadioGroupContext";

interface RadioGroupItemOptions {
  /**
   * The radio's own change handler
   */
  onChange: ChangeEventHandler<HTMLInputElement> | undefined;

  /**
   * The value the radio stands for
   */
  value: string;
}

/**
 * The props a radio takes from the `RadioGroup` around it
 */
export interface RadioGroupItemProps {
  /**
   * Whether the radio is selected, when the group is controlled
   */
  checked?: boolean;

  /**
   * Present when the group shows an error, so the radio can draw it
   */
  "data-invalid"?: "";

  /**
   * Whether the radio starts selected, when the group is uncontrolled
   */
  defaultChecked?: boolean;

  /**
   * The group's shared name
   */
  name?: string;

  /**
   * The radio's own handler, followed inside a group by reporting the radio's value to the group
   */
  onChange: ChangeEventHandler<HTMLInputElement> | undefined;

  /**
   * Whether the group needs an answer
   */
  required?: boolean;
}

/**
 * Connects a radio to the `RadioGroup` around it
 *
 * @param options the radio's own `onChange` and its `value`
 * @returns the props to spread on the radio input after its own. Outside a group, only the radio's `onChange`. Inside
 *   one: the selection from the group's `value` or `defaultValue`, the group's `name` and `required`, `data-invalid`
 *   while the group has an error, and an `onChange` that runs the radio's own and then reports its value to the group.
 */
export function useRadioGroupItem({ onChange, value }: RadioGroupItemOptions): RadioGroupItemProps {
  const group = useContext(RadioGroupContext);

  if (group === null) {
    return { onChange };
  }

  const selection: Pick<RadioGroupItemProps, "checked" | "defaultChecked"> = {};

  if (group.value !== undefined) {
    selection.checked = group.value === value;
  } else if (group.defaultValue !== undefined) {
    selection.defaultChecked = group.defaultValue === value;
  }

  return {
    ...selection,
    "data-invalid": group.invalid ? "" : undefined,
    name: group.name,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event);
      group.onValueChange?.(value);
    },
    required: group.required,
  };
}
