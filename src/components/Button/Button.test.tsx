import type { FormEvent } from "react";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { transitionedProperties } from "../../test/transitionedProperties";
import { Box } from "../Box";
import spinnerCss from "../Spinner/Spinner.module.css?raw";
import { TextInput } from "../TextInput";

import { Button } from "./Button";
import buttonCss from "./Button.module.css?raw";

describe("Button", () => {
  it("must render a button of type button when type is omitted", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "button");
  });

  it("must use the given type when type is set", () => {
    render(<Button type="submit">Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "submit");
  });

  it("must apply the primary variant and medium size when they are omitted", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("data-variant", "primary");
    expect(button).toHaveAttribute("data-size", "md");
  });

  it.each(["ghost", "outline", "primary", "secondary"] as const)(
    "must apply the %s variant when it is set",
    (variant) => {
      render(<Button variant={variant}>Save</Button>);

      expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("data-variant", variant);
    }
  );

  it("must fill a ghost button with the secondary pairing when it is pressed", () => {
    const pressedGhostRule =
      buttonCss.match(/\.button\[data-variant="ghost"\]:active:not\(:disabled, \[data-busy\]\) \{(.*?)\}/s)?.[1] ?? "";
    const declarations = pressedGhostRule.split(";").map((declaration) => declaration.trim());

    expect(declarations).toContain("background-color: var(--sui-color-secondary, #e5e7eb)");
    expect(declarations).toContain("color: var(--sui-color-on-secondary, #111827)");
  });

  it.each(["sm", "md", "lg"] as const)("must apply the %s size when it is set", (size) => {
    render(<Button size={size}>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("data-size", size);
  });

  it("must call onClick when the button is clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Save</Button>);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("must not call onClick when the button is disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button disabled={true} onClick={handleClick}>
        Save
      </Button>
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("must not call onClick when the button is busy", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button busy={true} onClick={handleClick}>
        Save
      </Button>
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("must not submit its form when the button is busy and pressed", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    render(
      <Box as="form" onSubmit={handleSubmit} aria-label="Profile">
        <Button busy={true} type="submit">
          Save
        </Button>
      </Box>
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("must not submit its form when Enter is pressed in a field while the submit button is busy", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    render(
      <Box as="form" onSubmit={handleSubmit} aria-label="Profile">
        <TextInput aria-label="Name" />
        <Button busy={true} type="submit">
          Save
        </Button>
      </Box>
    );

    await user.type(screen.getByRole("textbox", { name: "Name" }), "Pat{Enter}");

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("must stay focusable and be marked disabled when it is busy", async () => {
    const user = userEvent.setup();
    render(<Button busy={true}>Save</Button>);

    await user.tab();

    expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("aria-disabled", "true");
  });

  it("must keep its accessible name when it is busy", () => {
    render(<Button busy={true}>Save changes</Button>);

    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("must keep the consumer's aria-disabled when it is not busy", () => {
    render(<Button aria-disabled={true}>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("aria-disabled", "true");
  });

  it("must pulse the spinner instead of rotating it when reduced motion is requested", () => {
    const reducedMotionBlock = spinnerCss.match(/@media \(prefers-reduced-motion: reduce\) \{(.*?)\n\}/s)?.[1] ?? "";

    expect(reducedMotionBlock).toContain("animation:");
    expect(reducedMotionBlock).toContain("pulse");
    expect(reducedMotionBlock).not.toContain("rotate");
  });

  it("must merge className when one is given", () => {
    render(<Button className="custom">Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLButtonElement>();

    render(<Button ref={ref}>Save</Button>);

    expect(ref.current).toBe(screen.getByRole("button", { name: "Save" }));
  });

  it("must reject a variant when it is not supported", () => {
    // @ts-expect-error "danger" is not a ButtonVariant
    render(<Button variant="danger">Save</Button>);
  });

  it("must reject a size when it is not supported", () => {
    // @ts-expect-error "xl" is not a ButtonSize
    render(<Button size="xl">Save</Button>);
  });

  it("must transition only colours when reduced motion is requested", () => {
    const reducedMotionBlock = buttonCss.match(/@media \(prefers-reduced-motion: reduce\) \{(.*?)\n\}/s)?.[1] ?? "";

    expect(transitionedProperties(reducedMotionBlock)).toEqual(["background-color", "border-color"]);
  });

  it("must never transition the outline when focus moves to the button", () => {
    const properties = transitionedProperties(buttonCss);

    expect(properties).not.toContain("all");
    expect(properties).not.toContain("outline");
  });
});
