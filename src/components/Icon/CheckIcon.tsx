import type { JSX } from "react";

import { Box } from "../Box";

import type { IconProps } from "./Icon";
import { Icon } from "./Icon";

/**
 * A check mark, for something that is on, chosen or done, such as a checked item in a menu. It is hidden from assistive technology unless it has a `label`, so where the control it marks states its own value, such as a menu item's `aria-checked`, leave it without one.
 *
 * @example
 * <Text>
 *   <CheckIcon label="Saved" /> Draft
 * </Text>
 */
export function CheckIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      {/* Lucide's "check" icon, under the licence in LICENSE */}
      <Box as="path" d="M20 6 9 17l-5-5" />
    </Icon>
  );
}
