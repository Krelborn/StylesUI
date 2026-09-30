import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Checkbox } from "../Checkbox";
import { Field } from "../Field";

import { Fieldset } from "./Fieldset";

describe("Fieldset", () => {
  it("must render a group named by its label when a label is given", () => {
    render(
      <Fieldset label="Notifications">
        <Checkbox>Email</Checkbox>
      </Fieldset>
    );

    expect(elements.group.tagName).toBe("FIELDSET");
    expect(screen.getByText("Notifications").tagName).toBe("LEGEND");
  });

  it("must exclude trailing hidden content from the group name when the label is a node", () => {
    render(
      <Fieldset
        label={
          <>
            Notifications<span aria-hidden="true">*</span>
          </>
        }
      >
        <Checkbox>Email</Checkbox>
      </Fieldset>
    );

    expect(elements.group).toHaveAccessibleName("Notifications");
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("must describe the group with the description when one is given", () => {
    render(
      <Fieldset description="Choose how we reach you" label="Notifications">
        <Checkbox>Email</Checkbox>
      </Fieldset>
    );

    expect(elements.group).toHaveAccessibleDescription("Choose how we reach you");
  });

  it("must describe the group with the error when one is given", () => {
    render(
      <Fieldset error="Choose at least one" label="Notifications">
        <Checkbox>Email</Checkbox>
      </Fieldset>
    );

    expect(elements.group).toHaveAccessibleDescription("Choose at least one");
  });

  it("must describe the group with the description, then the error, when both are given", () => {
    render(
      <Fieldset description="Choose how we reach you" error="Choose at least one" label="Notifications">
        <Checkbox>Email</Checkbox>
      </Fieldset>
    );

    expect(elements.group).toHaveAccessibleDescription("Choose how we reach you Choose at least one");
  });

  it.each([
    { description: "an empty string", empty: "" },
    { description: "false", empty: false },
    { description: "null", empty: null },
  ])("must not describe the group when the description is $description", ({ empty }) => {
    render(
      <Fieldset description={empty} label="Notifications">
        <Checkbox>Email</Checkbox>
      </Fieldset>
    );

    expect(elements.group).not.toHaveAccessibleDescription();
    expect(elements.group).not.toHaveAttribute("aria-describedby");
  });

  it.each([
    { description: "an empty string", empty: "" },
    { description: "false", empty: false },
    { description: "null", empty: null },
  ])("must not describe the group when the error is $description", ({ empty }) => {
    render(
      <Fieldset error={empty} label="Notifications">
        <Checkbox>Email</Checkbox>
      </Fieldset>
    );

    expect(elements.group).not.toHaveAccessibleDescription();
    expect(elements.group).not.toHaveAttribute("aria-describedby");
  });

  it("must keep the consumer's aria-describedby after the description and error when all are given", () => {
    render(
      <>
        <Fieldset
          aria-describedby="extra-note"
          description="Choose how we reach you"
          error="Choose at least one"
          label="Notifications"
        >
          <Checkbox>Email</Checkbox>
        </Fieldset>
        <p id="extra-note">We never share your choice</p>
      </>
    );

    expect(elements.group).toHaveAccessibleDescription(
      "Choose how we reach you Choose at least one We never share your choice"
    );
  });

  it("must keep only the consumer's aria-describedby when there is no description or error", () => {
    render(
      <>
        <Fieldset aria-describedby="extra-note" label="Notifications">
          <Checkbox>Email</Checkbox>
        </Fieldset>
        <p id="extra-note">We never share your choice</p>
      </>
    );

    expect(elements.group).toHaveAttribute("aria-describedby", "extra-note");
  });

  it("must disable every control inside when it is disabled", () => {
    render(
      <Fieldset disabled={true} label="Notifications">
        <Checkbox>Email</Checkbox>
        <Checkbox>Text message</Checkbox>
      </Fieldset>
    );

    expect(screen.getByRole("checkbox", { name: "Email" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Text message" })).toBeDisabled();
  });

  it("must not add aria-required when it is rendered", () => {
    render(
      <Fieldset label="Notifications">
        <Checkbox required={true}>Email</Checkbox>
      </Fieldset>
    );

    expect(elements.group).not.toHaveAttribute("aria-required");
  });

  it("must pass role and aria attributes through when they are given", () => {
    render(
      <Fieldset aria-invalid="true" aria-required="true" label="Delivery" role="radiogroup">
        <Checkbox>Post</Checkbox>
      </Fieldset>
    );

    expect(screen.getByRole("radiogroup", { name: "Delivery" })).toBeRequired();
    expect(screen.getByRole("radiogroup", { name: "Delivery" })).toBeInvalid();
  });

  it("must not give a control inside the state of an outer Field when it is inside one", () => {
    render(
      <Field controlId="outer-control" description="Outer note" disabled={true} error="Outer error" required={true}>
        <Fieldset label="Notifications">
          <Checkbox>Email</Checkbox>
        </Fieldset>
      </Field>
    );

    const checkbox = screen.getByRole("checkbox", { name: "Email" });

    expect(checkbox).not.toHaveAttribute("id", "outer-control");
    expect(checkbox).toBeEnabled();
    expect(checkbox).not.toBeRequired();
    expect(checkbox).toBeValid();
    expect(checkbox).not.toHaveAccessibleDescription();
  });

  it("must forward native props when they are given", () => {
    render(
      <Fieldset id="notification-settings" label="Notifications">
        <Checkbox>Email</Checkbox>
      </Fieldset>
    );

    expect(elements.group).toHaveAttribute("id", "notification-settings");
  });

  it("must merge className when one is given", () => {
    render(
      <Fieldset className="custom" label="Notifications">
        <Checkbox>Email</Checkbox>
      </Fieldset>
    );

    expect(elements.group).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLFieldSetElement>();

    render(
      <Fieldset label="Notifications" ref={ref}>
        <Checkbox>Email</Checkbox>
      </Fieldset>
    );

    expect(ref.current).toBe(elements.group);
  });

  it("must reject a native prop when the fieldset does not support it", () => {
    render(
      // @ts-expect-error href is not a valid fieldset prop
      <Fieldset href="#main" label="Notifications">
        <Checkbox>Email</Checkbox>
      </Fieldset>
    );
  });

  it("must reject as when it is given", () => {
    render(
      // @ts-expect-error Fieldset always renders a fieldset
      <Fieldset as="div" label="Notifications">
        <Checkbox>Email</Checkbox>
      </Fieldset>
    );

    expect(elements.group.tagName).toBe("FIELDSET");
  });

  it("must reject a missing label when none is given", () => {
    render(
      // @ts-expect-error label is required
      <Fieldset>
        <Checkbox>Email</Checkbox>
      </Fieldset>
    );
  });
});

const elements = {
  get group() {
    return screen.getByRole("group");
  },
};
