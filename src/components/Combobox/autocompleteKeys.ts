import type { KeyboardEvent } from "react";

import { hasModifier } from "../../menus";

import { isAltArrow } from "./isAltArrow";
import type { ComboboxList } from "./useComboboxList";

/**
 * The input's text, which Enter and Escape read and Escape clears
 */
interface InputText {
  /**
   * Puts text in the input
   */
  commit: (text: string) => void;

  /**
   * Whether the input holds text typed since the last choice
   */
  editing: boolean;

  /**
   * The text the input shows
   */
  shown: string;
}

/**
 * Acts on a key pressed in an `Autocomplete`'s input, leaving typing, the caret keys, keys that compose text in an input
 * method, and Enter with no active option and no unchosen text, to the input
 *
 * @param event the key event
 * @param list the autocomplete's list
 * @param text the input's text: Enter does not submit text typed since the last choice, and Escape on the closed input
 *   clears it with the selection
 * @returns whether the key was handled, so its default should be prevented
 */
export function handleAutocompleteKey(event: KeyboardEvent<HTMLElement>, list: ComboboxList, text: InputText): boolean {
  // Safari sends the Enter that ends a composition after compositionend, as key code 229
  if (event.nativeEvent.isComposing || event.keyCode === 229) {
    return false;
  }

  if (isAltArrow(event, "ArrowDown")) {
    if (!list.open) {
      list.openList("none", "keyboard");
    }

    return true;
  }

  if (isAltArrow(event, "ArrowUp")) {
    const wasOpen = list.open;

    list.commitActive();

    return wasOpen;
  }

  return !hasModifier(event) && handleUnmodifiedKey(event.key, list, text);
}

function handleUnmodifiedKey(key: string, list: ComboboxList, text: InputText): boolean {
  if (key === "ArrowDown" || key === "ArrowUp") {
    return moveOrOpen(key, list);
  }

  if (key === "Enter") {
    return commitOrHold(list, text);
  }

  if (key === "Escape") {
    return closeOrClear(list, text);
  }

  if (key === "Tab") {
    list.close();
  }

  return false;
}

function moveOrOpen(key: "ArrowDown" | "ArrowUp", list: ComboboxList): boolean {
  if (list.open) {
    return list.moveByKey(key);
  }

  list.openList(key === "ArrowDown" ? "first" : "last", "keyboard");

  return true;
}

function commitOrHold(list: ComboboxList, text: InputText): boolean {
  if (list.activeDescendant !== undefined) {
    list.commitActive();

    return true;
  }

  // Text typed since the last choice is not a value, so it submits no form
  return text.editing && text.shown !== "";
}

function closeOrClear(list: ComboboxList, text: InputText): boolean {
  if (list.open) {
    list.close();

    return true;
  }

  if (text.shown === "" && list.selectedValue === null) {
    return false;
  }

  list.select(null);
  text.commit("");

  return true;
}
