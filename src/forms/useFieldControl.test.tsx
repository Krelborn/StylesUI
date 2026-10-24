import { render as renderBase, screen } from "@testing-library/react";
import type { JSX, ReactNode } from "react";
import { describe, expect, it } from "vitest";

import type { FieldContextValue } from "./FieldContext";
import { FieldContext } from "./FieldContext";
import type { FieldControlProps } from "./useFieldControl";
import { useFieldControl } from "./useFieldControl";

describe("useFieldControl", () => {
  it("must return the props unchanged when there is no Field", () => {
    renderBase(<Probe disabled={true} id="own-id" required={true} aria-describedby="own-note" aria-invalid={true} />);

    expect(elements.input).toHaveAttribute("id", "own-id");
    expect(elements.input).toHaveAttribute("aria-describedby", "own-note");
    expect(elements.input).toHaveAttribute("aria-invalid", "true");
    expect(elements.input).toBeDisabled();
    expect(elements.input).toBeRequired();
  });

  it("must leave every attribute absent when there is no Field and no props", () => {
    renderBase(<Probe />);

    expect(elements.input).not.toHaveAttribute("id");
    expect(elements.input).not.toHaveAttribute("aria-describedby");
    expect(elements.input).not.toHaveAttribute("aria-invalid");
    expect(elements.input).toBeEnabled();
    expect(elements.input).not.toBeRequired();
  });

  it("must use the Field control id when the control sets none", () => {
    const { render } = setUpTest({ field: { controlId: "field-control" } });

    render(<Probe />);

    expect(elements.input).toHaveAttribute("id", "field-control");
  });

  it("must use the Field control id when the control sets its own id", () => {
    const { render } = setUpTest({ field: { controlId: "field-control" } });

    render(<Probe id="own-id" />);

    expect(elements.input).toHaveAttribute("id", "field-control");
  });

  it("must keep the control's own aria-describedby after the Field's", () => {
    const { render } = setUpTest({ field: { describedBy: "field-description field-error" } });

    render(<Probe aria-describedby="own-note" />);

    expect(elements.input).toHaveAttribute("aria-describedby", "field-description field-error own-note");
  });

  it("must use the Field's aria-describedby when the control sets none", () => {
    const { render } = setUpTest({ field: { describedBy: "field-description" } });

    render(<Probe />);

    expect(elements.input).toHaveAttribute("aria-describedby", "field-description");
  });

  it("must use the control's own aria-describedby when the Field has none", () => {
    const { render } = setUpTest({ field: { describedBy: undefined } });

    render(<Probe aria-describedby="own-note" />);

    expect(elements.input).toHaveAttribute("aria-describedby", "own-note");
  });

  it("must leave aria-describedby absent when neither the Field nor the control has one", () => {
    const { render } = setUpTest({ field: { describedBy: undefined } });

    render(<Probe />);

    expect(elements.input).not.toHaveAttribute("aria-describedby");
  });

  it("must mark the control invalid when the Field has an error", () => {
    const { render } = setUpTest({ field: { invalid: true } });

    render(<Probe />);

    expect(elements.input).toHaveAttribute("aria-invalid", "true");
  });

  it("must leave aria-invalid absent when the Field has no error", () => {
    const { render } = setUpTest({ field: { invalid: false } });

    render(<Probe />);

    expect(elements.input).not.toHaveAttribute("aria-invalid");
  });

  it("must disable the control when the Field is disabled", () => {
    const { render } = setUpTest({ field: { disabled: true } });

    render(<Probe />);

    expect(elements.input).toBeDisabled();
  });

  it("must leave the control enabled when the Field is not disabled", () => {
    const { render } = setUpTest({ field: { disabled: false } });

    render(<Probe />);

    expect(elements.input).toBeEnabled();
  });

  it("must require the control when the Field is required", () => {
    const { render } = setUpTest({ field: { required: true } });

    render(<Probe />);

    expect(elements.input).toBeRequired();
  });

  it("must leave the control optional when the Field is not required", () => {
    const { render } = setUpTest({ field: { required: false } });

    render(<Probe />);

    expect(elements.input).not.toBeRequired();
  });

  it("must let the control's own aria-invalid win when the Field has an error", () => {
    const { render } = setUpTest({ field: { invalid: true } });

    render(<Probe aria-invalid={false} />);

    expect(elements.input).toHaveAttribute("aria-invalid", "false");
  });

  it("must let the control's own disabled win when the Field is disabled", () => {
    const { render } = setUpTest({ field: { disabled: true } });

    render(<Probe disabled={false} />);

    expect(elements.input).toBeEnabled();
  });

  it("must let the control's own required win when the Field is required", () => {
    const { render } = setUpTest({ field: { required: true } });

    render(<Probe required={false} />);

    expect(elements.input).not.toBeRequired();
  });
});

function Probe(props: FieldControlProps): JSX.Element {
  const controlProps = useFieldControl(props);

  return <input {...controlProps} aria-label="Probe" />;
}

function setUpTest({ field = {} }: { field?: Partial<FieldContextValue> } = {}) {
  const value: FieldContextValue = {
    controlId: "field-control",
    describedBy: undefined,
    disabled: false,
    invalid: false,
    labelId: undefined,
    required: false,
    ...field,
  };

  const render = (ui: ReactNode) => {
    renderBase(<FieldContext.Provider value={value}>{ui}</FieldContext.Provider>);
  };

  return { render };
}

const elements = {
  get input() {
    return screen.getByRole("textbox", { name: "Probe" });
  },
};
