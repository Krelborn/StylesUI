import type { CSSProperties } from "react";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Center } from "./Center";

describe("Center", () => {
  it("must render a div with content width, gutter 4 and no intrinsic centring when no props are given", () => {
    render(<Center>Content</Center>);

    const center = screen.getByText("Content");
    expect(center.tagName).toBe("DIV");
    expect(center).toHaveAttribute("data-width", "content");
    expect(center).not.toHaveAttribute("data-intrinsic");
    expect(center.style.getPropertyValue("--sui-center-gutter")).toBe("var(--sui-space-4, 1rem)");
  });

  it.each(["prose", "content", "wide"] as const)("must apply %s width when width is set", (width) => {
    render(<Center width={width}>Content</Center>);

    expect(screen.getByText("Content")).toHaveAttribute("data-width", width);
  });

  it("must centre children intrinsically when intrinsic is true", () => {
    render(<Center intrinsic={true}>Content</Center>);

    expect(screen.getByText("Content")).toHaveAttribute("data-intrinsic", "");
  });

  it("must set the gutter when gutter is given", () => {
    render(<Center gutter={0}>Content</Center>);

    expect(screen.getByText("Content").style.getPropertyValue("--sui-center-gutter")).toBe("0");
  });

  it("must render the element given in as when as is set", () => {
    render(<Center as="main">Content</Center>);

    expect(screen.getByRole("main")).toHaveTextContent("Content");
  });

  it("must merge style with the gutter when style is given", () => {
    render(<Center style={{ color: "red" }}>Content</Center>);

    const center = screen.getByText("Content");
    expect(center).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(center.style.getPropertyValue("--sui-center-gutter")).toBe("var(--sui-space-4, 1rem)");
  });

  it("must let style override the gutter when style sets the same custom property", () => {
    render(<Center style={{ "--sui-center-gutter": "3px" } as CSSProperties}>Content</Center>);

    expect(screen.getByText("Content").style.getPropertyValue("--sui-center-gutter")).toBe("3px");
  });

  it("must merge className when one is given", () => {
    render(<Center className="custom">Content</Center>);

    expect(screen.getByText("Content")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLDivElement>();

    render(<Center ref={ref}>Content</Center>);

    expect(ref.current).toBe(screen.getByText("Content"));
  });

  it("must reject a width when it is not a named width", () => {
    // @ts-expect-error "40rem" is not a CenterWidth
    render(<Center width="40rem">Content</Center>);
  });
});
