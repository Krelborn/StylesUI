import type { JSX, JSXElementConstructor, ReactNode } from "react";

import type { BoxProps } from "../Box";
import { Box } from "../Box";
import type { LinkElement } from "../Link";

/**
 * Renders the link a `NavBar` entry's `as` names
 *
 * @param as the anchor or component to render, or undefined for an anchor
 * @param className the entry's class names
 * @param content what the link holds
 * @param props every other prop the entry was given for its link
 * @returns the link
 */
export function renderNavBarLink(
  as: LinkElement | undefined,
  className: string,
  content: ReactNode,
  props: object
): JSX.Element {
  if (as === undefined || as === "a") {
    // Widened as in Box: the entry's props already guarantee they match `as`
    return (
      <Box {...(props as BoxProps<"a">)} as="a" className={className}>
        {content}
      </Box>
    );
  }

  // Narrowed to the props the entry adds: its props already guarantee the rest match the component
  const Component = as as JSXElementConstructor<{ children: ReactNode; className: string }>;

  return (
    <Component {...props} className={className}>
      {content}
    </Component>
  );
}
