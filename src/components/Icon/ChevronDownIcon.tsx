import type { JSX } from "react";

import { Box } from "../Box";

import type { IconProps } from "./Icon";
import { Icon } from "./Icon";

/**
 * A chevron pointing down, for a control that opens a menu or a list below it, or expands a section. It is hidden from assistive technology unless it has a `label`, so inside a button, name the button instead.
 *
 * @example
 * <Button aria-expanded={open} onClick={toggle}>
 *   Options <ChevronDownIcon />
 * </Button>
 */
export function ChevronDownIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      {/* Lucide's "chevron-down" icon, under the licence in LICENSE */}
      <Box as="path" d="m6 9 6 6 6-6" />
    </Icon>
  );
}
