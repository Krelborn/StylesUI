import { idSegment } from "../../accessibility";

/**
 * Builds the id of the tab for a value
 *
 * @param baseId the `Tabs`'s generated id
 * @param value the tab's value
 * @returns an id unique to the value within its `Tabs`, whatever characters the value holds
 */
export function tabId(baseId: string, value: string): string {
  return `${baseId}-tab-${idSegment(value)}`;
}

/**
 * Builds the id of the panel for a value
 *
 * @param baseId the `Tabs`'s generated id
 * @param value the panel's value
 * @returns an id unique to the value within its `Tabs`, whatever characters the value holds
 */
export function panelId(baseId: string, value: string): string {
  return `${baseId}-panel-${idSegment(value)}`;
}
