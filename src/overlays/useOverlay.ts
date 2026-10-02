import { useEffect, useEffectEvent, useId, useRef, useState } from "react";

import type { OverlayDelay } from "./OverlayDelay";

interface UseOverlayOptions {
  /**
   * Whether the overlay starts open when uncontrolled
   */
  defaultOpen: boolean;

  /**
   * Show and hide delays, in milliseconds
   */
  delay: Required<OverlayDelay>;

  /**
   * Called with the requested open state whenever the overlay asks to open or close
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Controls whether the overlay is open
   */
  open?: boolean;
}

/**
 * An overlay's identity and open state, and the requests that change it. Each request cancels any pending one.
 */
interface OverlayState {
  /**
   * `anchor-name` that ties the overlay's position to its trigger
   */
  anchorName: string;

  /**
   * Cancels a pending delayed show or hide
   */
  cancelDelay: () => void;

  /**
   * Hides the overlay at once
   */
  hide: () => void;

  /**
   * Hides the overlay after the hide delay, unless another request comes first
   */
  hideAfterDelay: () => void;

  /**
   * The overlay element's `id`
   */
  id: string;

  /**
   * Whether the overlay is open
   */
  open: boolean;

  /**
   * Shows the overlay at once
   */
  show: () => void;

  /**
   * Shows the overlay after the show delay, unless another request comes first
   */
  showAfterDelay: () => void;
}

/**
 * Holds an overlay's open state, controlled or uncontrolled, and hides an open overlay on Escape. An Escape that
 * hides the overlay has its default action prevented, so a dialog around the trigger stays open.
 *
 * @param options the initial or controlled open state, the delays and the change callback
 * @returns the overlay's id, the `anchor-name` that ties it to its trigger, whether it is open, and the requests that
 *   change it
 */
export function useOverlay({
  defaultOpen,
  delay,
  onOpenChange,
  open: controlledOpen,
}: UseOverlayOptions): OverlayState {
  const id = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const pendingRequest = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const open = controlledOpen ?? uncontrolledOpen;

  function cancelDelay(): void {
    clearTimeout(pendingRequest.current);
    pendingRequest.current = undefined;
  }

  function commit(nextOpen: boolean): void {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  }

  function request(nextOpen: boolean, delayMilliseconds: number): void {
    cancelDelay();

    if (nextOpen === open) {
      return;
    }

    if (delayMilliseconds <= 0) {
      commit(nextOpen);

      return;
    }

    pendingRequest.current = setTimeout(() => {
      pendingRequest.current = undefined;
      commit(nextOpen);
    }, delayMilliseconds);
  }

  const hideOnEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      request(false, 0);
    }
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      hideOnEscape(event);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(
    () => () => {
      clearTimeout(pendingRequest.current);
    },
    []
  );

  return {
    anchorName: `--sui-overlay-${id.replace(/[^\w-]/g, "")}`,
    cancelDelay,
    hide: () => request(false, 0),
    hideAfterDelay: () => request(false, delay.hide),
    id,
    open,
    show: () => request(true, 0),
    showAfterDelay: () => request(true, delay.show),
  };
}
