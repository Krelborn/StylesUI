import { fireEvent, render as renderBase, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { JSX } from "react";
import { useState } from "react";
import { describe, expect, it, onTestFinished, vi } from "vitest";

import { MissingContextError } from "../../errors";
import { Button } from "../Button";

import type { ListboxProps } from "./Listbox";
import { Listbox } from "./Listbox";
import { ListboxOption } from "./ListboxOption";

const fruits = ["Apple", "Apricot", "Banana", "Cherry"];

interface FruitListboxProps extends Pick<ListboxProps, "defaultValue" | "onAction" | "onValueChange" | "value"> {
  /**
   * The fruit whose option is disabled
   */
  disabledValue?: string;

  /**
   * The fruits listed, in order
   */
  shown: readonly string[];
}

/**
 * A listbox of fruits followed by a button, with a log of the actions and selection changes it reports
 */
function FruitListbox({
  defaultValue,
  disabledValue,
  onAction,
  onValueChange,
  shown,
  value,
}: FruitListboxProps): JSX.Element {
  const [actions, setActions] = useState<string[]>([]);
  const [changes, setChanges] = useState<string[]>([]);

  function handleAction(actionValue: string): void {
    onAction?.(actionValue);
    setActions((previous) => [...previous, actionValue]);
  }

  function handleValueChange(nextValue: string): void {
    onValueChange?.(nextValue);
    setChanges((previous) => [...previous, nextValue]);
  }

  return (
    <>
      <Listbox
        defaultValue={defaultValue}
        onAction={handleAction}
        onValueChange={handleValueChange}
        value={value}
        aria-label="Fruit"
      >
        {shown.map((fruit) => (
          <ListboxOption disabled={fruit === disabledValue} key={fruit} value={fruit}>
            {fruit}
          </ListboxOption>
        ))}
      </Listbox>
      <Button>After</Button>
      <p>{`Actions: ${logText(actions)}`}</p>
      <p>{`Changes: ${logText(changes)}`}</p>
    </>
  );
}

function logText(values: readonly string[]): string {
  return values.length === 0 ? "none" : values.join(", ");
}

describe("Listbox", () => {
  it("must be one tab stop named by aria-label when it renders", async () => {
    const { render, user } = setUpTest();
    render();

    await user.tab();
    const firstStop = document.activeElement;
    await user.tab();

    expect(firstStop).toBe(elements.listbox);
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("must make the selected option active when focus enters", async () => {
    const { render, user } = setUpTest();
    render({ defaultValue: "Banana" });

    await user.tab();

    expect(elements.listbox).toHaveAttribute("aria-activedescendant", elements.option("Banana").id);
  });

  it("must make the first option active without selecting it when focus enters with nothing selected", async () => {
    const { render, user } = setUpTest();
    render();

    await user.tab();

    expect(elements.listbox).toHaveAttribute("aria-activedescendant", elements.option("Apple").id);
    expect(elements.option("Apple")).toHaveAttribute("aria-selected", "false");
  });

  it("must select the active option when Space is pressed", async () => {
    const { onValueChange, render, user } = setUpTest();
    render();
    await user.tab();

    await user.keyboard(" ");

    expect(elements.option("Apple")).toHaveAttribute("aria-selected", "true");
    expect(onValueChange).toHaveBeenLastCalledWith("Apple");
  });

  it("must select the next and previous option when Down and Up are pressed", async () => {
    const { onValueChange, render, user } = setUpTest();
    render({ defaultValue: "Apricot" });
    await user.tab();

    await user.keyboard("{ArrowDown}");
    const afterDown = onValueChange.mock.lastCall;
    await user.keyboard("{ArrowUp}{ArrowUp}");

    expect(afterDown).toEqual(["Banana"]);
    expect(elements.option("Apple")).toHaveAttribute("aria-selected", "true");
  });

  it("must stay on the last option when Down is pressed at the end", async () => {
    const { render, user } = setUpTest();
    render({ defaultValue: "Cherry" });
    await user.tab();

    await user.keyboard("{ArrowDown}");

    expect(elements.option("Cherry")).toHaveAttribute("aria-selected", "true");
    expect(elements.listbox).toHaveAttribute("aria-activedescendant", elements.option("Cherry").id);
  });

  it("must select the first and last option when Home and End are pressed", async () => {
    const { render, user } = setUpTest();
    render({ defaultValue: "Banana" });
    await user.tab();

    await user.keyboard("{End}");
    const selectedAfterEnd = elements.option("Cherry").getAttribute("aria-selected");
    await user.keyboard("{Home}");

    expect(selectedAfterEnd).toBe("true");
    expect(elements.option("Apple")).toHaveAttribute("aria-selected", "true");
  });

  it("must call onAction once when Enter is held on the active option", async () => {
    const { onAction, render, user } = setUpTest();
    render({ defaultValue: "Banana" });
    await user.tab();

    fireEvent.keyDown(elements.listbox, { key: "Enter" });
    fireEvent.keyDown(elements.listbox, { key: "Enter", repeat: true });

    expect(screen.getByText("Actions: Banana")).toBeInTheDocument();
    expect(onAction).toHaveBeenCalledWith("Banana");
  });

  it("must call onAction when an option is double-clicked", async () => {
    const { onAction, render, user } = setUpTest();
    render();

    await user.dblClick(elements.option("Cherry"));

    expect(onAction).toHaveBeenCalledWith("Cherry");
  });

  it("must select an option and focus the listbox when the option is clicked", async () => {
    const { onValueChange, render, user } = setUpTest();
    render();

    await user.click(elements.option("Banana"));

    expect(elements.option("Banana")).toHaveAttribute("aria-selected", "true");
    expect(elements.listbox).toHaveFocus();
    expect(onValueChange).toHaveBeenLastCalledWith("Banana");
  });

  it("must reach a disabled option without selecting it", async () => {
    const { render, user } = setUpTest();
    render({ defaultValue: "Apple", disabledValue: "Apricot" });
    await user.tab();

    await user.keyboard("{ArrowDown}");

    expect(elements.listbox).toHaveAttribute("aria-activedescendant", elements.option("Apricot").id);
    expect(elements.option("Apricot")).toHaveAttribute("aria-disabled", "true");
    expect(elements.option("Apple")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Changes: none")).toBeInTheDocument();
  });

  it("must not select a disabled option when it is clicked", async () => {
    const { render, user } = setUpTest();
    render({ disabledValue: "Apricot" });

    await user.click(elements.option("Apricot"));

    expect(elements.option("Apricot")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Changes: none")).toBeInTheDocument();
  });

  it("must move to the next option starting with the typed text", async () => {
    const { render, user } = setUpTest();
    render({ defaultValue: "Apple" });
    await user.tab();

    await user.keyboard("c");

    expect(elements.option("Cherry")).toHaveAttribute("aria-selected", "true");
  });

  it("must match type-ahead on the title when an option is labelled by it", async () => {
    const { user } = setUpTest();
    renderBase(
      <Listbox aria-label="Pull requests">
        <ListboxOption value="build" aria-labelledby="build-title">
          <span aria-hidden="true">AL</span>
          <span id="build-title">Fix the build</span>
        </ListboxOption>
        <ListboxOption value="listbox" aria-labelledby="listbox-title">
          <span aria-hidden="true">MS</span>
          <span id="listbox-title">Add a listbox</span>
        </ListboxOption>
      </Listbox>
    );
    await user.tab();

    await user.keyboard("a");

    expect(elements.option("Add a listbox")).toHaveAttribute("aria-selected", "true");
  });

  it("must match type-ahead on textValue when an option gives one", async () => {
    const { user } = setUpTest();
    renderBase(
      <Listbox aria-label="Fruit">
        <ListboxOption value="cherry">Cherry</ListboxOption>
        <ListboxOption textValue="Banana" value="banana">
          Yellow: Banana
        </ListboxOption>
      </Listbox>
    );
    await user.tab();

    await user.keyboard("b");

    expect(elements.option("Yellow: Banana")).toHaveAttribute("aria-selected", "true");
  });

  it("must leave a letter alone when it is pressed with Meta", async () => {
    const { render, user } = setUpTest();
    render({ defaultValue: "Apple" });
    await user.tab();

    const notPrevented = fireEvent.keyDown(elements.listbox, { key: "c", metaKey: true });

    expect(notPrevented).toBe(true);
    expect(elements.option("Apple")).toHaveAttribute("aria-selected", "true");
  });

  it("must scroll the active option into the nearest container when a key moves it", async () => {
    const { render, user } = setUpTest();
    const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView");
    onTestFinished(() => {
      scrollIntoView.mockRestore();
    });
    render({ defaultValue: "Apple" });
    await user.tab();

    await user.keyboard("{ArrowDown}");

    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: "nearest", container: "nearest" });
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(elements.option("Apricot"));
  });

  it("must not scroll when it first renders or when an option is clicked", async () => {
    const { render, user } = setUpTest();
    const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView");
    onTestFinished(() => {
      scrollIntoView.mockRestore();
    });
    render({ defaultValue: "Cherry" });

    await user.click(elements.option("Banana"));

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("must prevent the default action of a key when the listbox handles it", async () => {
    const { render, user } = setUpTest();
    render({ defaultValue: "Apple" });
    await user.tab();

    expect(fireEvent.keyDown(elements.listbox, { key: "ArrowDown" })).toBe(false);
    expect(fireEvent.keyDown(elements.listbox, { key: " " })).toBe(false);
    expect(fireEvent.keyDown(elements.listbox, { key: "Tab" })).toBe(true);
  });

  it("must follow only value when it is controlled", async () => {
    const { onValueChange, render, user } = setUpTest();
    render({ value: "Apple" });

    await user.click(elements.option("Cherry"));

    expect(onValueChange).toHaveBeenLastCalledWith("Cherry");
    expect(elements.option("Apple")).toHaveAttribute("aria-selected", "true");
  });

  it("must stop pointing at an active option that is removed and still move when a key is pressed", async () => {
    const { render, user } = setUpTest();
    const { rerender } = render({ defaultValue: "Banana", shown: ["Apple", "Banana", "Cherry"] });
    await user.tab();
    await user.keyboard("{ArrowDown}");

    rerender(["Apple", "Banana"]);
    const activeAfterRemoval = elements.listbox.getAttribute("aria-activedescendant");
    await user.keyboard("{ArrowUp}");

    expect(activeAfterRemoval).toBeNull();
    expect(elements.option("Apple")).toHaveAttribute("aria-selected", "true");
  });

  it("must move from the selected option when the active option is removed but the selected one is not", async () => {
    const { render, user } = setUpTest();
    const { rerender } = render({ defaultValue: "Apple", disabledValue: "Apricot" });
    await user.tab();
    await user.keyboard("{ArrowDown}");

    rerender(["Apple", "Banana", "Cherry"]);
    const activeAfterRemoval = elements.listbox.getAttribute("aria-activedescendant");
    await user.keyboard("{ArrowDown}");

    expect(activeAfterRemoval).toBeNull();
    expect(elements.option("Banana")).toHaveAttribute("aria-selected", "true");
  });

  it("must throw a MissingContextError when an option renders outside Listbox", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    onTestFinished(() => {
      consoleError.mockRestore();
    });

    expect(() => renderBase(<ListboxOption value="apple">Apple</ListboxOption>)).toThrow(MissingContextError);
  });

  it("must reject a listbox when it has no name", () => {
    renderBase(
      // @ts-expect-error a listbox needs aria-label or aria-labelledby
      <Listbox>
        <ListboxOption value="apple">Apple</ListboxOption>
      </Listbox>
    );

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });
});

interface RenderOptions extends Pick<ListboxProps, "defaultValue" | "value"> {
  disabledValue?: string;
  shown?: readonly string[];
}

function setUpTest() {
  const user = userEvent.setup();
  const onAction = vi.fn();
  const onValueChange = vi.fn();

  const render = ({ shown = fruits, ...options }: RenderOptions = {}) => {
    const listboxFor = (shownFruits: readonly string[]): JSX.Element => (
      <FruitListbox {...options} onAction={onAction} onValueChange={onValueChange} shown={shownFruits} />
    );
    const { rerender } = renderBase(listboxFor(shown));

    return {
      rerender: (shownFruits: readonly string[]): void => rerender(listboxFor(shownFruits)),
    };
  };

  return { onAction, onValueChange, render, user };
}

const elements = {
  get listbox(): HTMLElement {
    return screen.getByRole("listbox", { name: "Fruit" });
  },
  option(name: string): HTMLElement {
    return screen.getByRole("option", { name });
  },
};
