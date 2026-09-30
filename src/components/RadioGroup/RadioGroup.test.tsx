import { render as renderBase, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Radio } from "../Radio";

import type { RadioGroupProps } from "./RadioGroup";
import { RadioGroup } from "./RadioGroup";

describe("RadioGroup", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("must render a radiogroup named by its label when a label is given", () => {
    const { render } = setUpTest();

    render();

    expect(elements.group).toHaveAccessibleName("Contact method");
    expect(elements.group.tagName).toBe("FIELDSET");
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("must give every radio the same non-empty name when no name is given", () => {
    const { render } = setUpTest();

    render();

    const names = screen.getAllByRole<HTMLInputElement>("radio").map((radio) => radio.name);

    expect(names[0]).not.toBe("");
    expect(new Set(names).size).toBe(1);
  });

  it("must give every radio the name when a name is given", () => {
    const { render } = setUpTest({ name: "contact" });

    render();

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveAttribute("name", "contact");
    }
  });

  it("must give each group its own name when two groups are rendered", () => {
    renderBase(
      <>
        <RadioGroup label="First">
          <Radio value="one">One</Radio>
        </RadioGroup>
        <RadioGroup label="Second">
          <Radio value="two">Two</Radio>
        </RadioGroup>
      </>
    );

    expect(screen.getByRole<HTMLInputElement>("radio", { name: "One" }).name).not.toBe(
      screen.getByRole<HTMLInputElement>("radio", { name: "Two" }).name
    );
  });

  it("must check the radio matching defaultValue when the group is uncontrolled", () => {
    const { render } = setUpTest({ defaultValue: "phone" });

    render();

    expect(elements.email).not.toBeChecked();
    expect(elements.phone).toBeChecked();
    expect(elements.post).not.toBeChecked();
  });

  it("must let the user change the selection when the group has a defaultValue", async () => {
    const user = userEvent.setup();
    const { render } = setUpTest({ defaultValue: "phone" });
    render();

    await user.click(elements.post);

    expect(elements.phone).not.toBeChecked();
    expect(elements.post).toBeChecked();
  });

  it("must check nothing when the group has no value and no defaultValue", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { render } = setUpTest();

    render();

    expect(screen.queryByRole("radio", { checked: true })).not.toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("must check nothing when value matches no radio", async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { render } = setUpTest({ value: "fax" });
    render();

    await user.click(elements.email);

    expect(screen.queryByRole("radio", { checked: true })).not.toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("must check the radio matching value when the group is controlled", () => {
    const { render } = setUpTest({ value: "post" });

    render();

    expect(elements.email).not.toBeChecked();
    expect(elements.post).toBeChecked();
  });

  it("must keep the controlled value when the parent does not update it", async () => {
    const user = userEvent.setup();
    const { onValueChange, render } = setUpTest({ value: "post" });
    render();

    await user.click(elements.email);

    expect(onValueChange).toHaveBeenCalledWith("email");
    expect(elements.email).not.toBeChecked();
    expect(elements.post).toBeChecked();
  });

  it("must call onValueChange with the chosen value when a radio is selected", async () => {
    const user = userEvent.setup();
    const { onValueChange, render } = setUpTest();
    render();

    await user.click(elements.phone);
    await user.click(screen.getByText("Post"));

    expect(onValueChange).toHaveBeenNthCalledWith(1, "phone");
    expect(onValueChange).toHaveBeenNthCalledWith(2, "post");
  });

  it("must also call the radio's own onChange when a radio is selected", async () => {
    const user = userEvent.setup();
    const { onChange, onValueChange, render } = setUpTest();
    render();

    await user.click(elements.email);

    expect(onChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith("email");
  });

  it("must select a radio without error when the group has no onValueChange", async () => {
    const user = userEvent.setup();
    renderBase(
      <RadioGroup label="Contact method">
        <Radio value="email">Email</Radio>
      </RadioGroup>
    );

    await user.click(elements.email);

    expect(elements.email).toBeChecked();
  });

  it("must mark the group and every radio required and show an asterisk outside the name when required is set", () => {
    const { render } = setUpTest({ required: true });

    render();

    expect(elements.group).toBeRequired();
    expect(elements.group).toHaveAccessibleName("Contact method");
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeRequired();
    }
  });

  it("must not mark the group required or show an asterisk when required is not set", () => {
    const { render } = setUpTest();

    render();

    expect(elements.group).not.toBeRequired();
    expect(elements.group).not.toHaveAttribute("aria-required");
    expect(screen.queryByText("*")).not.toBeInTheDocument();
    expect(elements.email).not.toBeRequired();
  });

  it("must mark the group and every radio invalid and describe the group with the error when an error is given", () => {
    const { render } = setUpTest({ error: "Choose a contact method" });

    render();

    expect(elements.group).toBeInvalid();
    expect(elements.group).toHaveAccessibleDescription("Choose a contact method");

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveAttribute("data-invalid", "");
    }
  });

  it.each([
    { description: "an empty string", empty: "" },
    { description: "false", empty: false },
    { description: "null", empty: null },
  ])("must not mark the group or the radios invalid when the error is $description", ({ empty }) => {
    const { render } = setUpTest({ error: empty });

    render();

    expect(elements.group).not.toHaveAttribute("aria-invalid");
    expect(elements.email).not.toHaveAttribute("data-invalid");
  });

  it("must describe the group with the description when one is given", () => {
    const { render } = setUpTest({ description: "We will only use it for receipts" });

    render();

    expect(elements.group).toHaveAccessibleDescription("We will only use it for receipts");
  });

  it("must disable every radio when disabled is set", async () => {
    const user = userEvent.setup();
    const { onValueChange, render } = setUpTest({ disabled: true });
    render();

    await user.click(elements.email);

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }

    expect(elements.email).not.toBeChecked();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("must apply the vertical orientation when orientation is omitted", () => {
    const { render } = setUpTest();

    render();

    expect(elements.email.closest("[data-orientation]")).toHaveAttribute("data-orientation", "vertical");
  });

  it.each(["horizontal", "vertical"] as const)("must apply the %s orientation when it is set", (orientation) => {
    const { render } = setUpTest({ orientation });

    render();

    expect(elements.email.closest("[data-orientation]")).toHaveAttribute("data-orientation", orientation);
  });

  it("must forward native props to the fieldset when they are given", () => {
    const { render } = setUpTest({ id: "contact-method" });

    render();

    expect(elements.group).toHaveAttribute("id", "contact-method");
  });

  it("must keep a consumer aria-describedby after its own description when one is given", () => {
    const { render } = setUpTest({ "aria-describedby": "extra-help", description: "Pick one" });

    render();

    const describedBy = elements.group.getAttribute("aria-describedby") ?? "";

    expect(describedBy.split(" ")).toHaveLength(2);
    expect(describedBy.endsWith("extra-help")).toBe(true);
  });

  it("must merge className onto the fieldset when one is given", () => {
    const { render } = setUpTest({ className: "custom" });

    render();

    expect(elements.group).toHaveClass("custom");
  });

  it("must forward ref to the fieldset when one is given", () => {
    const ref = createRef<HTMLFieldSetElement>();
    const { render } = setUpTest({ ref });

    render();

    expect(ref.current).toBe(elements.group);
  });

  it("must reject an orientation when it is not supported", () => {
    renderBase(
      // @ts-expect-error "diagonal" is not a RadioGroupOrientation
      <RadioGroup label="Contact method" orientation="diagonal">
        <Radio value="email">Email</Radio>
      </RadioGroup>
    );

    expect(elements.group).toBeInTheDocument();
  });

  it("must reject as when it is given", () => {
    renderBase(
      // @ts-expect-error RadioGroup always renders a fieldset
      <RadioGroup as="div" label="Contact method">
        <Radio value="email">Email</Radio>
      </RadioGroup>
    );

    expect(elements.group.tagName).toBe("FIELDSET");
  });

  it("must reject a non-string value when one is given", () => {
    renderBase(
      // @ts-expect-error RadioGroup values are strings
      <RadioGroup label="Contact method" value={1}>
        <Radio value="email">Email</Radio>
      </RadioGroup>
    );

    expect(elements.group).toBeInTheDocument();
  });
});

function setUpTest(props: Partial<RadioGroupProps> = {}) {
  const onChange = vi.fn();
  const onValueChange = vi.fn();

  const render = () => {
    renderBase(
      <RadioGroup label="Contact method" onValueChange={onValueChange} {...props}>
        <Radio onChange={onChange} value="email">
          Email
        </Radio>
        <Radio value="phone">Phone</Radio>
        <Radio value="post">Post</Radio>
      </RadioGroup>
    );
  };

  return { onChange, onValueChange, render };
}

const elements = {
  get email() {
    return screen.getByRole<HTMLInputElement>("radio", { name: "Email" });
  },
  get group() {
    return screen.getByRole("radiogroup");
  },
  get phone() {
    return screen.getByRole<HTMLInputElement>("radio", { name: "Phone" });
  },
  get post() {
    return screen.getByRole<HTMLInputElement>("radio", { name: "Post" });
  },
};
