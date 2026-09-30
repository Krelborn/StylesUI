import type { JSX, ReactNode } from "react";
import { useId } from "react";
import { clsx } from "clsx";

import { FieldContext, hasContent } from "../../forms";
import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Fieldset.module.css";

/**
 * Props for `Fieldset`: its own props plus every native fieldset prop
 */
export interface FieldsetProps extends Omit<BoxProps<"fieldset">, "aria-labelledby" | "as"> {
  /**
   * Not accepted: the `label` always names the group
   */
  "aria-labelledby"?: never;

  /**
   * Supporting text shown below the label, linked to the group with `aria-describedby`
   */
  description?: ReactNode;

  /**
   * Error message shown below the controls, linked to the group with `aria-describedby`. It is not a live region.
   */
  error?: ReactNode;

  /**
   * Label for the group, rendered as its `legend`, which names the group
   */
  label: ReactNode;
}

/**
 * Groups related form controls under a legend, with an optional description and error for the group. The
 * native `disabled` prop disables every control inside and dims the legend. Controls inside do not take the
 * state of a surrounding `Field`.
 *
 * @example
 * <Fieldset description="Choose how we reach you" label="Notifications">
 *   <Checkbox>Email</Checkbox>
 *   <Checkbox>Text message</Checkbox>
 * </Fieldset>
 */
export function Fieldset({
  "aria-describedby": consumerDescribedBy,
  children,
  className,
  description,
  error,
  label,
  ...rest
}: FieldsetProps): JSX.Element {
  const generatedId = useId();
  const legendId = `${generatedId}-legend`;
  const descriptionId = `${generatedId}-description`;
  const errorId = `${generatedId}-error`;
  const hasDescription = hasContent(description);
  const hasError = hasContent(error);
  const describedBy = [hasDescription && descriptionId, hasError && errorId, consumerDescribedBy]
    .filter(Boolean)
    .join(" ");

  return (
    <Box
      {...rest}
      as="fieldset"
      className={clsx(styles.fieldset, className)}
      aria-describedby={describedBy === "" ? undefined : describedBy}
      aria-labelledby={legendId}
    >
      <Box as="legend" className={styles.legend} id={legendId}>
        {label}
      </Box>
      {hasDescription && (
        <Box className={styles.description} id={descriptionId}>
          {description}
        </Box>
      )}
      <FieldContext.Provider value={null}>{children}</FieldContext.Provider>
      {hasError && (
        <Box className={styles.error} id={errorId}>
          {error}
        </Box>
      )}
    </Box>
  );
}
