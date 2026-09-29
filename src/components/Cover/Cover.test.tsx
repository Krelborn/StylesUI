import type { CSSProperties } from "react";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Cover } from "./Cover";

describe("Cover", () => {
  it("must default gap, padding and minimum height when they are omitted", () => {
    render(
      <Cover as="section" aria-label="Hero">
        Content
      </Cover>
    );

    const cover = screen.getByRole("region", { name: "Hero" });
    expect(cover.style.getPropertyValue("--sui-cover-gap")).toBe("var(--sui-space-4, 1rem)");
    expect(cover.style.getPropertyValue("--sui-cover-padding")).toBe("var(--sui-space-4, 1rem)");
    expect(cover.style.getPropertyValue("--sui-cover-minimum-height")).toBe("100dvh");
  });

  it("must render a div when as is omitted", () => {
    const ref = createRef<HTMLDivElement>();

    render(<Cover ref={ref}>Content</Cover>);

    expect(ref.current?.tagName).toBe("DIV");
  });

  it("must render top, children and bottom in order when the slots are given", () => {
    render(
      <Cover as="section" bottom="Bottom" top="Top" aria-label="Hero">
        Middle
      </Cover>
    );

    expect(screen.getByRole("region", { name: "Hero" })).toHaveTextContent("TopMiddleBottom");
  });

  it("must render only the children when no slots are given", () => {
    render(
      <Cover as="section" aria-label="Hero">
        Middle
      </Cover>
    );

    expect(screen.getByRole("region", { name: "Hero" })).toHaveTextContent("Middle");
  });

  it("must set the gap, padding and minimum height when they are given", () => {
    render(
      <Cover as="section" gap={2} minimumHeight="20rem" padding={0} aria-label="Hero">
        Content
      </Cover>
    );

    const cover = screen.getByRole("region", { name: "Hero" });
    expect(cover.style.getPropertyValue("--sui-cover-gap")).toBe("var(--sui-space-2, 0.5rem)");
    expect(cover.style.getPropertyValue("--sui-cover-padding")).toBe("0px");
    expect(cover.style.getPropertyValue("--sui-cover-minimum-height")).toBe("20rem");
  });

  it("must merge style with the custom properties when style is given", () => {
    render(
      <Cover as="section" style={{ color: "red" }} aria-label="Hero">
        Content
      </Cover>
    );

    const cover = screen.getByRole("region", { name: "Hero" });
    expect(cover).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(cover.style.getPropertyValue("--sui-cover-minimum-height")).toBe("100dvh");
  });

  it("must let style override the minimum height when style sets the same custom property", () => {
    render(
      <Cover as="section" style={{ "--sui-cover-minimum-height": "10rem" } as CSSProperties} aria-label="Hero">
        Content
      </Cover>
    );

    expect(screen.getByRole("region", { name: "Hero" }).style.getPropertyValue("--sui-cover-minimum-height")).toBe(
      "10rem"
    );
  });

  it("must merge className when one is given", () => {
    render(
      <Cover as="section" className="custom" aria-label="Hero">
        Content
      </Cover>
    );

    expect(screen.getByRole("region", { name: "Hero" })).toHaveClass("custom");
  });

  it("must forward ref to the outer element when one is given", () => {
    const ref = createRef<HTMLElement>();

    render(
      <Cover as="section" ref={ref} aria-label="Hero">
        Content
      </Cover>
    );

    expect(ref.current).toBe(screen.getByRole("region", { name: "Hero" }));
  });
});
