import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card } from "./Card";

describe("Card", () => {
  it("must render a div with medium padding when as and padding are omitted", () => {
    render(<Card>Content</Card>);

    const card = screen.getByText("Content");
    expect(card.tagName).toBe("DIV");
    expect(card).toHaveAttribute("data-padding", "md");
  });

  it.each(["sm", "md", "lg"] as const)("must apply %s padding when it is set", (padding) => {
    render(<Card padding={padding}>Content</Card>);

    expect(screen.getByText("Content")).toHaveAttribute("data-padding", padding);
  });

  it("must render the element given in as when as is set", () => {
    render(<Card as="article">Content</Card>);

    expect(screen.getByRole("article")).toHaveTextContent("Content");
  });

  it("must merge className when one is given", () => {
    render(<Card className="custom">Content</Card>);

    expect(screen.getByText("Content")).toHaveClass("custom");
  });

  it("must reject button props when rendered as a div", () => {
    // @ts-expect-error type is not a valid div prop
    render(<Card type="submit">Content</Card>);
  });
});
