import type { JSX } from "react";

import { Box } from "../Box";

import type { IconProps } from "./Icon";
import { Icon } from "./Icon";

/**
 * A chevron pointing along the line, for something that opens beside it, such as a submenu, or leads onward. It points the way the text runs, so it is mirrored in right-to-left text. It is hidden from assistive technology unless it has a `label`, so inside a button, name the button instead.
 *
 * @example
 * <Button aria-haspopup="menu">
 *   Move to <ChevronRightIcon />
 * </Button>
 */
export function ChevronRightIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props} mirrored={true}>
      {/* Lucide's "chevron-right" icon, under the licence in LICENSE */}
      <Box as="path" d="m9 18 6-6-6-6" />
    </Icon>
  );
}
