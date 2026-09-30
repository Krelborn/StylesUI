import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";

import { borderContrast } from "../../test/colorContrast";

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
