import type { JSX } from "react";

import { Box } from "../Box";

import type { IconProps } from "./Icon";
import { Icon } from "./Icon";

/**
 * A cross, for closing or dismissing something such as a dialog or a banner. It is hidden from assistive technology
 * unless it has a `label`, so inside a button, name the button instead.
 *
 * @example
 * <IconButton label="Close" onClick={close}>
 *   <CloseIcon />
 * </IconButton>
 */
export function CloseIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      {/* Lucide's "x" icon, under the licence in LICENSE */}
      <Box as="path" d="M18 6 6 18" />
      <Box as="path" d="m6 6 12 12" />
    </Icon>
  );
}
