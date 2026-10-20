import { idSegment } from "../../accessibility";

/**
 * Builds the id of an item's toggle
 *
 * @param baseId the `Accordion`'s generated id
 * @param value the item's value
 * @returns an id unique to the value within its `Accordion`, whatever characters the value holds
 */
export function toggleId(baseId: string, value: string): string {
  return `${baseId}-toggle-${idSegment(value)}`;
}

/**
 * Builds the id of an item's panel
 *
 * @param baseId the `Accordion`'s generated id
 * @param value the item's value
 * @returns an id unique to the value within its `Accordion`, whatever characters the value holds
 */
export function panelId(baseId: string, value: string): string {
  return `${baseId}-panel-${idSegment(value)}`;
}
