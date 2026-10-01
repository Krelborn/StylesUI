import type { ReactNode } from "react";

/**
 * Tells whether a node renders anything, so a `description` or `error` slot can be skipped when it is empty
 *
 * @param node the node to check
 * @returns false for `undefined`, `null`, a boolean and an empty string, otherwise true
 */
export function hasContent(node: ReactNode): boolean {
  return node !== undefined && node !== null && typeof node !== "boolean" && node !== "";
}
