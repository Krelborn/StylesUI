import type { CSSProperties } from "react";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Stack } from "./Stack";

describe("Stack", () => {
  it("must render a div with stretch alignment and gap 4 when no props are given", () => {
    render(<Stack>Content</Stack>);

    const stack = screen.getByText("Content");
    expect(stack.tagName).toBe("DIV");
    expect(stack).toHaveAttribute("data-align", "stretch");
    expect(stack.style.getPropertyValue("--sui-stack-gap")).toBe("var(--sui-space-4, 1rem)");
  });

  it.each(["start", "center", "end", "stretch", "baseline"] as const)(
    "must apply %s alignment when align is set",
    (align) => {
      render(<Stack align={align}>Content</Stack>);

      expect(screen.getByText("Content")).toHaveAttribute("data-align", align);
    }
  );

  it.each([
    { gap: 0, expected: "0px" },
    { gap: 6, expected: "var(--sui-space-6, 1.5rem)" },
  ] as const)("must set the gap to $expected when gap is $gap", ({ expected, gap }) => {
    render(<Stack gap={gap}>Content</Stack>);

    expect(screen.getByText("Content").style.getPropertyValue("--sui-stack-gap")).toBe(expected);
  });

  it("must render the element given in as when as is set", () => {
    render(<Stack as="article">Content</Stack>);

    expect(screen.getByRole("article")).toHaveTextContent("Content");
  });

  it.each(["ul", "ol"] as const)("must expose a list when rendered as %s", (element) => {
    render(
      <Stack as={element}>
        <li>Item</li>
      </Stack>
    );

    expect(screen.getByRole("list")).toHaveTextContent("Item");
  });

  it("must keep the given role when rendered as a list with a role", () => {
    render(
      <Stack as="ul" role="menu">
        <li role="menuitem">Item</li>
      </Stack>
    );

    expect(screen.getByRole("menu")).toHaveTextContent("Item");
  });

  it("must merge style with the gap when style is given", () => {
    render(<Stack style={{ color: "red" }}>Content</Stack>);

    const stack = screen.getByText("Content");
    expect(stack).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(stack.style.getPropertyValue("--sui-stack-gap")).toBe("var(--sui-space-4, 1rem)");
  });

  it("must let style override the gap when style sets the same custom property", () => {
    render(<Stack style={{ "--sui-stack-gap": "3px" } as CSSProperties}>Content</Stack>);

    expect(screen.getByText("Content").style.getPropertyValue("--sui-stack-gap")).toBe("3px");
  });

  it("must merge className when one is given", () => {
    render(<Stack className="custom">Content</Stack>);

    expect(screen.getByText("Content")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLDivElement>();

    render(<Stack ref={ref}>Content</Stack>);

    expect(ref.current).toBe(screen.getByText("Content"));
  });

  it("must reject a gap when it is not on the scale", () => {
    // @ts-expect-error 9 is not a Space
    render(<Stack gap={9}>Content</Stack>);
  });
});
