import type { JSX } from "react";

import { Box } from "../Box";

import type { IconProps } from "./Icon";
import { Icon } from "./Icon";

/**
 * A bin, for deleting something for good. It is hidden from assistive technology unless it has a `label`, so inside a button, name the button instead.
 *
 * @example
 * <IconButton label="Delete message" onClick={deleteMessage}>
 *   <DeleteIcon />
 * </IconButton>
 */
export function DeleteIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      {/* Lucide's "trash-2" icon, under the licence in THIRD_PARTY_NOTICES.md */}
      <Box as="path" d="M10 11v6" />
      <Box as="path" d="M14 11v6" />
      <Box as="path" d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <Box as="path" d="M3 6h18" />
      <Box as="path" d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Icon>
  );
}
