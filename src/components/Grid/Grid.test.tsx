import type { CSSProperties } from "react";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Grid } from "./Grid";

describe("Grid", () => {
  it("must render a div with gap 4 and a 16rem minimum item width when no props are given", () => {
    render(<Grid>Content</Grid>);

    const grid = screen.getByText("Content");
    expect(grid.tagName).toBe("DIV");
    expect(grid.style.getPropertyValue("--sui-grid-gap")).toBe("var(--sui-space-4, 1rem)");
    expect(grid.style.getPropertyValue("--sui-grid-minimum-item-width")).toBe("16rem");
  });

  it("must set the gap and minimum item width when they are given", () => {
    render(
      <Grid gap={2} minimumItemWidth="12rem">
        Content
      </Grid>
    );

    const grid = screen.getByText("Content");
    expect(grid.style.getPropertyValue("--sui-grid-gap")).toBe("var(--sui-space-2, 0.5rem)");
    expect(grid.style.getPropertyValue("--sui-grid-minimum-item-width")).toBe("12rem");
  });

  it("must render the element given in as when as is set", () => {
    render(
      <Grid as="section" aria-label="Latest posts">
        Content
      </Grid>
    );

    expect(screen.getByRole("region", { name: "Latest posts" })).toHaveTextContent("Content");
  });

  it("must expose a list when rendered as ul", () => {
    render(
      <Grid as="ul">
        <li>Item</li>
      </Grid>
    );

    expect(screen.getByRole("list")).toHaveTextContent("Item");
  });

  it("must merge style with the custom properties when style is given", () => {
    render(<Grid style={{ color: "red" }}>Content</Grid>);

    const grid = screen.getByText("Content");
    expect(grid).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(grid.style.getPropertyValue("--sui-grid-gap")).toBe("var(--sui-space-4, 1rem)");
  });

  it("must let style override the gap when style sets the same custom property", () => {
    render(<Grid style={{ "--sui-grid-gap": "3px" } as CSSProperties}>Content</Grid>);

    expect(screen.getByText("Content").style.getPropertyValue("--sui-grid-gap")).toBe("3px");
  });

  it("must merge className when one is given", () => {
    render(<Grid className="custom">Content</Grid>);

    expect(screen.getByText("Content")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLDivElement>();

    render(<Grid ref={ref}>Content</Grid>);

    expect(ref.current).toBe(screen.getByText("Content"));
  });
});
