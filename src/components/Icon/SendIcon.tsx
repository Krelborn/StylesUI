import type { JSX } from "react";

import { Box } from "../Box";

import type { IconProps } from "./Icon";
import { Icon } from "./Icon";

/**
 * A paper plane pointing along the line, for sending a message. It points the way the text runs, so it is mirrored in right-to-left text. It is hidden from assistive technology unless it has a `label`, so inside a button, name the button instead.
 *
 * @example
 * <IconButton label="Send" type="submit">
 *   <SendIcon />
 * </IconButton>
 */
export function SendIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props} mirrored={true}>
      {/* Lucide's "send-horizontal" icon, under the licence in LICENSE */}
      <Box
        as="path"
        d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z"
      />
      <Box as="path" d="M6 12h16" />
    </Icon>
  );
}
