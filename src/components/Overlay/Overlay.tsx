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
   * Element to render: a `span` for text-only content that may sit inside a paragraph, or a `div`
   */
  as: "div" | "span";

  /**
   * Whether the overlay is shown
   */
  open: boolean;

  /**
   * Side of the trigger the overlay opens on. It flips to the opposite side when there is no room.
   */
  placement: OverlayPlacement;

  /**
   * How the overlay closes: `auto` also closes on Escape, on a click outside and when another `auto` overlay opens;
   * `manual` only when `open` turns false
   */
  popover: "auto" | "manual";
}

type OverlayProps = OverlayOwnProps & Omit<BoxProps<"span">, "as" | "popover" | "ref" | keyof OverlayOwnProps>;

/**
 * Floating surface shared by the overlay components. It shows in the top layer beside its trigger but stays in place
 * in the DOM, so it inherits the theme and mode around it.
 */
export function Overlay({
  anchorName,
  as,
  className,
  open,
  placement,
  popover,
  style,
  ...rest
}: OverlayProps): JSX.Element {
  const element = useRef<HTMLSpanElement>(null);

  // Every render, so a popover the browser closed while `open` stayed true is shown again
  useEffect(() => {
    const current = element.current;

    // Browsers inside the library's floor but below the overlay floor have no Popover API
    if (current === null || !("showPopover" in current)) {
      return;
    }

    const shown = current.matches(":popover-open");

    if (open && !shown) {
      current.showPopover();
    } else if (!open && shown) {
      current.hidePopover();
    }
  });

  return (
    <Box
      {...rest}
      as={as as "span"}
      className={clsx(styles.overlay, className)}
      popover={popover}
      ref={element}
      style={{ ...style, positionAnchor: anchorName }}
      data-placement={placement}
    />
  );
}
