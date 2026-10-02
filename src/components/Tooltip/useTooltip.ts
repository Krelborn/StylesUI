import type { CSSProperties, FocusEvent, FocusEventHandler, PointerEvent, PointerEventHandler } from "react";
import { useEffect, useEffectEvent, useRef } from "react";

import type { OverlayDelay, OverlayPlacement } from "../../overlays";
import { mergeProps, useOverlay } from "../../overlays";

import type { TooltipOverlayProps } from "./Tooltip";
import { claimTooltip, isTooltipWarm } from "./tooltipCoordinator";

/**
 * Whether a tooltip names its trigger or describes it
 */
export type TooltipRelationship = "description" | "label";

/**
 * Options for `useTooltip`
 */
export interface UseTooltipOptions {
  /**
   * Whether the tooltip starts open when uncontrolled. Defaults to `false`.
   */
  defaultOpen?: boolean;

  /**
   * Show and hide delays. Defaults to 400ms to show and 150ms to hide; an omitted field keeps its default. A hide
   * delay too short for the pointer to cross from the trigger to the tooltip hides the tooltip on the way.
   */
  delay?: OverlayDelay;

  /**
   * Called with the requested open state whenever the tooltip asks to open or close
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Controls whether the tooltip is open. The hook then only reports through `onOpenChange`.
   */
  open?: boolean;

  /**
   * Side of the trigger the tooltip opens on. It flips to the opposite side when there is no room. Defaults to `top`.
   */
  placement?: OverlayPlacement;

  /**
   * `label` makes the tooltip the trigger's accessible name, for a trigger with no text of its own, and
   * `description` adds it as the trigger's description. Defaults to `description`.
   */
  relationship?: TooltipRelationship;
}

/**
 * Props `getTriggerProps` sets on the trigger
 */
interface TooltipTriggerProps {
  /**
   * The tooltip's id when it describes the trigger
   */
  "aria-describedby"?: string;

  /**
   * The tooltip's id when it names the trigger
   */
  "aria-labelledby"?: string;

  /**
   * Hides the tooltip
   */
  onBlur: FocusEventHandler<HTMLElement>;

  /**
   * Shows the tooltip when focus arrives from the keyboard
   */
  onFocus: FocusEventHandler<HTMLElement>;

  /**
   * Hides the tooltip
   */
  onPointerDown: PointerEventHandler<HTMLElement>;

  /**
   * Shows the tooltip after the show delay, for a mouse or pen
   */
  onPointerEnter: PointerEventHandler<HTMLElement>;

  /**
   * Hides the tooltip after the hide delay, for a mouse or pen, unless the trigger has keyboard focus
   */
  onPointerLeave: PointerEventHandler<HTMLElement>;

  /**
   * Names the trigger as the tooltip's anchor
   */
  style: CSSProperties;
}

/**
 * Prop getters for a tooltip's trigger and the `Tooltip`, and whether the tooltip is open
 */
export interface UseTooltipResult {
  /**
   * Returns the props to spread on the `Tooltip`, merged with any given
   */
  getOverlayProps: <Props extends object>(
    props?: Props & Partial<TooltipOverlayProps>
  ) => Omit<Props, keyof TooltipOverlayProps> & TooltipOverlayProps;

  /**
   * Returns the props to spread on the trigger, merged with any given: where both set a handler, both run, the given
   * one first; the tooltip's id comes before any given `aria-describedby` or `aria-labelledby` ids; and `style`
   * objects merge
   */
  getTriggerProps: <Props extends object>(
    props?: Props & Partial<TooltipTriggerProps>
  ) => Omit<Props, keyof TooltipTriggerProps> & TooltipTriggerProps;

  /**
   * Whether the tooltip is open
   */
  open: boolean;
}

const defaultDelay: Required<OverlayDelay> = { hide: 150, show: 400 };

/**
 * Connects a `Tooltip` to the element it belongs to. Spread `getTriggerProps()` on that element and
 * `getOverlayProps()` on the `Tooltip`. The tooltip opens after the show delay when a mouse or pen rests on the
 * trigger and at once when the trigger takes keyboard focus. It stays open while the pointer is over the tooltip, and
 * hides after the hide delay once the pointer leaves both, or at once on blur, on Escape and when the trigger is
 * pressed. Only one tooltip is open at a time, and while one is open, or for 300ms after it closes, the next opens
 * without its show delay.
 *
 * @param options open state, delays, placement and how the tooltip relates to its trigger
 * @returns prop getters for the trigger and the `Tooltip`, and whether the tooltip is open
 *
 * @example
 * const tooltip = useTooltip({ relationship: "label" });
 *
 * <Button {...tooltip.getTriggerProps()}><CopyIcon /></Button>
 * <Tooltip {...tooltip.getOverlayProps()}>Copy link</Tooltip>
 */
export function useTooltip({
  defaultOpen = false,
  delay,
  onOpenChange,
  open: controlledOpen,
  placement = "top",
  relationship = "description",
}: UseTooltipOptions = {}): UseTooltipResult {
  const overlay = useOverlay({
    defaultOpen,
    delay: { hide: delay?.hide ?? defaultDelay.hide, show: delay?.show ?? defaultDelay.show },
    onOpenChange,
    open: controlledOpen,
  });
  const hasKeyboardFocus = useRef(false);
  const hideForCoordinator = useEffectEvent(() => overlay.hide());
  const { id, open } = overlay;

  useEffect(() => {
    if (!open) {
      return;
    }

    return claimTooltip(id, () => hideForCoordinator());
  }, [id, open]);

  function handleTriggerPointerEnter(event: PointerEvent<HTMLElement>): void {
    if (event.pointerType === "touch") {
      return;
    }

    if (isTooltipWarm()) {
      overlay.show();
    } else {
      overlay.showAfterDelay();
    }
  }

  function handlePointerLeave(event: PointerEvent<HTMLElement>): void {
    if (event.pointerType !== "touch" && !hasKeyboardFocus.current) {
      overlay.hideAfterDelay();
    }
  }

  function handleFocus(event: FocusEvent<HTMLElement>): void {
    hasKeyboardFocus.current = event.currentTarget.matches(":focus-visible");

    if (hasKeyboardFocus.current) {
      overlay.show();
    }
  }

  function handleBlur(): void {
    hasKeyboardFocus.current = false;
    overlay.hide();
  }

  const overlayProps: TooltipOverlayProps = {
    anchorName: overlay.anchorName,
    id: overlay.id,
    onPointerEnter: overlay.cancelDelay,
    onPointerLeave: handlePointerLeave,
    open: overlay.open,
    placement,
  };
  const triggerProps: TooltipTriggerProps = {
    ...(relationship === "label" ? { "aria-labelledby": overlay.id } : { "aria-describedby": overlay.id }),
    onBlur: handleBlur,
    onFocus: handleFocus,
    onPointerDown: overlay.hide,
    onPointerEnter: handleTriggerPointerEnter,
    onPointerLeave: handlePointerLeave,
    style: { anchorName: overlay.anchorName },
  };

  function getOverlayProps<Props extends object>(
    props?: Props & Partial<TooltipOverlayProps>
  ): Omit<Props, keyof TooltipOverlayProps> & TooltipOverlayProps {
    return mergeProps<Props, TooltipOverlayProps>(props, overlayProps);
  }

  function getTriggerProps<Props extends object>(
    props?: Props & Partial<TooltipTriggerProps>
  ): Omit<Props, keyof TooltipTriggerProps> & TooltipTriggerProps {
    return mergeProps<Props, TooltipTriggerProps>(props, triggerProps);
  }

  return { getOverlayProps, getTriggerProps, open: overlay.open };
}
