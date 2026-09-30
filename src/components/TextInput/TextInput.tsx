import type { JSX } from "react";

import type { ControlSize } from "../../forms";
import type { BoxProps } from "../Box";
import { TextControl } from "../TextControl";

/**
 * Input types `TextInput` supports: the ones that take a line of typed text
 */
export type TextInputType = "email" | "number" | "password" | "search" | "tel" | "text" | "url";

/**
 * Props for `TextInput`: its own props plus every native input prop
 */
export interface TextInputProps extends Omit<BoxProps<"input">, "as" | "children" | "size" | "type"> {
  /**
   * Height of the input, matching the `Button` sizes. Takes the place of the native `size` attribute. Defaults
   * to `md`.
   */
  size?: ControlSize;

  /**
   * Kind of text the input takes. Defaults to `text`.
   */
  type?: TextInputType;
}

/**
 * Themed single-line text input. Inside a `Field` it takes its label, description, error, and required and
 * disabled state from the field; on its own it needs an `aria-label`.
 *
 * @example
 * <Field label="Email">
 *   <TextInput autoComplete="email" type="email" />
 * </Field>
 */
export function TextInput({ size = "md", type = "text", ...rest }: TextInputProps): JSX.Element {
  return <TextControl {...rest} as="input" size={size} type={type} />;
}
