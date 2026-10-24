import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties, JSX } from "react";
import { useEffect, useState } from "react";
import { expect, userEvent, waitFor } from "storybook/test";

import { focusRingContrast } from "../../test/colorContrast";
import { trustedInput } from "../../test/trustedInput";
import { Button } from "../Button";
import { Field } from "../Field";
import { Row } from "../Row";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { TextInput } from "../TextInput";

import { Autocomplete } from "./Autocomplete";
import { ComboboxOption } from "./ComboboxOption";

const countries = [
  { code: "ar", name: "Argentina" },
  { code: "au", name: "Australia" },
  { code: "br", name: "Brazil" },
  { code: "ca", name: "Canada" },
  { code: "ci", name: "Côte d’Ivoire" },
  { code: "fr", name: "France" },
  { code: "gf", name: "French Guiana" },
  { code: "de", name: "Germany" },
  { code: "is", name: "Iceland" },
  { code: "in", name: "India" },
  { code: "jm", name: "Jamaica" },
  { code: "jp", name: "Japan" },
  { code: "ke", name: "Kenya" },
  { code: "mx", name: "Mexico" },
  { code: "nz", name: "New Zealand" },
  { code: "no", name: "Norway" },
  { code: "pe", name: "Peru" },
  { code: "za", name: "South Africa" },
  { code: "es", name: "Spain" },
  { code: "vn", name: "Viet Nam" },
];

const sizes = ["sm", "md", "lg"] as const;

interface AddressFormProps {
  /**
   * The writing direction around the form
   */
  dir?: "ltr" | "rtl";

  /**
   * Styles for the form's frame, such as a width
   */
  style?: CSSProperties;
}

/**
 * An address form's country autocomplete in a field, between two buttons so Tab has somewhere to go on either side,
 * with the value it holds shown below
 */
function AddressForm({ dir, style }: AddressFormProps): JSX.Element {
  const [country, setCountry] = useState<string | null>(null);

  return (
    <Stack dir={dir} gap={3} style={{ maxInlineSize: "24rem", minBlockSize: "24rem", ...style }} data-testid="form">
      <Button variant="secondary">Back</Button>
      <Field description="Type to search" label="Country">
        <Autocomplete name="country" onValueChange={setCountry} value={country}>
          {countries.map((option) => (
            <ComboboxOption key={option.code} value={option.code}>
              {option.name}
            </ComboboxOption>
          ))}
        </Autocomplete>
      </Field>
      <Button variant="secondary">Save</Button>
      <Text>{`Country: ${country ?? "none"}`}</Text>
    </Stack>
  );
}

/**
 * An autocomplete whose options come from a search that answers 300ms after each change to the text, as a server does
 */
function ServerSearch(): JSX.Element {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(countries);
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    const search = setTimeout(() => {
      setResults(countries.filter((option) => option.name.toLowerCase().startsWith(query.toLowerCase())));
    }, 300);

    return () => {
      clearTimeout(search);
    };
  }, [query]);

  return (
    <Stack gap={3} style={{ maxInlineSize: "24rem", minBlockSize: "24rem" }}>
      <Field description="Searches as you type" label="Country">
        <Autocomplete filter={null} inputValue={query} onInputValueChange={setQuery} onValueChange={setCountry}>
          {results.map((option) => (
            <ComboboxOption key={option.code} value={option.code}>
              {option.name}
            </ComboboxOption>
          ))}
        </Autocomplete>
      </Field>
      <Text>{`Country: ${country ?? "none"}`}</Text>
    </Stack>
  );
}

const meta = {
  title: "Forms/Autocomplete",
  component: Autocomplete,
  subcomponents: { ComboboxOption },
  parameters: {
    a11y: { test: "error" },
  },
  render: () => <AddressForm />,
} satisfies Meta<typeof Autocomplete>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A country autocomplete. Typing filters the list, ignoring case and accents, and makes the first match active, and
 * clicking a country chooses it and puts its name in the input.
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole("combobox", { name: "Country" });

    await userEvent.type(input, "cote");

    const listbox = canvas.getByRole("listbox", { name: "Country" });
    await waitFor(() => expect(listbox).toBeVisible());
    await expect(canvas.getAllByRole("option").map((option) => option.textContent)).toEqual(["Côte d’Ivoire"]);
    // An option the filter hides has no name to find it by, and toBeVisible() takes its hidden attribute for its look
    await expect(canvas.getByText("France").closest('[role="option"]')?.getClientRects()).toHaveLength(0);

    await userEvent.click(canvas.getByRole("option", { name: "Côte d’Ivoire" }));

    await waitFor(() => expect(listbox).not.toBeVisible());
    await expect(input).toHaveValue("Côte d’Ivoire");
    await expect(canvas.getByText("Country: ci")).toBeInTheDocument();
  },
};

/**
 * The three sizes, each beside a `TextInput` of the same size, which it matches in height
 */
export const Sizes: Story = {
  render: () => (
    <Stack gap={3}>
      {sizes.map((size) => (
        <Row align="center" gap={2} key={size}>
          <Autocomplete aria-label={`Country, ${size}`} size={size}>
            {countries.map((option) => (
              <ComboboxOption key={option.code} value={option.code}>
                {option.name}
              </ComboboxOption>
            ))}
          </Autocomplete>
          <TextInput aria-label={`Note, ${size}`} size={size} />
        </Row>
      ))}
    </Stack>
  ),
  play: async ({ canvas }) => {
    for (const size of sizes) {
      const autocomplete = canvas.getByRole("combobox", { name: `Country, ${size}` });
      const textInput = canvas.getByRole("textbox", { name: `Note, ${size}` });

      await expect(autocomplete.getBoundingClientRect().height, size).toBeCloseTo(
        textInput.getBoundingClientRect().height,
        0
      );
    }
  },
};

/**
 * A list filtered by a search the consumer runs, with `filter={null}`: the options are whatever the search returns
 */
export const ServerFiltered: Story = {
  render: () => <ServerSearch />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole("combobox", { name: "Country" });

    await userEvent.type(input, "ja");

    await waitFor(() =>
      expect(canvas.getAllByRole("option").map((option) => option.textContent)).toEqual(["Jamaica", "Japan"])
    );
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    await expect(input).toHaveValue("Japan");
    await expect(canvas.getByText("Country: jp")).toBeInTheDocument();
  },
};

/**
 * Tab reaches the input without opening the list. Typing opens it and makes the first match active, drawing a ring
 * at 3:1 while focus stays in the input; the arrow keys move, Enter chooses and puts the name in the input. With no
 * match the list says so. Escape closes the list, and pressed again clears the input and the choice, and Tab leaves.
 */
export const KeyboardInteraction: Story = {
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const combobox = canvas.getByRole("combobox", { name: "Country" });
    const listbox = canvas.getByRole("listbox", { hidden: true, name: "Country" });
    const active = (): HTMLElement | null =>
      document.getElementById(combobox.getAttribute("aria-activedescendant") ?? "");
    const option = (name: string): HTMLElement => canvas.getByRole("option", { hidden: true, name });

    canvas.getByRole("button", { name: "Back" }).focus();
    await input.pressKey("Tab");
    await expect(combobox).toHaveFocus();
    await expect(listbox).not.toBeVisible();
    await expect(focusRingContrast(combobox)).toBeGreaterThanOrEqual(3);

    await input.pressKey("j");
    await input.pressKey("a");
    await waitFor(() => expect(listbox).toBeVisible());
    await expect(active()).toBe(option("Jamaica"));
    await expect(canvas.getByText("No results", { selector: "div" })).not.toBeVisible();
    await expect(focusRingContrast(option("Jamaica"))).toBeGreaterThanOrEqual(3);
    await expect(combobox).toHaveFocus();

    await input.pressKey("ArrowDown");
    await expect(active()).toBe(option("Japan"));
    await input.pressKey("Enter");
    await waitFor(() => expect(listbox).not.toBeVisible());
    await expect(combobox).toHaveValue("Japan");
    await expect(canvas.getByText("Country: jp")).toBeInTheDocument();

    await input.pressKey("Escape");
    await expect(combobox).toHaveValue("");
    await expect(canvas.getByText("Country: none")).toBeInTheDocument();

    await input.pressKey("z");
    await input.pressKey("z");
    await waitFor(() => expect(canvas.getByText("No results", { selector: "div" })).toBeVisible());
    await expect(combobox).toHaveAttribute("aria-expanded", "true");
    await input.pressKey("Escape");
    await waitFor(() => expect(listbox).not.toBeVisible());
    await expect(combobox).toHaveValue("zz");

    await input.pressKey("Tab");
    await expect(combobox).toHaveValue("");
    await expect(canvas.getByRole("button", { name: "Save" })).toHaveFocus();
  },
};

/**
 * A click in the input opens the list, a click on a country chooses it, and a click outside closes the list without
 * choosing, putting the chosen name back in the input
 */
export const PointerInteraction: Story = {
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const combobox = canvas.getByRole("combobox", { name: "Country" });
    const listbox = canvas.getByRole("listbox", { hidden: true, name: "Country" });
    combobox.dataset.testid = "country";
    canvas.getByRole("option", { hidden: true, name: "Canada" }).dataset.testid = "canada";

    await input.clickByTestId("country");
    await waitFor(() => expect(listbox).toBeVisible());
    await input.clickByTestId("canada");
    await waitFor(() => expect(listbox).not.toBeVisible());
    await expect(combobox).toHaveValue("Canada");
    await expect(combobox).toHaveFocus();

    await userEvent.type(combobox, "x");
    await waitFor(() => expect(listbox).toBeVisible());
    await input.clickPageCorner();
    await waitFor(() => expect(listbox).not.toBeVisible());
    await expect(combobox).toHaveValue("Canada");
  },
};

/**
 * In right-to-left text the chevron sits at the input's left end, where the text ends
 */
export const RightToLeft: Story = {
  render: () => <AddressForm dir="rtl" />,
  play: async ({ canvas }) => {
    const combobox = canvas.getByRole("combobox", { name: "Country" });
    const field = combobox.getBoundingClientRect();
    const chevron = combobox.parentElement?.querySelector("svg")?.getBoundingClientRect();

    await expect(chevron?.left).toBeLessThan(field.left + field.width / 2);
  },
};

/**
 * In a 320px frame the list is at least as wide as the input and fits the window
 */
export const Narrow: Story = {
  render: () => <AddressForm style={{ inlineSize: "20rem" }} />,
  play: async ({ canvas }) => {
    const combobox = canvas.getByRole("combobox", { name: "Country" });

    await expect(canvas.getByTestId("form").getBoundingClientRect().width).toBeCloseTo(320, 0);
    await userEvent.click(combobox);

    const listbox = canvas.getByRole("listbox", { name: "Country" });
    await waitFor(() => expect(listbox).toBeVisible());

    const list = listbox.parentElement?.getBoundingClientRect();
    await expect(list?.width).toBeGreaterThanOrEqual(combobox.getBoundingClientRect().width);
    await expect(list?.left).toBeGreaterThanOrEqual(0);
    await expect(list?.right).toBeLessThanOrEqual(window.innerWidth);
  },
};
