import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Text } from "./Text";

describe("Text", () => {
  it("must render a span when as is omitted", () => {
    render(<Text>Hello</Text>);

    expect(screen.getByText("Hello").tagName).toBe("SPAN");
  });

  it("must apply the default size, tone and weight when they are omitted", () => {
    render(<Text>Hello</Text>);

    const text = screen.getByText("Hello");
    expect(text).toHaveAttribute("data-size", "md");
    expect(text).toHaveAttribute("data-tone", "default");
    expect(text).toHaveAttribute("data-weight", "regular");
  });

  it("must apply the given size, tone and weight when they are set", () => {
    render(
      <Text size="xl" tone="muted" weight="bold">
        Hello
      </Text>
    );

    const text = screen.getByText("Hello");
    expect(text).toHaveAttribute("data-size", "xl");
    expect(text).toHaveAttribute("data-tone", "muted");
    expect(text).toHaveAttribute("data-weight", "bold");
  });

  it("must render the element given in as and forward its props when as is set", () => {
    render(
      <Text as="a" href="https://example.com">
        Link
      </Text>
    );

    expect(screen.getByRole("link", { name: "Link" })).toHaveAttribute("href", "https://example.com");
  });

  it("must merge className when one is given", () => {
    render(<Text className="custom">Hello</Text>);

    expect(screen.getByText("Hello")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLSpanElement>();

    render(<Text ref={ref}>Hello</Text>);

    expect(ref.current).toBe(screen.getByText("Hello"));
  });

  it("must reject a size when it is only valid for headings", () => {
    // @ts-expect-error "2xl" is a HeadingSize, not a TextSize
    render(<Text size="2xl">Hello</Text>);
  });

  it("must reject a tone when it is not supported", () => {
    // @ts-expect-error "accent" is not a TextTone
    render(<Text tone="accent">Hello</Text>);
  });

  it("must reject a weight when it is not supported", () => {
    // @ts-expect-error "light" is not a TextWeight
    render(<Text weight="light">Hello</Text>);
  });
});
