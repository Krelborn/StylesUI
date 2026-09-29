import type { CSSProperties } from "react";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageLayout } from "./PageLayout";

describe("PageLayout", () => {
  it("must render a div with no gap when no props are given", () => {
    render(<PageLayout>Content</PageLayout>);

    const layout = screen.getByText("Content");
    expect(layout.tagName).toBe("DIV");
    expect(layout.style.getPropertyValue("--sui-page-layout-gap")).toBe("0px");
  });

  it("must render header, main and footer children as landmarks when they are given", () => {
    render(
      <PageLayout>
        <header>Site</header>
        <main>Post</main>
        <footer>Copyright</footer>
      </PageLayout>
    );

    expect(screen.getByRole("banner")).toHaveTextContent("Site");
    expect(screen.getByRole("main")).toHaveTextContent("Post");
    expect(screen.getByRole("contentinfo")).toHaveTextContent("Copyright");
  });

  it("must set the gap when gap is given", () => {
    render(<PageLayout gap={6}>Content</PageLayout>);

    expect(screen.getByText("Content").style.getPropertyValue("--sui-page-layout-gap")).toBe(
      "var(--sui-space-6, 1.5rem)"
    );
  });

  it("must merge style with the gap when style is given", () => {
    render(<PageLayout style={{ color: "red" }}>Content</PageLayout>);

    const layout = screen.getByText("Content");
    expect(layout).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(layout.style.getPropertyValue("--sui-page-layout-gap")).toBe("0px");
  });

  it("must let style override the gap when style sets the same custom property", () => {
    render(<PageLayout style={{ "--sui-page-layout-gap": "3px" } as CSSProperties}>Content</PageLayout>);

    expect(screen.getByText("Content").style.getPropertyValue("--sui-page-layout-gap")).toBe("3px");
  });

  it("must merge className when one is given", () => {
    render(<PageLayout className="custom">Content</PageLayout>);

    expect(screen.getByText("Content")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLDivElement>();

    render(<PageLayout ref={ref}>Content</PageLayout>);

    expect(ref.current).toBe(screen.getByText("Content"));
  });
});
