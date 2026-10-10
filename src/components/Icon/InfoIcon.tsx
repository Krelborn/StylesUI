import type { JSX } from "react";

import { Box } from "../Box";

import type { IconProps } from "./Icon";
import { Icon } from "./Icon";

/**
 * A letter i in a circle, for information about something, such as an app's About details. It is hidden from assistive technology unless it has a `label`, so inside a button, name the button instead.
 *
 * @example
 * <IconButton label="About" {...getTriggerProps()}>
 *   <InfoIcon />
 * </IconButton>
 */
export function InfoIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      {/* Lucide's "info" icon, under the licence in LICENSE */}
      <Box as="circle" cx="12" cy="12" r="10" />
      <Box as="path" d="M12 16v-4" />
      <Box as="path" d="M12 8h.01" />
    </Icon>
  );
}
