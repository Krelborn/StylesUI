import type { CSSProperties } from "react";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Cluster } from "./Cluster";

describe("Cluster", () => {
  it("must render a wrapping div with centre alignment, start justification and gap 2 when no props are given", () => {
    render(<Cluster>Content</Cluster>);

    const cluster = screen.getByText("Content");
    expect(cluster.tagName).toBe("DIV");
    expect(cluster).toHaveAttribute("data-align", "center");
    expect(cluster).toHaveAttribute("data-justify", "start");
    expect(cluster).toHaveAttribute("data-wrap", "");
    expect(cluster.style.getPropertyValue("--sui-horizontal-flow-gap")).toBe("var(--sui-space-2, 0.5rem)");
  });

  it.each(["start", "center", "end", "stretch", "baseline"] as const)(
    "must apply %s alignment when align is set",
    (align) => {
      render(<Cluster align={align}>Content</Cluster>);

      expect(screen.getByText("Content")).toHaveAttribute("data-align", align);
    }
  );

  it.each(["start", "center", "end", "between"] as const)(
    "must apply %s justification when justify is set",
    (justify) => {
      render(<Cluster justify={justify}>Content</Cluster>);

      expect(screen.getByText("Content")).toHaveAttribute("data-justify", justify);
    }
  );

  it("must set the gap when gap is given", () => {
    render(<Cluster gap={3}>Content</Cluster>);

    expect(screen.getByText("Content").style.getPropertyValue("--sui-horizontal-flow-gap")).toBe(
      "var(--sui-space-3, 0.75rem)"
    );
  });

  it("must render the element given in as when as is set", () => {
    render(
      <Cluster as="nav" aria-label="Main">
        Content
      </Cluster>
    );

    expect(screen.getByRole("navigation", { name: "Main" })).toHaveTextContent("Content");
  });

  it("must expose a list when rendered as ul", () => {
    render(
      <Cluster as="ul" aria-label="Tags">
        <li>Item</li>
      </Cluster>
    );

    expect(screen.getByRole("list", { name: "Tags" })).toHaveTextContent("Item");
  });

  it("must merge style with the gap when style is given", () => {
    render(<Cluster style={{ color: "red" }}>Content</Cluster>);

    const cluster = screen.getByText("Content");
    expect(cluster).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(cluster.style.getPropertyValue("--sui-horizontal-flow-gap")).toBe("var(--sui-space-2, 0.5rem)");
  });

  it("must let style override the gap when style sets the same custom property", () => {
    render(<Cluster style={{ "--sui-horizontal-flow-gap": "3px" } as CSSProperties}>Content</Cluster>);

    expect(screen.getByText("Content").style.getPropertyValue("--sui-horizontal-flow-gap")).toBe("3px");
  });

  it("must merge className when one is given", () => {
    render(<Cluster className="custom">Content</Cluster>);

    expect(screen.getByText("Content")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLDivElement>();

    render(<Cluster ref={ref}>Content</Cluster>);

    expect(ref.current).toBe(screen.getByText("Content"));
  });

  it("must reject a justification when it is not supported", () => {
    // @ts-expect-error "around" is not a Justification
    render(<Cluster justify="around">Content</Cluster>);
  });
});
