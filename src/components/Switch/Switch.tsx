import type { JSX, ReactNode } from "react";

import type { BoxProps } from "../Box";
import { ChoiceControl } from "../ChoiceControl";

/**
 * Props for `Switch`: its own props plus every native input prop. `className` and `style` go to the wrapping
 * label; `ref` and every other prop go to the input.
 */
export interface SwitchProps extends Omit<
  BoxProps<"input">,
  "as" | "children" | "dangerouslySetInnerHTML" | "role" | "type"
> {
  /**
   * Label shown beside the track, which names the switch. Without it, give the switch an accessible name, for
   * example with `aria-label` or the `label` of the `Field` around it. It is inline content, as a `label` holds: a child
   * laid out as a block drops below the track.
   */
  children?: ReactNode;
}

/**
 * Themed on/off switch: a native checkbox with the `switch` role, inside the label that names it. Use it for a
 * setting that takes effect at once, and `Checkbox` for a choice submitted with a form. When it is required it
 * shows an asterisk after its label. Inside a `Field` it takes its description, error, and required and disabled
 * state from the field; give it either children or the field's `label`, not both.
 *
 * @example
 * <Switch defaultChecked={true} name="notifications">Email notifications</Switch>
 */
export function Switch(props: SwitchProps): JSX.Element {
  return <ChoiceControl {...props} kind="switch" />;
}
