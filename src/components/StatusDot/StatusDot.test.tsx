import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import type { BadgeTone } from "../Badge";

import type { StatusDotSize, StatusDotVariant } from "./StatusDot";
import { StatusDot } from "./StatusDot";

const tones: BadgeTone[] = ["danger", "info", "neutral", "primary", "success", "warning"];
const variants: StatusDotVariant[] = ["ring", "solid"];
const sizes: StatusDotSize[] = ["md", "sm"];

describe("StatusDot", () => {
  it("must be an image named by the label when label is set", () => {
    render(<StatusDot label="Checks passing" tone="success" />);

    expect(screen.getByRole("img", { name: "Checks passing" })).toBeInTheDocument();
  });

  it("must be hidden from assistive technology when label is omitted", () => {
    render(<StatusDot data-testid="dot" />);

    expect(screen.getByTestId("dot")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img", { hidden: true })).toBeNull();
  });

  it("must be hidden from assistive technology when label is empty", () => {
    render(<StatusDot data-testid="dot" label="" />);

    expect(screen.getByTestId("dot")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img", { hidden: true })).toBeNull();
  });

  it("must apply the neutral tone, solid variant and medium size when they are omitted", () => {
    render(<StatusDot label="No checks" />);

    const dot = screen.getByRole("img", { name: "No checks" });
    expect(dot).toHaveAttribute("data-tone", "neutral");
    expect(dot).toHaveAttribute("data-variant", "solid");
    expect(dot).toHaveAttribute("data-size", "md");
  });

  it.each(tones)("must apply the %s tone when it is set", (tone) => {
    render(<StatusDot label="Status" tone={tone} />);

    expect(screen.getByRole("img", { name: "Status" })).toHaveAttribute("data-tone", tone);
  });

  it.each(variants)("must apply the %s variant when it is set", (variant) => {
    render(<StatusDot label="Status" variant={variant} />);

    expect(screen.getByRole("img", { name: "Status" })).toHaveAttribute("data-variant", variant);
  });

  it.each(sizes)("must apply the %s size when it is set", (size) => {
    render(<StatusDot label="Status" size={size} />);

    expect(screen.getByRole("img", { name: "Status" })).toHaveAttribute("data-size", size);
  });

  it("must forward native props when they are given", () => {
    render(<StatusDot id="checks-status" label="Checks passing" />);

    expect(screen.getByRole("img", { name: "Checks passing" })).toHaveAttribute("id", "checks-status");
  });

  it("must merge className when one is given", () => {
    render(<StatusDot className="custom" label="Checks passing" />);

    expect(screen.getByRole("img", { name: "Checks passing" })).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLSpanElement>();

    render(<StatusDot label="Checks passing" ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("img", { name: "Checks passing" }));
  });

  it("must reject role when it is given", () => {
    render(
      // @ts-expect-error the label decides the role
      <StatusDot label="Checks passing" role="note" />
    );

    expect(screen.getByRole("img", { name: "Checks passing" })).toBeInTheDocument();
  });

  it("must reject aria-label when it is given", () => {
    render(
      // @ts-expect-error the label names the dot
      <StatusDot label="Checks passing" aria-label="Other" />
    );

    expect(screen.getByRole("img", { name: "Checks passing" })).toBeInTheDocument();
  });

  it("must reject aria-labelledby when it is given", () => {
    render(
      // @ts-expect-error the label names the dot
      <StatusDot label="Checks passing" aria-labelledby="missing" />
    );

    expect(screen.getByRole("img", { name: "Checks passing" })).toBeInTheDocument();
  });

  it("must reject aria-hidden when it is given", () => {
    render(
      // @ts-expect-error the label decides whether the dot is hidden
      <StatusDot label="Checks passing" aria-hidden={true} />
    );

    expect(screen.getByRole("img", { name: "Checks passing" })).toBeInTheDocument();
  });

  it("must reject a variant when it is not supported", () => {
    render(
      // @ts-expect-error "outline" is not a StatusDotVariant
      <StatusDot variant="outline" />
    );
  });
});
