import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";

import { TextInput } from "../TextInput";

import { Field } from "./Field";

const meta = {
  title: "Forms/Field",
  component: Field,
  args: {
    label: "Email",
  },
  argTypes: {
    as: {
      control: "select",
      description:
        "Element to render: a `div`, or an `li` or `section` where the field is a list item or a region. The field accepts every prop that element supports, including `ref`.",
      options: ["div", "li", "section"],
      table: {
        defaultValue: { summary: "div" },
        type: { summary: '"div" | "li" | "section"' },
      },
    },
    children: {
      control: false,
      description: "The one form control the field labels",
      table: { type: { summary: "ReactNode" } },
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: (args) => (
    <Field {...args} style={{ maxWidth: "24rem" }}>
      <TextInput type="email" />
    </Field>
  ),
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The label names the control, and clicking it moves focus to the control
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Email" });

    await userEvent.click(canvas.getByText("Email"));

    await expect(input).toHaveFocus();
  },
};

/**
 * `description` sits between the label and the control, and is announced with the control through
 * `aria-describedby`
 */
export const WithDescription: Story = {
  args: {
    description: "We only use it to send receipts",
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Email" });

    await expect(input).toHaveAccessibleDescription("We only use it to send receipts");
  },
};

/**
 * `error` sits below the control and marks it `aria-invalid`. It is announced after the
 * description. It is not a live region, so report a failed submission in a form-level summary.
 */
export const WithError: Story = {
  args: {
    description: "We only use it to send receipts",
    error: "Enter an email address, such as ada@example.com",
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Email" });

    await expect(input).toBeInvalid();
    await expect(input).toHaveAccessibleDescription(
      "We only use it to send receipts Enter an email address, such as ada@example.com"
    );
  },
};

/**
 * `required` marks the control required and adds an asterisk to the label. The asterisk is hidden
 * from assistive technology, which reads the control's own required state instead.
 */
export const Required: Story = {
  args: {
    required: true,
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Email" });

    await expect(input).toBeRequired();
  },
};

/**
 * `disabled` disables the control and dims the label
 */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Email" });

    await expect(input).toBeDisabled();
    await expect(Number(getComputedStyle(canvas.getByText("Email")).opacity)).toBeLessThan(1);
  },
};
