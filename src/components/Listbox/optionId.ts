/**
 * Builds the id of the option for a value
 *
 * @param baseId the `Listbox`'s generated id
 * @param value the option's value
 * @returns an id unique to the value within its `Listbox`, whatever characters the value holds
 */
export function optionId(baseId: string, value: string): string {
  return `${baseId}-option-${encodeURIComponent(value)}`;
}
