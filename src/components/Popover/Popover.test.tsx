import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { transitionedProperties } from "../../test/transitionedProperties";

import { Popover } from "./Popover";
import popoverCss from "./Popover.module.css?raw";

const overlayProps = {
  anchorName: "--sui-overlay-test",
  id: "problems",
  onBeforeToggle: vi.fn(),
  onToggle: vi.fn(),
  placement: "bottom",
} as const;

describe("Popover", () => {
  it("must render a hidden auto popover div when it is closed", () => {
    render(
      <Popover {...overlayProps} open={false}>
        Checks are failing
      </Popover>
    );

    const popover = screen.getByText("Checks are failing");
    expect(popover).not.toBeVisible();
    expect(popover.tagName).toBe("DIV");
    expect(popover).toHaveAttribute("popover", "auto");
    expect(popover).toHaveAttribute("id", "problems");
  });

  it("must show the popover when open is true", () => {
    render(
      <Popover {...overlayProps} open={true}>
        Checks are failing
      </Popover>
    );

    expect(screen.getByText("Checks are failing")).toBeVisible();
  });

  it("must reject popover when it is given", () => {
    render(
      // @ts-expect-error a Popover is always an auto popover
      <Popover {...overlayProps} open={true} popover="manual">
        Checks are failing
      </Popover>
    );

    expect(screen.getByText("Checks are failing")).toHaveAttribute("popover", "auto");
  });

  it("must only fade when reduced motion is requested", () => {
    const reducedMotionBlock = popoverCss.match(/@media \(prefers-reduced-motion: reduce\) \{(.*?)\n\}/s)?.[1] ?? "";

    expect(transitionedProperties(reducedMotionBlock)).toEqual(["opacity"]);
  });
});
