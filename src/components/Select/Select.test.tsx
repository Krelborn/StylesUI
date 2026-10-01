import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { transitionedProperties } from "../../test/transitionedProperties";
import { Field } from "../Field";
import textControlCss from "../TextControl/TextControl.module.css?raw";

import { Select } from "./Select";

describe("Select", () => {
  it("must render a combobox named by aria-label when one is given", () => {
    render(<Select aria-label="Country">{countryOptions}</Select>);

    expect(elements.select).toBeInTheDocument();
  });

  it("must apply the medium size when size is omitted", () => {
    render(<Select aria-label="Country">{countryOptions}</Select>);

    expect(elements.select).toHaveAttribute("data-size", "md");
  });

  it.each(["sm", "md", "lg"] as const)("must apply the %s size when it is set", (size) => {
    render(
      <Select size={size} aria-label="Country">
        {countryOptions}
      </Select>
    );

    expect(elements.select).toHaveAttribute("data-size", size);
  });

  it("must not render a native size attribute when size is set", () => {
    render(
      <Select size="lg" aria-label="Country">
        {countryOptions}
      </Select>
    );

    expect(elements.select).not.toHaveAttribute("size");
  });

  it("must group its options when it is given optgroups", () => {
    render(
      <Select aria-label="Country">
        <optgroup label="Europe">
          <option value="fr">France</option>
        </optgroup>
        <optgroup label="Asia">
          <option value="jp">Japan</option>
        </optgroup>
      </Select>
    );

    expect(screen.getByRole("group", { name: "Asia" })).toContainElement(screen.getByRole("option", { name: "Japan" }));
  });

  it("must take its name, description, invalid and required state from a Field when it is inside one", () => {
    render(
      <Field description="Where the order ships to" error="Choose a country" label="Country" required={true}>
        <Select>{countryOptions}</Select>
      </Field>
    );

    expect(elements.select).toHaveAccessibleDescription("Where the order ships to Choose a country");
    expect(elements.select).toBeInvalid();
    expect(elements.select).toBeRequired();
  });

  it("must call onChange when the user selects an option", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Select onChange={handleChange} aria-label="Country">
        {countryOptions}
      </Select>
    );

    await user.selectOptions(elements.select, "Japan");

    expect(elements.select).toHaveValue("jp");
    expect(handleChange).toHaveBeenCalled();
  });

  it("must not accept input when it is disabled", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Select disabled={true} onChange={handleChange} aria-label="Country">
        {countryOptions}
      </Select>
    );

    await user.selectOptions(elements.select, "Japan");

    expect(elements.select).toHaveValue("fr");
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("must forward native props when they are given", () => {
    render(
      <Select autoComplete="country" name="country" aria-label="Country">
        {countryOptions}
      </Select>
    );

    expect(elements.select).toHaveAttribute("autocomplete", "country");
    expect(elements.select).toHaveAttribute("name", "country");
  });

  it("must merge className when one is given", () => {
    render(
      <Select className="custom" aria-label="Country">
        {countryOptions}
      </Select>
    );

    expect(elements.select).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLSelectElement>();

    render(
      <Select ref={ref} aria-label="Country">
        {countryOptions}
      </Select>
    );

    expect(ref.current).toBe(elements.select);
  });

  it("must reject a size when it is not supported", () => {
    render(
      // @ts-expect-error "xl" is not a ControlSize
      <Select size="xl" aria-label="Country">
        {countryOptions}
      </Select>
    );
  });

  it("must reject multiple when it is given", () => {
    render(
      // @ts-expect-error Select chooses one option; a list of several is a different control
      <Select multiple={true} aria-label="Country">
        {countryOptions}
      </Select>
    );
  });

  it("must reject as when it is given", () => {
    render(
      // @ts-expect-error Select always renders a select
      <Select as="input" aria-label="Country">
        {countryOptions}
      </Select>
    );
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

const countryOptions = (
  <>
    <option value="fr">France</option>
    <option value="jp">Japan</option>
  </>
);

const elements = {
  get select() {
    return screen.getByRole("combobox", { name: "Country" });
  },
};
