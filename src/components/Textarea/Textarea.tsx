import type { JSX } from "react";

import type { ControlSize } from "../../forms";
import type { BoxProps } from "../Box";
import { TextControl } from "../TextControl";

/**
 * Props for `Textarea`: its own props plus every native textarea prop
 */
export interface TextareaProps extends Omit<BoxProps<"textarea">, "as" | "children"> {
  /**
   * Padding and font size of the textarea, matching the `Button` sizes. Defaults to `md`.
   */
  size?: ControlSize;
}

/**
 * Themed multi-line text input that the user can resize vertically. Set its height with `rows` and its text
 * with `value` or `defaultValue`. Inside a `Field` it takes its label, description, error, and required and
 * disabled state from the field. Outside one, give it an accessible name, for example with `aria-label`.
 *
 * @example
 * <Field label="Message">
 *   <Textarea rows={4} />
 * </Field>
 */
export function Textarea({ size = "md", ...rest }: TextareaProps): JSX.Element {
  return <TextControl {...rest} as="textarea" size={size} />;
}
