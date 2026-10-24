import type { KeyboardEvent } from "react";

/**
 * Whether a key is an arrow pressed with Alt alone, which opens or commits a combobox's list
 *
 * @param event the key event
 * @param key the arrow
 * @returns true for that arrow with Alt and neither Ctrl nor Meta
 */
export function isAltArrow(event: KeyboardEvent<HTMLElement>, key: "ArrowDown" | "ArrowUp"): boolean {
  return event.key === key && event.altKey && !event.ctrlKey && !event.metaKey;
}
