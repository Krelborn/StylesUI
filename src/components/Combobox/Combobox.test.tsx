import { fireEvent, render as renderBase, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { JSX } from "react";
import { useState } from "react";
import { describe, expect, it, onTestFinished, vi } from "vitest";

import { MissingContextError } from "../../errors";
import { Button } from "../Button";
import { Field } from "../Field";

import type { ComboboxProps } from "./Combobox";
import { Combobox } from "./Combobox";
import { ComboboxOption } from "./ComboboxOption";

const people = [
  { description: "Mathematics", id: "ada", name: "Ada Lovelace" },
  { description: "Computing", id: "alan", name: "Alan Turing" },
  { description: "Navy", id: "grace", name: "Grace Hopper" },
  { description: "Spaceflight", id: "katherine", name: "Katherine Johnson" },
];

interface AssigneePickerProps extends Pick<ComboboxProps, "defaultValue" | "name" | "onValueChange" | "value"> {
  /**
   * The id of the person whose option is disabled
   */
  disabledId?: string;

  /**
   * Whether the field disables the combobox
   */
  fieldDisabled?: boolean;

  /**
   * Whether the field requires a choice
   */
  required?: boolean;

  /**
   * The ids of the people listed. Defaults to everyone.
   */
  shownIds?: readonly string[];
}

/**
 * An assignee combobox in a field inside a form, followed by a button
 */
function AssigneePicker({
  defaultValue,
  disabledId,
  fieldDisabled = false,
  name,
  onValueChange,
  required = false,
  shownIds = people.map((person) => person.id),
  value,
}: AssigneePickerProps): JSX.Element {
  return (
    <form aria-label="Task">
      <Field description="Who works on it" disabled={fieldDisabled} label="Assignee" required={required}>
        <Combobox
          defaultValue={defaultValue}
          name={name}
          onValueChange={onValueChange}
          placeholder="Unassigned"
          value={value}
        >
          {people
            .filter((person) => shownIds.includes(person.id))
            .map((person) => (
              <ComboboxOption
                description={person.description}
                disabled={person.id === disabledId}
                key={person.id}
                leading={<span>{person.name.slice(0, 1)}</span>}
                value={person.id}
              >
                {person.name}
              </ComboboxOption>
            ))}
        </Combobox>
      </Field>
      <Button>After</Button>
    </form>
  );
}

/**
 * The picker with its value held by a parent that applies every change, showing what it holds
 */
function ControlledPicker({ onValueChange }: Pick<ComboboxProps, "onValueChange">): JSX.Element {
  const [assignee, setAssignee] = useState<string | null>("alan");

  function handleValueChange(next: string): void {
    onValueChange?.(next);
    setAssignee(next);
  }

  return (
    <>
      <AssigneePicker onValueChange={handleValueChange} value={assignee} />
      <output>{assignee}</output>
    </>
  );
}

describe("Combobox", () => {
  it("must render a closed combobox named and described by its field when it renders", () => {
    renderBase(<AssigneePicker />);

    expect(elements.combobox).toHaveAttribute("aria-haspopup", "listbox");
    expect(elements.combobox).toHaveAttribute("aria-expanded", "false");
    expect(elements.combobox).toHaveAccessibleDescription("Who works on it");
    expect(elements.combobox).toHaveAttribute("aria-controls", elements.hiddenListbox.id);
    expect(elements.combobox).toHaveTextContent("Unassigned");
  });

  it("must show its list named by the field's label when it opens", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker />);

    await user.click(elements.combobox);

    expect(elements.listbox).toBeVisible();
    expect(elements.combobox).toHaveAttribute("aria-expanded", "true");
  });

  it("must describe each option by its description when the list opens", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker />);

    await user.click(elements.combobox);

    expect(elements.option("Grace Hopper")).toHaveAccessibleDescription("Navy");
  });

  it("must show the selected option's leading content and label when an option is selected", () => {
    renderBase(<AssigneePicker defaultValue="grace" />);

    expect(elements.combobox).toHaveTextContent("GGrace Hopper");
    expect(elements.combobox).not.toHaveTextContent("Navy");
  });

  it("must name the combobox and its list by aria-label when it is outside a field", async () => {
    const { user } = setUpTest();
    renderBase(
      <Combobox aria-label="Status">
        <ComboboxOption value="open">Open</ComboboxOption>
      </Combobox>
    );

    await user.click(screen.getByRole("combobox", { name: "Status" }));

    expect(screen.getByRole("listbox", { name: "Status" })).toBeVisible();
  });

  it.each([
    { key: "{ArrowDown}", name: "Down Arrow" },
    { key: "{ArrowUp}", name: "Up Arrow" },
    { key: "{Enter}", name: "Enter" },
    { key: " ", name: "Space" },
  ])("must open on the selected option when $name is pressed on the closed field", async ({ key }) => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker defaultValue="grace" />);
    await user.tab();

    await user.keyboard(key);

    expect(elements.listbox).toBeVisible();
    expect(elements.combobox).toHaveFocus();
    expect(elements.activeOption).toBe(elements.option("Grace Hopper"));
  });

  it("must open on the first option when Down Arrow is pressed with nothing selected", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker />);
    await user.tab();

    await user.keyboard("{ArrowDown}");

    expect(elements.activeOption).toBe(elements.option("Ada Lovelace"));
  });

  it.each([
    { expected: "Ada Lovelace", key: "{Home}" },
    { expected: "Katherine Johnson", key: "{End}" },
  ])("must open on $expected when $key is pressed on the closed field", async ({ expected, key }) => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker defaultValue="grace" />);
    await user.tab();

    await user.keyboard(key);

    expect(elements.activeOption).toBe(elements.option(expected));
  });

  it("must open with no option active when Alt+Down Arrow is pressed", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker defaultValue="grace" />);
    await user.tab();

    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");

    expect(elements.listbox).toBeVisible();
    expect(elements.combobox).not.toHaveAttribute("aria-activedescendant");
  });

  it("must open and move by type-ahead when a character is typed on the closed field", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker />);
    await user.tab();

    await user.keyboard("k");

    expect(elements.activeOption).toBe(elements.option("Katherine Johnson"));
  });

  it("must leave a key alone when it is pressed with Ctrl", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker />);
    await user.tab();

    await user.keyboard("{Control>}{ArrowDown}{/Control}");

    expect(elements.combobox).toHaveAttribute("aria-expanded", "false");
  });

  it("must stop at the last option when Down Arrow is pressed past it", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker defaultValue="grace" />);
    await user.tab();

    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");

    expect(elements.activeOption).toBe(elements.option("Katherine Johnson"));
  });

  it.each([
    { expected: "Ada Lovelace", key: "{Home}" },
    { expected: "Katherine Johnson", key: "{End}" },
  ])("must move to $expected when $key is pressed in the open list", async ({ expected, key }) => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker defaultValue="alan" />);
    await user.tab();
    await user.keyboard("{ArrowDown}");

    await user.keyboard(key);

    expect(elements.activeOption).toBe(elements.option(expected));
  });

  it("must scroll the active option into view when a key moves it", async () => {
    const { scrollIntoView, user } = setUpTest();
    renderBase(<AssigneePicker />);
    await user.tab();
    await user.keyboard("{ArrowDown}");
    scrollIntoView.mockClear();

    await user.keyboard("{ArrowDown}");

    expect(scrollIntoView.mock.contexts).toEqual([elements.option("Alan Turing")]);
  });

  it("must not scroll when the pointer moves the active option", async () => {
    const { scrollIntoView, user } = setUpTest();
    renderBase(<AssigneePicker />);
    await user.click(elements.combobox);
    scrollIntoView.mockClear();

    await user.hover(elements.option("Grace Hopper"));

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("must reach a disabled option when the arrow keys pass it", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker defaultValue="alan" disabledId="grace" />);
    await user.tab();

    await user.keyboard("{ArrowDown}{ArrowDown}");

    expect(elements.activeOption).toBe(elements.option("Grace Hopper"));
    expect(elements.option("Grace Hopper")).toHaveAttribute("aria-disabled", "true");
  });

  it.each([
    { key: "{Enter}", name: "Enter" },
    { key: " ", name: "Space" },
    { key: "{Alt>}{ArrowUp}{/Alt}", name: "Alt+Up Arrow" },
  ])("must commit the active option and close when $name is pressed in the open list", async ({ key }) => {
    const { onValueChange, user } = setUpTest();
    renderBase(<AssigneePicker onValueChange={onValueChange} />);
    await user.tab();
    await user.keyboard("{ArrowDown}{ArrowDown}");

    await user.keyboard(key);

    expect(onValueChange.mock.calls).toEqual([["alan"]]);
    expect(elements.combobox).toHaveAttribute("aria-expanded", "false");
    expect(elements.combobox).toHaveTextContent("Alan Turing");
    expect(elements.combobox).toHaveFocus();
  });

  it("must join type-ahead rather than commit when Space is typed within a query", async () => {
    const { onValueChange, user } = setUpTest();
    renderBase(<AssigneePicker onValueChange={onValueChange} />);
    await user.tab();
    await user.keyboard("{ArrowDown}");

    await user.keyboard("katherine j");

    expect(onValueChange).not.toHaveBeenCalled();
    expect(elements.activeOption).toBe(elements.option("Katherine Johnson"));
  });

  it("must keep the list open without committing when Enter is pressed on a disabled option", async () => {
    const { onValueChange, user } = setUpTest();
    renderBase(<AssigneePicker defaultValue="grace" disabledId="grace" onValueChange={onValueChange} />);
    await user.tab();
    await user.keyboard("{ArrowDown}");

    await user.keyboard("{Enter}");

    expect(onValueChange).not.toHaveBeenCalled();
    expect(elements.listbox).toBeVisible();
  });

  it("must close without committing when Enter is pressed with no option active", async () => {
    const { onValueChange, user } = setUpTest();
    renderBase(<AssigneePicker onValueChange={onValueChange} />);
    await user.tab();
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");

    await user.keyboard("{Enter}");

    expect(onValueChange).not.toHaveBeenCalled();
    expect(elements.combobox).toHaveAttribute("aria-expanded", "false");
  });

  it("must close without committing when Escape is pressed in the open list", async () => {
    const { onValueChange, user } = setUpTest();
    renderBase(<AssigneePicker defaultValue="ada" onValueChange={onValueChange} />);
    await user.tab();
    await user.keyboard("{ArrowDown}{ArrowDown}");

    await user.keyboard("{Escape}");

    expect(onValueChange).not.toHaveBeenCalled();
    expect(elements.combobox).toHaveAttribute("aria-expanded", "false");
    expect(elements.combobox).toHaveTextContent("Ada Lovelace");
    expect(elements.combobox).toHaveFocus();
  });

  it("must close without committing and move on when Tab is pressed in the open list", async () => {
    const { onValueChange, user } = setUpTest();
    renderBase(<AssigneePicker onValueChange={onValueChange} />);
    await user.tab();
    await user.keyboard("{ArrowDown}{ArrowDown}");

    await user.tab();

    expect(onValueChange).not.toHaveBeenCalled();
    expect(elements.combobox).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("must open on the selected option without the focus ring when the field is clicked", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker defaultValue="alan" />);

    await user.click(elements.combobox);

    expect(elements.activeOption).toBe(elements.option("Alan Turing"));
    expect(elements.activeOption).toHaveAttribute("data-active", "pointer");
    expect(elements.combobox).toHaveFocus();
  });

  it("must close the list when the open field is clicked", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker />);
    await user.click(elements.combobox);

    await user.click(elements.combobox);

    expect(elements.combobox).toHaveAttribute("aria-expanded", "false");
    expect(elements.combobox).toHaveFocus();
  });

  it("must make the option under the pointer active when the pointer moves over it", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker />);
    await user.click(elements.combobox);

    await user.hover(elements.option("Grace Hopper"));

    expect(elements.activeOption).toBe(elements.option("Grace Hopper"));
    expect(elements.activeOption).toHaveAttribute("data-active", "pointer");
  });

  it("must leave the active option alone when a finger moves over another", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker defaultValue="alan" />);
    await user.click(elements.combobox);

    fireEvent.pointerMove(elements.option("Grace Hopper"), { pointerType: "touch" });

    expect(elements.activeOption).toBe(elements.option("Alan Turing"));
  });

  it("must stop naming an option as active when it unmounts", async () => {
    const { render, user } = setUpTest();
    const { rerender } = render(<AssigneePicker />);
    await user.click(elements.combobox);
    await user.keyboard("{ArrowDown}");
    expect(elements.activeOption).toBe(elements.option("Alan Turing"));

    rerender(<AssigneePicker shownIds={["ada", "grace", "katherine"]} />);

    expect(elements.combobox).not.toHaveAttribute("aria-activedescendant");
  });

  it("must focus the field when a click opens it without focusing it, as in Safari", () => {
    renderBase(<AssigneePicker />);

    fireEvent.click(elements.combobox);

    expect(elements.combobox).toHaveFocus();
  });

  it("must show the focus ring on the active option when a key moves it", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker />);
    await user.click(elements.combobox);

    await user.keyboard("{ArrowDown}");

    expect(elements.activeOption).toHaveAttribute("data-active", "keyboard");
  });

  it("must commit an option and keep focus on the field when it is clicked", async () => {
    const { onValueChange, user } = setUpTest();
    renderBase(<AssigneePicker onValueChange={onValueChange} />);
    await user.click(elements.combobox);

    await user.click(elements.option("Grace Hopper"));

    expect(onValueChange.mock.calls).toEqual([["grace"]]);
    expect(elements.combobox).toHaveFocus();
    expect(elements.combobox).toHaveTextContent("Grace Hopper");
  });

  it("must not commit a disabled option when it is clicked", async () => {
    const { onValueChange, user } = setUpTest();
    renderBase(<AssigneePicker disabledId="grace" onValueChange={onValueChange} />);
    await user.click(elements.combobox);

    await user.click(elements.option("Grace Hopper"));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(elements.listbox).toBeVisible();
  });

  it("must close without committing when focus leaves the field", async () => {
    const { onValueChange, user } = setUpTest();
    renderBase(<AssigneePicker onValueChange={onValueChange} />);
    await user.click(elements.combobox);

    await user.click(screen.getByRole("button", { name: "After" }));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(elements.combobox).toHaveAttribute("aria-expanded", "false");
  });

  it("must mark the selected option when the list opens", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker defaultValue="alan" />);

    await user.click(elements.combobox);

    expect(elements.option("Alan Turing")).toHaveAttribute("aria-selected", "true");
    expect(elements.option("Ada Lovelace")).toHaveAttribute("aria-selected", "false");
  });

  it("must show the value its parent holds when it is controlled", async () => {
    const { onValueChange, user } = setUpTest();
    renderBase(<ControlledPicker onValueChange={onValueChange} />);
    await user.click(elements.combobox);

    await user.click(elements.option("Katherine Johnson"));

    expect(onValueChange.mock.calls).toEqual([["katherine"]]);
    expect(screen.getByRole("status")).toHaveTextContent("katherine");
    expect(elements.combobox).toHaveTextContent("Katherine Johnson");
  });

  it("must keep its value when it is controlled and the parent ignores a change", async () => {
    const { onValueChange, user } = setUpTest();
    renderBase(<AssigneePicker onValueChange={onValueChange} value="alan" />);
    await user.click(elements.combobox);

    await user.click(elements.option("Ada Lovelace"));

    expect(onValueChange.mock.calls).toEqual([["ada"]]);
    expect(elements.combobox).toHaveTextContent("Alan Turing");
  });

  it("must not report a change when the selected option is committed again", async () => {
    const { onValueChange, user } = setUpTest();
    renderBase(<AssigneePicker defaultValue="alan" onValueChange={onValueChange} />);
    await user.click(elements.combobox);

    await user.click(elements.option("Alan Turing"));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("must submit the selected value with its form when it has a name", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker name="assignee" />);
    await user.click(elements.combobox);

    await user.click(elements.option("Grace Hopper"));

    expect(new FormData(elements.form).get("assignee")).toBe("grace");
  });

  it("must disable the field and leave the list closed when its field is disabled", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker fieldDisabled={true} name="assignee" />);

    await user.click(elements.combobox);

    expect(elements.combobox).toBeDisabled();
    expect(elements.combobox).toHaveAttribute("aria-expanded", "false");
    expect(new FormData(elements.form).has("assignee")).toBe(false);
  });

  it("must mark the field required for assistive technology when its field requires a choice", () => {
    renderBase(<AssigneePicker required={true} />);

    expect(elements.combobox).toHaveAttribute("aria-required", "true");
    expect(elements.combobox).not.toHaveAttribute("required");
  });

  it("must cancel the button's own Space click when Space is released", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker />);
    await user.tab();

    const notCancelled = fireEvent.keyUp(elements.combobox, { key: " " });

    expect(notCancelled).toBe(false);
  });

  it("must throw a MissingContextError when an option renders outside a combobox", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    onTestFinished(() => {
      consoleError.mockRestore();
    });

    expect(() => renderBase(<ComboboxOption value="ada">Ada</ComboboxOption>)).toThrow(MissingContextError);
  });

  it("must keep the option a key makes active when the pointer made it active first", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker />);
    await user.click(elements.combobox);

    await user.keyboard("{Home}");

    expect(elements.activeOption).toBe(elements.option("Ada Lovelace"));
    expect(elements.activeOption).toHaveAttribute("data-active", "keyboard");
  });

  it("must close the list when a press on the field began with it open, though the press took focus away", async () => {
    const { user } = setUpTest();
    renderBase(<AssigneePicker />);
    await user.click(elements.combobox);

    fireEvent.pointerDown(elements.combobox);
    fireEvent.blur(elements.combobox);
    fireEvent.click(elements.combobox, { detail: 1 });

    expect(elements.combobox).toHaveAttribute("aria-expanded", "false");
  });

  it("must keep a consumer's anchor name beside its own when it is given one", () => {
    renderBase(<Combobox aria-label="Status" style={{ anchorName: "--tooltip-anchor" }} />);

    expect(screen.getByRole("combobox", { name: "Status" }).style.getPropertyValue("anchor-name")).toContain(
      "--tooltip-anchor"
    );
  });

  it("must reject the props the combobox pattern sets when they are given", () => {
    renderBase(
      <>
        {/* @ts-expect-error the combobox pattern sets the role */}
        <Combobox aria-label="Status" role="menuitem" />
        {/* @ts-expect-error the field is always a button that opens the list */}
        <Combobox aria-label="Status" type="submit" />
        {/* @ts-expect-error the selection is a string or null */}
        <Combobox aria-label="Status" value={1} />
        <Combobox aria-label="Status">
          {/* @ts-expect-error the label names the option */}
          <ComboboxOption aria-label="Open" value="open">
            Open
          </ComboboxOption>
        </Combobox>
      </>
    );
  });
});

function setUpTest() {
  const user = userEvent.setup();
  const onValueChange = vi.fn();
  const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView");
  onTestFinished(() => {
    scrollIntoView.mockRestore();
  });

  const render = (ui: JSX.Element) => {
    const { rerender } = renderBase(ui);

    return { rerender };
  };

  return { onValueChange, render, scrollIntoView, user };
}

const elements = {
  get activeOption(): HTMLElement | null {
    const id = elements.combobox.getAttribute("aria-activedescendant");

    return id === null ? null : document.getElementById(id);
  },
  get combobox(): HTMLElement {
    return screen.getByRole("combobox", { name: "Assignee" });
  },
  get form(): HTMLFormElement {
    return screen.getByRole("form", { name: "Task" }) as HTMLFormElement;
  },
  get hiddenListbox(): HTMLElement {
    return screen.getByRole("listbox", { hidden: true, name: "Assignee" });
  },
  get listbox(): HTMLElement {
    return screen.getByRole("listbox", { name: "Assignee" });
  },
  option(name: string): HTMLElement {
    return screen.getByRole("option", { name });
  },
};
