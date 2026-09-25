import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Heading } from "./Heading";

describe("Heading", () => {
  it.each([
    { level: 1, size: "3xl" },
    { level: 2, size: "2xl" },
    { level: 3, size: "xl" },
    { level: 4, size: "lg" },
    { level: 5, size: "md" },
    { level: 6, size: "sm" },
  ] as const)("must render an h$level sized $size when the level is $level", ({ level, size }) => {
    render(<Heading level={level}>Title</Heading>);

    expect(screen.getByRole("heading", { level, name: "Title" })).toHaveAttribute("data-size", size);
  });

  it("must apply the given size when size overrides the level default", () => {
    render(
      <Heading level={1} size="md">
        Title
      </Heading>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toHaveAttribute("data-size", "md");
  });

  it("must merge className when one is given", () => {
    render(
      <Heading className="custom" level={2}>
        Title
      </Heading>
    );

    expect(screen.getByRole("heading", { name: "Title" })).toHaveClass("custom");
  });

  it("must reject rendering when level is missing", () => {
    // @ts-expect-error level is required so heading semantics are always explicit
    render(<Heading>Title</Heading>);
  });

  it("must reject as when it is given", () => {
    render(
      // @ts-expect-error the level decides the element, so as is not accepted
      <Heading as="p" level={1}>
        Title
      </Heading>
    );
  });
});
