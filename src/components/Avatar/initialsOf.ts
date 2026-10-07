/**
 * Picks the initials an avatar shows for a name
 *
 * @param name a person's or team's name, a handle such as "@plee", or a path such as "acme/web-team"
 * @returns the first letter of each of the first two words, or the first two letters of a one-word name, upper-cased.
 *   Words are separated by anything that is not a letter, mark or digit in any script, and letters are counted by
 *   code point. Empty when the name has no letters or digits.
 */
export function initialsOf(name: string): string {
  const words = name.split(/[^\p{L}\p{M}\p{N}]+/u).filter((word) => word !== "");

  if (words.length === 0) {
    return "";
  }

  const letters = words.length === 1 ? Array.from(words[0]).slice(0, 2) : words.slice(0, 2).map(firstCodePoint);

  return letters.join("").toUpperCase();
}

function firstCodePoint(word: string): string {
  return String.fromCodePoint(word.codePointAt(0) ?? 0);
}
