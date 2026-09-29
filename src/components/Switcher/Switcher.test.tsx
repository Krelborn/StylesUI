import type { CSSProperties } from "react";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Switcher } from "./Switcher";

describe("Switcher", () => {
  it("must render a div with gap 4 and a 30rem threshold when no props are given", () => {
    render(<Switcher>Content</Switcher>);

    const switcher = screen.getByText("Content");
    expect(switcher.tagName).toBe("DIV");
    expect(switcher.style.getPropertyValue("--sui-switcher-gap")).toBe("var(--sui-space-4, 1rem)");
    expect(switcher.style.getPropertyValue("--sui-switcher-threshold")).toBe("30rem");
  });

  it("must set the gap and threshold when they are given", () => {
    render(
      <Switcher gap={1} threshold="20rem">
        Content
      </Switcher>
    );

    const switcher = screen.getByText("Content");
    expect(switcher.style.getPropertyValue("--sui-switcher-gap")).toBe("var(--sui-space-1, 0.25rem)");
    expect(switcher.style.getPropertyValue("--sui-switcher-threshold")).toBe("20rem");
  });

  it("must render the element given in as when as is set", () => {
    render(
      <Switcher as="nav" aria-label="More posts">
        Content
      </Switcher>
    );

    expect(screen.getByRole("navigation", { name: "More posts" })).toHaveTextContent("Content");
  });

  it("must expose a list when rendered as ol", () => {
    render(
      <Switcher as="ol">
        <li>Item</li>
      </Switcher>
    );

    expect(screen.getByRole("list")).toHaveTextContent("Item");
  });

  it("must merge style with the custom properties when style is given", () => {
    render(<Switcher style={{ color: "red" }}>Content</Switcher>);

    const switcher = screen.getByText("Content");
    expect(switcher).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(switcher.style.getPropertyValue("--sui-switcher-threshold")).toBe("30rem");
  });

  it("must let style override the threshold when style sets the same custom property", () => {
    render(<Switcher style={{ "--sui-switcher-threshold": "5rem" } as CSSProperties}>Content</Switcher>);

    expect(screen.getByText("Content").style.getPropertyValue("--sui-switcher-threshold")).toBe("5rem");
  });

  it("must merge className when one is given", () => {
    render(<Switcher className="custom">Content</Switcher>);

    expect(screen.getByText("Content")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLDivElement>();

    render(<Switcher ref={ref}>Content</Switcher>);

    expect(ref.current).toBe(screen.getByText("Content"));
  });
});
