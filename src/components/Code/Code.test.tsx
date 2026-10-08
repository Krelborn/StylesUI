import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { Code } from "./Code";

describe("Code", () => {
  it("must render a code element when it is given text", () => {
    render(<Code>pnpm install</Code>);

    expect(screen.getByText("pnpm install").tagName).toBe("CODE");
  });

  it("must forward native props when they are given", () => {
    render(<Code id="install-command">pnpm install</Code>);

    expect(screen.getByText("pnpm install")).toHaveAttribute("id", "install-command");
  });

  it("must merge className when one is given", () => {
    render(<Code className="custom">pnpm install</Code>);

    expect(screen.getByText("pnpm install")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLElement>();

    render(<Code ref={ref}>pnpm install</Code>);

    expect(ref.current).toBe(screen.getByText("pnpm install"));
  });

  it("must reject as when it is given", () => {
    // @ts-expect-error Code always renders a code element
    render(<Code as="span">pnpm install</Code>);
  });
});
