import type { ReactNode } from "react";
import { Fragment, isValidElement } from "react";

/**
 * Tells whether a node holds a value other than an empty one, so an empty `description` or `error` slot can be
 * skipped
 *
 * @param node the node to check
 * @returns false for `undefined`, `null`, a boolean, an empty string, and an array or fragment holding only those;
 *   otherwise true, including for a component that renders nothing
 */
export function hasContent(node: ReactNode): boolean {
  if (Array.isArray(node)) {
    return node.some(hasContent);
  }

  if (isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment) {
    return hasContent(node.props.children);
  }

  return node !== undefined && node !== null && typeof node !== "boolean" && node !== "";
}
