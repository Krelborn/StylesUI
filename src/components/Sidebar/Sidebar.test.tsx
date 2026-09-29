import type { CSSProperties } from "react";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("must render a div with the sidebar at the end, stretched panes, gap 4 and a 50% content minimum when no props are given", () => {
    render(<Sidebar>Content</Sidebar>);

    const sidebar = screen.getByText("Content");
    expect(sidebar.tagName).toBe("DIV");
    expect(sidebar).toHaveAttribute("data-side", "end");
    expect(sidebar).toHaveAttribute("data-align", "stretch");
    expect(sidebar.style.getPropertyValue("--sui-sidebar-gap")).toBe("var(--sui-space-4, 1rem)");
    expect(sidebar.style.getPropertyValue("--sui-sidebar-content-minimum-width")).toBe("50%");
  });

  it("must leave the side width to the content when sideWidth is omitted", () => {
    render(<Sidebar>Content</Sidebar>);

    expect(screen.getByText("Content").style.getPropertyValue("--sui-sidebar-side-width")).toBe("");
  });

  it("must set the side width when sideWidth is given", () => {
    render(<Sidebar sideWidth="18rem">Content</Sidebar>);

    expect(screen.getByText("Content").style.getPropertyValue("--sui-sidebar-side-width")).toBe("18rem");
  });

  it.each(["start", "end"] as const)("must put the sidebar at the %s when side is set", (side) => {
    render(<Sidebar side={side}>Content</Sidebar>);

    expect(screen.getByText("Content")).toHaveAttribute("data-side", side);
  });

  it.each(["start", "stretch"] as const)("must apply %s alignment when align is set", (align) => {
    render(<Sidebar align={align}>Content</Sidebar>);

    expect(screen.getByText("Content")).toHaveAttribute("data-align", align);
  });

  it("must set the gap and content minimum width when they are given", () => {
    render(
      <Sidebar contentMinimumWidth="60%" gap={8}>
        Content
      </Sidebar>
    );

    const sidebar = screen.getByText("Content");
    expect(sidebar.style.getPropertyValue("--sui-sidebar-gap")).toBe("var(--sui-space-8, 2rem)");
    expect(sidebar.style.getPropertyValue("--sui-sidebar-content-minimum-width")).toBe("60%");
  });

  it("must render the element given in as when as is set", () => {
    render(<Sidebar as="main">Content</Sidebar>);

    expect(screen.getByRole("main")).toHaveTextContent("Content");
  });

  it("must merge style with the custom properties when style is given", () => {
    render(<Sidebar style={{ color: "red" }}>Content</Sidebar>);

    const sidebar = screen.getByText("Content");
    expect(sidebar).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(sidebar.style.getPropertyValue("--sui-sidebar-gap")).toBe("var(--sui-space-4, 1rem)");
  });

  it("must let style override the side width when style sets the same custom property", () => {
    render(
      <Sidebar sideWidth="18rem" style={{ "--sui-sidebar-side-width": "10rem" } as CSSProperties}>
        Content
      </Sidebar>
    );

    expect(screen.getByText("Content").style.getPropertyValue("--sui-sidebar-side-width")).toBe("10rem");
  });

  it("must merge className when one is given", () => {
    render(<Sidebar className="custom">Content</Sidebar>);

    expect(screen.getByText("Content")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLDivElement>();

    render(<Sidebar ref={ref}>Content</Sidebar>);

    expect(ref.current).toBe(screen.getByText("Content"));
  });

  it("must reject an alignment when it is not supported", () => {
    // @ts-expect-error Sidebar only supports start and stretch
    render(<Sidebar align="center">Content</Sidebar>);
  });
});
