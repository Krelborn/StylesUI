/**
 * Tests whether an option's text contains the typed text, ignoring case, accents and the typed text's surrounding
 * spaces: an `Autocomplete`'s default filter
 *
 * @param textValue the option's text
 * @param inputValue the typed text
 * @returns true when the option shows
 */
export function containsText(textValue: string, inputValue: string): boolean {
  return foldText(textValue).includes(foldText(inputValue.trim()));
}

/**
 * Reduces text to what matching compares
 *
 * @param text any text
 * @returns the text in lower case with its accents removed
 */
function foldText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
}
