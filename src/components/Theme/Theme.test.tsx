import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Theme } from "./Theme";

describe("Theme", () => {
  it("must render a div when as is omitted", () => {
    render(<Theme>Content</Theme>);

    expect(screen.getByText("Content").tagName).toBe("DIV");
  });

  it("must set the theme and mode attributes when name and mode are given", () => {
    render(
      <Theme mode="dark" name="playful">
        Content
      </Theme>
    );

    const theme = screen.getByText("Content");
    expect(theme).toHaveAttribute("data-sui-theme", "playful");
    expect(theme).toHaveAttribute("data-sui-mode", "dark");
  });

  it("must omit the theme and mode attributes when name and mode are omitted", () => {
    render(<Theme>Content</Theme>);

    const theme = screen.getByText("Content");
    expect(theme).not.toHaveAttribute("data-sui-theme");
    expect(theme).not.toHaveAttribute("data-sui-mode");
  });

  it("must render the element given in as when as is set", () => {
    render(
      <Theme aria-label="Island" as="section">
        Content
      </Theme>
    );

    expect(screen.getByRole("region", { name: "Island" })).toBeInTheDocument();
  });

  it("must merge className when one is given", () => {
    render(<Theme className="custom">Content</Theme>);

    expect(screen.getByText("Content")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLElement>();

    render(
      <Theme as="section" ref={ref}>
        Content
      </Theme>
    );

    expect(ref.current).toBe(screen.getByText("Content"));
  });

  it("must reject a theme name when it is not shipped", () => {
    // @ts-expect-error "ocean" is not a ThemeName
    render(<Theme name="ocean">Content</Theme>);
  });
});
