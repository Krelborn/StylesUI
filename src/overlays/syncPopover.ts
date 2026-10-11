import { PopoverRefusedError } from "../errors";

/**
 * Shows or hides a popover to match `open`, leaving it alone when it already matches. The browser refuses while it
 * shows or hides another popover, so a refusal is tried again on the next task, unless the popover has left the
 * document by then. A second refusal is thrown from the timer as a `PopoverRefusedError`, where it is reported without
 * unmounting the app; any other error is thrown at once.
 *
 * @param popover the popover element
 * @param open whether it should be shown
 * @returns a function that cancels the retry, for an effect's cleanup
 */
export function syncPopover(popover: HTMLElement, open: boolean): () => void {
  if (refusalToSync(popover, open) === null) {
    return () => {};
  }

  const retry = setTimeout(() => {
    if (!popover.isConnected) {
      return;
    }

    const refusal = refusalToSync(popover, open);

    if (refusal !== null) {
      throw new PopoverRefusedError(popover, open, refusal);
    }
  }, 0);

  return () => {
    clearTimeout(retry);
  };
}

/**
 * Shows or hides a popover to match `open`, unless the browser refuses
 *
 * @param popover the popover element
 * @param open whether it should be shown
 * @returns the browser's refusal, or null when the popover matches `open`
 */
function refusalToSync(popover: HTMLElement, open: boolean): DOMException | null {
  const shown = popover.matches(":popover-open");

  try {
    if (open && !shown) {
      popover.showPopover();
    } else if (!open && shown) {
      popover.hidePopover();
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "InvalidStateError") {
      return error;
    }

    throw error;
  }

  return null;
}
