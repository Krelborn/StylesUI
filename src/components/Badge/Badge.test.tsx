import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { BadgeTone, BadgeVariant } from "./Badge";
import { Badge } from "./Badge";

const tones: BadgeTone[] = ["danger", "info", "neutral", "primary", "success", "warning"];
const variants: BadgeVariant[] = ["solid", "subtle"];

describe("Badge", () => {
  it("must render a span when as is omitted", () => {
    render(<Badge>New</Badge>);

    expect(screen.getByText("New").tagName).toBe("SPAN");
  });

  it("must apply the neutral tone and subtle variant when they are omitted", () => {
    render(<Badge>New</Badge>);

    const badge = screen.getByText("New");
    expect(badge).toHaveAttribute("data-tone", "neutral");
    expect(badge).toHaveAttribute("data-variant", "subtle");
  });

  it.each(tones)("must apply the %s tone when it is set", (tone) => {
    render(<Badge tone={tone}>New</Badge>);

    expect(screen.getByText("New")).toHaveAttribute("data-tone", tone);
  });

  it.each(variants)("must apply the %s variant when it is set", (variant) => {
    render(<Badge variant={variant}>New</Badge>);

    expect(screen.getByText("New")).toHaveAttribute("data-variant", variant);
  });

  it("must render the element given in as and forward its props when as is set", () => {
    render(
      <Badge as="a" href="#changelog">
        Changelog
      </Badge>
    );

    expect(screen.getByRole("link", { name: "Changelog" })).toHaveAttribute("href", "#changelog");
  });

  it("must forward native props when they are given", () => {
    render(<Badge id="release-status">Released</Badge>);

    expect(screen.getByText("Released")).toHaveAttribute("id", "release-status");
  });

  it("must merge className when one is given", () => {
    render(<Badge className="custom">New</Badge>);

    expect(screen.getByText("New")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLSpanElement>();

    render(<Badge ref={ref}>New</Badge>);

    expect(ref.current).toBe(screen.getByText("New"));
  });

  it("must reject a tone when it is not supported", () => {
    // @ts-expect-error "accent" is not a BadgeTone
    render(<Badge tone="accent">New</Badge>);
  });

  it("must reject a variant when it is not supported", () => {
    // @ts-expect-error "outline" is not a BadgeVariant
    render(<Badge variant="outline">New</Badge>);
  });
});
