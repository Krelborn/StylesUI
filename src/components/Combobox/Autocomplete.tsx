import { clsx } from "clsx";
import type { ChangeEvent, CSSProperties, FocusEvent, JSX, KeyboardEvent, MouseEvent, ReactNode } from "react";

import type { ControlSize } from "../../forms";
import { useFieldControl } from "../../forms";
import { anchorNameFor, mergeProps } from "../../overlays";
import type { BoxProps } from "../Box";
import { Box } from "../Box";
import { ChevronDownIcon } from "../Icon";
import { TextControl } from "../TextControl";
import { VisuallyHidden } from "../VisuallyHidden";

import styles from "./Combobox.module.css";
import type { ComboboxFilter } from "./ComboboxContext";
import type { ComboboxPlacement } from "./ComboboxPopup";
import { ComboboxPopup } from "./ComboboxPopup";
import { handleAutocompleteKey } from "./autocompleteKeys";
import { containsText } from "./containsText";
import { useAutocompleteText } from "./useAutocompleteText";
import { useComboboxList } from "./useComboboxList";
import { useResultsAnnouncement } from "./useResultsAnnouncement";

interface AutocompleteOwnProps {
  /**
   * The `ComboboxOption`s
   */
  children?: ReactNode;

  /**
   * The text the input starts with when `inputValue` is not given. Defaults to the selected option's text.
   */
  defaultInputValue?: string;

  /**
   * The option selected at first, which leaves the selection uncontrolled. Defaults to none.
   */
  defaultValue?: string | null;

  /**
   * Whether an option shows for the typed text. Defaults to the option's text containing it, ignoring case and
   * accents. Null shows every option rendered, for a list filtered elsewhere, such as on a server; typing then makes no
   * option active, since the options for the text are still to come.
   */
  filter?: ComboboxFilter | null;

  /**
   * The text in the input, which makes it controlled: update it from `onInputValueChange`
   */
  inputValue?: string;

  /**
   * Adds a hidden input that submits the selected value with a form under this name
   */
  name?: string;

  /**
   * Called with the text as the user types, with an option's text when they commit it, and with the selected
   * option's text, or none, when focus leaves
   */
  onInputValueChange?: (inputValue: string) => void;

  /**
   * Called with the value of the option the user commits, or null when they clear the input with Escape
   */
  onValueChange?: (value: string | null) => void;

  /**
   * Where the list opens. It flips to the other side when there is no room. Defaults to `bottom-start`.
   */
  placement?: ComboboxPlacement;

  /**
   * What the live region says, and the empty list shows, for a number of matching options. Defaults to English:
   * "No results", "1 result", "12 results".
   */
  resultsLabel?: (count: number) => string;

  /**
   * Height of the input, matching the `Button` sizes. Takes the place of the native `size` attribute. Defaults to
   * `md`.
   */
  size?: ControlSize;

  /**
   * The selected option, or null for none, which makes the selection controlled: update it from `onValueChange`
   */
  value?: string | null;
}

/**
 * Props for `Autocomplete`: its own props plus every `input` prop except those the combobox pattern sets
 */
export interface AutocompleteProps
  extends
    AutocompleteOwnProps,
    Omit<
      BoxProps<"input">,
      | "aria-activedescendant"
      | "aria-autocomplete"
      | "aria-controls"
      | "aria-expanded"
      | "as"
      | "children"
      | "dangerouslySetInnerHTML"
      | "defaultValue"
      | "role"
      | "size"
      | "type"
      | "value"
      | keyof AutocompleteOwnProps
    > {}

/**
 * A text input that filters a list of options as the user types, following the WAI-ARIA combobox pattern with list
 * autocomplete, to choose one of many options by typing part of its name. Typing opens the list and makes the first
 * match active; the arrow keys move through it; Enter or a click chooses an option, putting its text in the input;
 * Escape closes the list, and then clears the input. Only an option can be the value: when focus leaves, the input shows
 * the selected option's text again. The number of matches is announced once typing pauses. Inside a `Field` it takes
 * its label, description, error, and required and disabled state from the field; outside one, give it an `aria-label`.
 *
 * @example
 * <Field label="Country">
 *   <Autocomplete name="country" onValueChange={setCountry} value={country}>
 *     <ComboboxOption value="fr">France</ComboboxOption>
 *     <ComboboxOption value="jp">Japan</ComboboxOption>
 *   </Autocomplete>
 * </Field>
 */
export function Autocomplete({
  children,
  className,
  defaultInputValue,
  defaultValue = null,
  filter = containsText,
  inputValue,
  name,
  onInputValueChange,
  onValueChange,
  placement = "bottom-start",
  resultsLabel = defaultResultsLabel,
  size = "md",
  value,
  ...rest
}: AutocompleteProps): JSX.Element {
  const fieldControl = useFieldControl(rest);
  const text = useAutocompleteText({ defaultInputValue, inputValue, onInputValueChange });
  const list = useComboboxList({
    controlId: fieldControl.id,
    defaultValue,
    filter,
    onCommit: text.commit,
    onValueChange,
    query: text.query,
    value,
  });
  const { announceCount, announcement } = useResultsAnnouncement(resultsLabel, list.countShown);
  const shownText = text.shownText(list.selectedContent?.text);
  const anchorStyle: CSSProperties = { anchorName: anchorNameFor(list.listId) };

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const typed = event.currentTarget.value;

    text.edit(typed);
    list.openList("none", "keyboard");
    list.matchFirst(typed);
    announceCount();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (!event.defaultPrevented && handleAutocompleteKey(event, list, { commit: text.commit, shown: shownText })) {
      event.preventDefault();
    }
  }

  function handleClick(event: MouseEvent<HTMLInputElement>): void {
    if (!event.defaultPrevented && !list.open) {
      list.openList("none", "pointer");
    }
  }

  function handleBlur(_event: FocusEvent<HTMLInputElement>): void {
    list.close();
    text.restore(list.selectedContent?.text);
  }

  return (
    <>
      <Box
        as="span"
        className={styles.inputFrame}
        data-disabled={fieldControl.disabled === true ? "" : undefined}
        data-size={size}
      >
        <TextControl
          autoComplete="off"
          {...mergeProps(rest, {
            onBlur: handleBlur,
            onChange: handleChange,
            onClick: handleClick,
            onKeyDown: handleKeyDown,
            style: anchorStyle,
          })}
          as="input"
          className={clsx(styles.input, className)}
          id={list.controlId}
          role="combobox"
          size={size}
          type="text"
          value={shownText}
          aria-activedescendant={list.activeDescendant}
          aria-autocomplete="list"
          aria-controls={list.listId}
          aria-expanded={list.open}
        />
        <ChevronDownIcon className={styles.chevron} />
      </Box>
      <ComboboxPopup
        aria-label={rest["aria-label"]}
        aria-labelledby={rest["aria-labelledby"]}
        disabled={fieldControl.disabled}
        emptyMessage={resultsLabel(0)}
        list={list}
        name={name}
        placement={placement}
      >
        {children}
      </ComboboxPopup>
      <VisuallyHidden aria-live="polite">{announcement}</VisuallyHidden>
    </>
  );
}

/**
 * Says how many options match, in English
 *
 * @param count the number of matching options
 * @returns "No results", "1 result" or "12 results"
 */
function defaultResultsLabel(count: number): string {
  if (count === 0) {
    return "No results";
  }

  return count === 1 ? "1 result" : `${count} results`;
}
