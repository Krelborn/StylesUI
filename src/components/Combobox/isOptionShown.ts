import type { ComboboxFilter } from "./ComboboxContext";

/**
 * Whether an option shows for the typed text
 *
 * @param filter the combobox's filter, or null to show every option
 * @param query the typed text
 * @param text the option's text
 * @returns true when there is no filter or no text, or the filter accepts the option
 */
export function isOptionShown(filter: ComboboxFilter | null, query: string, text: string): boolean {
  return filter === null || query === "" || filter(text, query);
}
