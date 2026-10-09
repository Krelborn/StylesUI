import type { JSX } from "react";

import { Box } from "../Box";

import type { IconProps } from "./Icon";
import { Icon } from "./Icon";

/**
 * Three dots in a column, for a menu of more actions, such as one at the end of a list item or a table row. It is hidden from assistive technology unless it has a `label`, so inside a button, name the button instead.
 *
 * @example
 * <IconButton label="More actions" {...getTriggerProps()}>
 *   <MoreVerticalIcon />
 * </IconButton>
 */
export function MoreVerticalIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      {/* Lucide's "ellipsis-vertical" icon, under the licence in THIRD_PARTY_NOTICES.md */}
      <Box as="circle" cx="12" cy="12" r="1" />
      <Box as="circle" cx="12" cy="5" r="1" />
      <Box as="circle" cx="12" cy="19" r="1" />
    </Icon>
  );
}
