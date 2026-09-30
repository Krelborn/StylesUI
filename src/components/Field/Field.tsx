import type { JSX, ReactNode } from "react";
import { useId } from "react";
import { clsx } from "clsx";

import type { FieldContextValue } from "../../forms";
import { FieldContext, hasContent } from "../../forms";
import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";
import { RequiredIndicator } from "../RequiredIndicator";

import styles from "./Field.module.css";

interface FieldOwnProps {
  /**
   * `id` of the control, which the label points at. Wins over an `id` set on the control. Defaults to a
   * generated id.
   */
  controlId?: string;

  /**
   * Supporting text shown between the label and the control, linked to the control with `aria-describedby`
   */
  description?: ReactNode;

  /**
   * Disables the control and dims the label. Defaults to `false`.
   */
  disabled?: boolean;

  /**
   * Error message shown below the control. Marks the control `aria-invalid` and is linked to it with
   * `aria-describedby`. It is not a live region.
   */
  error?: ReactNode;

  /**
   * Label for the control. Omit only for a control that labels itself.
   */
  label?: ReactNode;

  /**
   * Sets `required` on the control and adds an `aria-hidden` asterisk to the label. Defaults to `false`.
   */
  required?: boolean;
}

/**
 * Props for `Field`: its own props plus every prop supported by the element given in `as`
 */
// Spelled out rather than PolymorphicProps<E, FieldOwnProps>, whose own props react-docgen cannot read for the docs
export type FieldProps<E extends BoxElement = "div"> = FieldOwnProps & Omit<BoxProps<E>, keyof FieldOwnProps>;

/**
 * Wraps one form control with a label, a description and an error message, and links them to the control so the
 * label and error association is written once. Renders the label, description, control and error in that order.
 *
 * @example
 * <Field description="We only use it to send receipts" label="Email" required={true}>
 *   <TextInput />
 * </Field>
 */
export function Field<E extends BoxElement = "div">({
  as,
  className,
  controlId,
  description,
  disabled = false,
  error,
  label,
  required = false,
  ...rest
}: FieldProps<E>): JSX.Element {
  // Widened as in Box: FieldProps<E> already guarantees the props match `as`
  const { children, ...boxProps } = rest as BoxProps<"div">;
  const generatedId = useId();
  const descriptionId = `${generatedId}-description`;
  const errorId = `${generatedId}-error`;
  const hasDescription = hasContent(description);
  const hasError = hasContent(error);
  const describedBy = [hasDescription && descriptionId, hasError && errorId].filter(Boolean).join(" ");
  const fieldContext: FieldContextValue = {
    controlId: controlId ?? generatedId,
    describedBy: describedBy === "" ? undefined : describedBy,
    disabled,
    invalid: hasError,
    required,
  };

  return (
    <Box
      {...boxProps}
      as={as as "div"}
      className={clsx(styles.field, className)}
      data-disabled={disabled ? "" : undefined}
    >
      {hasContent(label) && (
        <Box as="label" className={styles.label} htmlFor={fieldContext.controlId}>
          {label}
          {required && <RequiredIndicator />}
        </Box>
      )}
      {hasDescription && (
        <Box className={styles.description} id={descriptionId}>
          {description}
        </Box>
      )}
      <FieldContext.Provider value={fieldContext}>{children}</FieldContext.Provider>
      {hasError && (
        <Box className={styles.error} id={errorId}>
          {error}
        </Box>
      )}
    </Box>
  );
}
