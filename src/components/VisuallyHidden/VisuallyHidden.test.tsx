import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { Button } from "../Button";

import { VisuallyHidden } from "./VisuallyHidden";

describe("VisuallyHidden", () => {
  it("must render a span when as is omitted", () => {
    render(<VisuallyHidden>Close</VisuallyHidden>);

    expect(screen.getByText("Close").tagName).toBe("SPAN");
  });

  it("must render the element given in as when as is set", () => {
    render(<VisuallyHidden as="h2">Section title</VisuallyHidden>);

    expect(screen.getByRole("heading", { level: 2, name: "Section title" })).toBeInTheDocument();
  });

  it("must keep its text in the accessible name of a parent button", () => {
    render(
      <Button>
        <span aria-hidden={true}>x</span>
        <VisuallyHidden>Close</VisuallyHidden>
      </Button>
    );

    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("must forward native props when they are given", () => {
    render(<VisuallyHidden id="hint">Close</VisuallyHidden>);

    expect(screen.getByText("Close")).toHaveAttribute("id", "hint");
  });

  it("must merge className when one is given", () => {
    render(<VisuallyHidden className="custom">Close</VisuallyHidden>);

    expect(screen.getByText("Close")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLSpanElement>();

    render(<VisuallyHidden ref={ref}>Close</VisuallyHidden>);

    expect(ref.current).toBe(screen.getByText("Close"));
  });
});
