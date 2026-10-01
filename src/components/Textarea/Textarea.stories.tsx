import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";

import { borderContrast, focusRingContrast } from "../../test/colorContrast";
import { Field } from "../Field";
import { Stack } from "../Stack";

import { Textarea } from "./Textarea";

const meta = {
  title: "Forms/Textarea",
  component: Textarea,
  args: {
    onChange: fn(),
  },
  argTypes: {
    disabled: {
      control: "boolean",
      description: "Prevents typing and dims the textarea",
      table: { type: { summary: "boolean" } },
    },
    placeholder: {
      control: "text",
      description: "Hint shown in the muted text colour while the textarea is empty",
      table: { type: { summary: "string" } },
    },
    rows: {
      control: "number",
      description: "Number of text lines the textarea is tall",
      table: { type: { summary: "number" } },
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: (args) => (
    <Field label="Message" style={{ maxWidth: "24rem" }}>
      <Textarea {...args} />
    </Field>
  ),
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A textarea labelled by the `Field` around it. Drag its corner to make it taller.
 */
export const Default: Story = {
  args: {
    placeholder: "What would you like to tell us?",
    rows: 4,
  },
};

/**
 * `size` scales padding and font size in step with the other form controls. `rows` sets the height.
 */
export const Sizes: Story = {
  render: () => (
    <Stack style={{ maxWidth: "24rem" }}>
      <Textarea placeholder="Small" size="sm" aria-label="Small" />
      <Textarea placeholder="Medium" size="md" aria-label="Medium" />
      <Textarea placeholder="Large" size="lg" aria-label="Large" />
    </Stack>
  ),
};

/**
 * An error on the `Field` marks the textarea `aria-invalid`, which draws its border in the danger
 * colour
 */
export const Invalid: Story = {
  args: {
    defaultValue: "Hi",
    rows: 4,
  },
  render: (args) => (
    <Field error="Enter at least 20 characters" label="Message" style={{ maxWidth: "24rem" }}>
      <Textarea {...args} />
    </Field>
  ),
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole("textbox", { name: "Message" });

    await expect(textarea).toBeInvalid();
    await expect(borderContrast(textarea)).toBeGreaterThanOrEqual(3);
  },
};

/**
 * A disabled textarea is dimmed, skipped by the keyboard and cannot be typed in. Disable the
 * `Field` instead to dim its label as well.
 */
export const Disabled: Story = {
  args: {
    defaultValue: "The build fails on a clean checkout.",
    disabled: true,
    rows: 4,
  },
};

/**
 * Tab moves focus into the textarea and shows a focus ring, typing changes its value with Enter
 * starting a new line, and the next Tab skips a disabled textarea
 */
export const KeyboardInteraction: Story = {
  render: (args) => (
    <Stack style={{ maxWidth: "24rem" }}>
      <Field label="Summary">
        <Textarea {...args} />
      </Field>
      <Field disabled={true} label="Internal notes">
        <Textarea defaultValue="Assigned to support" />
      </Field>
      <Field label="Steps to reproduce">
        <Textarea />
      </Field>
    </Stack>
  ),
  play: async ({ args, canvas }) => {
    const summary = canvas.getByRole("textbox", { name: "Summary" });
    const steps = canvas.getByRole("textbox", { name: "Steps to reproduce" });

    await userEvent.tab();
    await expect(summary).toHaveFocus();
    await expect(summary.matches(":focus-visible")).toBe(true);
    await expect(parseFloat(getComputedStyle(summary).outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(focusRingContrast(summary)).toBeGreaterThanOrEqual(3);
    await expect(borderContrast(summary)).toBeGreaterThanOrEqual(3);

    await userEvent.keyboard("Build fails{Enter}Only on a clean checkout");
    await expect(summary).toHaveValue("Build fails\nOnly on a clean checkout");
    await expect(args.onChange).toHaveBeenCalled();

    await userEvent.tab();
    await expect(steps).toHaveFocus();
  },
};
