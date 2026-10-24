import { useState } from "react";

interface UseAutocompleteTextOptions {
  /**
   * The text the input starts with when uncontrolled
   */
  defaultInputValue: string | undefined;

  /**
   * The input's text when controlled
   */
  inputValue: string | undefined;

  /**
   * Called with each new text
   */
  onInputValueChange: ((inputValue: string) => void) | undefined;

  /**
   * The selected option's text, or undefined for none or one that has not rendered
   */
  selectedText: string | undefined;
}

/**
 * An `Autocomplete`'s text and the ways it changes
 */
interface AutocompleteText {
  /**
   * Puts an option's text in the input as the user commits it
   */
  commit: (text: string) => void;

  /**
   * Takes the text the user typed
   */
  edit: (text: string) => void;

  /**
   * Whether the input holds text other than the selection's: typed since the last choice, or, when controlled, any
   * text the parent gives that is not the selected option's
   */
  editing: boolean;

  /**
   * The text the options are filtered by: the input's while editing, or empty while it shows the selection
   */
  query: string;

  /**
   * Shows the selection's text again, after editing that chose nothing
   */
  restore: () => void;

  /**
   * The text the input shows
   */
  shown: string;
}

/**
 * Holds what the user is typing in an `Autocomplete`, apart from the selection's text, which the input shows otherwise
 *
 * @param options the controlled or starting text, the change callback and the selection's text
 * @returns the text and the ways it changes
 */
export function useAutocompleteText({
  defaultInputValue,
  inputValue,
  onInputValueChange,
  selectedText,
}: UseAutocompleteTextOptions): AutocompleteText {
  const [editingText, setEditingText] = useState<string | null>(defaultInputValue ?? null);
  const shown = inputValue ?? editingText ?? selectedText ?? "";
  // A parent's text is the user's own unless it is the selection's, whether or not the change handler has run yet
  const editing = inputValue === undefined ? editingText !== null : inputValue !== (selectedText ?? "");

  function edit(text: string): void {
    setEditingText(text);
    onInputValueChange?.(text);
  }

  function commit(text: string): void {
    setEditingText(null);
    onInputValueChange?.(text);
  }

  function restore(): void {
    if (editing) {
      commit(selectedText ?? "");
    }
  }

  return { commit, edit, editing, query: editing ? shown : "", restore, shown };
}
