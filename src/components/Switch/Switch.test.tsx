import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { Field } from "../Field";

import { Switch } from "./Switch";

describe("Switch", () => {
  it("must render a switch that is off and named by its children when children are given", () => {
    render(<Switch>Email notifications</Switch>);

    expect(elements.switch).not.toBeChecked();
  });

  it("must be named by aria-label when it has no children", () => {
    render(<Switch aria-label="Email notifications" />);

    expect(elements.switch).toBeInTheDocument();
  });

  it("must toggle when the input is clicked", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Switch onChange={handleChange}>Email notifications</Switch>);

    await user.click(elements.switch);

    expect(elements.switch).toBeChecked();
    expect(handleChange).toHaveBeenCalled();
  });

  it("must toggle when the label text is clicked", async () => {
    const user = userEvent.setup();
    render(<Switch>Email notifications</Switch>);

    await user.click(screen.getByText("Email notifications"));

    expect(elements.switch).toBeChecked();
  });

  it("must not toggle when it is disabled", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Switch disabled={true} onChange={handleChange}>
        Email notifications
      </Switch>
    );

    await user.click(elements.switch);
    await user.click(screen.getByText("Email notifications"));

    expect(elements.switch).not.toBeChecked();
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("must show an asterisk and be required when required is set", () => {
    render(<Switch required={true}>Email notifications</Switch>);

    expect(elements.switch).toBeRequired();
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("must show an asterisk and be required when a Field requires it", () => {
    render(
      <Field required={true}>
        <Switch>Email notifications</Switch>
      </Field>
    );

    expect(elements.switch).toBeRequired();
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("must not show an asterisk when it is not required", () => {
    render(<Switch>Email notifications</Switch>);

    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("must not show an asterisk when it is required and has no children", () => {
    render(<Switch required={true} aria-label="Email notifications" />);

    expect(elements.switch).toBeRequired();
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("must take its description and invalid state from a Field when it is inside one", () => {
    render(
      <Field description="Sent once a day" error="Turn on notifications to continue">
        <Switch>Email notifications</Switch>
      </Field>
    );

    expect(elements.switch).toHaveAccessibleDescription("Sent once a day Turn on notifications to continue");
    expect(elements.switch).toBeInvalid();
  });

  it("must forward native props to the input when they are given", () => {
    render(
      <Switch defaultChecked={true} name="notifications" value="email">
        Email notifications
      </Switch>
    );

    expect(elements.switch).toBeChecked();
    expect(elements.switch).toHaveAttribute("name", "notifications");
    expect(elements.switch).toHaveAttribute("value", "email");
  });

  it("must send className and style to the label when they are given", () => {
    render(
      <Switch className="custom" style={{ color: "red" }}>
        Email notifications
      </Switch>
    );

    expect(elements.label).toHaveClass("custom");
    expect(elements.label).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(elements.switch).not.toHaveClass("custom");
    expect(elements.switch).not.toHaveAttribute("style");
  });

  it("must forward ref to the input when one is given", () => {
    const ref = createRef<HTMLInputElement>();

    render(<Switch ref={ref}>Email notifications</Switch>);

    expect(ref.current).toBe(elements.switch);
  });

  it("must reject a role when one is given", () => {
    render(
      // @ts-expect-error Switch always has the switch role
      // oxlint-disable-next-line jsx-a11y/role-has-required-aria-props -- the role is rejected by the types and never rendered
      <Switch role="checkbox">Email notifications</Switch>
    );

    expect(elements.switch).toBeInTheDocument();
  });

  it("must reject a type when one is given", () => {
    // @ts-expect-error Switch always renders a checkbox input
    render(<Switch type="radio">Email notifications</Switch>);

    expect(elements.switch).toHaveAttribute("type", "checkbox");
  });

  it("must reject as when it is given", () => {
    // @ts-expect-error Switch always renders an input inside a label
    render(<Switch as="textarea">Email notifications</Switch>);

    expect(elements.switch).toBeInstanceOf(HTMLInputElement);
  });

  it("must reject dangerouslySetInnerHTML when it is given", () => {
    // Built without rendering, since React throws when an input is given inner HTML
    const element = (
      // @ts-expect-error an input takes no inner HTML
      <Switch dangerouslySetInnerHTML={{ __html: "Email notifications" }} aria-label="Email notifications" />
    );

    expect(isValidElement(element)).toBe(true);
  });
});

const elements = {
  get label() {
    return elements.switch.labels?.item(0);
  },
  get switch() {
    return screen.getByRole<HTMLInputElement>("switch", { name: "Email notifications" });
  },
};
