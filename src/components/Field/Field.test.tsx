import type { JSX } from "react";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { FieldControlProps } from "../../forms";
import { useFieldControl } from "../../forms";
import { Box } from "../Box";

import { Field } from "./Field";

describe("Field", () => {
  it("must name the control from the label when a label is given", () => {
    render(
      <Field label="Email">
        <Probe />
      </Field>
    );

    expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
  });

  it("must exclude the asterisk from the accessible name when the field is required", () => {
    render(
      <Field label="Email" required={true}>
        <Probe />
      </Field>
    );

    expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("must not show an asterisk when the field is not required", () => {
    render(
      <Field label="Email">
        <Probe />
      </Field>
    );

    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("must not show an asterisk or name the control when the label is empty", () => {
    render(
      <Field label="" required={true}>
        <Probe />
      </Field>
    );

    expect(screen.queryByText("*")).not.toBeInTheDocument();
    expect(elements.input).not.toHaveAccessibleName();
  });

  it("must describe the control with the description when one is given", () => {
    render(
      <Field description="Use your work address" label="Email">
        <Probe />
      </Field>
    );

    expect(elements.input).toHaveAccessibleDescription("Use your work address");
  });

  it("must describe the control with the error when one is given", () => {
    render(
      <Field error="Enter a valid email" label="Email">
        <Probe />
      </Field>
    );

    expect(elements.input).toHaveAccessibleDescription("Enter a valid email");
  });

  it("must describe the control with the description, then the error, when both are given", () => {
    render(
      <Field description="Use your work address" error="Enter a valid email" label="Email">
        <Probe />
      </Field>
    );

    expect(elements.input).toHaveAccessibleDescription("Use your work address Enter a valid email");
  });

  it.each([
    { description: "an empty string", empty: "" },
    { description: "false", empty: false },
    { description: "true", empty: true },
    { description: "null", empty: null },
  ])("must not describe the control when the description is $description", ({ empty }) => {
    render(
      <Field description={empty} label="Email">
        <Probe />
      </Field>
    );

    expect(elements.input).not.toHaveAccessibleDescription();
    expect(elements.input).not.toHaveAttribute("aria-describedby");
  });

  it("must mark the control invalid when an error is given", () => {
    render(
      <Field error="Enter a valid email" label="Email">
        <Probe />
      </Field>
    );

    expect(elements.input).toBeInvalid();
  });

  it.each([
    { description: "an empty string", empty: "" },
    { description: "false", empty: false },
    { description: "true", empty: true },
    { description: "null", empty: null },
  ])("must not mark the control invalid or describe it when the error is $description", ({ empty }) => {
    render(
      <Field error={empty} label="Email">
        <Probe />
      </Field>
    );

    expect(elements.input).not.toBeInvalid();
    expect(elements.input).not.toHaveAccessibleDescription();
    expect(elements.input).not.toHaveAttribute("aria-describedby");
  });

  it("must mark the control required when the field is required", () => {
    render(
      <Field label="Email" required={true}>
        <Probe />
      </Field>
    );

    expect(elements.input).toBeRequired();
  });

  it("must disable the control when the field is disabled", () => {
    render(
      <Field disabled={true} label="Email">
        <Probe />
      </Field>
    );

    expect(elements.input).toBeDisabled();
  });

  it("must use controlId as the control id when it is given", () => {
    render(
      <Field controlId="email-control" label="Email">
        <Probe />
      </Field>
    );

    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute("id", "email-control");
  });

  it("must use controlId over the control's own id when both are given", () => {
    render(
      <Field controlId="email-control" label="Email">
        <Probe id="own-id" />
      </Field>
    );

    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute("id", "email-control");
  });

  it("must focus the control when the label is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Field label="Email">
        <Probe />
      </Field>
    );

    await user.click(screen.getByText("Email"));

    expect(elements.input).toHaveFocus();
  });

  it("must keep each control tied to its own label and description when several fields render", () => {
    render(
      <>
        <Field description="First note" label="First">
          <Probe />
        </Field>
        <Field description="Second note" label="Second">
          <Probe />
        </Field>
      </>
    );

    expect(screen.getByRole("textbox", { name: "First" })).toHaveAccessibleDescription("First note");
    expect(screen.getByRole("textbox", { name: "Second" })).toHaveAccessibleDescription("Second note");
  });

  it("must render the element given in as when as is set", () => {
    render(
      <Field as="fieldset" label="Email">
        <Probe />
      </Field>
    );

    expect(screen.getByRole("group").tagName).toBe("FIELDSET");
  });

  it("must merge className when one is given", () => {
    render(
      <Field as="fieldset" className="custom" label="Email">
        <Probe />
      </Field>
    );

    expect(screen.getByRole("group")).toHaveClass("custom");
  });

  it("must forward native props when they are given", () => {
    render(
      <Field as="section" label="Email" aria-label="Account">
        <Probe />
      </Field>
    );

    expect(screen.getByRole("region", { name: "Account" })).toBeInTheDocument();
  });

  it("must forward ref to the root when one is given", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <Field label="Email" ref={ref}>
        <Probe />
      </Field>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toContainElement(elements.input);
  });

  it("must reject a native prop when the element does not support it", () => {
    render(
      // @ts-expect-error href is not a valid div prop
      <Field href="#main" label="Email">
        <Probe />
      </Field>
    );
  });

  it("must reject as when it is not an intrinsic element", () => {
    render(
      // @ts-expect-error "widget" is not a BoxElement
      <Field as="widget" label="Email">
        <Probe />
      </Field>
    );
  });
});

function Probe(props: FieldControlProps): JSX.Element {
  const controlProps = useFieldControl(props);

  return <Box as="input" {...controlProps} />;
}

const elements = {
  get input() {
    return screen.getByRole("textbox");
  },
};
