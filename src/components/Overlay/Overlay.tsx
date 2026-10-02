import { clsx } from "clsx";
import type { JSX } from "react";
import { useEffect, useRef } from "react";

import type { OverlayPlacement } from "../../overlays";
import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Overlay.module.css";

interface OverlayOwnProps {
  /**
   * `anchor-name` of the trigger the overlay is positioned against
   */
  anchorName: string;

  /**
   * Whether the overlay is shown
   */
  open: boolean;

  /**
   * Side of the trigger the overlay opens on. It flips to the opposite side when there is no room.
   */
  placement: OverlayPlacement;
}

type OverlayProps = OverlayOwnProps & Omit<BoxProps<"span">, "as" | "popover" | "ref" | keyof OverlayOwnProps>;

/**
 * Floating surface shared by the overlay components. It shows in the top layer beside its trigger but stays in place
 * in the DOM, so it inherits the theme and mode around it.
 */
export function Overlay({ anchorName, className, open, placement, style, ...rest }: OverlayProps): JSX.Element {
  const popover = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = popover.current;

    // Browsers inside the library's floor but below the overlay floor have no Popover API
    if (element === null || !open || !("showPopover" in element)) {
      return;
    }

    element.showPopover();

    return () => {
      element.hidePopover();
    };
  }, [open]);

  return (
    <Box
      {...rest}
      as="span"
      className={clsx(styles.overlay, className)}
      popover="manual"
      ref={popover}
      style={{ ...style, positionAnchor: anchorName }}
      data-placement={placement}
    />
  );
}
