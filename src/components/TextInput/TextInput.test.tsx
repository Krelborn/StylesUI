import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { transitionedProperties } from "../../test/transitionedProperties";
import { Field } from "../Field";
import textControlCss from "../TextControl/TextControl.module.css?raw";

import { TextInput } from "./TextInput";

describe("TextInput", () => {
  it("must render a textbox named by aria-label when one is given", () => {
    render(<TextInput aria-label="Email" />);

    expect(elements.input).toBeInTheDocument();
  });

  it("must apply the text type and the medium size when they are omitted", () => {
    render(<TextInput aria-label="Email" />);

    expect(elements.input).toHaveAttribute("type", "text");
    expect(elements.input).toHaveAttribute("data-size", "md");
  });

  it.each(["sm", "md", "lg"] as const)("must apply the %s size when it is set", (size) => {
    render(<TextInput size={size} aria-label="Email" />);

    expect(elements.input).toHaveAttribute("data-size", size);
  });

  it("must not render a native size attribute when size is set", () => {
    render(<TextInput size="lg" aria-label="Email" />);

    expect(elements.input).not.toHaveAttribute("size");
  });

  it.each([
    { role: "textbox", type: "email" },
    { role: "spinbutton", type: "number" },
    { role: "searchbox", type: "search" },
    { role: "textbox", type: "tel" },
    { role: "textbox", type: "text" },
    { role: "textbox", type: "url" },
  ] as const)("must render a $role of type $type when type is $type", ({ role, type }) => {
    render(<TextInput type={type} aria-label="Email" />);

    expect(screen.getByRole(role, { name: "Email" })).toHaveAttribute("type", type);
  });

  it("must render an input of type password when type is password", () => {
    render(<TextInput type="password" aria-label="Password" />);

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });

  it("must take its name, description, invalid and required state from a Field when it is inside one", () => {
    render(
      <Field description="Use your work address" error="Enter a valid email" label="Email" required={true}>
        <TextInput />
      </Field>
    );

    expect(elements.input).toHaveAccessibleDescription("Use your work address Enter a valid email");
    expect(elements.input).toBeInvalid();
    expect(elements.input).toBeRequired();
  });

  it("must call onChange when the user types", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TextInput onChange={handleChange} aria-label="Email" />);

    await user.type(elements.input, "ada@example.com");

    expect(elements.input).toHaveValue("ada@example.com");
    expect(handleChange).toHaveBeenCalled();
  });

  it("must not accept input when it is disabled", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TextInput disabled={true} onChange={handleChange} aria-label="Email" />);

    await user.type(elements.input, "ada@example.com");

    expect(elements.input).toHaveValue("");
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("must forward native props when they are given", () => {
    render(<TextInput name="email" placeholder="ada@example.com" aria-label="Email" />);

    expect(elements.input).toHaveAttribute("name", "email");
    expect(elements.input).toHaveAttribute("placeholder", "ada@example.com");
  });

  it("must merge className when one is given", () => {
    render(<TextInput className="custom" aria-label="Email" />);

    expect(elements.input).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLInputElement>();

    render(<TextInput ref={ref} aria-label="Email" />);

    expect(ref.current).toBe(elements.input);
  });

  it("must reject a size when it is not supported", () => {
    // @ts-expect-error "xl" is not a ControlSize
    render(<TextInput size="xl" aria-label="Email" />);
  });

  it("must reject a type when it is not supported", () => {
    // @ts-expect-error "checkbox" is not a TextInputType
    render(<TextInput type="checkbox" aria-label="Email" />);
  });

  it("must reject children when they are given", () => {
    // Built without rendering, since React throws when an input is given children
    // @ts-expect-error an input takes no children
    const element = <TextInput aria-label="Email">Email</TextInput>;

    expect(isValidElement(element)).toBe(true);
  });

  it("must reject dangerouslySetInnerHTML when it is given", () => {
    // Built without rendering, since React throws when an input is given inner HTML
    // @ts-expect-error an input takes no inner HTML
    const element = <TextInput dangerouslySetInnerHTML={{ __html: "Email" }} aria-label="Email" />;

    expect(isValidElement(element)).toBe(true);
  });

  it("must reject as when it is given", () => {
    // @ts-expect-error TextInput always renders an input
    render(<TextInput as="textarea" aria-label="Email" />);
  });

  it("must transition only the border colour when the stylesheet declares a transition", () => {
    expect(transitionedProperties(textControlCss)).toEqual(["border-color"]);
  });

  it("must never transition the outline or all properties when the stylesheet declares a transition", () => {
    const properties = transitionedProperties(textControlCss);

    expect(properties).not.toContain("all");
    expect(properties).not.toContain("outline");
  });
});

const elements = {
  get input() {
    return screen.getByRole("textbox", { name: "Email" });
  },
};
