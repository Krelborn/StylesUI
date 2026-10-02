import { render as renderBase, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, isValidElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RadioGroupContext } from "../../forms";

import { Radio } from "./Radio";

describe("Radio", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("must render an unchecked radio named by its children when children are given", () => {
    renderBase(<Radio value="email">Email</Radio>);

    expect(elements.email).not.toBeChecked();
  });

  it("must be named by aria-label when it has no children", () => {
    renderBase(<Radio value="email" aria-label="Email" />);

    expect(elements.email).toBeInTheDocument();
  });

  it("must be checked when the input is clicked", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    renderBase(
      <Radio onChange={handleChange} value="email">
        Email
      </Radio>
    );

    await user.click(elements.email);

    expect(elements.email).toBeChecked();
    expect(handleChange).toHaveBeenCalled();
  });

  it("must be checked when the label text is clicked", async () => {
    const user = userEvent.setup();
    renderBase(<Radio value="email">Email</Radio>);

    await user.click(screen.getByText("Email"));

    expect(elements.email).toBeChecked();
  });

  it("must not be checked when it is disabled", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    renderBase(
      <Radio disabled={true} onChange={handleChange} value="email">
        Email
      </Radio>
    );

    await user.click(elements.email);
    await user.click(screen.getByText("Email"));

    expect(elements.email).not.toBeChecked();
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("must use its own name when it is outside a group", () => {
    renderBase(
      <Radio name="channel" value="email">
        Email
      </Radio>
    );

    expect(elements.email).toHaveAttribute("name", "channel");
  });

  it("must select only one radio when radios outside a group share a name", async () => {
    const user = userEvent.setup();
    renderBase(
      <>
        <Radio name="channel" value="email">
          Email
        </Radio>
        <Radio name="channel" value="post">
          Post
        </Radio>
      </>
    );

    await user.click(elements.email);
    await user.click(elements.post);

    expect(elements.email).not.toBeChecked();
    expect(elements.post).toBeChecked();
  });

  it("must be required without an asterisk when required is set", () => {
    renderBase(
      <Radio required={true} value="email">
        Email
      </Radio>
    );

    expect(elements.email).toBeRequired();
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("must not mark itself invalid or required for assistive technology when it is outside a group", () => {
    renderBase(<Radio value="email">Email</Radio>);

    expect(elements.email).not.toHaveAttribute("data-invalid");
    expect(elements.email).not.toHaveAttribute("aria-invalid");
    expect(elements.email).not.toHaveAttribute("aria-required");
  });

  it("must forward native props to the input when they are given", () => {
    renderBase(
      <Radio defaultChecked={true} value="email">
        Email
      </Radio>
    );

    expect(elements.email).toBeChecked();
    expect(elements.email).toHaveAttribute("value", "email");
  });

  it("must send className and style to the label when they are given", () => {
    renderBase(
      <Radio className="custom" style={{ color: "red" }} value="email">
        Email
      </Radio>
    );

    expect(elements.label).toHaveClass("custom");
    expect(elements.label).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(elements.email).not.toHaveClass("custom");
    expect(elements.email).not.toHaveAttribute("style");
  });

  it("must forward ref to the input when one is given", () => {
    const ref = createRef<HTMLInputElement>();

    renderBase(
      <Radio ref={ref} value="email">
        Email
      </Radio>
    );

    expect(ref.current).toBe(elements.email);
  });

  it("must require a value when one is missing", () => {
    // @ts-expect-error Radio needs a value to report to its group
    renderBase(<Radio>Email</Radio>);

    expect(elements.email).toBeInTheDocument();
  });

  it("must reject a type when one is given", () => {
    renderBase(
      // @ts-expect-error Radio always renders a radio input
      <Radio type="checkbox" value="email">
        Email
      </Radio>
    );

    expect(elements.email).toHaveAttribute("type", "radio");
  });

  it("must reject as when it is given", () => {
    renderBase(
      // @ts-expect-error Radio always renders an input inside a label
      <Radio as="textarea" value="email">
        Email
      </Radio>
    );

    expect(elements.email).toBeInstanceOf(HTMLInputElement);
  });

  it("must reject dangerouslySetInnerHTML when it is given", () => {
    // Built without rendering, since React throws when an input is given inner HTML
    // @ts-expect-error an input takes no inner HTML
    const element = <Radio dangerouslySetInnerHTML={{ __html: "Email" }} aria-label="Email" value="email" />;

    expect(isValidElement(element)).toBe(true);
  });

  it("must render the group's name when it is inside a group", () => {
    const { render } = setUpTest({ name: "channel" });

    render();

    expect(elements.email).toHaveAttribute("name", "channel");
    expect(elements.post).toHaveAttribute("name", "channel");
  });

  it("must replace its own name with the group's when it is inside a group", () => {
    const { render } = setUpTest({ name: "channel" });

    render({ name: "own-name" });

    expect(elements.email).toHaveAttribute("name", "channel");
  });

  it("must be required when the group is required", () => {
    const { render } = setUpTest({ required: true });

    render();

    expect(elements.email).toBeRequired();
    expect(elements.post).toBeRequired();
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("must not be required when the group is not required", () => {
    const { render } = setUpTest({ required: false });

    render();

    expect(elements.email).not.toBeRequired();
  });

  it("must not mark itself required for assistive technology when the group is required", () => {
    const { render } = setUpTest({ required: true });

    render();

    expect(elements.email).not.toHaveAttribute("aria-required");
  });

  it("must check the radio matching the group's value when the group is controlled", () => {
    const { render } = setUpTest({ value: "post" });

    render();

    expect(elements.email).not.toBeChecked();
    expect(elements.post).toBeChecked();
  });

  it("must keep the group's value checked when the user selects another radio and the value does not change", async () => {
    const user = userEvent.setup();
    const { calls, render } = setUpTest({ value: "post" });
    render();

    await user.click(elements.email);

    expect(elements.email).not.toBeChecked();
    expect(elements.post).toBeChecked();
    expect(calls).toEqual(["onChange", "onValueChange:email"]);
  });

  it("must not log a React warning when the group is controlled", async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { render } = setUpTest({ value: "post" });
    render();

    await user.click(elements.email);

    expect(consoleError).not.toHaveBeenCalled();
  });

  it("must check the radio matching the group's default value when the group is uncontrolled", () => {
    const { render } = setUpTest({ defaultValue: "post" });

    render();

    expect(elements.email).not.toBeChecked();
    expect(elements.post).toBeChecked();
  });

  it("must let the user change the selection when the group has a default value", async () => {
    const user = userEvent.setup();
    const { calls, render } = setUpTest({ defaultValue: "post" });
    render();

    await user.click(elements.email);

    expect(elements.email).toBeChecked();
    expect(elements.post).not.toBeChecked();
    expect(calls).toEqual(["onChange", "onValueChange:email"]);
  });

  it("must let the user select a radio when the group has no value and no default value", async () => {
    const user = userEvent.setup();
    const { render } = setUpTest();
    render();

    expect(elements.email).not.toBeChecked();
    expect(elements.post).not.toBeChecked();

    await user.click(elements.post);

    expect(elements.post).toBeChecked();
  });

  it("must call its own onChange and then the group's onValueChange with its value when it is selected", async () => {
    const user = userEvent.setup();
    const { calls, render } = setUpTest();
    render();

    await user.click(elements.post);

    expect(calls).toEqual(["onChange", "onValueChange:post"]);
  });

  it("must call the group's onValueChange when it is selected and has no onChange of its own", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderBase(
      <RadioGroupContext.Provider
        value={{
          defaultValue: undefined,
          invalid: false,
          name: "channel",
          onValueChange,
          required: false,
          value: undefined,
        }}
      >
        <Radio value="email">Email</Radio>
      </RadioGroupContext.Provider>
    );

    await user.click(elements.email);

    expect(onValueChange).toHaveBeenCalledWith("email");
  });

  it("must not call the group's onValueChange when it is disabled", async () => {
    const user = userEvent.setup();
    const { calls, render } = setUpTest();
    render({ disabled: true });

    await user.click(elements.email);

    expect(calls).toEqual([]);
  });

  it("must select without error when the group has no onValueChange", async () => {
    const user = userEvent.setup();
    renderBase(
      <RadioGroupContext.Provider
        value={{
          defaultValue: undefined,
          invalid: false,
          name: "channel",
          onValueChange: undefined,
          required: false,
          value: undefined,
        }}
      >
        <Radio value="email">Email</Radio>
      </RadioGroupContext.Provider>
    );

    await user.click(elements.email);

    expect(elements.email).toBeChecked();
  });

  it("must set data-invalid without aria-invalid when the group is invalid", () => {
    const { render } = setUpTest({ invalid: true });

    render();

    expect(elements.email).toHaveAttribute("data-invalid", "");
    expect(elements.post).toHaveAttribute("data-invalid", "");
    expect(elements.email).not.toHaveAttribute("aria-invalid");
  });

  it("must not set data-invalid when the group is valid", () => {
    const { render } = setUpTest({ invalid: false });

    render();

    expect(elements.email).not.toHaveAttribute("data-invalid");
  });
});

interface GroupOptions {
  defaultValue?: string;
  invalid?: boolean;
  name?: string;
  required?: boolean;
  value?: string;
}

interface RadioOptions {
  disabled?: boolean;
  name?: string;
}

// Renders two radios inside a hand-built group context, and records the order the handlers run in
function setUpTest({ defaultValue, invalid = false, name = "channel", required = false, value }: GroupOptions = {}) {
  const calls: string[] = [];

  const render = ({ disabled, name: ownName }: RadioOptions = {}) => {
    renderBase(
      <RadioGroupContext.Provider
        value={{
          defaultValue,
          invalid,
          name,
          onValueChange: (selected) => {
            calls.push(`onValueChange:${selected}`);
          },
          required,
          value,
        }}
      >
        <Radio
          disabled={disabled}
          name={ownName}
          onChange={() => {
            calls.push("onChange");
          }}
          value="email"
        >
          Email
        </Radio>
        <Radio
          onChange={() => {
            calls.push("onChange");
          }}
          value="post"
        >
          Post
        </Radio>
      </RadioGroupContext.Provider>
    );
  };

  return { calls, render };
}

const elements = {
  get email() {
    return screen.getByRole<HTMLInputElement>("radio", { name: "Email" });
  },
  get label() {
    return elements.email.labels?.item(0);
  },
  get post() {
    return screen.getByRole<HTMLInputElement>("radio", { name: "Post" });
  },
};
