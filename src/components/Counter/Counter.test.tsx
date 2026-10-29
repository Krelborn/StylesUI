import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import type { BadgeTone, BadgeVariant } from "../Badge";

import { Counter } from "./Counter";

const tones: BadgeTone[] = ["danger", "info", "neutral", "primary", "success", "warning"];
const variants: BadgeVariant[] = ["solid", "subtle"];

describe("Counter", () => {
  it("must show the count when it is 1 or more", () => {
    render(<Counter count={3} />);

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it.each([0, -2, 0.5, Number.NaN])("must render nothing when the count is %s", (count) => {
    render(<Counter count={count} data-testid="counter" />);

    expect(screen.queryByTestId("counter")).toBeNull();
  });

  it("must show the maximum followed by a plus when the count is above max", () => {
    render(<Counter count={120} max={99} />);

    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("must show the count without a plus when the count equals max", () => {
    render(<Counter count={99} max={99} />);

    expect(screen.getByText("99")).toBeInTheDocument();
  });

  it("must add a plus after the count when it is capped", () => {
    render(<Counter capped={true} count={30} />);

    expect(screen.getByText("30+")).toBeInTheDocument();
  });

  it("must apply max before capped when both are set", () => {
    render(<Counter capped={true} count={120} max={99} />);

    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("must read the hidden suffix after the count when hiddenSuffix is set", () => {
    render(<Counter count={3} hiddenSuffix="new" />);

    expect(screen.getByText("3").textContent).toBe("3 new");
  });

  it("must apply the neutral tone and subtle variant when they are omitted", () => {
    render(<Counter count={3} />);

    const counter = screen.getByText("3");
    expect(counter).toHaveAttribute("data-tone", "neutral");
    expect(counter).toHaveAttribute("data-variant", "subtle");
  });

  it.each(tones)("must apply the %s tone when it is set", (tone) => {
    render(<Counter count={3} tone={tone} />);

    expect(screen.getByText("3")).toHaveAttribute("data-tone", tone);
  });

  it.each(variants)("must apply the %s variant when it is set", (variant) => {
    render(<Counter count={3} variant={variant} />);

    expect(screen.getByText("3")).toHaveAttribute("data-variant", variant);
  });

  it("must forward native props when they are given", () => {
    render(<Counter count={3} id="unread-count" />);

    expect(screen.getByText("3")).toHaveAttribute("id", "unread-count");
  });

  it("must merge className when one is given", () => {
    render(<Counter className="custom" count={3} />);

    expect(screen.getByText("3")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLSpanElement>();

    render(<Counter count={3} ref={ref} />);

    expect(ref.current).toBe(screen.getByText("3"));
  });

  it("must reject children when they are given", () => {
    render(
      // @ts-expect-error the count is the content, so children are not accepted
      <Counter count={3}>three</Counter>
    );
  });
});

describe("Counter max below 1", () => {
  it.each([0, -2])("must treat a max of %s as 1", (max) => {
    render(<Counter count={5} max={max} />);

    expect(screen.getByText("1+")).toBeInTheDocument();
  });
});
