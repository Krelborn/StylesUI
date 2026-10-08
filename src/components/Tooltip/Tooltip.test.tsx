import { render, screen } from "@testing-library/react";
import { describe, expect, it, onTestFinished, vi } from "vitest";

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

  it("must show the tooltip again when the browser closed it while open stays true", () => {
    const { rerender } = render(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={true} placement="top">
        Sends to all subscribers
      </Tooltip>
    );
    screen.getByRole("tooltip").hidePopover();

    rerender(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={true} placement="top">
        Sends to everyone
      </Tooltip>
    );

    expect(screen.getByRole("tooltip", { name: "Sends to everyone" })).toBeVisible();
  });

  it("must not show the tooltip again when it is already shown", () => {
    const showPopover = vi.spyOn(HTMLElement.prototype, "showPopover");
    onTestFinished(() => {
      showPopover.mockRestore();
    });
    const { rerender } = render(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={true} placement="top">
        Sends to all subscribers
      </Tooltip>
    );

    rerender(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={true} placement="top">
        Sends to everyone
      </Tooltip>
    );

    expect(showPopover).toHaveBeenCalledTimes(1);
  });

  it("must not hide the tooltip when it is already hidden", () => {
    const hidePopover = vi.spyOn(HTMLElement.prototype, "hidePopover");
    onTestFinished(() => {
      hidePopover.mockRestore();
    });
    const { rerender } = render(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={false} placement="top">
        Sends to all subscribers
      </Tooltip>
    );

    rerender(
      <Tooltip anchorName="--sui-overlay-test" id="publish-tip" open={false} placement="top">
        Sends to everyone
      </Tooltip>
    );

    expect(hidePopover).not.toHaveBeenCalled();
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

  it("must not transition when reduced motion is requested", () => {
    const reducedMotionBlock = tooltipCss.match(/@media \(prefers-reduced-motion: reduce\) \{(.*?)\n\}/s)?.[1] ?? "";

    expect(transitionedProperties(reducedMotionBlock)).toEqual(["none"]);
  });
});
