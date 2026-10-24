import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties, JSX } from "react";
import { useState } from "react";
import { expect, userEvent, waitFor } from "storybook/test";

import { focusRingContrast, isSameColor, textContrast } from "../../test/colorContrast";
import { trustedInput } from "../../test/trustedInput";
import { Avatar } from "../Avatar";
import { Button } from "../Button";
import { Field } from "../Field";
import { Row } from "../Row";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { TextInput } from "../TextInput";

import { Combobox } from "./Combobox";
import { ComboboxOption } from "./ComboboxOption";

const people = [
  { id: "ada", name: "Ada Lovelace", team: "Mathematics" },
  { id: "alan", name: "Alan Turing", team: "Computing" },
  { id: "grace", name: "Grace Hopper", team: "Navy" },
  { id: "katherine", name: "Katherine Johnson", team: "Spaceflight" },
  { id: "margaret", name: "Margaret Hamilton", team: "Apollo" },
];

const sizes = ["sm", "md", "lg"] as const;

interface AssigneeFormProps {
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
 * A task's assignee picker in a field, between two buttons so Tab has somewhere to go on either side, with the value it
 * holds shown below
 */
function AssigneeForm({ dir, style }: AssigneeFormProps): JSX.Element {
  const [assignee, setAssignee] = useState<string | null>("alan");

  return (
    <Stack dir={dir} gap={3} style={{ maxInlineSize: "24rem", minBlockSize: "22rem", ...style }} data-testid="form">
      <Button variant="secondary">Back</Button>
      <Field description="Who works on the task" label="Assignee">
        <Combobox onValueChange={setAssignee} placeholder="Unassigned" value={assignee}>
          {people.map((person) => (
            <ComboboxOption
              description={person.team}
              disabled={person.id === "margaret"}
              key={person.id}
              leading={<Avatar name={person.name} size="sm" />}
              value={person.id}
            >
              {person.name}
            </ComboboxOption>
          ))}
        </Combobox>
      </Field>
      <Button variant="secondary">Save</Button>
      <Text>{`Assignee: ${assignee ?? "none"}`}</Text>
    </Stack>
  );
}

const meta = {
  title: "Forms/Combobox",
  component: Combobox,
  subcomponents: { ComboboxOption },
  parameters: {
    a11y: { test: "error" },
  },
  render: () => <AssigneeForm />,
} satisfies Meta<typeof Combobox>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * An assignee picker whose options show an avatar and a team. The field shows the selected person; clicking it opens
 * the list on them, and clicking another person chooses them and closes the list, with focus left on the field.
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const combobox = canvas.getByRole("combobox", { name: "Assignee" });

    await expect(combobox).toHaveTextContent("Alan Turing");
    await userEvent.click(combobox);

    const listbox = await canvas.findByRole("listbox", { name: "Assignee" });
    await waitFor(() => expect(listbox).toBeVisible());
    await expect(combobox).toHaveFocus();

    await userEvent.click(canvas.getByRole("option", { name: "Grace Hopper" }));

    await waitFor(() => expect(listbox).not.toBeVisible());
    await expect(combobox).toHaveTextContent("Grace Hopper");
    await expect(canvas.getByText("Assignee: grace")).toBeInTheDocument();
    await expect(combobox).toHaveFocus();
  },
};

/**
 * The three sizes, each beside a `TextInput` of the same size, which it matches in height even with an avatar in it
 */
export const Sizes: Story = {
  render: () => (
    <Stack gap={3}>
      {sizes.map((size) => (
        <Row align="center" gap={2} key={size}>
          <Combobox aria-label={`Assignee, ${size}`} defaultValue="ada" size={size}>
            {people.map((person) => (
              <ComboboxOption key={person.id} leading={<Avatar name={person.name} size="sm" />} value={person.id}>
                {person.name}
              </ComboboxOption>
            ))}
          </Combobox>
          <TextInput aria-label={`Note, ${size}`} size={size} />
        </Row>
      ))}
    </Stack>
  ),
  play: async ({ canvas }) => {
    for (const size of sizes) {
      const combobox = canvas.getByRole("combobox", { name: `Assignee, ${size}` });
      const textInput = canvas.getByRole("textbox", { name: `Note, ${size}` });

      await expect(combobox.getBoundingClientRect().height, size).toBeCloseTo(
        textInput.getBoundingClientRect().height,
        0
      );
    }
  },
};

/**
 * Tab reaches the field, showing its ring at 3:1. Down Arrow opens the list on the selected person, with focus left on
 * the field and the active option drawing a ring of its own. The arrow keys, Home, End and type-ahead move through
 * the list, reaching the disabled person too; Enter chooses, Escape closes without choosing, and Tab leaves.
 */
export const KeyboardInteraction: Story = {
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const combobox = canvas.getByRole("combobox", { name: "Assignee" });
    const listbox = canvas.getByRole("listbox", { hidden: true, name: "Assignee" });
    const active = (): HTMLElement | null =>
      document.getElementById(combobox.getAttribute("aria-activedescendant") ?? "");
    const option = (name: string): HTMLElement => canvas.getByRole("option", { hidden: true, name });

    canvas.getByRole("button", { name: "Back" }).focus();
    await input.pressKey("Tab");
    await expect(combobox).toHaveFocus();
    await expect(combobox.matches(":focus-visible")).toBe(true);
    await expect(focusRingContrast(combobox)).toBeGreaterThanOrEqual(3);

    await input.pressKey("ArrowDown");
    await waitFor(() => expect(listbox).toBeVisible());
    await expect(combobox).toHaveFocus();
    await expect(active()).toBe(option("Alan Turing"));
    await expect(focusRingContrast(option("Alan Turing"))).toBeGreaterThanOrEqual(3);

    await input.pressKey("ArrowDown");
    await expect(active()).toBe(option("Grace Hopper"));
    await input.pressKey("End");
    await expect(active()).toBe(option("Margaret Hamilton"));
    await input.pressKey("Home");
    await expect(active()).toBe(option("Ada Lovelace"));
    await input.pressKey("k");
    await expect(active()).toBe(option("Katherine Johnson"));

    await input.pressKey("Enter");
    await waitFor(() => expect(listbox).not.toBeVisible());
    await expect(combobox).toHaveTextContent("Katherine Johnson");
    await expect(combobox).toHaveFocus();

    await input.pressKey("ArrowUp");
    await waitFor(() => expect(listbox).toBeVisible());
    await input.pressKey("ArrowUp");
    await input.pressKey("Escape");
    await waitFor(() => expect(listbox).not.toBeVisible());
    await expect(combobox).toHaveTextContent("Katherine Johnson");

    await input.pressKey("Space");
    await waitFor(() => expect(listbox).toBeVisible());
    await input.pressKey("ArrowDown");
    await input.pressKey("Tab");
    await waitFor(() => expect(listbox).not.toBeVisible());
    await expect(combobox).toHaveTextContent("Katherine Johnson");
    await expect(canvas.getByRole("button", { name: "Save" })).toHaveFocus();
  },
};

/**
 * A click opens the list. The pointer moves the active option without a ring, a click on an option chooses it, and a
 * click outside closes the list without choosing.
 */
export const PointerInteraction: Story = {
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const combobox = canvas.getByRole("combobox", { name: "Assignee" });
    const listbox = canvas.getByRole("listbox", { hidden: true, name: "Assignee" });
    const option = (name: string): HTMLElement => canvas.getByRole("option", { hidden: true, name });

    combobox.dataset.testid = "assignee";
    option("Ada Lovelace").dataset.testid = "ada";
    option("Grace Hopper").dataset.testid = "grace";

    await input.clickByTestId("assignee");
    await waitFor(() => expect(listbox).toBeVisible());

    await input.hoverByTestId("grace");
    await expect(combobox).toHaveAttribute("aria-activedescendant", option("Grace Hopper").id);
    await expect(getComputedStyle(option("Grace Hopper")).outlineStyle).toBe("none");

    await input.clickByTestId("grace");
    await waitFor(() => expect(listbox).not.toBeVisible());
    await expect(combobox).toHaveTextContent("Grace Hopper");
    await expect(combobox).toHaveFocus();

    await input.clickByTestId("assignee");
    await waitFor(() => expect(listbox).toBeVisible());
    await input.hoverByTestId("ada");
    await input.clickPageCorner();
    await waitFor(() => expect(listbox).not.toBeVisible());
    await expect(combobox).toHaveTextContent("Grace Hopper");
  },
};

/**
 * In right-to-left text the chevron sits at the field's left end and the list lines up with the field's right edge
 */
export const RightToLeft: Story = {
  render: () => <AssigneeForm dir="rtl" />,
  play: async ({ canvas }) => {
    const combobox = canvas.getByRole("combobox", { name: "Assignee" });

    await userEvent.click(combobox);

    const listbox = canvas.getByRole("listbox", { name: "Assignee" });
    await waitFor(() => expect(listbox).toBeVisible());

    const field = combobox.getBoundingClientRect();
    const chevron = combobox.querySelector("svg")?.getBoundingClientRect();
    await expect(chevron?.left).toBeLessThan(field.left + field.width / 2);
    await expect(listbox.parentElement?.getBoundingClientRect().right).toBeCloseTo(field.right, 0);
  },
};

/**
 * In a 320px frame the list is at least as wide as the field and fits the window
 */
export const Narrow: Story = {
  render: () => <AssigneeForm style={{ inlineSize: "20rem" }} />,
  play: async ({ canvas }) => {
    const combobox = canvas.getByRole("combobox", { name: "Assignee" });

    await expect(canvas.getByTestId("form").getBoundingClientRect().width).toBeCloseTo(320, 0);
    await userEvent.click(combobox);

    const listbox = canvas.getByRole("listbox", { name: "Assignee" });
    await waitFor(() => expect(listbox).toBeVisible());

    const list = listbox.parentElement?.getBoundingClientRect();
    await expect(list?.width).toBeGreaterThanOrEqual(combobox.getBoundingClientRect().width);
    await expect(list?.left).toBeGreaterThanOrEqual(0);
    await expect(list?.right).toBeLessThanOrEqual(window.innerWidth);
  },
};

/**
 * The option under the pointer takes the menu's highlight, and its label and description keep 4.5:1 on it
 */
export const HoverContrast: Story = {
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const combobox = canvas.getByRole("combobox", { name: "Assignee" });
    await userEvent.click(combobox);

    const grace = canvas.getByRole("option", { name: "Grace Hopper" });
    await waitFor(() => expect(grace).toBeVisible());
    grace.dataset.testid = "grace";

    await input.hoverByTestId("grace");
    await expect(combobox).toHaveAttribute("aria-activedescendant", grace.id);
    await Promise.all(grace.getAnimations().map((transition) => transition.finished));

    await expect(
      textContrast(canvas.getByText("Grace Hopper", { selector: '[role="option"] *' }))
    ).toBeGreaterThanOrEqual(4.5);
    await expect(textContrast(canvas.getByText("Navy"))).toBeGreaterThanOrEqual(4.5);
  },
};

/**
 * Under forced colours, as Windows High Contrast applies them, the active option is `Highlight` with `HighlightText`
 */
export const ForcedColors: Story = {
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const combobox = canvas.getByRole("combobox", { name: "Assignee" });
    combobox.focus();
    await userEvent.keyboard("{ArrowDown}");

    const alan = canvas.getByRole("option", { name: "Alan Turing" });
    await waitFor(() => expect(alan).toBeVisible());

    await input.emulateForcedColors(true);

    try {
      await Promise.all(alan.getAnimations().map((transition) => transition.finished));

      await expect(isSameColor(alan, getComputedStyle(alan).backgroundColor, "Highlight")).toBe(true);
      await expect(isSameColor(alan, getComputedStyle(alan).color, "HighlightText")).toBe(true);
    } finally {
      await input.emulateForcedColors(false);
    }
  },
};
