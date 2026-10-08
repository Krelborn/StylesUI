import type { CSSProperties, ToggleEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";

import type { OverlayPlacement } from "../../overlays";
import { anchorNameFor, mergeProps } from "../../overlays";

import type { PopoverOverlayProps } from "./Popover";

/**
 * Options for `usePopover`
 */
export interface UsePopoverOptions {
  /**
   * Whether the popover starts open when uncontrolled. Defaults to `false`.
   */
  defaultOpen?: boolean;

  /**
   * Called with the new open state when the popover opens or closes; when controlled, also with `true` when the user
   * asks to open it
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Controls whether the popover is open. The hook then cancels openings and reports them through `onOpenChange`; a
   * close the browser makes is reported after it happens, and the popover shows again if `open` stays true. Only one
   * popover can be open at a time, so two held open this way keep closing each other.
   */
  open?: boolean;

  /**
   * Side of the trigger the popover opens on. It flips to the opposite side when there is no room. Defaults to
   * `bottom`.
   */
  placement?: OverlayPlacement;
}

/**
 * Props `getTriggerProps` sets on the trigger
 */
interface PopoverTriggerProps {
  /**
   * The popover's id
   */
  "aria-controls": string;

  /**
   * Whether the popover is open
   */
  "aria-expanded": boolean;

  /**
   * The popover's id, which makes the button open and close it without script
   */
  popoverTarget: string;

  /**
   * Names the trigger as the popover's anchor
   */
  style: CSSProperties;
}

/**
 * Prop getters for a popover's trigger and the `Popover`, whether it is open, and a way to close it
 */
export interface UsePopoverResult {
  /**
   * Closes the popover: hides it when uncontrolled, and reports `false` through `onOpenChange` either way
   */
  close: () => void;

  /**
   * Returns the props to spread on the `Popover`, merged with any given
   */
  getOverlayProps: <Props extends object>(
    props?: Props & Partial<PopoverOverlayProps>
  ) => Omit<Props, keyof PopoverOverlayProps> & PopoverOverlayProps;

  /**
   * Returns the props to spread on the trigger, which must be a button, merged with any given: where both set a
   * handler, both run, the given one first, and `style` objects merge
   */
  getTriggerProps: <Props extends object>(
    props?: Props & Partial<PopoverTriggerProps>
  ) => Omit<Props, keyof PopoverTriggerProps> & PopoverTriggerProps;

  /**
   * Whether the popover is open
   */
  open: boolean;
}

/**
 * Connects a `Popover` to the button that opens it. Clicking the button toggles the popover, and Escape or a click
 * outside closes it, all handled by the browser. Opening another popover closes this one.
 *
 * @param options open state, the change callback and placement
 * @returns prop getters for the trigger and the `Popover`, whether it is open, and `close`
 *
 * @example
 * const popover = usePopover({ placement: "top" });
 *
 * <Button {...popover.getTriggerProps()} variant="ghost">2 problems</Button>
 * <Popover {...popover.getOverlayProps()}>…</Popover>
 */
export function usePopover({
  defaultOpen = false,
  onOpenChange,
  open: controlledOpen,
  placement = "bottom",
}: UsePopoverOptions = {}): UsePopoverResult {
  const id = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [renderRequest, requestRender] = useState(0);
  const popoverElement = useRef<HTMLElement | null>(null);
  const controlled = controlledOpen !== undefined;
  const open = controlledOpen ?? uncontrolledOpen;
  const anchorName = anchorNameFor(id);

  // Overlay follows only changes to `open`, which stays true while the browser closes a held-open popover, so the hook
  // shows it again itself
  useEffect(() => {
    const element = popoverElement.current;

    if (renderRequest > 0 && open && element !== null && element.isConnected && !element.matches(":popover-open")) {
      element.showPopover();
    }
  }, [open, renderRequest]);

  function commit(nextOpen: boolean): void {
    if (!controlled) {
      setUncontrolledOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  }

  function handleBeforeToggle(event: ToggleEvent<HTMLElement>): void {
    if (controlled && !open && event.newState === "open") {
      event.preventDefault();
      onOpenChange?.(true);
    }
  }

  function handleToggle(event: ToggleEvent<HTMLElement>): void {
    const nextOpen = event.newState === "open";

    if (nextOpen === open) {
      return;
    }

    commit(nextOpen);

    if (controlled) {
      popoverElement.current = event.currentTarget;
      requestRender((count) => count + 1);
    }
  }

  function close(): void {
    if (open) {
      commit(false);
    }
  }

  const overlayProps: PopoverOverlayProps = {
    anchorName,
    id,
    onBeforeToggle: handleBeforeToggle,
    onToggle: handleToggle,
    open,
    placement,
  };
  const triggerProps: PopoverTriggerProps = {
    "aria-controls": id,
    "aria-expanded": open,
    popoverTarget: id,
    style: { anchorName },
  };

  function getOverlayProps<Props extends object>(
    props?: Props & Partial<PopoverOverlayProps>
  ): Omit<Props, keyof PopoverOverlayProps> & PopoverOverlayProps {
    return mergeProps<Props, PopoverOverlayProps>(props, overlayProps);
  }

  function getTriggerProps<Props extends object>(
    props?: Props & Partial<PopoverTriggerProps>
  ): Omit<Props, keyof PopoverTriggerProps> & PopoverTriggerProps {
    return mergeProps<Props, PopoverTriggerProps>(props, triggerProps);
  }

  return { close, getOverlayProps, getTriggerProps, open };
}
