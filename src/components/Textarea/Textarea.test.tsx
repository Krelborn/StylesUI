import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { transitionedProperties } from "../../test/transitionedProperties";
import { Field } from "../Field";
import textControlCss from "../TextControl/TextControl.module.css?raw";

import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("must render a textarea named by aria-label when one is given", () => {
    render(<Textarea aria-label="Message" />);

    expect(elements.textarea).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("must apply the medium size when size is omitted", () => {
    render(<Textarea aria-label="Message" />);

    expect(elements.textarea).toHaveAttribute("data-size", "md");
  });

  it.each(["sm", "md", "lg"] as const)("must apply the %s size when it is set", (size) => {
    render(<Textarea size={size} aria-label="Message" />);

    expect(elements.textarea).toHaveAttribute("data-size", size);
  });

  it("must take its name, description, invalid and required state from a Field when it is inside one", () => {
    render(
      <Field description="Tell us what happened" error="Enter a message" label="Message" required={true}>
        <Textarea />
      </Field>
    );

    expect(elements.textarea).toHaveAccessibleDescription("Tell us what happened Enter a message");
    expect(elements.textarea).toBeInvalid();
    expect(elements.textarea).toBeRequired();
  });

  it("must call onChange when the user types", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} aria-label="Message" />);

    await user.type(elements.textarea, "First line{Enter}Second line");

    expect(elements.textarea).toHaveValue("First line\nSecond line");
    expect(handleChange).toHaveBeenCalled();
  });

  it("must not accept input when it is disabled", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Textarea disabled={true} onChange={handleChange} aria-label="Message" />);

    await user.type(elements.textarea, "First line");

    expect(elements.textarea).toHaveValue("");
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("must forward native props when they are given", () => {
    render(<Textarea name="message" rows={6} aria-label="Message" />);

    expect(elements.textarea).toHaveAttribute("name", "message");
    expect(elements.textarea).toHaveAttribute("rows", "6");
  });

  it("must merge className when one is given", () => {
    render(<Textarea className="custom" aria-label="Message" />);

    expect(elements.textarea).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLTextAreaElement>();

    render(<Textarea ref={ref} aria-label="Message" />);

    expect(ref.current).toBe(elements.textarea);
  });

  it("must reject a size when it is not supported", () => {
    // @ts-expect-error "xl" is not a ControlSize
    render(<Textarea size="xl" aria-label="Message" />);
  });

  it("must reject children when they are given", () => {
    // Built without rendering, since React warns when a textarea is given children
    // @ts-expect-error a textarea takes its text from value or defaultValue
    const element = <Textarea aria-label="Message">Hello</Textarea>;

    expect(isValidElement(element)).toBe(true);
  });

  it("must reject as when it is given", () => {
    // @ts-expect-error Textarea always renders a textarea
    render(<Textarea as="input" aria-label="Message" />);
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
  get textarea() {
    return screen.getByRole("textbox", { name: "Message" });
  },
};
