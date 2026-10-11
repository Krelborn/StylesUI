import type { CSSProperties, RefObject, ToggleEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";

import type { OverlayPlacement } from "../../overlays";
import { anchorNameFor, mergeProps, syncPopover } from "../../overlays";

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
   * Element to focus when the popover opens, such as the safe choice in a confirmation. Without one, focus stays where
   * it is.
   */
  initialFocus?: RefObject<HTMLElement | null>;

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
   * Closes the popover: hides it when uncontrolled, and reports `false` through `onOpenChange` either way. Focus
   * returns to the trigger when it was inside the popover or had been lost to the page, as Safari loses it when a button
   * is clicked.
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
 * outside closes it, all handled by the browser. Opening another popover closes this one. When the popover closes with
 * focus inside it, focus returns to the button; a click outside leaves focus where the click put it.
 *
 * @param options open state, the change callback, placement and the element to focus on opening
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
  initialFocus,
  onOpenChange,
  open: controlledOpen,
  placement = "bottom",
}: UsePopoverOptions = {}): UsePopoverResult {
  const id = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [renderRequest, requestRender] = useState(0);
  const popoverElement = useRef<HTMLElement | null>(null);
  const returnsFocus = useRef(false);
  const controlled = controlledOpen !== undefined;
  const open = controlledOpen ?? uncontrolledOpen;
  const anchorName = anchorNameFor(id);

  // Overlay follows only changes to `open`, which stays true while the browser closes a held-open popover, so the hook
  // shows it again itself
  useEffect(() => {
    const element = popoverElement.current;

    if (renderRequest === 0 || !open || element === null || !element.isConnected) {
      return;
    }

    return syncPopover(element, true);
  }, [open, renderRequest]);

  function commit(nextOpen: boolean): void {
    if (!controlled) {
      setUncontrolledOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  }

  function handleBeforeToggle(event: ToggleEvent<HTMLElement>): void {
    // Only now, before the popover hides, can focus be found inside it
    if (event.newState === "closed" && event.currentTarget.contains(document.activeElement)) {
      returnsFocus.current = true;
    }

    if (controlled && !open && event.newState === "open") {
      event.preventDefault();
      onOpenChange?.(true);
    }
  }

  function handleToggle(event: ToggleEvent<HTMLElement>): void {
    const nextOpen = event.newState === "open";
    popoverElement.current = event.currentTarget;
    moveFocus(event.currentTarget, nextOpen);

    if (nextOpen === open) {
      return;
    }

    commit(nextOpen);

    if (controlled) {
      requestRender((count) => count + 1);
    }
  }

  // The browser returns focus to whatever had it before the popover opened, which in WebKit is not the trigger
  function moveFocus(popover: HTMLElement, opened: boolean): void {
    if (opened) {
      returnsFocus.current = false;
      initialFocus?.current?.focus();
    } else if (returnsFocus.current) {
      returnsFocus.current = false;
      triggerOf(popover)?.focus();
    }
  }

  function close(): void {
    if (!open) {
      return;
    }

    const focused = document.activeElement;

    // WebKit leaves focus on the page, not on a button clicked inside the popover
    if (focused === null || focused === document.body || popoverElement.current?.contains(focused) === true) {
      returnsFocus.current = true;
    }

    commit(false);
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

/**
 * Finds the button that opens a popover
 *
 * @param popover the popover element
 * @returns the element whose `popovertarget` names the popover, or null when there is none
 */
function triggerOf(popover: HTMLElement): HTMLElement | null {
  const triggers = popover.ownerDocument.querySelectorAll<HTMLElement>("[popovertarget]");

  return Array.from(triggers).find((trigger) => trigger.getAttribute("popovertarget") === popover.id) ?? null;
}
