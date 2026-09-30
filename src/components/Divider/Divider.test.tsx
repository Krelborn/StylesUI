import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Divider } from "./Divider";

describe("Divider", () => {
  it("must render a separator when no props are given", () => {
    render(<Divider />);

    expect(screen.getByRole("separator").tagName).toBe("HR");
  });

  it("must apply the horizontal orientation when orientation is omitted", () => {
    render(<Divider />);

    expect(screen.getByRole("separator")).toHaveAttribute("data-orientation", "horizontal");
  });

  it.each(["horizontal", "vertical"] as const)("must apply the %s orientation when it is set", (orientation) => {
    render(<Divider orientation={orientation} />);

    expect(screen.getByRole("separator")).toHaveAttribute("data-orientation", orientation);
  });

  it("must not set aria-orientation when the divider is horizontal", () => {
    render(<Divider orientation="horizontal" />);

    expect(screen.getByRole("separator")).not.toHaveAttribute("aria-orientation");
  });

  it("must set aria-orientation to vertical when the divider is vertical", () => {
    render(<Divider orientation="vertical" />);

    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
  });

  it("must forward native props when they are given", () => {
    render(<Divider id="section-break" />);

    expect(screen.getByRole("separator")).toHaveAttribute("id", "section-break");
  });

  it("must merge className when one is given", () => {
    render(<Divider className="custom" />);

    expect(screen.getByRole("separator")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLHRElement>();

    render(<Divider ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("separator"));
  });

  it("must reject an orientation when it is not supported", () => {
    // @ts-expect-error "diagonal" is not a DividerOrientation
    render(<Divider orientation="diagonal" />);
  });

  it("must reject as when it is given", () => {
    // @ts-expect-error Divider always renders an hr
    render(<Divider as="div" />);
  });
});
