/**
 * Reads the text type-ahead matches for a menu item
 *
 * @param item the item element
 * @returns the text of the elements its `aria-labelledby` names, joined by spaces, so a description or shortcut is
 *   left out; its own text when it names none in its document
 */
export function itemText(item: HTMLElement): string {
  const labels = (item.getAttribute("aria-labelledby") ?? "")
    .split(/\s+/)
    .map((id) => item.ownerDocument.getElementById(id))
    .filter((label) => label !== null);

  return labels.length === 0 ? (item.textContent ?? "") : labels.map((label) => label.textContent).join(" ");
}
