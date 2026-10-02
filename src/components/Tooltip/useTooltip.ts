import type { CSSProperties } from "react";

import type { OverlayPlacement } from "../../overlays";
import { mergeProps, useOverlay } from "../../overlays";

import type { TooltipOverlayProps } from "./Tooltip";

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
   * Controls whether the tooltip is open
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

/**
 * Connects a `Tooltip` to the element it belongs to. Spread `getTriggerProps()` on that element and
 * `getOverlayProps()` on the `Tooltip`.
 *
 * @param options open state, placement and how the tooltip relates to its trigger
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
  open: controlledOpen,
  placement = "top",
  relationship = "description",
}: UseTooltipOptions = {}): UseTooltipResult {
  const overlay = useOverlay({ defaultOpen, open: controlledOpen });

  const overlayProps: TooltipOverlayProps = {
    anchorName: overlay.anchorName,
    id: overlay.id,
    open: overlay.open,
    placement,
  };
  const triggerProps: TooltipTriggerProps = {
    ...(relationship === "label" ? { "aria-labelledby": overlay.id } : { "aria-describedby": overlay.id }),
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
