import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Theme } from "./Theme";

describe("Theme", () => {
  it("must render a div when as is omitted", () => {
    render(<Theme>Content</Theme>);

    expect(screen.getByText("Content").tagName).toBe("DIV");
  });

  it("must set data-sui-theme when theme is given", () => {
    render(<Theme theme="playful">Content</Theme>);

    expect(screen.getByText("Content")).toHaveAttribute("data-sui-theme", "playful");
  });

  it("must set data-sui-mode when mode is given", () => {
    render(<Theme mode="dark">Content</Theme>);

    expect(screen.getByText("Content")).toHaveAttribute("data-sui-mode", "dark");
  });

  it("must set data-sui-palette when palette is given", () => {
    render(<Theme palette="pop">Content</Theme>);

    expect(screen.getByText("Content")).toHaveAttribute("data-sui-palette", "pop");
  });

  it("must omit the theme, palette and mode attributes when theme, palette and mode are omitted", () => {
    render(<Theme>Content</Theme>);

    const theme = screen.getByText("Content");
    expect(theme).not.toHaveAttribute("data-sui-theme");
    expect(theme).not.toHaveAttribute("data-sui-palette");
    expect(theme).not.toHaveAttribute("data-sui-mode");
  });

  it("must render the element given in as when as is set", () => {
    render(
      <Theme as="section" aria-label="Island">
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

  it("must forward name to the element when as is form", () => {
    render(
      <Theme as="form" name="checkout">
        Content
      </Theme>
    );

    const form = screen.getByText("Content");
    expect(form.tagName).toBe("FORM");
    expect(form).toHaveAttribute("name", "checkout");
    expect(form).not.toHaveAttribute("data-sui-theme");
  });

  it("must reject a theme name when it is not shipped", () => {
    // @ts-expect-error "ocean" is not a ThemeName
    render(<Theme theme="ocean">Content</Theme>);
  });

  it("must reject a palette name when it is not shipped", () => {
    // @ts-expect-error "neon" is not a PaletteName
    render(<Theme palette="neon">Content</Theme>);
  });

  it("must reject a mode when it is not supported", () => {
    // @ts-expect-error "auto" is not a ThemeMode
    render(<Theme mode="auto">Content</Theme>);
  });
});
