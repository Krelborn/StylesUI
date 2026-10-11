import type { MockInstance } from "vitest";
import { onTestFinished, vi } from "vitest";

/**
 * Makes `showPopover` stricter than a browser's, until the test finishes: it throws when the popover is not in the
 * document, as a browser's does, and also when it is already showing, where a browser returns without effect, so a test
 * fails on a needless show. The jsdom stub does neither.
 *
 * @returns the spy on `showPopover`, to make a call refuse with `mockImplementationOnce`
 */
export function rejectInvalidShowPopover(): MockInstance<HTMLElement["showPopover"]> {
  const showPopover = HTMLElement.prototype.showPopover;
  const spy = vi.spyOn(HTMLElement.prototype, "showPopover").mockImplementation(function showPopoverOrThrow(
    this: HTMLElement
  ) {
    if (!this.isConnected) {
      throw new DOMException("The popover is not in the document", "InvalidStateError");
    }

    if (this.matches(":popover-open")) {
      throw new DOMException("The popover is already showing", "InvalidStateError");
    }

    showPopover.call(this);
  });

  onTestFinished(() => {
    spy.mockRestore();
  });

  return spy;
}
