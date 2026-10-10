import type { JSX } from "react";

import { Box } from "../Box";

import type { IconProps } from "./Icon";
import { Icon } from "./Icon";

/**
 * Two arrows chasing round a circle, for reloading or syncing. To show that a refresh is running, make the
 * `IconButton` holding it `busy`, which shows a spinner in its place. It is hidden from assistive technology unless it
 * has a `label`, so inside a button, name the button instead.
 *
 * @example
 * <IconButton busy={isRefreshing} label="Refresh" onClick={refresh}>
 *   <RefreshIcon />
 * </IconButton>
 */
export function RefreshIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props}>
      {/* Lucide's "refresh-cw" icon, under the licence in LICENSE */}
      <Box as="path" d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <Box as="path" d="M21 3v5h-5" />
      <Box as="path" d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <Box as="path" d="M8 16H3v5" />
    </Icon>
  );
}
