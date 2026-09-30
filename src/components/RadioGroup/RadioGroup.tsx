import type { JSX } from "react";
import { useId } from "react";

import { hasContent, RadioGroupContext } from "../../forms";
import { Box } from "../Box";
import type { FieldsetProps } from "../Fieldset";
import { Fieldset } from "../Fieldset";
import { RequiredIndicator } from "../RequiredIndicator";

import styles from "./RadioGroup.module.css";

/**
 * Direction a group lays its radios out: `vertical` in a column, `horizontal` in a row that wraps
 */
export type RadioGroupOrientation = "horizontal" | "vertical";

/**
 * Props for `RadioGroup`: its own props plus every native fieldset prop
 */
export interface RadioGroupProps extends Omit<FieldsetProps, "defaultValue" | "name"> {
  /**
   * The value selected at first, leaving the group uncontrolled so the user's choices are kept by the radios
   */
  defaultValue?: string;

  /**
   * Name every radio submits its value under. Defaults to a generated name that is unique to the group.
   */
  name?: string;

  /**
   * Called with the value of the radio the user selects, after that radio's own `onChange`
   */
  onValueChange?: (value: string) => void;

  /**
   * How the radios are laid out. Defaults to `vertical`.
   */
  orientation?: RadioGroupOrientation;

  /**
   * Whether one radio must be selected. It marks the group and every radio required and adds an asterisk
   * to the label. Defaults to `false`.
   */
  required?: boolean;

  /**
   * The selected value, which makes the group controlled: the selection follows it, so update it from
   * `onValueChange`. Give a value that matches no radio to select none.
   */
  value?: string;
}

/**
 * Groups `Radio` components under a label so they share a name and one selection. The label names the group,
 * `description` and `error` are linked to it, and an `error` marks the group and its radios invalid. The
 * native `disabled` prop disables every radio. The group holds no state of its own: it is uncontrolled with
 * `defaultValue` and controlled with `value`.
 *
 * @example
 * <RadioGroup defaultValue="monthly" label="Billing" onValueChange={setBilling}>
 *   <Radio value="monthly">Pay monthly</Radio>
 *   <Radio value="yearly">Pay yearly</Radio>
 * </RadioGroup>
 */
export function RadioGroup({
  children,
  defaultValue,
  error,
  label,
  name,
  onValueChange,
  orientation = "vertical",
  required = false,
  value,
  ...rest
}: RadioGroupProps): JSX.Element {
  const generatedName = useId();
  const invalid = hasContent(error);

  return (
    <RadioGroupContext.Provider
      value={{ defaultValue, invalid, name: name ?? generatedName, onValueChange, required, value }}
    >
      <Fieldset
        {...rest}
        error={error}
        label={
          required ? (
            <>
              {label}
              <RequiredIndicator />
            </>
          ) : (
            label
          )
        }
        role="radiogroup"
        aria-invalid={invalid ? true : undefined}
        aria-required={required ? true : undefined}
      >
        <Box className={styles.radioGroup} data-orientation={orientation}>
          {children}
        </Box>
      </Fieldset>
    </RadioGroupContext.Provider>
  );
}
