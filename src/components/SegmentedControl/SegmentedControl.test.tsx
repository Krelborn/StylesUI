import { render as renderBase, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { transitionedProperties } from "../../test/transitionedProperties";

import { Segment } from "./Segment";
import type { SegmentedControlProps } from "./SegmentedControl";
import { SegmentedControl } from "./SegmentedControl";
import segmentedControlCss from "./SegmentedControl.module.css?raw";

describe("SegmentedControl", () => {
  it("must be a radio group named by its label when it renders", () => {
    const { render } = setUpTest();

    render();

    expect(screen.getByRole("radiogroup", { name: "Appearance" })).toBeInTheDocument();
  });

  it("must select and report a segment when it is clicked", async () => {
    const { onValueChange, render, user } = setUpTest();
    render();

    await user.click(elements.segment("Dark"));

    expect(elements.segment("Dark")).toBeChecked();
    expect(elements.segment("Light")).not.toBeChecked();
    expect(onValueChange).toHaveBeenLastCalledWith("dark");
  });

  it("must move and report the selection when an arrow key is pressed", async () => {
    const { onValueChange, render, user } = setUpTest();
    render();
    await user.tab();

    await user.keyboard("{ArrowRight}");

    expect(elements.segment("Dark")).toHaveFocus();
    expect(elements.segment("Dark")).toBeChecked();
    expect(onValueChange).toHaveBeenLastCalledWith("dark");
  });

  it("must select the segment given in defaultValue when it renders", () => {
    const { render } = setUpTest();

    render({ defaultValue: "system" });

    expect(elements.segment("System")).toBeChecked();
  });

  it("must submit the selected value under the name when it is in a form", async () => {
    const user = userEvent.setup();
    const submitted: FormDataEntryValue[] = [];
    renderBase(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted.push(...new FormData(event.currentTarget).getAll("appearance"));
        }}
      >
        <SegmentedControl defaultValue="light" label="Appearance" name="appearance">
          <Segment value="light">Light</Segment>
          <Segment value="dark">Dark</Segment>
        </SegmentedControl>
        <button type="submit">Save</button>
      </form>
    );
    await user.click(elements.segment("Dark"));

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(submitted).toEqual(["dark"]);
  });

  it("must follow only value when it is controlled", async () => {
    const { onValueChange, render, user } = setUpTest();
    render({ defaultValue: undefined, value: "light" });

    await user.click(elements.segment("Dark"));

    expect(onValueChange).toHaveBeenLastCalledWith("dark");
    expect(elements.segment("Light")).toBeChecked();
  });

  it("must not select a disabled segment when it is clicked", async () => {
    const { onValueChange, user } = setUpTest();
    renderBase(
      <SegmentedControl defaultValue="light" label="Appearance" onValueChange={onValueChange}>
        <Segment value="light">Light</Segment>
        <Segment disabled={true} value="dark">
          Dark
        </Segment>
      </SegmentedControl>
    );

    await user.click(elements.segment("Dark"));

    expect(elements.segment("Light")).toBeChecked();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("must disable every segment when the control is disabled", () => {
    const { render } = setUpTest();

    render({ disabled: true });

    for (const name of ["Light", "Dark", "System"]) {
      expect(elements.segment(name)).toBeDisabled();
    }
  });

  it("must mark the group and every segment required when required is set", () => {
    const { render } = setUpTest();

    render({ required: true });

    expect(elements.group).toHaveAttribute("aria-required", "true");
    expect(elements.segment("Light")).toBeRequired();
  });

  it("must not require a segment that asks to be required when the control is not required", () => {
    renderBase(
      <SegmentedControl label="Appearance" required={false}>
        <Segment required={true} value="light">
          Light
        </Segment>
      </SegmentedControl>
    );

    expect(elements.segment("Light")).not.toBeRequired();
  });

  it("must mark the group invalid and describe it when an error is given", () => {
    const { render } = setUpTest();

    render({ error: "Choose an appearance" });

    expect(elements.group).toHaveAttribute("aria-invalid", "true");
    expect(elements.group).toHaveAccessibleDescription("Choose an appearance");
  });

  it("must mark every segment with data-invalid when an error is given", () => {
    const { render } = setUpTest();

    render({ error: "Choose an appearance" });

    expect(elements.segment("Light")).toHaveAttribute("data-invalid", "");
    expect(elements.segment("Dark")).toHaveAttribute("data-invalid", "");
  });

  it("must send className and style to the label and ref to the input when they are given", () => {
    const ref = createRef<HTMLInputElement>();
    renderBase(
      <SegmentedControl defaultValue="light" label="Appearance">
        <Segment className="custom" ref={ref} style={{ color: "red" }} value="light">
          Light
        </Segment>
      </SegmentedControl>
    );

    expect(elements.segment("Light").labels?.item(0)).toHaveClass("custom");
    expect(elements.segment("Light").labels?.item(0)).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(elements.segment("Light")).not.toHaveClass("custom");
    expect(elements.segment("Light")).not.toHaveAttribute("style");
    expect(ref.current).toBe(elements.segment("Light"));
  });

  it("must work as a plain radio when a segment is outside a SegmentedControl", async () => {
    const user = userEvent.setup();
    renderBase(
      <>
        <Segment name="appearance" value="light">
          Light
        </Segment>
        <Segment name="appearance" value="dark">
          Dark
        </Segment>
      </>
    );

    await user.click(elements.segment("Dark"));

    expect(elements.segment("Dark")).toBeChecked();
    expect(elements.segment("Dark")).toHaveAttribute("name", "appearance");
  });

  it("must keep its own data-invalid when it is outside a SegmentedControl", () => {
    renderBase(
      <Segment value="light" data-invalid="">
        Light
      </Segment>
    );

    expect(elements.segment("Light")).toHaveAttribute("data-invalid", "");
  });

  it("must reject orientation when it is given", () => {
    renderBase(
      // @ts-expect-error a segmented control is always a row
      <SegmentedControl label="Appearance" orientation="vertical">
        <Segment value="light">Light</Segment>
      </SegmentedControl>
    );

    expect(elements.group).toBeInTheDocument();
  });

  it("must transition only colours when reduced motion is requested", () => {
    const reducedMotionBlock =
      segmentedControlCss.match(/@media \(prefers-reduced-motion: reduce\) \{(.*?)\n\}/s)?.[1] ?? "";

    expect(transitionedProperties(reducedMotionBlock)).toEqual(["background-color", "border-color"]);
    expect(reducedMotionBlock).toContain(".input:checked");
  });

  it("must keep the checked label out of forced colour adjustment when forced colours are active", () => {
    const forcedColorsBlock = segmentedControlCss.match(/@media \(forced-colors: active\) \{(.*?)\n\}/s)?.[1] ?? "";
    const checkedTextRule = forcedColorsBlock.match(/\.input:checked \+ \.text \{(.*?)\}/s)?.[1] ?? "";

    expect(checkedTextRule).toContain("forced-color-adjust: none");
  });
});

function setUpTest() {
  const user = userEvent.setup();
  const onValueChange = vi.fn();

  const render = (props: Partial<SegmentedControlProps> = {}): void => {
    renderBase(
      <SegmentedControl defaultValue="light" label="Appearance" onValueChange={onValueChange} {...props}>
        <Segment value="light">Light</Segment>
        <Segment value="dark">Dark</Segment>
        <Segment value="system">System</Segment>
      </SegmentedControl>
    );
  };

  return { onValueChange, render, user };
}

const elements = {
  get group(): HTMLElement {
    return screen.getByRole("radiogroup", { name: "Appearance" });
  },
  segment(name: string): HTMLInputElement {
    return screen.getByRole<HTMLInputElement>("radio", { name });
  },
};
