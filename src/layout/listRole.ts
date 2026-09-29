import type { AriaRole } from "react";

import type { BoxElement } from "../components/Box";

/**
 * Picks the role for a container that removes list markers, which makes WebKit stop exposing
 * `ul` and `ol` as lists
 *
 * @param element the element the container renders
 * @param role the role the consumer passed, if any
 * @returns `list` for a `ul` or `ol` without a role, otherwise the given role
 */
export function listRole(element: BoxElement, role: AriaRole | undefined): AriaRole | undefined {
  if (role === undefined && (element === "ul" || element === "ol")) {
    return "list";
  }

  return role;
}
