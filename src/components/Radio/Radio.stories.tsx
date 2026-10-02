import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";

import { borderContrast, focusRingContrast } from "../../test/colorContrast";
import { Button } from "../Button";
import { Stack } from "../Stack";

import { Radio } from "./Radio";

const meta = {
  title: "Forms/Radio",
  component: Radio,
  args: {
    children: "Pay monthly",
    onChange: fn(),
    value: "monthly",
  },
  argTypes: {
    children: {
      control: "text",
    },
    defaultChecked: {
      control: "boolean",
      description: "Whether the radio starts selected",
      table: { type: { summary: "boolean" } },
    },
    disabled: {
      control: "boolean",
      description: "Prevents selecting and dims the radio and its label",
      table: { type: { summary: "boolean" } },
    },
    value: {
      control: "text",
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Radio>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The children are the label that names the radio, and clicking the label selects it. An unselected
 * radio has a boundary that stands out from the page, and a selected radio fills with the primary
 * colour and shows a dot.
 */
export const Default: Story = {
  play: async ({ args, canvas }) => {
    const radio = canvas.getByRole("radio", { name: "Pay monthly" });

    await expect(radio).not.toBeChecked();
    await expect(borderContrast(radio)).toBeGreaterThanOrEqual(3);

    await userEvent.click(canvas.getByText("Pay monthly"));
    await expect(radio).toBeChecked();
    await expect(args.onChange).toHaveBeenCalled();
  },
};

/**
 * A disabled radio is dimmed along with its label, skipped by the keyboard and keeps its state
 */
export const Disabled: Story = {
  args: {
    defaultChecked: true,
    disabled: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("radio", { name: "Pay monthly" })).toBeDisabled();
    await expect(Number(getComputedStyle(canvas.getByText("Pay monthly")).opacity)).toBeLessThan(1);
  },
};

/**
 * Radios outside a `RadioGroup` that share a `name` behave as one native group. Tab focuses a radio and
 * shows a focus ring, Space selects it, and the arrow keys move the selection. Once one is selected the
 * group is a single tab stop.
 */
export const KeyboardInteraction: Story = {
  render: (args) => (
    <Stack gap={2}>
      <Radio {...args} name="billing" />
      <Radio name="billing" value="yearly">
        Pay yearly
      </Radio>
      <Button>Continue</Button>
    </Stack>
  ),
  play: async ({ args, canvas }) => {
    const monthly = canvas.getByRole("radio", { name: "Pay monthly" });
    const yearly = canvas.getByRole("radio", { name: "Pay yearly" });
    const continueButton = canvas.getByRole("button", { name: "Continue" });

    await userEvent.tab();
    await expect(monthly).toHaveFocus();
    await expect(monthly.matches(":focus-visible")).toBe(true);
    await expect(parseFloat(getComputedStyle(monthly).outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(focusRingContrast(monthly)).toBeGreaterThanOrEqual(3);
    await expect(borderContrast(monthly)).toBeGreaterThanOrEqual(3);

    await userEvent.keyboard(" ");
    await expect(monthly).toBeChecked();
    await expect(args.onChange).toHaveBeenCalled();

    await userEvent.keyboard("{ArrowDown}");
    await expect(yearly).toHaveFocus();
    await expect(yearly).toBeChecked();
    await expect(monthly).not.toBeChecked();

    await userEvent.tab();
    await expect(continueButton).toHaveFocus();

    await userEvent.tab({ shift: true });
    await expect(yearly).toHaveFocus();
  },
};
