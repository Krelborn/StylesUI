import type { JSX } from "react";

import type { ControlSize } from "../../forms";
import type { BoxProps } from "../Box";
import { TextControl } from "../TextControl";

/**
 * Props for `Select`: its own props plus every native select prop
 */
export interface SelectProps extends Omit<BoxProps<"select">, "as" | "multiple" | "size"> {
  /**
   * Height of the select, matching the `Button` sizes. Takes the place of the native `size` attribute. Defaults
   * to `md`.
   */
  size?: ControlSize;
}

/**
 * Themed native select that chooses one option from a list. Its children are native `option` and `optgroup`
 * elements. Inside a `Field` it takes its label, description, error, and required and disabled state from the
 * field. Outside one, give it an accessible name, for example with `aria-label`.
 *
 * @example
 * <Field label="Country">
 *   <Select defaultValue="fr">
 *     <option value="fr">France</option>
 *     <option value="jp">Japan</option>
 *   </Select>
 * </Field>
 */
export function Select({ size = "md", ...rest }: SelectProps): JSX.Element {
  return <TextControl {...rest} as="select" size={size} />;
}
