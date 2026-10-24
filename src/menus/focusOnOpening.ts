import { renderedItems } from "./renderedItems";

/**
 * Where focus goes as a menu opens: its first or last item, or the menu itself
 */
export type OpeningFocus = "first" | "last" | "menu";

/**
 * Moves focus into a menu that has just opened
 *
 * @param menu the menu element
 * @param openingFocus where focus goes; a menu with no items takes it itself
 */
export function focusOnOpening(menu: HTMLElement, openingFocus: OpeningFocus): void {
  const items = renderedItems(menu);
  const targets: Record<OpeningFocus, HTMLElement | undefined> = { first: items.at(0), last: items.at(-1), menu };

  (targets[openingFocus] ?? menu).focus();
}
