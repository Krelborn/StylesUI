import type { AriaAttributes } from "react";
import { useContext } from "react";

import { FieldContext } from "./FieldContext";

/**
 * The props a form control passes to `useFieldControl` and renders from what it returns
 */
export interface FieldControlProps {
  /**
   * Ids of the elements that describe the control, separated by spaces
   */
  "aria-describedby"?: AriaAttributes["aria-describedby"];

  /**
   * Whether the control's value fails validation
   */
  "aria-invalid"?: AriaAttributes["aria-invalid"];

  /**
   * Whether the control is disabled
   */
  disabled?: boolean;

  /**
   * The control's `id`, which a label points at
   */
  id?: string;

  /**
   * Whether the control must be filled in
   */
  required?: boolean;
}

/**
 * Merges the state of the surrounding `Field` into a form control's own props
 *
 * @param props the control's own `aria-describedby`, `aria-invalid`, `disabled`, `id` and `required`
 * @returns the props to render on the control. Outside a `Field` they are the given props. Inside one, the
 *   field's control id replaces the control's own `id`, the field's description and error ids come before the
 *   control's own `aria-describedby`, and the control's own `aria-invalid`, `disabled` and `required` win over
 *   the field's, which are left absent rather than false.
 */
export function useFieldControl({
  "aria-describedby": ownDescribedBy,
  "aria-invalid": ownInvalid,
  disabled: ownDisabled,
  id: ownId,
  required: ownRequired,
}: FieldControlProps): FieldControlProps {
  const field = useContext(FieldContext);

  if (field === null) {
    return {
      "aria-describedby": ownDescribedBy,
      "aria-invalid": ownInvalid,
      disabled: ownDisabled,
      id: ownId,
      required: ownRequired,
    };
  }

  const describedBy = [field.describedBy, ownDescribedBy].filter(Boolean).join(" ");

  return {
    "aria-describedby": describedBy === "" ? undefined : describedBy,
    "aria-invalid": ownInvalid ?? (field.invalid || undefined),
    disabled: ownDisabled ?? (field.disabled || undefined),
    id: field.controlId,
    required: ownRequired ?? (field.required || undefined),
  };
}
