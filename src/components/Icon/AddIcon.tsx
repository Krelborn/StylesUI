import type { JSX } from "react";

import { Box } from "../Box";

import type { IconProps } from "./Icon";
import { Icon } from "./Icon";

/**
 * A plus sign, for adding something such as an item, a row or a file. It is hidden from assistive technology unless it has a `label`, so inside a button, name the button instead.
 *
 * @example
 * <IconButton label="Add item" onClick={addItem}>
 *   <AddIcon />
 * </IconButton>
 */
export function AddIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      {/* Lucide's "plus" icon, under the licence in THIRD_PARTY_NOTICES.md */}
      <Box as="path" d="M5 12h14" />
      <Box as="path" d="M12 5v14" />
    </Icon>
  );
}
