import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";

import { borderContrast, focusRingContrast } from "../../test/colorContrast";
import { Button } from "../Button";
import { Field } from "../Field";
import { Row } from "../Row";
import { Stack } from "../Stack";

import { TextInput } from "./TextInput";

const sizes = [
  { name: "Small", size: "sm" },
  { name: "Medium", size: "md" },
  { name: "Large", size: "lg" },
] as const;

const meta = {
  title: "Forms/TextInput",
  component: TextInput,
  args: {
    onChange: fn(),
  },
  argTypes: {
    disabled: {
      control: "boolean",
      description: "Prevents typing and dims the input",
      table: { type: { summary: "boolean" } },
    },
    placeholder: {
      control: "text",
      description: "Hint shown in the muted text colour while the input is empty",
      table: { type: { summary: "string" } },
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: (args) => (
    <Field label="Email" style={{ maxWidth: "24rem" }}>
      <TextInput {...args} />
    </Field>
  ),
} satisfies Meta<typeof TextInput>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A text input labelled by the `Field` around it
 */
export const Default: Story = {
  args: {
    autoComplete: "email",
    placeholder: "ada@example.com",
    type: "email",
  },
};

/**
 * `size` scales padding and font size in step with `Button`, so an input is as tall as a button of
 * the same size beside it
 */
export const Sizes: Story = {
  render: () => (
    <Stack align="start">
      {sizes.map(({ name, size }) => (
        <Row key={size}>
          <TextInput placeholder={name} size={size} aria-label={name} />
          <Button size={size}>{name}</Button>
        </Row>
      ))}
    </Stack>
  ),
  play: async ({ canvas }) => {
    for (const { name } of sizes) {
      const input = canvas.getByRole("textbox", { name });
      const button = canvas.getByRole("button", { name });

      await expect(input.getBoundingClientRect().height, `${name} input height`).toBe(
        button.getBoundingClientRect().height
      );
    }
  },
};

/**
 * An error on the `Field` marks the input `aria-invalid`, which draws its border in the danger
 * colour
 */
export const Invalid: Story = {
  args: {
    defaultValue: "ada@example",
    type: "email",
  },
  render: (args) => (
    <Field error="Enter an email address, such as ada@example.com" label="Email" style={{ maxWidth: "24rem" }}>
      <TextInput {...args} />
    </Field>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Email" });

    await expect(input).toBeInvalid();
    await expect(borderContrast(input)).toBeGreaterThanOrEqual(3);
  },
};

/**
 * A disabled input is dimmed, skipped by the keyboard and cannot be typed in. Disable the `Field`
 * instead to dim its label as well.
 */
export const Disabled: Story = {
  args: {
    defaultValue: "ada@example.com",
    disabled: true,
  },
};

/**
 * Tab moves focus into the input and shows a focus ring, typing changes its value, and the next Tab
 * skips a disabled input
 */
export const KeyboardInteraction: Story = {
  render: (args) => (
    <Stack style={{ maxWidth: "24rem" }}>
      <Field label="Name">
        <TextInput {...args} />
      </Field>
      <Field disabled={true} label="Account number">
        <TextInput defaultValue="1042" />
      </Field>
      <Field label="Email">
        <TextInput type="email" />
      </Field>
    </Stack>
  ),
  play: async ({ args, canvas }) => {
    const name = canvas.getByRole("textbox", { name: "Name" });
    const email = canvas.getByRole("textbox", { name: "Email" });

    await userEvent.tab();
    await expect(name).toHaveFocus();
    await expect(name.matches(":focus-visible")).toBe(true);
    await expect(parseFloat(getComputedStyle(name).outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(focusRingContrast(name)).toBeGreaterThanOrEqual(3);
    await expect(borderContrast(name)).toBeGreaterThanOrEqual(3);

    await userEvent.keyboard("Ada Lovelace");
    await expect(name).toHaveValue("Ada Lovelace");
    await expect(args.onChange).toHaveBeenCalled();

    await userEvent.tab();
    await expect(email).toHaveFocus();
  },
};
