import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PolymorphicProps } from "./Box";
import { Box } from "./Box";

describe("Box", () => {
  it("renders a div by default", () => {
    render(<Box>Content</Box>);

    expect(screen.getByText("Content").tagName).toBe("DIV");
  });

  it("renders the element given in as and forwards its event handlers", async () => {
    const handleClick = vi.fn();
    render(
      <Box as="button" onClick={handleClick}>
        Click Me
      </Box>
    );

    await userEvent.click(screen.getByRole("button", { name: "Click Me" }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("forwards element attributes", () => {
    render(
      <Box as="a" href="https://example.com" id="link" aria-label="Example">
        Link
      </Box>
    );

    const link = screen.getByRole("link", { name: "Example" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("id", "link");
  });

  it("merges className with the base class", () => {
    render(<Box className="custom">Content</Box>);

    const box = screen.getByText("Content");
    expect(box).toHaveClass("custom");
    expect(box.classList).toHaveLength(2);
  });

  it("forwards ref to the rendered element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Box as="button" ref={ref}>
        Click Me
      </Box>
    );

    expect(ref.current).toBe(screen.getByRole("button"));
  });

  it("rejects props the element does not support", () => {
    // @ts-expect-error href is not a valid div prop
    render(<Box href="https://example.com">Content</Box>);
  });

  it("must accept element props and reject invalid own-prop values when typed with PolymorphicProps", () => {
    const acceptsLinkProps = (props: PolymorphicProps<"a", { tone?: "x" }>): string | undefined => props.href;

    expect(acceptsLinkProps({ href: "https://example.com", tone: "x" })).toBe("https://example.com");

    // @ts-expect-error "y" is not assignable to tone
    acceptsLinkProps({ tone: "y" });
  });
});
