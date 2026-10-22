/**
 * Whether a key was pressed with Alt, Ctrl or Meta, which leaves it to the browser and the app
 *
 * @param event the key event
 * @returns true when any of the three was held
 */
export function hasModifier(event: Pick<KeyboardEvent, "altKey" | "ctrlKey" | "metaKey">): boolean {
  return event.altKey || event.ctrlKey || event.metaKey;
}
