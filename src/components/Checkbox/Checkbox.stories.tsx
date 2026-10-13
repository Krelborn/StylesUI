import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";

import { expectOnSpaceScale, textStart } from "../../test/choiceControl";
import { borderContrast, focusRingContrast } from "../../test/colorContrast";
import { Field } from "../Field";
import { Stack } from "../Stack";
import { Text } from "../Text";

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

const wrappingLabel = "Send me offers from partners we work with, chosen to match my plan";

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
 * Stacked closely, each checkbox's label is a target at least 24px tall, and only as wide as its
 * text
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

    await expect(label.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    await expect(label.getBoundingClientRect().width).toBeCloseTo(
      offers.getBoundingClientRect().width + text.getBoundingClientRect().width,
      0
    );
  },
};

/**
 * The box is `--sui-space-4` square and centred halfway between the capital and the lowercase
 * letters of the first line of its label, and the label text starts `--sui-space-6` from the box in
 * every theme. Text below a checkbox lines up with its label when it is padded by
 * `var(--sui-space-6)`.
 */
export const AlignedText: Story = {
  render: (args) => (
    <Stack gap={2} style={{ maxInlineSize: "18rem" }}>
      <Stack gap={0}>
        <Checkbox {...args} />
        <Text as="p" size="sm" style={{ paddingInlineStart: "var(--sui-space-6)" }} tone="muted">
          New features, about once a month
        </Text>
      </Stack>
      <Checkbox>{wrappingLabel}</Checkbox>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const wrappingText = canvas.getByText(wrappingLabel);

    await expect(wrappingText.getBoundingClientRect().height, "the long label wraps").toBeGreaterThan(
      parseFloat(getComputedStyle(wrappingText).lineHeight)
    );

    for (const name of ["Send me product updates", wrappingLabel]) {
      await expectOnSpaceScale(canvas.getByRole<HTMLInputElement>("checkbox", { name }), canvas.getByText(name));
    }

    await expect(textStart(canvas.getByText("New features, about once a month"))).toBeCloseTo(
      textStart(canvas.getByText("Send me product updates")),
      0
    );
  },
};

/**
 * A checkbox named by `aria-label` alone takes up no more room than its box
 */
export const WithoutText: Story = {
  args: {
    "aria-label": "Select every row",
    children: undefined,
  },
  play: async ({ canvas }) => {
    const checkbox = canvas.getByRole<HTMLInputElement>("checkbox", { name: "Select every row" });
    const [label] = checkbox.labels ?? [];

    await expect(label.getBoundingClientRect().width).toBeCloseTo(checkbox.getBoundingClientRect().width, 0);
  },
};

/**
 * Tab moves focus to the checkbox and shows a focus ring on the box, which stops short of the label
 * text. Space toggles it, and the next Tab skips a disabled checkbox.
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

    const { outlineOffset, outlineWidth } = getComputedStyle(updates);
    const ringEnd = updates.getBoundingClientRect().right + parseFloat(outlineOffset) + parseFloat(outlineWidth);

    await expect(ringEnd, "focus ring end").toBeLessThan(textStart(canvas.getByText("Send me product updates")));

    await userEvent.keyboard(" ");
    await expect(updates).toBeChecked();
    await expect(args.onChange).toHaveBeenCalled();

    await userEvent.keyboard(" ");
    await expect(updates).not.toBeChecked();

    await userEvent.tab();
    await expect(offers).toHaveFocus();
  },
};
