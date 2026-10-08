/**
 * An option as a listbox renders it
 */
export interface RenderedOption {
  /**
   * Whether the option can be reached but not selected
   */
  disabled: boolean;

  /**
   * The option element
   */
  element: HTMLElement;

  /**
   * The text type-ahead matches: the option's `textValue`, else the text of the elements its `aria-labelledby` names,
   * else its own text
   */
  textValue: string;

  /**
   * The option's value
   */
  value: string;
}

/**
 * Reads the options a listbox renders
 *
 * @param listbox the listbox element
 * @returns each option in document order, with its value, its type-ahead text and whether it is disabled
 */
export function renderedOptions(listbox: HTMLElement): RenderedOption[] {
  return Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"]'), (element) => ({
    disabled: element.getAttribute("aria-disabled") === "true",
    element,
    textValue: element.dataset.textValue ?? labelledByText(element) ?? element.textContent ?? "",
    value: element.dataset.value ?? "",
  }));
}

/**
 * Reads the text of the elements an option's `aria-labelledby` names
 *
 * @param option the option element
 * @returns their text, joined by spaces; undefined when it names no element in the document
 */
function labelledByText(option: HTMLElement): string | undefined {
  const labels = (option.getAttribute("aria-labelledby") ?? "")
    .split(/\s+/)
    .map((id) => option.ownerDocument.getElementById(id))
    .filter((label) => label !== null);

  return labels.length === 0 ? undefined : labels.map((label) => label.textContent).join(" ");
}
