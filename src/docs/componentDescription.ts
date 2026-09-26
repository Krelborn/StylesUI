const exampleTag = /^@example[^\S\n]*\n([\s\S]*?)\s*(?=^@|(?![\s\S]))/gm;

/**
 * Reads a component's JSDoc description, as extracted by react-docgen, as Markdown for its docs page
 *
 * @param component the component a story file's meta documents
 * @returns the description with each `@example` tag as a TSX code block, or an empty string when
 *   the component has no docgen info
 */
export function componentDescription(component: unknown): string {
  if ((typeof component !== "function" && typeof component !== "object") || component === null) {
    return "";
  }

  const { __docgenInfo: docgenInfo } = component as { __docgenInfo?: { description?: string } };

  return (docgenInfo?.description ?? "").replace(exampleTag, "```tsx\n$1\n```\n\n").trimEnd();
}
