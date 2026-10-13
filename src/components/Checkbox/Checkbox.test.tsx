import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { transitionedProperties } from "../../test/transitionedProperties";
import choiceControlCss from "../ChoiceControl/ChoiceControl.module.css?raw";
import { Field } from "../Field";

import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("must render an unchecked checkbox named by its children when children are given", () => {
    render(<Checkbox>Accept terms</Checkbox>);

    expect(elements.checkbox).not.toBeChecked();
  });

  it("must be named by aria-label when it has no children", () => {
    render(<Checkbox aria-label="Accept terms" />);

    expect(elements.checkbox).toBeInTheDocument();
  });

  it("must toggle when the input is clicked", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Checkbox onChange={handleChange}>Accept terms</Checkbox>);

    await user.click(elements.checkbox);

    expect(elements.checkbox).toBeChecked();
    expect(handleChange).toHaveBeenCalled();
  });

  it("must toggle when the label text is clicked", async () => {
    const user = userEvent.setup();
    render(<Checkbox>Accept terms</Checkbox>);

    await user.click(screen.getByText("Accept terms"));

    expect(elements.checkbox).toBeChecked();
  });

  it("must not toggle when it is disabled", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Checkbox disabled={true} onChange={handleChange}>
        Accept terms
      </Checkbox>
    );

    await user.click(elements.checkbox);
    await user.click(screen.getByText("Accept terms"));

    expect(elements.checkbox).not.toBeChecked();
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("must show an asterisk and be required when required is set", () => {
    render(<Checkbox required={true}>Accept terms</Checkbox>);

    expect(elements.checkbox).toBeRequired();
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("must show an asterisk and be required when a Field requires it", () => {
    render(
      <Field required={true}>
        <Checkbox>Accept terms</Checkbox>
      </Field>
    );

    expect(elements.checkbox).toBeRequired();
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("must not show an asterisk when it is not required", () => {
    render(<Checkbox>Accept terms</Checkbox>);

    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("must not show an asterisk when it is required and has no children", () => {
    render(<Checkbox required={true} aria-label="Accept terms" />);

    expect(elements.checkbox).toBeRequired();
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("must take its description and invalid state from a Field when it is inside one", () => {
    render(
      <Field description="You can change this later" error="Accept the terms to continue">
        <Checkbox>Accept terms</Checkbox>
      </Field>
    );

    expect(elements.checkbox).toHaveAccessibleDescription("You can change this later Accept the terms to continue");
    expect(elements.checkbox).toBeInvalid();
  });

  it("must forward native props to the input when they are given", () => {
    render(
      <Checkbox defaultChecked={true} name="terms" value="accepted">
        Accept terms
      </Checkbox>
    );

    expect(elements.checkbox).toBeChecked();
    expect(elements.checkbox).toHaveAttribute("name", "terms");
    expect(elements.checkbox).toHaveAttribute("value", "accepted");
  });

  it("must send className and style to the label when they are given", () => {
    render(
      <Checkbox className="custom" style={{ color: "red" }}>
        Accept terms
      </Checkbox>
    );

    expect(elements.label).toHaveClass("custom");
    expect(elements.label).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(elements.checkbox).not.toHaveClass("custom");
    expect(elements.checkbox).not.toHaveAttribute("style");
  });

  it("must forward ref to the input when one is given", () => {
    const ref = createRef<HTMLInputElement>();

    render(<Checkbox ref={ref}>Accept terms</Checkbox>);

    expect(ref.current).toBe(elements.checkbox);
  });

  it("must reject a type when one is given", () => {
    // @ts-expect-error Checkbox always renders a checkbox input
    render(<Checkbox type="radio">Accept terms</Checkbox>);

    expect(elements.checkbox).toHaveAttribute("type", "checkbox");
  });

  it("must reject as when it is given", () => {
    // @ts-expect-error Checkbox always renders an input inside a label
    render(<Checkbox as="textarea">Accept terms</Checkbox>);

    expect(elements.checkbox).toBeInstanceOf(HTMLInputElement);
  });

  it("must reject dangerouslySetInnerHTML when it is given", () => {
    // Built without rendering, since React throws when an input is given inner HTML
    // @ts-expect-error an input takes no inner HTML
    const element = <Checkbox dangerouslySetInnerHTML={{ __html: "Accept terms" }} aria-label="Accept terms" />;

    expect(isValidElement(element)).toBe(true);
  });

  it("must leave only colour transitions in the choice control stylesheet when reduced motion is requested", () => {
    const reducedMotionBlock =
      choiceControlCss.match(/@media \(prefers-reduced-motion: reduce\) \{(.*?)\n\}/s)?.[1] ?? "";

    expect(transitionedProperties(reducedMotionBlock)).toEqual(["background-color"]);
  });

  it("must show the hover halo in the choice control stylesheet only when the device can hover", () => {
    const css = choiceControlCss.replace(/\/\*.*?\*\//gs, "");
    const hoverGates = css.match(/@media \(hover: hover\) \{.*?\n\}/gs) ?? [];
    const ungated = hoverGates.reduce((rest, gate) => rest.replace(gate, ""), css);

    expect(hoverGates.join("")).toContain(":hover");
    expect(ungated).not.toContain(":hover");
  });

  it("must never transition the outline or all properties when the choice control stylesheet declares a transition", () => {
    const properties = transitionedProperties(choiceControlCss);

    expect(properties).not.toHaveLength(0);
    expect(properties).not.toContain("all");
    expect(properties).not.toContain("outline");
  });
});

const elements = {
  get checkbox() {
    return screen.getByRole<HTMLInputElement>("checkbox", { name: "Accept terms" });
  },
  get label() {
    return elements.checkbox.labels?.item(0);
  },
};
