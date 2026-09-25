import { createRef } from "react";
import { render as renderBase, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  it("must render a button of type button when type is omitted", () => {
    renderBase(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "button");
  });

  it("must use the given type when type is set", () => {
    renderBase(<Button type="submit">Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "submit");
  });

  it("must apply the primary variant and medium size when they are omitted", () => {
    renderBase(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("data-variant", "primary");
    expect(button).toHaveAttribute("data-size", "md");
  });

  it.each(["primary", "secondary", "outline"] as const)("must apply the %s variant when it is set", (variant) => {
    renderBase(<Button variant={variant}>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("data-variant", variant);
  });

  it.each(["sm", "md", "lg"] as const)("must apply the %s size when it is set", (size) => {
    renderBase(<Button size={size}>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("data-size", size);
  });

  it("must call onClick when the button is clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    renderBase(<Button onClick={handleClick}>Save</Button>);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("must not call onClick when the button is disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    renderBase(
      <Button disabled={true} onClick={handleClick}>
        Save
      </Button>
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("must merge className when one is given", () => {
    renderBase(<Button className="custom">Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLButtonElement>();

    renderBase(<Button ref={ref}>Save</Button>);

    expect(ref.current).toBe(screen.getByRole("button", { name: "Save" }));
  });

  it("must reject a variant when it is not supported", () => {
    // @ts-expect-error "danger" is not a ButtonVariant
    renderBase(<Button variant="danger">Save</Button>);
  });
});
