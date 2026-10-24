import type { KeyboardEvent } from "react";

import { hasModifier } from "../../menus";

import { isAltArrow } from "./isAltArrow";
import type { ComboboxList, OpeningActive } from "./useComboboxList";

const closedKeyOpenings: Partial<Record<string, OpeningActive>> = {
  " ": "selected",
  ArrowDown: "selected",
  ArrowUp: "selected",
  End: "last",
  Enter: "selected",
  Home: "first",
};

/**
 * Acts on a key pressed on a `Combobox`'s field
 *
 * @param event the key event
 * @param list the combobox's list
 * @returns whether the key was handled, so its default should be prevented
 */
export function handleComboboxKey(event: KeyboardEvent<HTMLElement>, list: ComboboxList): boolean {
  return list.open ? handleOpenKey(event, list) : handleClosedKey(event, list);
}

function handleClosedKey(event: KeyboardEvent<HTMLElement>, list: ComboboxList): boolean {
  const opening = closedKeyOpenings[event.key];

  if (isAltArrow(event, "ArrowDown")) {
    list.openList("none", "keyboard");

    return true;
  }

  if (hasModifier(event)) {
    return false;
  }

  if (opening !== undefined) {
    list.openList(opening, "keyboard");

    return true;
  }

  if (Array.from(event.key).length !== 1) {
    return false;
  }

  list.openList("selected", "keyboard");
  list.typeAhead(event.key);

  return true;
}

function handleOpenKey(event: KeyboardEvent<HTMLElement>, list: ComboboxList): boolean {
  if (event.key === "Tab" || event.key === "Escape") {
    list.close();

    return event.key === "Escape";
  }

  if (isAltArrow(event, "ArrowUp")) {
    list.commitActive();

    return true;
  }

  if (hasModifier(event)) {
    return false;
  }

  if (event.key === "Enter" || (event.key === " " && !list.isTypingAhead())) {
    list.commitActive();

    return true;
  }

  return list.moveByKey(event.key) || list.typeAhead(event.key);
}
