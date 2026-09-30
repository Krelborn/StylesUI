import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { useState } from "react";
import { expect, fn, userEvent } from "storybook/test";

import { borderContrast, focusRingContrast } from "../../test/colorContrast";
import { Button } from "../Button";
import { Radio } from "../Radio";
import { Stack } from "../Stack";
import { Text } from "../Text";

import type { RadioGroupProps } from "./RadioGroup";
import { RadioGroup } from "./RadioGroup";

const meta = {
  title: "Forms/RadioGroup",
  component: RadioGroup,
  args: {
    label: "Contact method",
    onValueChange: fn(),
  },
  argTypes: {
    children: {
      control: false,
      description: "The `Radio` components the group holds",
      table: { type: { summary: "ReactNode" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables every radio and dims the label",
      table: { type: { summary: "boolean" } },
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: (args) => (
    <RadioGroup {...args} style={{ maxWidth: "24rem" }}>
      <Radio value="email">Email</Radio>
      <Radio value="phone">Phone</Radio>
      <Radio value="post">Post</Radio>
    </RadioGroup>
  ),
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The label names the group, the radios stack in a column and share one selection. Choosing a radio
 * reports its value to `onValueChange`.
 */
export const Default: Story = {
  play: async ({ args, canvas }) => {
    const group = canvas.getByRole("radiogroup", { name: "Contact method" });
    const email = canvas.getByRole("radio", { name: "Email" });
    const phone = canvas.getByRole("radio", { name: "Phone" });

    await expect(group).toContainElement(email);
    await expect(email.getBoundingClientRect().bottom).toBeLessThanOrEqual(phone.getBoundingClientRect().top);

    await userEvent.click(canvas.getByText("Phone"));
    await expect(phone).toBeChecked();
    await expect(args.onValueChange).toHaveBeenLastCalledWith("phone");

    await userEvent.click(canvas.getByText("Post"));
    await expect(phone).not.toBeChecked();
    await expect(canvas.getByRole("radio", { name: "Post" })).toBeChecked();
    await expect(args.onValueChange).toHaveBeenLastCalledWith("post");
  },
};

/**
 * `orientation="horizontal"` lays the radios out in a row that wraps when the space runs out
 */
export const Horizontal: Story = {
  args: {
    orientation: "horizontal",
  },
  play: async ({ canvas }) => {
    const email = canvas.getByRole("radio", { name: "Email" });
    const phone = canvas.getByRole("radio", { name: "Phone" });

    await expect(email.getBoundingClientRect().top).toBeCloseTo(phone.getBoundingClientRect().top, 0);
    await expect(email.getBoundingClientRect().right).toBeLessThanOrEqual(phone.getBoundingClientRect().left);
  },
};

/**
 * `description` sits below the label and `error` below the radios. The group is announced with the
 * description, then the error, and an `error` also marks every radio invalid and draws its border in the
 * danger colour. `required` adds an asterisk to the label that assistive technology skips, and marks the
 * group required. The error is not a live region, so report a failed submission in a form-level summary.
 */
export const WithDescriptionAndError: Story = {
  args: {
    description: "We only use it to confirm your order",
    error: "Choose a contact method",
    required: true,
  },
  play: async ({ canvas }) => {
    const group = canvas.getByRole("radiogroup", { name: "Contact method" });
    const email = canvas.getByRole("radio", { name: "Email" });

    await expect(group).toBeRequired();
    await expect(group).toBeInvalid();
    await expect(group).toHaveAccessibleDescription("We only use it to confirm your order Choose a contact method");
    await expect(email).toBeRequired();
    await expect(borderContrast(email)).toBeGreaterThanOrEqual(3);
  },
};

/**
 * The native `disabled` prop disables every radio, keeping the selection and skipping the group in the tab
 * order, and dims the label
 */
export const Disabled: Story = {
  args: {
    defaultValue: "phone",
    disabled: true,
  },
  play: async ({ canvas }) => {
    for (const radio of canvas.getAllByRole("radio")) {
      await expect(radio).toBeDisabled();
    }

    await expect(canvas.getByRole("radio", { name: "Phone" })).toBeChecked();
    await expect(Number(getComputedStyle(canvas.getByText("Contact method")).opacity)).toBeLessThan(1);
  },
};

function ControlledRadioGroup(args: RadioGroupProps): JSX.Element {
  const [value, setValue] = useState("email");

  return (
    <Stack gap={2}>
      <RadioGroup
        {...args}
        onValueChange={(nextValue) => {
          setValue(nextValue);
          args.onValueChange?.(nextValue);
        }}
        value={value}
      >
        <Radio value="email">Email</Radio>
        <Radio value="phone">Phone</Radio>
        <Radio value="post">Post</Radio>
      </RadioGroup>
      <Text>Selected: {value}</Text>
    </Stack>
  );
}

/**
 * `value` makes the group controlled: the selection is whatever the parent passes, so update it from
 * `onValueChange`. If the parent does not, the selection stays where it was.
 */
export const Controlled: Story = {
  render: (args) => <ControlledRadioGroup {...args} />,
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole("radio", { name: "Email" })).toBeChecked();

    await userEvent.click(canvas.getByText("Post"));
    await expect(canvas.getByRole("radio", { name: "Post" })).toBeChecked();
    await expect(canvas.getByRole("radio", { name: "Email" })).not.toBeChecked();
    await expect(canvas.getByText("Selected: post")).toBeInTheDocument();
    await expect(args.onValueChange).toHaveBeenLastCalledWith("post");
  },
};

/**
 * The group is one tab stop: Tab enters at the selected radio and the next Tab leaves the group. The arrow
 * keys move the selection, wrap at either end and skip a disabled radio, and the focused radio shows a
 * focus ring.
 */
export const KeyboardInteraction: Story = {
  args: {
    defaultValue: "email",
  },
  render: (args) => (
    <Stack gap={4}>
      <Button>Before the group</Button>
      <RadioGroup {...args}>
        <Radio value="email">Email</Radio>
        <Radio disabled={true} value="phone">
          Phone
        </Radio>
        <Radio value="post">Post</Radio>
      </RadioGroup>
      <Button>After the group</Button>
    </Stack>
  ),
  play: async ({ args, canvas }) => {
    const before = canvas.getByRole("button", { name: "Before the group" });
    const after = canvas.getByRole("button", { name: "After the group" });
    const email = canvas.getByRole("radio", { name: "Email" });
    const post = canvas.getByRole("radio", { name: "Post" });

    await userEvent.tab();
    await expect(before).toHaveFocus();

    await userEvent.tab();
    await expect(email).toHaveFocus();
    await expectFocusRing(email);

    await userEvent.keyboard("{ArrowDown}");
    await expect(post).toHaveFocus();
    await expect(post).toBeChecked();
    await expect(args.onValueChange).toHaveBeenLastCalledWith("post");
    await expectFocusRing(post);

    await userEvent.keyboard("{ArrowDown}");
    await expect(email).toHaveFocus();
    await expect(email).toBeChecked();
    await expect(args.onValueChange).toHaveBeenLastCalledWith("email");

    await userEvent.keyboard("{ArrowUp}");
    await expect(post).toHaveFocus();
    await expect(post).toBeChecked();

    await userEvent.tab();
    await expect(after).toHaveFocus();

    await userEvent.tab({ shift: true });
    await expect(post).toHaveFocus();
  },
};

async function expectFocusRing(radio: HTMLElement): Promise<void> {
  await expect(radio.matches(":focus-visible")).toBe(true);
  await expect(parseFloat(getComputedStyle(radio).outlineWidth)).toBeGreaterThanOrEqual(2);
  await expect(focusRingContrast(radio)).toBeGreaterThanOrEqual(3);
}
