import { clsx } from "clsx";
import type { FocusEvent, JSX, KeyboardEvent, MouseEvent, ReactNode } from "react";

import type { ControlSize } from "../../forms";
import { useFieldControl } from "../../forms";
import { anchorNameFor } from "../../overlays";
import type { BoxProps } from "../Box";
import { ChevronDownIcon } from "../Icon";
import { TextControl } from "../TextControl";

import styles from "./Combobox.module.css";
import { ComboboxFieldValue } from "./ComboboxFieldValue";
import type { ComboboxPlacement } from "./ComboboxPopup";
import { ComboboxPopup } from "./ComboboxPopup";
import { handleComboboxKey } from "./comboboxKeys";
import { useComboboxList } from "./useComboboxList";

interface ComboboxOwnProps {
  /**
   * The `ComboboxOption`s
   */
  children?: ReactNode;

  /**
   * The option selected at first, which leaves the combobox uncontrolled. Defaults to none.
   */
  defaultValue?: string | null;

  /**
   * Adds a hidden input that submits the selected value with a form under this name
   */
  name?: string;

  /**
   * Called with the value of the option the user commits
   */
  onValueChange?: (value: string) => void;

  /**
   * Shown in the field while no option is selected
   */
  placeholder?: ReactNode;

  /**
   * Where the list opens. It flips to the other side when there is no room. Defaults to `bottom-start`.
   */
  placement?: ComboboxPlacement;

  /**
   * Height of the field, matching the `Button` sizes. Defaults to `md`.
   */
  size?: ControlSize;

  /**
   * The selected option, or null for none, which makes the combobox controlled: update it from `onValueChange`
   */
  value?: string | null;
}

/**
 * Props for `Combobox`: its own props plus every `button` prop except those the combobox pattern sets
 */
export interface ComboboxProps
  extends
    ComboboxOwnProps,
    Omit<
      BoxProps<"button">,
      | "aria-activedescendant"
      | "aria-autocomplete"
      | "aria-controls"
      | "aria-expanded"
      | "aria-haspopup"
      | "as"
      | "defaultValue"
      | "role"
      | "type"
      | "value"
      | keyof ComboboxOwnProps
    > {}

/**
 * A field that opens a list of options to choose one from, following the WAI-ARIA select-only combobox pattern, for
 * options a native `Select` cannot show, such as people with avatars. The field shows the selected option. Down Arrow,
 * Enter, Space or a click opens the list; the arrow keys, Home, End and type-ahead move through it; Enter, Space or a
 * click chooses an option; Escape and Tab close it without choosing. Focus stays on the field. Inside a `Field` it takes
 * its label, description, error, and required and disabled state from the field; outside one, give it an `aria-label`.
 *
 * @example
 * <Field label="Assignee">
 *   <Combobox onValueChange={setAssignee} placeholder="Unassigned" value={assignee}>
 *     <ComboboxOption leading={<Avatar name="Pat Lee" size="xs" />} value="pat">Pat Lee</ComboboxOption>
 *   </Combobox>
 * </Field>
 */
export function Combobox({
  "aria-label": label,
  "aria-labelledby": labelledBy,
  children,
  className,
  defaultValue = null,
  name,
  onBlur,
  onClick,
  onKeyDown,
  onKeyUp,
  onValueChange,
  placeholder,
  placement = "bottom-start",
  size = "md",
  style,
  value,
  ...rest
}: ComboboxProps): JSX.Element {
  const fieldControl = useFieldControl(rest);
  const list = useComboboxList({
    controlId: fieldControl.id,
    defaultValue,
    filter: null,
    onValueChange: ignoreNone(onValueChange),
    query: "",
    value,
  });

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    onKeyDown?.(event);

    if (!event.defaultPrevented && handleComboboxKey(event, list)) {
      event.preventDefault();
    }
  }

  // The button's own Space click would reopen the list Space just closed
  function handleKeyUp(event: KeyboardEvent<HTMLButtonElement>): void {
    onKeyUp?.(event);

    if (event.key === " ") {
      event.preventDefault();
    }
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    onClick?.(event);

    if (!event.defaultPrevented) {
      // Safari does not focus a clicked button, and the list closes when focus leaves the field
      event.currentTarget.focus();
      // A pointer's click counts its presses; one from assistive technology has none
      list.toggleList(event.detail === 0 ? "keyboard" : "pointer");
    }
  }

  function handleBlur(event: FocusEvent<HTMLButtonElement>): void {
    onBlur?.(event);
    list.close();
  }

  return (
    <>
      <TextControl
        {...rest}
        as="button"
        className={clsx(styles.field, className)}
        id={list.controlId}
        onBlur={handleBlur}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a native select cannot hold rich options
        role="combobox"
        size={size}
        style={{ ...style, anchorName: anchorNameFor(list.listId) }}
        type="button"
        aria-activedescendant={list.activeDescendant}
        aria-controls={list.listId}
        aria-expanded={list.open}
        aria-haspopup="listbox"
        aria-label={label}
        aria-labelledby={labelledBy}
      >
        <ComboboxFieldValue placeholder={placeholder} selected={list.selectedContent} />
        <ChevronDownIcon className={styles.chevron} />
      </TextControl>
      <ComboboxPopup
        aria-label={label}
        aria-labelledby={labelledBy}
        disabled={fieldControl.disabled}
        list={list}
        name={name}
        placement={placement}
      >
        {children}
      </ComboboxPopup>
    </>
  );
}

/**
 * Adapts `onValueChange` to the list's, which a `Combobox` never calls with null, since it has no way to clear
 *
 * @param onValueChange the consumer's callback
 * @returns a callback that passes on every value but null
 */
function ignoreNone(onValueChange: ((value: string) => void) | undefined): (value: string | null) => void {
  return (next) => {
    if (next !== null) {
      onValueChange?.(next);
    }
  };
}
