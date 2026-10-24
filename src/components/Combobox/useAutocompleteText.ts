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
   * The text the options are filtered by: what the user typed, or empty while the input shows the selection
   */
  query: string;

  /**
   * Shows the selection's text again, after typing that chose nothing
   *
   * @param selectedText the selected option's text, or undefined for none
   */
  restore: (selectedText: string | undefined) => void;

  /**
   * The text the input shows
   *
   * @param selectedText the selected option's text, or undefined for none
   */
  shownText: (selectedText: string | undefined) => string;
}

/**
 * Holds what the user is typing in an `Autocomplete`, apart from the selection's text, which the input shows otherwise
 *
 * @param options the controlled or starting text and the change callback
 * @returns the text and the ways it changes
 */
export function useAutocompleteText({
  defaultInputValue,
  inputValue,
  onInputValueChange,
}: UseAutocompleteTextOptions): AutocompleteText {
  const [editingText, setEditingText] = useState<string | null>(defaultInputValue ?? null);

  function edit(text: string): void {
    setEditingText(text);
    onInputValueChange?.(text);
  }

  function commit(text: string): void {
    setEditingText(null);
    onInputValueChange?.(text);
  }

  function restore(selectedText: string | undefined): void {
    if (editingText !== null) {
      commit(selectedText ?? "");
    }
  }

  function shownText(selectedText: string | undefined): string {
    return inputValue ?? editingText ?? selectedText ?? "";
  }

  return { commit, edit, query: editingText ?? "", restore, shownText };
}
