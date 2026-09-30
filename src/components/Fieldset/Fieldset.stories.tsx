import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";

import { Checkbox } from "../Checkbox";
import { Stack } from "../Stack";

import { Fieldset } from "./Fieldset";

const meta = {
  title: "Forms/Fieldset",
  component: Fieldset,
  args: {
    label: "Notifications",
  },
  argTypes: {
    children: {
      control: false,
      description: "The form controls the fieldset groups",
      table: { type: { summary: "ReactNode" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables every control inside and dims the label",
      table: { type: { summary: "boolean" } },
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: (args) => (
    <Fieldset {...args} style={{ maxWidth: "24rem" }}>
      <Stack gap={1}>
        <Checkbox name="channel" value="email">
          Email
        </Checkbox>
        <Checkbox name="channel" value="text">
          Text message
        </Checkbox>
        <Checkbox name="channel" value="post">
          Post
        </Checkbox>
      </Stack>
    </Fieldset>
  ),
} satisfies Meta<typeof Fieldset>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The label is the `legend` that names the group of checkboxes, and sits above the first one
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const group = canvas.getByRole("group", { name: "Notifications" });
    const email = canvas.getByRole("checkbox", { name: "Email" });

    await expect(group).toContainElement(email);
    await expect(canvas.getByText("Notifications").getBoundingClientRect().bottom).toBeLessThanOrEqual(
      email.getBoundingClientRect().top
    );

    await userEvent.click(canvas.getByText("Email"));
    await expect(email).toBeChecked();
  },
};

/**
 * `description` sits below the label and `error` below the controls. The group is announced with the
 * description, then the error, through `aria-describedby`. The error is not a live region, so report a
 * failed submission in a form-level summary.
 */
export const WithDescriptionAndError: Story = {
  args: {
    description: "Choose how we reach you",
    error: "Choose at least one way to be notified",
  },
  play: async ({ canvas }) => {
    const group = canvas.getByRole("group", { name: "Notifications" });

    await expect(group).toHaveAccessibleDescription("Choose how we reach you Choose at least one way to be notified");
  },
};

/**
 * The native `disabled` prop disables every control inside, skipping them in the tab order, and dims the
 * label
 */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
  play: async ({ canvas }) => {
    for (const checkbox of canvas.getAllByRole("checkbox")) {
      await expect(checkbox).toBeDisabled();
    }

    await expect(Number(getComputedStyle(canvas.getByText("Notifications")).opacity)).toBeLessThan(1);
  },
};
