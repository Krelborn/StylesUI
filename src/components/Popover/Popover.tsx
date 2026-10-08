import { clsx } from "clsx";
import type { JSX, ToggleEventHandler } from "react";

import type { OverlayPlacement } from "../../overlays";
import type { BoxProps } from "../Box";
import { Overlay } from "../Overlay";

import styles from "./Popover.module.css";

/**
 * Props `getOverlayProps` from `usePopover` returns, which every `Popover` takes
 */
export interface PopoverOverlayProps {
  /**
   * `anchor-name` of the trigger the popover is positioned against. From `getOverlayProps`.
   */
  anchorName: string;

  /**
   * The popover's id, which the trigger's `popoverTarget` and `aria-controls` point at. From `getOverlayProps`.
   */
  id: string;

  /**
   * Cancels an opening the parent of a controlled popover has not asked for. From `getOverlayProps`.
   */
  onBeforeToggle: ToggleEventHandler<HTMLElement>;

  /**
   * Keeps the hook's state in step with the browser. From `getOverlayProps`.
   */
  onToggle: ToggleEventHandler<HTMLElement>;

  /**
   * Whether the popover is shown. From `getOverlayProps`.
   */
  open: boolean;

  /**
   * Side of the trigger the popover opens on. From `getOverlayProps`.
   */
  placement: OverlayPlacement;
}

/**
 * Props for `Popover`: the props `getOverlayProps` returns plus every `div` prop except `popover` and `ref`
 */
export interface PopoverProps
  extends PopoverOverlayProps, Omit<BoxProps<"div">, "as" | "popover" | "ref" | keyof PopoverOverlayProps> {}

/**
 * A surface that opens beside a button and holds more content than a tooltip can, such as a short list or a few
 * actions. `usePopover` connects the two: spread `getTriggerProps()` on a `Button` or `IconButton` and
 * `getOverlayProps()` on the popover, inside the same `Theme`. It closes on Escape and on a click outside, and closing
 * from the keyboard returns focus to the button. It has no role of its own: give it `role="dialog"` and a name when it
 * holds a form.
 *
 * @example
 * const popover = usePopover({ placement: "top" });
 *
 * <Button {...popover.getTriggerProps()} variant="ghost">2 problems</Button>
 * <Popover {...popover.getOverlayProps()}>…</Popover>
 */
export function Popover({ className, ...rest }: PopoverProps): JSX.Element {
  return <Overlay {...rest} as="div" className={clsx(styles.popover, className)} popover="auto" />;
}
