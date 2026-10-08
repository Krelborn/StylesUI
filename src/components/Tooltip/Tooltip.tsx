import { clsx } from "clsx";
import type { JSX, PointerEventHandler } from "react";

import type { OverlayPlacement } from "../../overlays";
import type { BoxProps } from "../Box";
import { Overlay } from "../Overlay";

import styles from "./Tooltip.module.css";

/**
 * Props `getOverlayProps` from `useTooltip` returns, which every `Tooltip` takes
 */
export interface TooltipOverlayProps {
  /**
   * `anchor-name` of the trigger the tooltip is positioned against. From `getOverlayProps`.
   */
  anchorName: string;

  /**
   * The tooltip's id, which the trigger's `aria-describedby` or `aria-labelledby` points at. From `getOverlayProps`.
   */
  id: string;

  /**
   * Keeps the tooltip open while the pointer is over it. From `getOverlayProps`.
   */
  onPointerEnter?: PointerEventHandler<HTMLElement>;

  /**
   * Hides the tooltip after the hide delay once the pointer leaves it. From `getOverlayProps`.
   */
  onPointerLeave?: PointerEventHandler<HTMLElement>;

  /**
   * Whether the tooltip is shown. From `getOverlayProps`.
   */
  open: boolean;

  /**
   * Side of the trigger the tooltip opens on. From `getOverlayProps`.
   */
  placement: OverlayPlacement;
}

/**
 * Props for `Tooltip`: the props `getOverlayProps` returns plus every `span` prop except `popover`, `ref` and `role`
 */
export interface TooltipProps
  extends TooltipOverlayProps, Omit<BoxProps<"span">, "as" | "popover" | "ref" | "role" | keyof TooltipOverlayProps> {}

/**
 * Short text shown beside the element it belongs to while the pointer rests on that element or it has keyboard
 * focus. `useTooltip` connects the two: spread `getTriggerProps()` on the element and `getOverlayProps()` on the
 * tooltip, inside the same `Theme`. A tooltip holds text only, nothing interactive.
 *
 * @example
 * const tooltip = useTooltip();
 *
 * <Button {...tooltip.getTriggerProps()}>Publish</Button>
 * <Tooltip {...tooltip.getOverlayProps()}>Sends to all subscribers</Tooltip>
 */
export function Tooltip({ className, ...rest }: TooltipProps): JSX.Element {
  return <Overlay {...rest} as="span" className={clsx(styles.tooltip, className)} popover="manual" role="tooltip" />;
}
