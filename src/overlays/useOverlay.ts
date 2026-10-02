import { useId, useState } from "react";

interface UseOverlayOptions {
  /**
   * Whether the overlay starts open when uncontrolled
   */
  defaultOpen: boolean;

  /**
   * Controls whether the overlay is open
   */
  open?: boolean;
}

/**
 * An overlay's identity and open state
 */
interface OverlayState {
  /**
   * `anchor-name` that ties the overlay's position to its trigger
   */
  anchorName: string;

  /**
   * The overlay element's `id`
   */
  id: string;

  /**
   * Whether the overlay is open
   */
  open: boolean;
}

/**
 * Holds an overlay's open state, controlled or uncontrolled
 *
 * @param options the initial or controlled open state
 * @returns the overlay's id, the `anchor-name` that ties it to its trigger, and whether it is open
 */
export function useOverlay({ defaultOpen, open: controlledOpen }: UseOverlayOptions): OverlayState {
  const id = useId();
  const [uncontrolledOpen] = useState(defaultOpen);

  return {
    anchorName: `--sui-overlay-${id.replace(/[^\w-]/g, "")}`,
    id,
    open: controlledOpen ?? uncontrolledOpen,
  };
}
