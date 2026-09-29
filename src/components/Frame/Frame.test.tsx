import type { CSSProperties } from "react";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Frame } from "./Frame";

describe("Frame", () => {
  it("must render a div with a 16 / 9 ratio when no props are given", () => {
    render(<Frame>Content</Frame>);

    const frame = screen.getByText("Content");
    expect(frame.tagName).toBe("DIV");
    expect(frame.style.getPropertyValue("--sui-frame-ratio")).toBe("16 / 9");
  });

  it("must set the ratio when ratio is given", () => {
    render(<Frame ratio="4 / 3">Content</Frame>);

    expect(screen.getByText("Content").style.getPropertyValue("--sui-frame-ratio")).toBe("4 / 3");
  });

  it("must render the image it frames when one is given", () => {
    render(
      <Frame>
        <img alt="Mountain lake" src="lake.jpg" />
      </Frame>
    );

    expect(screen.getByRole("img", { name: "Mountain lake" })).toBeInTheDocument();
  });

  it("must merge style with the ratio when style is given", () => {
    render(<Frame style={{ color: "red" }}>Content</Frame>);

    const frame = screen.getByText("Content");
    expect(frame).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(frame.style.getPropertyValue("--sui-frame-ratio")).toBe("16 / 9");
  });

  it("must let style override the ratio when style sets the same custom property", () => {
    render(<Frame style={{ "--sui-frame-ratio": "1 / 1" } as CSSProperties}>Content</Frame>);

    expect(screen.getByText("Content").style.getPropertyValue("--sui-frame-ratio")).toBe("1 / 1");
  });

  it("must merge className when one is given", () => {
    render(<Frame className="custom">Content</Frame>);

    expect(screen.getByText("Content")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLDivElement>();

    render(<Frame ref={ref}>Content</Frame>);

    expect(ref.current).toBe(screen.getByText("Content"));
  });

  it("must reject a ratio when it is not width / height", () => {
    // @ts-expect-error "wide" is not a width / height ratio
    render(<Frame ratio="wide">Content</Frame>);
  });
});
