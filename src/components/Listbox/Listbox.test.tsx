import { act, fireEvent, render as renderBase, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { JSX } from "react";
import { useState, useSyncExternalStore } from "react";
import { describe, expect, it, onTestFinished, vi } from "vitest";

import { MissingContextError } from "../../errors";
import { transitionedProperties } from "../../test/transitionedProperties";
import { Button } from "../Button";

import type { ListboxProps } from "./Listbox";
import { Listbox } from "./Listbox";
import listboxCss from "./Listbox.module.css?raw";
import { ListboxOption } from "./ListboxOption";

const fruits = ["Apple", "Apricot", "Banana", "Cherry"];

interface FruitListboxProps extends Pick<ListboxProps, "defaultValue" | "onAction" | "onValueChange" | "value"> {
  /**
   * The fruit whose option is disabled
   */
  disabledValue?: string;

  /**
   * The fruits listed, in order. Defaults to all four.
   */
  shown?: readonly string[];
}

/**
 * A listbox of fruits followed by a button, with a log of the actions and selection changes it reports
 */
function FruitListbox({
  defaultValue,
  disabledValue,
  onAction,
  onValueChange,
  shown = fruits,
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

/**
 * Two pull request options, each labelled by its title and showing initials before it
 */
function PullRequestListbox(): JSX.Element {
  return (
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
}

interface FruitStore {
  /**
   * Whether the fruit is still listed
   */
  isListed: (fruit: string) => boolean;

  /**
   * Stops listing the fruit and tells every subscriber
   */
  remove: (fruit: string) => void;

  /**
   * Calls the listener whenever a fruit is removed, until the returned function is called
   */
  subscribe: (listener: () => void) => () => void;
}

/**
 * Creates a store of listed fruits that each option reads for itself, so removing one re-renders only that option
 */
function createFruitStore(initialFruits: readonly string[]): FruitStore {
  const listed = new Set(initialFruits);
  const listeners = new Set<() => void>();

  return {
    isListed: (fruit) => listed.has(fruit),
    remove: (fruit) => {
      listed.delete(fruit);
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}

interface StoredFruitOptionProps {
  /**
   * The fruit the option stands for
   */
  fruit: string;

  /**
   * The store that says whether the fruit is listed
   */
  store: FruitStore;
}

/**
 * An option that renders only while its store lists its fruit
 */
function StoredFruitOption({ fruit, store }: StoredFruitOptionProps): JSX.Element | null {
  const listed = useSyncExternalStore(store.subscribe, () => store.isListed(fruit));

  return listed ? <ListboxOption value={fruit}>{fruit}</ListboxOption> : null;
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

  it("must have no active option when focus has not entered", () => {
    const { render } = setUpTest();

    render({ defaultValue: "Banana" });

    expect(elements.listbox).not.toHaveAttribute("aria-activedescendant");
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
    renderBase(<PullRequestListbox />);
    await user.tab();

    await user.keyboard("a");

    expect(elements.option("Add a listbox")).toHaveAttribute("aria-selected", "true");
  });

  it("must match type-ahead on the title when the listbox renders in a shadow root", async () => {
    const { user } = setUpTest();
    const host = document.createElement("div");
    document.body.append(host);
    onTestFinished(() => {
      host.remove();
    });
    const container = document.createElement("div");
    host.attachShadow({ mode: "open" }).append(container);
    renderBase(<PullRequestListbox />, { container });
    const shadow = within(container);
    await user.click(shadow.getByRole("option", { name: "Fix the build" }));

    await user.keyboard("a");

    expect(shadow.getByRole("option", { name: "Add a listbox" })).toHaveAttribute("aria-selected", "true");
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

  it.each(["altKey", "ctrlKey", "metaKey"])(
    "must leave a letter alone when it is pressed with %s",
    async (modifier) => {
      const { render, user } = setUpTest();
      render({ defaultValue: "Apple" });
      await user.tab();

      const notPrevented = fireEvent.keyDown(elements.listbox, { key: "c", [modifier]: true });

      expect(notPrevented).toBe(true);
      expect(elements.option("Apple")).toHaveAttribute("aria-selected", "true");
    }
  );

  it("must scroll the selected option into the nearest container when focus enters from the keyboard", async () => {
    const { render, scrollIntoView, user } = setUpTest();
    render({ defaultValue: "Cherry" });

    await user.tab();

    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: "nearest", container: "nearest" });
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(elements.option("Cherry"));
  });

  it("must scroll the active option into the nearest container when a key moves it", async () => {
    const { render, scrollIntoView, user } = setUpTest();
    render({ defaultValue: "Apple" });
    await user.tab();

    await user.keyboard("{ArrowDown}");

    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: "nearest", container: "nearest" });
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(elements.option("Apricot"));
  });

  it("must not scroll when it first renders or when an option is clicked", async () => {
    const { render, scrollIntoView, user } = setUpTest();
    render({ defaultValue: "Cherry" });

    await user.click(elements.option("Banana"));

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("must not scroll when a touch taps an option of an unfocused listbox", async () => {
    const { render, scrollIntoView, user } = setUpTest();
    render({ defaultValue: "Cherry" });

    await user.pointer({ keys: "[TouchA]", target: elements.option("Banana") });

    expect(elements.option("Banana")).toHaveAttribute("aria-selected", "true");
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("must not scroll when a script clicks an option of an unfocused listbox", () => {
    const { render, scrollIntoView } = setUpTest();
    render({ defaultValue: "Cherry" });

    fireEvent.click(elements.option("Banana"));

    expect(elements.listbox).toHaveFocus();
    expect(elements.option("Banana")).toHaveAttribute("aria-selected", "true");
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("must scroll when focus enters from the keyboard after a press on an option is cancelled", async () => {
    const { render, scrollIntoView, user } = setUpTest();
    render({ defaultValue: "Cherry" });
    fireEvent.pointerDown(elements.option("Banana"));
    fireEvent.pointerCancel(elements.option("Banana"));

    await user.tab();

    expect(scrollIntoView.mock.contexts.at(-1)).toBe(elements.option("Cherry"));
  });

  it("must scroll when focus returns from the keyboard after a press released outside the listbox", async () => {
    const { render, scrollIntoView, user } = setUpTest();
    render({ defaultValue: "Cherry" });
    await user.pointer([
      { keys: "[MouseLeft>]", target: elements.option("Banana") },
      { keys: "[/MouseLeft]", target: document.body },
    ]);
    await user.tab();

    await user.tab({ shift: true });

    expect(elements.listbox).toHaveFocus();
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(elements.option("Cherry"));
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

  it("must make the new selected option active when value changes while focused", async () => {
    const { render, user } = setUpTest();
    const { rerender } = render({ value: "Apple" });
    await user.tab();

    rerender({ value: "Cherry" });

    expect(elements.listbox).toHaveAttribute("aria-activedescendant", elements.option("Cherry").id);
  });

  it("must keep the active option and select none when value changes to null while focused", async () => {
    const { render, user } = setUpTest();
    const { rerender } = render({ value: "Banana" });
    await user.tab();

    rerender({ value: null });

    expect(elements.listbox).toHaveAttribute("aria-activedescendant", elements.option("Banana").id);
    expect(screen.queryByRole("option", { selected: true })).toBeNull();
  });

  it("must keep pointing at a rendered option when value changes to one the list does not show", async () => {
    const { render, user } = setUpTest();
    const { rerender } = render({ value: "Apple" });
    await user.tab();
    await user.tab();

    rerender({ value: "Durian" });

    expect(elements.listbox).toHaveAttribute("aria-activedescendant", elements.option("Apple").id);
  });

  it.each([{ strictMode: false }, { strictMode: true }])(
    "must stop pointing at a removed active option and still move when a key is pressed, strictMode $strictMode",
    async ({ strictMode }) => {
      const { render, user } = setUpTest();
      const { rerender } = render({ defaultValue: "Banana", shown: ["Apple", "Banana", "Cherry"], strictMode });
      await user.tab();
      await user.keyboard("{ArrowDown}");

      rerender({ shown: ["Apple", "Banana"] });
      const activeAfterRemoval = elements.listbox.getAttribute("aria-activedescendant");
      await user.keyboard("{ArrowUp}");

      expect(activeAfterRemoval).toBeNull();
      expect(elements.option("Apple")).toHaveAttribute("aria-selected", "true");
    }
  );

  it("must move from the selected option when the active option is removed but the selected one is not", async () => {
    const { render, user } = setUpTest();
    const { rerender } = render({ defaultValue: "Apple", disabledValue: "Apricot" });
    await user.tab();
    await user.keyboard("{ArrowDown}");

    rerender({ shown: ["Apple", "Banana", "Cherry"] });
    const activeAfterRemoval = elements.listbox.getAttribute("aria-activedescendant");
    await user.keyboard("{ArrowDown}");

    expect(activeAfterRemoval).toBeNull();
    expect(elements.option("Banana")).toHaveAttribute("aria-selected", "true");
  });

  it("must stop pointing at an active option when it removes itself without the listbox rendering", async () => {
    const { user } = setUpTest();
    const store = createFruitStore(["Apple", "Banana", "Cherry"]);
    renderBase(
      <Listbox defaultValue="Banana" aria-label="Fruit">
        {["Apple", "Banana", "Cherry"].map((fruit) => (
          <StoredFruitOption fruit={fruit} key={fruit} store={store} />
        ))}
      </Listbox>
    );
    await user.tab();
    await user.keyboard("{ArrowDown}");

    act(() => {
      store.remove("Cherry");
    });
    const activeAfterRemoval = elements.listbox.getAttribute("aria-activedescendant");
    await user.keyboard("{ArrowUp}");

    expect(activeAfterRemoval).toBeNull();
    expect(elements.option("Apple")).toHaveAttribute("aria-selected", "true");
  });

  it("must keep the active option when the list re-renders with it still listed", async () => {
    const { render, user } = setUpTest();
    const { rerender } = render({ defaultValue: "Apple", disabledValue: "Apricot" });
    await user.tab();
    await user.keyboard("{ArrowDown}");

    rerender({ shown: [...fruits] });

    expect(elements.listbox).toHaveAttribute("aria-activedescendant", elements.option("Apricot").id);
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

  it("must transition only colours when an option changes state", () => {
    const properties = transitionedProperties(listboxCss);

    expect(properties.every((property) => property === "background-color" || property === "color")).toBe(true);
    expect(properties).not.toHaveLength(0);
  });

  it("must fill the selected option with Highlight and opt out of forced colours when forced colours are active", () => {
    const forcedColorsBlock = listboxCss.match(/@media \(forced-colors: active\) \{(.*?)\n\}/s)?.[1] ?? "";
    const selectedRule = forcedColorsBlock.match(/\.option\[aria-selected="true"\],[^{]*\{(.*?)\}/s)?.[1] ?? "";
    const declarations = selectedRule.split(";").map((declaration) => declaration.trim());

    expect(declarations).toContain("background-color: Highlight");
    expect(declarations).toContain("color: HighlightText");
    expect(declarations).toContain("forced-color-adjust: none");
  });
});

type FruitListOptions = Omit<FruitListboxProps, "onAction" | "onValueChange">;

interface RenderOptions extends FruitListOptions {
  strictMode?: boolean;
}

function setUpTest() {
  const user = userEvent.setup();
  const onAction = vi.fn();
  const onValueChange = vi.fn();
  const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView");
  onTestFinished(() => {
    scrollIntoView.mockRestore();
  });

  const render = ({ strictMode = false, ...initialOptions }: RenderOptions = {}) => {
    const listboxFor = (options: FruitListOptions): JSX.Element => (
      <FruitListbox {...options} onAction={onAction} onValueChange={onValueChange} />
    );
    const { rerender } = renderBase(listboxFor(initialOptions), { reactStrictMode: strictMode });

    return {
      rerender: (changes: FruitListOptions): void => rerender(listboxFor({ ...initialOptions, ...changes })),
    };
  };

  return { onAction, onValueChange, render, scrollIntoView, user };
}

const elements = {
  get listbox(): HTMLElement {
    return screen.getByRole("listbox", { name: "Fruit" });
  },
  option(name: string): HTMLElement {
    return screen.getByRole("option", { name });
  },
};
