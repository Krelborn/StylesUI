import type { JSX } from "react";

import { Box } from "../Box";

import type { IconProps } from "./Icon";
import { Icon } from "./Icon";

/**
 * A minus sign, for removing something, such as an item from a list, or taking one away from a count. It is hidden from assistive technology unless it has a `label`, so inside a button, name the button instead.
 *
 * @example
 * <IconButton label="Remove item" onClick={removeItem}>
 *   <RemoveIcon />
 * </IconButton>
 */
export function RemoveIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      {/* Lucide's "minus" icon, under the licence in THIRD_PARTY_NOTICES.md */}
      <Box as="path" d="M5 12h14" />
    </Icon>
  );
}
