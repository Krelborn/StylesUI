/**
 * Builds the `anchor-name` that ties an overlay to its trigger
 *
 * @param id the overlay's generated id
 * @returns a dashed ident unique to the id, with the punctuation React's ids contain removed
 */
export function anchorNameFor(id: string): string {
  return `--sui-overlay-${id.replace(/[^\w-]/g, "")}`;
}
