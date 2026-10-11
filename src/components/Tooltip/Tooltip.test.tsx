import { act, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it, onTestFinished, vi } from "vitest";

import { rejectInvalidShowPopover } from "../../test/rejectInvalidShowPopover";
import { transitionedProperties } from "../../test/transitionedProperties";

import { Tooltip } from "./Tooltip";
import tooltipCss from "./Tooltip.module.css?raw";

describe("Tooltip", () => {
  it("must render a hidden manual popover with the tooltip role when it is closed", () => {
    render(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={false} placement="top">
        Sends to all subscribers
      </Tooltip>
    );

    const tooltip = screen.getByRole("tooltip", { hidden: true });
    expect(tooltip).not.toBeVisible();
    expect(tooltip).toHaveAttribute("id", "publish-tip");
    expect(tooltip).toHaveAttribute("popover", "manual");
    expect(tooltip.tagName).toBe("SPAN");
  });

  it("must show the tooltip when open is true", () => {
    render(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={true} placement="top">
        Sends to all subscribers
      </Tooltip>
    );

    expect(screen.getByRole("tooltip", { name: "Sends to all subscribers" })).toBeVisible();
  });

  it("must hide the tooltip when open changes to false", () => {
    const { rerender } = render(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={true} placement="top">
        Sends to all subscribers
      </Tooltip>
    );

    rerender(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={false} placement="top">
        Sends to all subscribers
      </Tooltip>
    );

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("must require the props getOverlayProps returns", () => {
    // @ts-expect-error anchorName, id, open and placement come from getOverlayProps
    render(<Tooltip>Sends to all subscribers</Tooltip>);

    expect(screen.getByRole("tooltip", { hidden: true })).toBeInTheDocument();
  });

  it("must reject role when it is given", () => {
    render(
      // @ts-expect-error Tooltip always has the tooltip role
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={true} placement="top" role="note">
        Sends to all subscribers
      </Tooltip>
    );

    expect(screen.getByRole("tooltip", { name: "Sends to all subscribers" })).toBeInTheDocument();
  });

  it("must still render when the browser has no Popover API", () => {
    const showPopover = HTMLElement.prototype.showPopover;
    Reflect.deleteProperty(HTMLElement.prototype, "showPopover");
    onTestFinished(() => {
      HTMLElement.prototype.showPopover = showPopover;
    });

    render(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={true} placement="top">
        Sends to all subscribers
      </Tooltip>
    );

    expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent("Sends to all subscribers");
  });

  it("must show the tooltip on the next task when the browser refuses to show it at first", () => {
    const { advance, popoverMethod } = setUpTest();
    popoverMethod("showPopover").mockImplementationOnce(refuse);
    render(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={true} placement="top">
        Sends to all subscribers
      </Tooltip>
    );

    advance(0);

    expect(screen.getByRole("tooltip", { name: "Sends to all subscribers" })).toBeVisible();
  });

  it("must hide the tooltip on the next task when the browser refuses to hide it at first", () => {
    const { advance, popoverMethod } = setUpTest();
    const { rerender } = render(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={true} placement="top">
        Sends to all subscribers
      </Tooltip>
    );
    popoverMethod("hidePopover").mockImplementationOnce(refuse);
    rerender(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={false} placement="top">
        Sends to all subscribers
      </Tooltip>
    );

    advance(0);

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("must keep the tooltip hidden when open turns false before the browser lets it show", () => {
    const { advance, popoverMethod } = setUpTest();
    popoverMethod("showPopover").mockImplementationOnce(refuse);
    const { rerender } = render(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={true} placement="top">
        Sends to all subscribers
      </Tooltip>
    );

    rerender(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={false} placement="top">
        Sends to all subscribers
      </Tooltip>
    );
    advance(0);

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("must report the refusal and keep the tooltip rendered when the browser refuses to show it again", () => {
    const { advance, popoverMethod } = setUpTest();
    popoverMethod("showPopover").mockImplementation(refuse);
    render(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={true} placement="top">
        Sends to all subscribers
      </Tooltip>
    );

    expect(() => advance(0)).toThrow(
      expect.objectContaining({
        cause: expect.objectContaining({ name: "InvalidStateError" }),
        message: 'The browser refused to show the popover with id "publish-tip"',
      })
    );
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent("Sends to all subscribers");
  });

  it("must report the refusal and keep the tooltip rendered when the browser refuses to hide it again", () => {
    const { advance, popoverMethod } = setUpTest();
    const { rerender } = render(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={true} placement="top">
        Sends to all subscribers
      </Tooltip>
    );
    popoverMethod("hidePopover").mockImplementation(refuse);
    rerender(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={false} placement="top">
        Sends to all subscribers
      </Tooltip>
    );

    expect(() => advance(0)).toThrow('The browser refused to hide the popover with id "publish-tip"');
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent("Sends to all subscribers");
  });

  it("must not show the tooltip when it unmounts before the browser lets it show", () => {
    const { advance } = setUpTest();
    rejectInvalidShowPopover().mockImplementationOnce(refuse);
    const { unmount } = render(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={true} placement="top">
        Sends to all subscribers
      </Tooltip>
    );

    unmount();

    expect(() => advance(0)).not.toThrow();
  });

  it("must show the tooltip once on the next task when the browser refuses at first in StrictMode", () => {
    const { advance } = setUpTest();
    rejectInvalidShowPopover().mockImplementationOnce(refuse);
    render(
      <StrictMode>
        <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={true} placement="top">
          Sends to all subscribers
        </Tooltip>
      </StrictMode>
    );

    advance(0);

    expect(screen.getByRole("tooltip", { name: "Sends to all subscribers" })).toBeVisible();
  });

  it("must throw while rendering when showing the tooltip fails for a reason other than a refusal", () => {
    const { popoverMethod } = setUpTest();
    popoverMethod("showPopover").mockImplementationOnce(() => {
      throw new TypeError("The popover is broken");
    });

    expect(() =>
      render(
        <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={true} placement="top">
          Sends to all subscribers
        </Tooltip>
      )
    ).toThrow("The popover is broken");
  });

  it("must not transition when reduced motion is requested", () => {
    const reducedMotionBlock = tooltipCss.match(/@media \(prefers-reduced-motion: reduce\) \{(.*?)\n\}/s)?.[1] ?? "";

    expect(transitionedProperties(reducedMotionBlock)).toEqual(["none"]);
  });
});

function setUpTest() {
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.useRealTimers();
  });

  function advance(milliseconds: number): void {
    act(() => {
      vi.advanceTimersByTime(milliseconds);
    });
  }

  function popoverMethod(method: "hidePopover" | "showPopover") {
    const spy = vi.spyOn(HTMLElement.prototype, method);
    onTestFinished(() => {
      spy.mockRestore();
    });

    return spy;
  }

  return { advance, popoverMethod };
}

/**
 * Throws as the browser does when asked to show or hide a popover while it shows or hides another
 */
function refuse(): never {
  throw new DOMException("Invalid to show a popover during another show operation", "InvalidStateError");
}
