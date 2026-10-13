import { clsx } from "clsx";
import type { JSX, ReactNode } from "react";

import { hasContent, useFieldControl } from "../../forms";
import type { BoxProps } from "../Box";
import { Box } from "../Box";
import { RequiredIndicator } from "../RequiredIndicator";

import styles from "./ChoiceControl.module.css";

type ChoiceControlKind = "checkbox" | "radio" | "switch";

interface ChoiceControlProps extends Omit<BoxProps<"input">, "as" | "children" | "dangerouslySetInnerHTML" | "type"> {
  /**
   * Label shown beside the control, which names it
   */
  children?: ReactNode;

  /**
   * Control to draw. A switch is a checkbox input with the `switch` role, which replaces any `role` given.
   */
  kind: ChoiceControlKind;
}

/**
 * Themed native checkbox or radio input inside the `label` that names it, shared by `Checkbox`, `Switch` and
 * `Radio`. `className` and `style` go to the label; `ref` and every other prop go to the input. Inside a `Field`
 * the input takes its id, description, and invalid, disabled and required state from the field. A required
 * checkbox or switch with a label shows an asterisk after it.
 */
export function ChoiceControl({
  children,
  className,
  kind,
  role,
  style,
  ...inputProps
}: ChoiceControlProps): JSX.Element {
  const fieldControlProps = useFieldControl(inputProps);
  const hasText = hasContent(children);

  return (
    <Box
      as="label"
      className={clsx(styles.choiceControl, { [styles.withText]: hasText }, className)}
      style={style}
      data-kind={kind}
    >
      <Box
        {...inputProps}
        {...fieldControlProps}
        as="input"
        className={styles.input}
        role={kind === "switch" ? "switch" : role}
        type={kind === "radio" ? "radio" : "checkbox"}
      />
      {hasText && (
        <Box as="span" className={styles.text}>
          {children}
          {fieldControlProps.required && kind !== "radio" && <RequiredIndicator />}
        </Box>
      )}
    </Box>
  );
}
