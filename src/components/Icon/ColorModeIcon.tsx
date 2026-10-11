import type { JSX } from "react";

import { Box } from "../Box";

import type { IconProps } from "./Icon";
import { Icon } from "./Icon";

/**
 * A sun half hidden behind a crescent moon, for the colour mode, such as on a button that switches between light and dark. It is hidden from assistive technology unless it has a `label`, so inside a button, name the button instead.
 *
 * @example
 * <IconButton label="Dark mode" onClick={toggleDarkMode} aria-pressed={isDark}>
 *   <ColorModeIcon />
 * </IconButton>
 */
export function ColorModeIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      {/* Lucide's "sun-moon" icon, under the licence in LICENSE */}
      <Box as="path" d="M12 2v2" />
      <Box
        as="path"
        d="M14.837 16.385a6 6 0 1 1-7.223-7.222c.624-.147.97.66.715 1.248a4 4 0 0 0 5.26 5.259c.589-.255 1.396.09 1.248.715"
      />
      <Box as="path" d="M16 12a4 4 0 0 0-4-4" />
      <Box as="path" d="m19 5-1.256 1.256" />
      <Box as="path" d="M20 12h2" />
    </Icon>
  );
}
