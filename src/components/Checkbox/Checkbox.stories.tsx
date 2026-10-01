import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";

import { borderContrast, focusRingContrast } from "../../test/colorContrast";
import { Field } from "../Field";
import { Stack } from "../Stack";

import { Checkbox } from "./Checkbox";

const meta = {
  title: "Forms/Checkbox",
  component: Checkbox,
  args: {
    children: "Send me product updates",
    onChange: fn(),
  },
  argTypes: {
    children: {
      control: "text",
    },
    defaultChecked: {
      control: "boolean",
      description: "Whether the checkbox starts checked",
      table: { type: { summary: "boolean" } },
    },
    disabled: {
      control: "boolean",
      description: "Prevents toggling and dims the checkbox and its label",
      table: { type: { summary: "boolean" } },
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The children are the label that names the checkbox, and clicking the label toggles it
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const checkbox = canvas.getByRole("checkbox", { name: "Send me product updates" });
    const label = canvas.getByText("Send me product updates");

    await userEvent.click(label);
    await expect(checkbox).toBeChecked();

    await userEvent.click(label);
    await expect(checkbox).not.toBeChecked();
  },
};

/**
 * A checked checkbox fills with the primary colour and shows a check mark
 */
export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("checkbox", { name: "Send me product updates" })).toBeChecked();
  },
};

/**
 * A disabled checkbox is dimmed along with its label, skipped by the keyboard and keeps its state
 */
export const Disabled: Story = {
  args: {
    defaultChecked: true,
    disabled: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("checkbox", { name: "Send me product updates" })).toBeDisabled();
    await expect(Number(getComputedStyle(canvas.getByText("Send me product updates")).opacity)).toBeLessThan(1);
  },
};

/**
 * A `Field` with no `label` leaves the checkbox to name itself and gives it the rest: `error` marks
 * it `aria-invalid`, which draws its border in the danger colour, and `required` adds an asterisk
 * to the checkbox's own label
 */
export const InAField: Story = {
  args: {
    children: "I accept the terms of service",
  },
  render: (args) => (
    <Field error="Accept the terms of service to continue" required={true}>
      <Checkbox {...args} />
    </Field>
  ),
  play: async ({ canvas }) => {
    const checkbox = canvas.getByRole("checkbox", { name: "I accept the terms of service" });

    await expect(checkbox).toBeInvalid();
    await expect(checkbox).toBeRequired();
    await expect(checkbox).toHaveAccessibleDescription("Accept the terms of service to continue");
    await expect(borderContrast(checkbox)).toBeGreaterThanOrEqual(3);
  },
};

/**
 * Checkboxes stacked closely each keep a target of at least 24px, and each label is only as wide
 * as its text
 */
export const Stacked: Story = {
  render: (args) => (
    <Stack gap={1}>
      <Checkbox {...args} />
      <Checkbox defaultChecked={true}>Send me security alerts</Checkbox>
      <Checkbox>Send me partner offers</Checkbox>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const offers = canvas.getByRole<HTMLInputElement>("checkbox", { name: "Send me partner offers" });
    const text = canvas.getByText("Send me partner offers");
    const [label] = offers.labels ?? [];

    await expect(label.getBoundingClientRect().width).toBeCloseTo(
      offers.getBoundingClientRect().width + text.getBoundingClientRect().width,
      0
    );
  },
};

/**
 * Tab moves focus to the checkbox and shows a focus ring on the box, Space toggles it, and the next
 * Tab skips a disabled checkbox
 */
export const KeyboardInteraction: Story = {
  render: (args) => (
    <Stack gap={2}>
      <Checkbox {...args} />
      <Checkbox disabled={true}>Send me security alerts</Checkbox>
      <Checkbox>Send me partner offers</Checkbox>
    </Stack>
  ),
  play: async ({ args, canvas }) => {
    const updates = canvas.getByRole("checkbox", { name: "Send me product updates" });
    const offers = canvas.getByRole("checkbox", { name: "Send me partner offers" });

    await userEvent.tab();
    await expect(updates).toHaveFocus();
    await expect(updates.matches(":focus-visible")).toBe(true);
    await expect(parseFloat(getComputedStyle(updates).outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(focusRingContrast(updates)).toBeGreaterThanOrEqual(3);
    await expect(borderContrast(updates)).toBeGreaterThanOrEqual(3);

    await userEvent.keyboard(" ");
    await expect(updates).toBeChecked();
    await expect(args.onChange).toHaveBeenCalled();

    await userEvent.keyboard(" ");
    await expect(updates).not.toBeChecked();

    await userEvent.tab();
    await expect(offers).toHaveFocus();
  },
};
