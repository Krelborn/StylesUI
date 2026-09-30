import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AlertTone } from "./Alert";
import { Alert } from "./Alert";

const tones: AlertTone[] = ["danger", "info", "success", "warning"];

// The default icon is hidden from assistive technology, so no accessible query can find it
function findDefaultIcon(): SVGElement | null {
  return screen.getByTestId("alert").querySelector("svg");
}

describe("Alert", () => {
  it("must render a div when as is omitted", () => {
    render(<Alert data-testid="alert">Saved</Alert>);

    expect(screen.getByTestId("alert").tagName).toBe("DIV");
  });

  it("must have no role when none is given", () => {
    render(<Alert data-testid="alert">Saved</Alert>);

    expect(screen.getByTestId("alert")).not.toHaveAttribute("role");
  });

  it("must pass the role through when one is given", () => {
    render(<Alert role="alert">Saved</Alert>);

    expect(screen.getByRole("alert")).toHaveTextContent("Saved");
  });

  it("must render the element given in as when as is set", () => {
    render(
      <Alert as="section" aria-label="Import result">
        Saved
      </Alert>
    );

    expect(screen.getByRole("region", { name: "Import result" })).toHaveTextContent("Saved");
  });

  it("must apply the info tone when it is omitted", () => {
    render(<Alert data-testid="alert">Saved</Alert>);

    expect(screen.getByTestId("alert")).toHaveAttribute("data-tone", "info");
  });

  it.each(tones)("must apply the %s tone when it is set", (tone) => {
    render(
      <Alert data-testid="alert" tone={tone}>
        Saved
      </Alert>
    );

    expect(screen.getByTestId("alert")).toHaveAttribute("data-tone", tone);
  });

  it("must render the children when they are given", () => {
    render(<Alert>Your changes are saved</Alert>);

    expect(screen.getByText("Your changes are saved")).toBeInTheDocument();
  });

  it("must render the title when one is given", () => {
    render(<Alert title="Heads up">Your changes are saved</Alert>);

    expect(screen.getByText("Heads up")).toBeInTheDocument();
  });

  it("must render a node as the title when one is given", () => {
    render(<Alert title={<em>Heads up</em>}>Your changes are saved</Alert>);

    expect(screen.getByText("Heads up").tagName).toBe("EM");
  });

  it("must not set a title attribute when a title is given", () => {
    render(
      <Alert data-testid="alert" title="Heads up">
        Your changes are saved
      </Alert>
    );

    expect(screen.getByTestId("alert")).not.toHaveAttribute("title");
    expect(screen.queryByTitle("Heads up")).not.toBeInTheDocument();
  });

  it.each(tones)("must render the default icon hidden from assistive technology for the %s tone", (tone) => {
    render(
      <Alert data-testid="alert" tone={tone}>
        Saved
      </Alert>
    );

    expect(findDefaultIcon()).toHaveAttribute("aria-hidden", "true");
  });

  it("must render the icon in place of the default icon when one is given", () => {
    render(
      <Alert data-testid="alert" icon={<span>Tip</span>}>
        Saved
      </Alert>
    );

    expect(screen.getByText("Tip")).toBeInTheDocument();
    expect(findDefaultIcon()).toBeNull();
  });

  it.each([null, false])("must render no icon when icon is %s", (icon) => {
    render(
      <Alert data-testid="alert" icon={icon}>
        Saved
      </Alert>
    );

    expect(findDefaultIcon()).toBeNull();
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("must forward native props when they are given", () => {
    render(
      <Alert data-testid="alert" id="import-result">
        Saved
      </Alert>
    );

    expect(screen.getByTestId("alert")).toHaveAttribute("id", "import-result");
  });

  it("must merge className when one is given", () => {
    render(
      <Alert className="custom" data-testid="alert">
        Saved
      </Alert>
    );

    expect(screen.getByTestId("alert")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <Alert data-testid="alert" ref={ref}>
        Saved
      </Alert>
    );

    expect(ref.current).toBe(screen.getByTestId("alert"));
  });

  it("must reject a tone when it is not supported", () => {
    // @ts-expect-error "error" is not an AlertTone
    render(<Alert tone="error">Saved</Alert>);
  });
});
