/**
 * Turns any string into text that can sit inside an element id
 *
 * @param value the string, which may hold any characters, unpaired surrogates included
 * @returns letters, digits, hyphens and underscores, different for every different value
 */
export function idSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9-]/g, (character) => `_${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
}
