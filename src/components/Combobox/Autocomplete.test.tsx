import { act, fireEvent, render as renderBase, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { JSX } from "react";
import { useState } from "react";
import { describe, expect, it, onTestFinished, vi } from "vitest";

import { Button } from "../Button";
import { Field } from "../Field";

import type { AutocompleteProps } from "./Autocomplete";
import { Autocomplete } from "./Autocomplete";
import { ComboboxOption } from "./ComboboxOption";

const countries = [
  { code: "ci", name: "Côte d’Ivoire" },
  { code: "fr", name: "France" },
  { code: "gf", name: "French Guiana" },
  { code: "jm", name: "Jamaica" },
  { code: "jp", name: "Japan" },
];

type CountryPickerProps = Pick<
  AutocompleteProps,
  "defaultValue" | "filter" | "name" | "onInputValueChange" | "onValueChange" | "resultsLabel" | "value"
> & {
  /**
   * The code of the country whose option is disabled
   */
  disabledCode?: string;

  /**
   * Called when the form is submitted
   */
  onSubmit?: () => void;

  /**
   * Whether the field requires a choice
   */
  required?: boolean;
};

/**
 * A country autocomplete in a field inside a form, followed by a button
 */
function CountryPicker({ disabledCode, onSubmit, required = false, ...props }: CountryPickerProps): JSX.Element {
  return (
    <form
      aria-label="Address"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <Field label="Country" required={required}>
        <Autocomplete {...props}>
          {countries.map((country) => (
            <ComboboxOption disabled={country.code === disabledCode} key={country.code} value={country.code}>
              {country.name}
            </ComboboxOption>
          ))}
        </Autocomplete>
      </Field>
      <Button>After</Button>
    </form>
  );
}

/**
 * An autocomplete whose parent holds the text and renders only the countries starting with it, as a server would
 */
function ServerFilteredPicker({
  defaultValue,
  onInputValueChange,
}: Pick<AutocompleteProps, "defaultValue" | "onInputValueChange">): JSX.Element {
  const [query, setQuery] = useState("");
  const results = countries.filter((country) => country.name.startsWith(query));

  function handleInputValueChange(next: string): void {
    onInputValueChange?.(next);
    setQuery(next);
  }

  return (
    <Field label="Country">
      <Autocomplete
        defaultValue={defaultValue}
        filter={null}
        inputValue={query}
        name="country"
        onInputValueChange={handleInputValueChange}
      >
        {results.map((country) => (
          <ComboboxOption key={country.code} value={country.code}>
            {country.name}
          </ComboboxOption>
        ))}
      </Autocomplete>
    </Field>
  );
}

/**
 * An autocomplete whose parent holds the text and keeps only its first two characters
 */
function TwoCharacterPicker(): JSX.Element {
  const [query, setQuery] = useState("");

  return (
    <Field label="Country">
      <Autocomplete inputValue={query} onInputValueChange={(next) => setQuery(next.slice(0, 2))}>
        {countries.map((country) => (
          <ComboboxOption key={country.code} value={country.code}>
            {country.name}
          </ComboboxOption>
        ))}
      </Autocomplete>
    </Field>
  );
}

describe("Autocomplete", () => {
  it("must render a closed combobox input named by its field when it renders", () => {
    renderBase(<CountryPicker />);

    expect(elements.input).toHaveAttribute("aria-autocomplete", "list");
    expect(elements.input).toHaveAttribute("aria-expanded", "false");
    expect(elements.input).toHaveAttribute("autocomplete", "off");
    expect(elements.input).toHaveAttribute("aria-controls", screen.getByRole("listbox", { hidden: true }).id);
  });

  it("must leave the list closed when focus alone reaches the input", async () => {
    const { user } = setUpTest();
    renderBase(<CountryPicker />);

    await user.tab();

    expect(elements.input).toHaveFocus();
    expect(elements.input).toHaveAttribute("aria-expanded", "false");
  });

  it("must open the list named by the field with no option active when the input is clicked", async () => {
    const { user } = setUpTest();
    renderBase(<CountryPicker />);

    await user.click(elements.input);

    expect(screen.getByRole("listbox", { name: "Country" })).toBeVisible();
    expect(elements.shownOptions).toEqual(countries.map((country) => country.name));
    expect(elements.input).not.toHaveAttribute("aria-activedescendant");
  });

  it("must filter the options and make the first match active when text is typed", async () => {
    const { user } = setUpTest();
    renderBase(<CountryPicker />);

    await user.type(elements.input, "fr");

    expect(elements.shownOptions).toEqual(["France", "French Guiana"]);
    expect(elements.activeOption).toBe(elements.option("France"));
    expect(elements.activeOption).toHaveAttribute("data-active", "keyboard");
  });

  it("must ignore case and accents when it filters by default", async () => {
    const { user } = setUpTest();
    renderBase(<CountryPicker />);

    await user.type(elements.input, "COTE");

    expect(elements.shownOptions).toEqual(["Côte d’Ivoire"]);
  });

  it("must skip a disabled match when it makes the first match active", async () => {
    const { user } = setUpTest();
    renderBase(<CountryPicker disabledCode="fr" />);

    await user.type(elements.input, "fr");

    expect(elements.activeOption).toBe(elements.option("French Guiana"));
  });

  it("must show every option with none active when the text is emptied", async () => {
    const { user } = setUpTest();
    renderBase(<CountryPicker />);
    await user.type(elements.input, "fr");

    await user.clear(elements.input);

    expect(elements.shownOptions).toEqual(countries.map((country) => country.name));
    expect(elements.input).not.toHaveAttribute("aria-activedescendant");
  });

  it("must commit the active option and show its text when Enter is pressed", async () => {
    const { onInputValueChange, onValueChange, user } = setUpTest();
    renderBase(<CountryPicker onInputValueChange={onInputValueChange} onValueChange={onValueChange} />);
    await user.type(elements.input, "fr");

    await user.keyboard("{Enter}");

    expect(onValueChange.mock.calls).toEqual([["fr"]]);
    expect(onInputValueChange.mock.calls.at(-1)).toEqual(["France"]);
    expect(elements.input).toHaveValue("France");
    expect(elements.input).toHaveAttribute("aria-expanded", "false");
    expect(elements.input).toHaveFocus();
  });

  it("must leave Enter to the form when no option is active", async () => {
    const { onSubmit, user } = setUpTest();
    renderBase(<CountryPicker onSubmit={onSubmit} />);
    await user.click(elements.input);

    await user.keyboard("{Enter}");

    expect(onSubmit).toHaveBeenCalled();
  });

  it.each([
    { expected: "Côte d’Ivoire", key: "{ArrowDown}" },
    { expected: "Japan", key: "{ArrowUp}" },
  ])("must open on $expected when $key is pressed on the closed input", async ({ expected, key }) => {
    const { user } = setUpTest();
    renderBase(<CountryPicker />);
    await user.tab();

    await user.keyboard(key);

    expect(elements.activeOption).toBe(elements.option(expected));
  });

  it("must stop at the last option when Down Arrow is pressed past it", async () => {
    const { user } = setUpTest();
    renderBase(<CountryPicker />);
    await user.type(elements.input, "fr");

    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");

    expect(elements.activeOption).toBe(elements.option("French Guiana"));
  });

  it("must move to the last option when Up Arrow is pressed in the open list with none active", async () => {
    const { user } = setUpTest();
    renderBase(<CountryPicker />);
    await user.click(elements.input);

    await user.keyboard("{ArrowUp}");

    expect(elements.activeOption).toBe(elements.option("Japan"));
  });

  it("must open with no option active when Alt+Down Arrow is pressed", async () => {
    const { user } = setUpTest();
    renderBase(<CountryPicker />);
    await user.tab();

    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");

    expect(elements.input).toHaveAttribute("aria-expanded", "true");
    expect(elements.input).not.toHaveAttribute("aria-activedescendant");
  });

  it("must commit the active option when Alt+Up Arrow is pressed", async () => {
    const { onValueChange, user } = setUpTest();
    renderBase(<CountryPicker onValueChange={onValueChange} />);
    await user.type(elements.input, "ja");

    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");

    expect(onValueChange.mock.calls).toEqual([["jm"]]);
    expect(elements.input).toHaveValue("Jamaica");
  });

  it("must close the list and keep the text when Escape is pressed in the open list", async () => {
    const { onValueChange, user } = setUpTest();
    renderBase(<CountryPicker onValueChange={onValueChange} />);
    await user.type(elements.input, "fr");

    await user.keyboard("{Escape}");

    expect(elements.input).toHaveAttribute("aria-expanded", "false");
    expect(elements.input).toHaveValue("fr");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("must clear the text and the selection when Escape is pressed on the closed input", async () => {
    const { onInputValueChange, onValueChange, user } = setUpTest();
    renderBase(
      <CountryPicker defaultValue="jp" onInputValueChange={onInputValueChange} onValueChange={onValueChange} />
    );
    await user.tab();

    await user.keyboard("{Escape}");

    expect(elements.input).toHaveValue("");
    expect(onValueChange.mock.calls).toEqual([[null]]);
    expect(onInputValueChange.mock.calls).toEqual([[""]]);
  });

  it("must leave Escape alone when the closed input is already empty", async () => {
    const { user } = setUpTest();
    renderBase(<CountryPicker />);
    await user.tab();

    const notCancelled = fireEvent.keyDown(elements.input, { key: "Escape" });

    expect(notCancelled).toBe(true);
  });

  it.each(["Home", "End", "ArrowLeft", "ArrowRight"])(
    "must leave %s to the input's caret when it is pressed",
    async (key) => {
      const { user } = setUpTest();
      renderBase(<CountryPicker />);
      await user.type(elements.input, "fr");

      const notCancelled = fireEvent.keyDown(elements.input, { key });

      expect(notCancelled).toBe(true);
      expect(elements.activeOption).toBe(elements.option("France"));
    }
  );

  it("must show the selected option's text when it starts with a selection", () => {
    renderBase(<CountryPicker defaultValue="jp" />);

    expect(elements.input).toHaveValue("Japan");
  });

  it("must close without committing and show the selection's text again when Tab moves on", async () => {
    const { onInputValueChange, onValueChange, user } = setUpTest();
    renderBase(
      <CountryPicker defaultValue="jp" onInputValueChange={onInputValueChange} onValueChange={onValueChange} />
    );
    await user.clear(elements.input);
    await user.type(elements.input, "fr");

    await user.tab();

    expect(elements.input).toHaveValue("Japan");
    expect(elements.input).toHaveAttribute("aria-expanded", "false");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onInputValueChange.mock.calls.at(-1)).toEqual(["Japan"]);
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("must empty the input when focus leaves with no selection", async () => {
    const { user } = setUpTest();
    renderBase(<CountryPicker />);
    await user.type(elements.input, "zz");

    await user.tab();

    expect(elements.input).toHaveValue("");
  });

  it("must commit an option and keep focus in the input when it is clicked", async () => {
    const { onValueChange, user } = setUpTest();
    renderBase(<CountryPicker onValueChange={onValueChange} />);
    await user.click(elements.input);

    await user.click(elements.option("Jamaica"));

    expect(onValueChange.mock.calls).toEqual([["jm"]]);
    expect(elements.input).toHaveValue("Jamaica");
    expect(elements.input).toHaveFocus();
  });

  it("must make the option under the pointer active when the pointer moves over it", async () => {
    const { user } = setUpTest();
    renderBase(<CountryPicker />);
    await user.click(elements.input);

    await user.hover(elements.option("Japan"));

    expect(elements.activeOption).toBe(elements.option("Japan"));
    expect(elements.activeOption).toHaveAttribute("data-active", "pointer");
  });

  it("must filter with the given test when it has a filter", async () => {
    const { user } = setUpTest();
    renderBase(<CountryPicker filter={(textValue, inputValue) => textValue.startsWith(inputValue)} />);

    await user.type(elements.input, "J");

    expect(elements.shownOptions).toEqual(["Jamaica", "Japan"]);
  });

  it("must show the options its parent renders when its filter is null", async () => {
    const { onInputValueChange, user } = setUpTest();
    renderBase(<ServerFilteredPicker onInputValueChange={onInputValueChange} />);

    await user.type(elements.input, "Ja");

    expect(onInputValueChange.mock.calls).toEqual([["J"], ["Ja"]]);
    expect(elements.input).toHaveValue("Ja");
    expect(elements.shownOptions).toEqual(["Jamaica", "Japan"]);
  });

  it("must make no option active while typing when its filter is null", async () => {
    const { user } = setUpTest();
    renderBase(<ServerFilteredPicker />);

    await user.type(elements.input, "J");

    expect(elements.input).not.toHaveAttribute("aria-activedescendant");
  });

  it("must stop naming an option as active when the parent stops rendering it", async () => {
    const { user } = setUpTest();
    renderBase(<ServerFilteredPicker />);
    await user.type(elements.input, "J");
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(elements.activeOption).toBe(elements.option("Japan"));

    await user.type(elements.input, "am");

    expect(elements.shownOptions).toEqual(["Jamaica"]);
    expect(elements.input).not.toHaveAttribute("aria-activedescendant");
  });

  it("must keep the list open and show that nothing matches when no option matches", async () => {
    const { user } = setUpTest();
    renderBase(<CountryPicker />);

    await user.type(elements.input, "zz");

    expect(elements.input).toHaveAttribute("aria-expanded", "true");
    expect(elements.shownOptions).toEqual([]);
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("must announce the number of matches when typing pauses", async () => {
    const { user } = setUpTestWithFakeTimers();
    renderBase(<CountryPicker />);
    await user.type(elements.input, "fr");
    expect(elements.liveRegion).toHaveTextContent("");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(elements.liveRegion).toHaveTextContent("2 results");
  });

  it("must announce in the given words when it has a results label", async () => {
    const { user } = setUpTestWithFakeTimers();
    renderBase(<CountryPicker resultsLabel={(count) => `${count} pays`} />);
    await user.type(elements.input, "j");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(elements.liveRegion).toHaveTextContent("2 pays");
  });

  it("must submit the selected value with its form when it has a name", async () => {
    const { user } = setUpTest();
    renderBase(<CountryPicker name="country" />);
    await user.type(elements.input, "jap");

    await user.keyboard("{Enter}");

    expect(new FormData(elements.form).get("country")).toBe("jp");
  });

  it("must make the input required when its field requires a choice", () => {
    renderBase(<CountryPicker required={true} />);

    expect(elements.input).toBeRequired();
  });

  it.each([
    { key: "Enter", name: "Enter" },
    { key: "ArrowDown", name: "Down Arrow" },
    { key: "Escape", name: "Escape" },
  ])("must leave $name to the input method when it is pressed while composing text", async ({ key }) => {
    const { onValueChange, user } = setUpTest();
    renderBase(<CountryPicker onValueChange={onValueChange} />);
    await user.type(elements.input, "fr");

    const notCancelled = fireEvent.keyDown(elements.input, { isComposing: true, key });

    expect(notCancelled).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(elements.activeOption).toBe(elements.option("France"));
  });

  it("must leave Enter to the input method when Safari sends it after the composition ends", async () => {
    const { onValueChange, user } = setUpTest();
    renderBase(<CountryPicker onValueChange={onValueChange} />);
    await user.type(elements.input, "fr");

    fireEvent.keyDown(elements.input, { key: "Enter", keyCode: 229 });

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("must keep the option a key makes active when the pointer made it active first", async () => {
    const { user } = setUpTest();
    renderBase(<CountryPicker />);
    await user.click(elements.input);
    await user.hover(elements.option("Jamaica"));

    await user.type(elements.input, "J");

    expect(elements.activeOption).toBe(elements.option("Jamaica"));
    expect(elements.activeOption).toHaveAttribute("data-active", "keyboard");
  });

  it("must not announce a count when the choice is made before typing pauses", async () => {
    const { user } = setUpTestWithFakeTimers();
    renderBase(<CountryPicker />);
    await user.type(elements.input, "jap");
    await user.keyboard("{Enter}");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(elements.liveRegion).toHaveTextContent("");
  });

  it("must show the selection's text again when focus leaves after its option stopped rendering", async () => {
    const { user } = setUpTest();
    renderBase(<ServerFilteredPicker defaultValue="fr" />);
    await user.type(elements.input, "Ja");

    await user.tab();

    expect(elements.input).toHaveValue("France");
  });

  it("must filter by the text its parent holds when the parent changes what was typed", async () => {
    const { user } = setUpTest();
    renderBase(<TwoCharacterPicker />);

    await user.type(elements.input, "Jam");

    expect(elements.input).toHaveValue("Ja");
    expect(elements.shownOptions).toEqual(["Jamaica", "Japan"]);
  });

  it("must make the first match for its parent's text active when the parent changes what was typed", async () => {
    const { user } = setUpTest();
    renderBase(<TwoCharacterPicker />);

    await user.type(elements.input, "Jax");

    expect(elements.input).toHaveValue("Ja");
    expect(elements.activeOption).toBe(elements.option("Jamaica"));
  });

  it("must read its options' labels in their own shadow root when it renders inside one", () => {
    const host = document.createElement("div");
    const container = document.createElement("div");
    document.body.append(host);
    host.attachShadow({ mode: "open" }).append(container);
    onTestFinished(() => {
      host.remove();
    });
    renderBase(<CountryPicker />, { container });
    const shadow = within(container);

    // user-event cannot focus an element in a shadow root
    fireEvent.change(shadow.getByRole("combobox", { name: "Country" }), { target: { value: "fr" } });

    expect(shadow.getAllByRole("option").map((option) => option.textContent)).toEqual(["France", "French Guiana"]);
  });

  it("must stop naming an option as active when a new filter from the parent hides it", async () => {
    const { render, user } = setUpTest();
    const { rerender } = render(<CountryPicker />);
    await user.type(elements.input, "an");
    expect(elements.activeOption).toBe(elements.option("France"));

    rerender(<CountryPicker filter={(textValue, inputValue) => textValue.startsWith(inputValue)} />);

    expect(elements.input).not.toHaveAttribute("aria-activedescendant");
  });

  it("must not submit its form when Enter is pressed on text that matches no option", async () => {
    const { onSubmit, user } = setUpTest();
    renderBase(<CountryPicker onSubmit={onSubmit} required={true} />);
    await user.type(elements.input, "zzz");

    await user.keyboard("{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("must not open or commit when it is read-only", async () => {
    const { onValueChange, user } = setUpTest();
    renderBase(
      <Field label="Country">
        <Autocomplete defaultValue="jp" onValueChange={onValueChange} readOnly={true}>
          <ComboboxOption value="jp">Japan</ComboboxOption>
          <ComboboxOption value="fr">France</ComboboxOption>
        </Autocomplete>
      </Field>
    );

    await user.click(elements.input);
    await user.keyboard("{ArrowDown}{Enter}{Escape}");

    expect(elements.input).toHaveAttribute("aria-expanded", "false");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(elements.input).toHaveValue("Japan");
  });

  it("must keep the typed text when focus leaves because the window lost it", async () => {
    const { hasFocus, user } = setUpTest();
    renderBase(<CountryPicker defaultValue="jp" />);
    await user.clear(elements.input);
    await user.type(elements.input, "fr");
    hasFocus.mockReturnValue(false);

    await user.tab();

    expect(elements.input).toHaveValue("fr");
  });

  it("must submit its value with the form its form attribute names when it has one", () => {
    renderBase(
      <>
        <form aria-label="Elsewhere" id="elsewhere" />
        <Autocomplete aria-label="Country" defaultValue="jp" form="elsewhere" name="country">
          <ComboboxOption value="jp">Japan</ComboboxOption>
        </Autocomplete>
      </>
    );

    expect(new FormData(screen.getByRole("form", { name: "Elsewhere" }) as HTMLFormElement).get("country")).toBe("jp");
  });

  it("must reject the props the combobox pattern sets when they are given", () => {
    renderBase(
      <>
        {/* @ts-expect-error the combobox pattern sets the role */}
        <Autocomplete aria-label="Country" role="searchbox" />
        {/* @ts-expect-error the input always takes text */}
        <Autocomplete aria-label="Country" type="email" />
        {/* @ts-expect-error the selection is a string or null */}
        <Autocomplete aria-label="Country" value={1} />
      </>
    );
  });
});

function setUpTest() {
  const user = userEvent.setup();
  const onInputValueChange = vi.fn();
  const onSubmit = vi.fn();
  const onValueChange = vi.fn();
  // jsdom's document never has focus, which reads as the window losing it
  const hasFocus = vi.spyOn(document, "hasFocus").mockReturnValue(true);
  onTestFinished(() => {
    hasFocus.mockRestore();
  });

  const render = (ui: JSX.Element) => {
    const { rerender } = renderBase(ui);

    return { rerender };
  };

  return { hasFocus, onInputValueChange, onSubmit, onValueChange, render, user };
}

function setUpTestWithFakeTimers() {
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.useRealTimers();
  });

  return { ...setUpTest(), user: userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) }) };
}

const elements = {
  get activeOption(): HTMLElement | null {
    const id = elements.input.getAttribute("aria-activedescendant");

    return id === null ? null : document.getElementById(id);
  },
  get form(): HTMLFormElement {
    return screen.getByRole("form", { name: "Address" }) as HTMLFormElement;
  },
  get input(): HTMLElement {
    return screen.getByRole("combobox", { name: "Country" });
  },
  get liveRegion(): HTMLElement {
    return screen.getByText((_content, element) => element?.getAttribute("aria-live") === "polite");
  },
  option(name: string): HTMLElement {
    return screen.getByRole("option", { name });
  },
  get shownOptions(): string[] {
    return screen.queryAllByRole("option").map((option) => option.textContent ?? "");
  },
};
