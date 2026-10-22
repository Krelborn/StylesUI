import type { JSX } from "react";

import { Box } from "../Box";

import type { IconProps } from "./Icon";
import { Icon } from "./Icon";

/**
 * Three horizontal lines, for the button that shows a site's navigation when it is collapsed on a narrow screen. It is
 * hidden from assistive technology unless it has a `label`, so inside a button, name the button instead.
 *
 * @example
 * <Button aria-expanded={open} onClick={toggle}>
 *   <MenuIcon /> Menu
 * </Button>
 */
export function MenuIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      {/* Lucide's "menu" icon, under the licence in LICENSE */}
      <Box as="path" d="M4 5h16" />
      <Box as="path" d="M4 12h16" />
      <Box as="path" d="M4 19h16" />
    </Icon>
  );
}
