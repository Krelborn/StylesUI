import { clsx } from "clsx";
import type { JSX } from "react";

import type { ControlSize } from "../../forms";
import { useFieldControl } from "../../forms";
import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./TextControl.module.css";

type TextControlElement = "button" | "input" | "select" | "textarea";

interface TextControlOwnProps<E extends TextControlElement> {
  /**
   * Native element to render
   */
  as: E;

  /**
   * Padding and font size of the control, matching the `Button` sizes. Takes the place of the native `size`
   * attribute.
   */
  size: ControlSize;
}

type TextControlProps<E extends TextControlElement> = TextControlOwnProps<E> &
  Omit<BoxProps<E>, keyof TextControlOwnProps<E>>;

/**
 * Themed text-entry element shared by `TextInput`, `Textarea`, `Select`, `Combobox` and `Autocomplete`. Inside a
 * `Field` it takes its id, description, and invalid, disabled and required state from the field.
 */
export function TextControl<E extends TextControlElement>({
  as,
  className,
  size,
  ...rest
}: TextControlProps<E>): JSX.Element {
  // Widened to one element's props: TextControlProps<E> already guarantees the props match `as`
  const boxProps = rest as Omit<BoxProps<"input">, "as" | "size">;
  const { required, ...fieldControlProps } = useFieldControl(boxProps);
  // A button cannot be required, so a Combobox's says so to assistive technology alone
  const requiredProps = as === "button" ? { "aria-required": required } : { required };

  return (
    <Box
      {...boxProps}
      {...fieldControlProps}
      {...requiredProps}
      as={as as "input"}
      className={clsx(styles.textControl, className)}
      data-size={size}
    />
  );
}
