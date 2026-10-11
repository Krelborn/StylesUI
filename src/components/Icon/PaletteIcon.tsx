import type { JSX } from "react";

import { Box } from "../Box";

import type { IconProps } from "./Icon";
import { Icon } from "./Icon";

/**
 * A painter's palette dotted with paint, for choosing colours, such as the button that opens an appearance or theme menu. It is hidden from assistive technology unless it has a `label`, so inside a button, name the button instead.
 *
 * @example
 * <IconButton label="Appearance" {...getTriggerProps()}>
 *   <PaletteIcon />
 * </IconButton>
 */
export function PaletteIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      {/* Lucide's "palette" icon, under the licence in LICENSE */}
      <Box
        as="path"
        d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"
      />
      <Box as="circle" cx="13.5" cy="6.5" fill="currentColor" r=".5" />
      <Box as="circle" cx="17.5" cy="10.5" fill="currentColor" r=".5" />
      <Box as="circle" cx="6.5" cy="12.5" fill="currentColor" r=".5" />
      <Box as="circle" cx="8.5" cy="7.5" fill="currentColor" r=".5" />
    </Icon>
  );
}
