const resetAfterMilliseconds = 500;

/**
 * The text typed so far for type-ahead, and when its last character was typed
 */
export interface TypeAheadQuery {
  /**
   * The characters typed so far
   */
  text: string;

  /**
   * When the last character was typed, in milliseconds
   */
  time: number;
}

/**
 * Adds a typed character to a type-ahead query
 *
 * @param query the query so far, or null when there is none
 * @param character the character typed
 * @param time when it was typed, in milliseconds
 * @returns the query with the character added, or a new query of that character when the last one came more than
 *   500ms before
 */
export function extendTypeAheadQuery(query: TypeAheadQuery | null, character: string, time: number): TypeAheadQuery {
  const continues = query !== null && time - query.time <= resetAfterMilliseconds;

  return { text: continues ? query.text + character : character, time };
}

/**
 * Finds the item type-ahead moves to
 *
 * @param labels each item's text, in order
 * @param currentIndex the active item, or -1 for none
 * @param text the typed text
 * @returns the index of the first label from the current item on that starts with the text, ignoring case and
 *   wrapping round. A single character starts after the current item, so typing it again moves on; longer text starts
 *   at it, so the current item keeps matching while it can. Null when no label matches.
 */
export function typeAheadTarget(labels: readonly string[], currentIndex: number, text: string): number | null {
  const prefix = text.toLocaleLowerCase();
  const start = text.length === 1 ? currentIndex + 1 : Math.max(currentIndex, 0);

  for (let offset = 0; offset < labels.length; offset += 1) {
    const index = (start + offset) % labels.length;

    if (labels[index].trim().toLocaleLowerCase().startsWith(prefix)) {
      return index;
    }
  }

  return null;
}
