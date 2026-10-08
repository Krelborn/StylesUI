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
 * @returns each option that is not hidden or inert, in document order, with its value, its type-ahead text and
 *   whether it is disabled
 */
export function renderedOptions(listbox: HTMLElement): RenderedOption[] {
  const options = Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"]')).filter(
    (element) => element.closest("[hidden], [inert]") === null
  );

  return options.map((element) => ({
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
 * @returns their text, joined by spaces; undefined when it names no element in the option's document or shadow root
 */
function labelledByText(option: HTMLElement): string | undefined {
  const root = option.getRootNode();
  const scope = root instanceof ShadowRoot ? root : option.ownerDocument;
  const labels = (option.getAttribute("aria-labelledby") ?? "")
    .split(/\s+/)
    .map((id) => scope.getElementById(id))
    .filter((label) => label !== null);

  return labels.length === 0 ? undefined : labels.map((label) => label.textContent).join(" ");
}
