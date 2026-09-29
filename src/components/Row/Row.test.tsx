import type { CSSProperties } from "react";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Row } from "./Row";

describe("Row", () => {
  it("must render a non-wrapping div with centre alignment, start justification and gap 2 when no props are given", () => {
    render(<Row>Content</Row>);

    const row = screen.getByText("Content");
    expect(row.tagName).toBe("DIV");
    expect(row).toHaveAttribute("data-align", "center");
    expect(row).toHaveAttribute("data-justify", "start");
    expect(row).not.toHaveAttribute("data-wrap");
    expect(row.style.getPropertyValue("--sui-horizontal-flow-gap")).toBe("var(--sui-space-2, 0.5rem)");
  });

  it.each(["start", "center", "end", "stretch", "baseline"] as const)(
    "must apply %s alignment when align is set",
    (align) => {
      render(<Row align={align}>Content</Row>);

      expect(screen.getByText("Content")).toHaveAttribute("data-align", align);
    }
  );

  it.each(["start", "center", "end", "between"] as const)(
    "must apply %s justification when justify is set",
    (justify) => {
      render(<Row justify={justify}>Content</Row>);

      expect(screen.getByText("Content")).toHaveAttribute("data-justify", justify);
    }
  );

  it("must set the gap when gap is given", () => {
    render(<Row gap={0}>Content</Row>);

    expect(screen.getByText("Content").style.getPropertyValue("--sui-horizontal-flow-gap")).toBe("0px");
  });

  it("must render the element given in as when as is set", () => {
    render(<Row as="header">Content</Row>);

    expect(screen.getByRole("banner")).toHaveTextContent("Content");
  });

  it("must expose a list when rendered as ul", () => {
    render(
      <Row as="ul">
        <li>Item</li>
      </Row>
    );

    expect(screen.getByRole("list")).toHaveTextContent("Item");
  });

  it("must merge style with the gap when style is given", () => {
    render(<Row style={{ color: "red" }}>Content</Row>);

    const row = screen.getByText("Content");
    expect(row).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(row.style.getPropertyValue("--sui-horizontal-flow-gap")).toBe("var(--sui-space-2, 0.5rem)");
  });

  it("must let style override the gap when style sets the same custom property", () => {
    render(<Row style={{ "--sui-horizontal-flow-gap": "3px" } as CSSProperties}>Content</Row>);

    expect(screen.getByText("Content").style.getPropertyValue("--sui-horizontal-flow-gap")).toBe("3px");
  });

  it("must merge className when one is given", () => {
    render(<Row className="custom">Content</Row>);

    expect(screen.getByText("Content")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLDivElement>();

    render(<Row ref={ref}>Content</Row>);

    expect(ref.current).toBe(screen.getByText("Content"));
  });

  it("must reject wrap when it is given", () => {
    // @ts-expect-error Row never wraps; use Cluster
    render(<Row wrap={true}>Content</Row>);
  });
});
