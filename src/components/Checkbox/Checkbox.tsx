import type { JSX, ReactNode } from "react";

import type { BoxProps } from "../Box";
import { ChoiceControl } from "../ChoiceControl";

/**
 * Props for `Checkbox`: its own props plus every native input prop. `className` and `style` go to the wrapping
 * label; `ref` and every other prop go to the input.
 */
export interface CheckboxProps extends Omit<BoxProps<"input">, "as" | "children" | "dangerouslySetInnerHTML" | "type"> {
  /**
   * Label shown beside the box, which names the checkbox. Without it, give the checkbox an accessible name, for
   * example with `aria-label` or the `label` of the `Field` around it. It is inline content, as a `label` holds: a child
   * laid out as a block drops below the box, so put a description after the checkbox, padded by `var(--sui-space-6)`.
   */
  children?: ReactNode;
}

/**
 * Themed native checkbox inside the label that names it. When it is required it shows an asterisk after its
 * label. Inside a `Field` it takes its description, error, and required and disabled state from the field; give
 * it either children or the field's `label`, not both.
 *
 * @example
 * <Checkbox name="updates">Send me product updates</Checkbox>
 */
export function Checkbox(props: CheckboxProps): JSX.Element {
  return <ChoiceControl {...props} kind="checkbox" />;
}
