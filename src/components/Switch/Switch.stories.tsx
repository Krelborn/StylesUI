import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";

import { borderContrast, focusRingContrast } from "../../test/colorContrast";
import { Field } from "../Field";
import { Stack } from "../Stack";

import { Switch } from "./Switch";

const meta = {
  title: "Forms/Switch",
  component: Switch,
  args: {
    children: "Email notifications",
    onChange: fn(),
  },
  argTypes: {
    children: {
      control: "text",
    },
    defaultChecked: {
      control: "boolean",
      description: "Whether the switch starts on",
      table: { type: { summary: "boolean" } },
    },
    disabled: {
      control: "boolean",
      description: "Prevents toggling and dims the switch and its label",
      table: { type: { summary: "boolean" } },
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The children are the label that names the switch, and clicking the label toggles it
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const notifications = canvas.getByRole("switch", { name: "Email notifications" });
    const label = canvas.getByText("Email notifications");

    await userEvent.click(label);
    await expect(notifications).toBeChecked();

    await userEvent.click(label);
    await expect(notifications).not.toBeChecked();
  },
};

/**
 * A switch that is on fills with the primary colour and moves its thumb to the far end of the
 * track, so its state does not depend on colour alone
 */
export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("switch", { name: "Email notifications" })).toBeChecked();
  },
};

/**
 * A disabled switch is dimmed along with its label, skipped by the keyboard and keeps its state
 */
export const Disabled: Story = {
  args: {
    defaultChecked: true,
    disabled: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("switch", { name: "Email notifications" })).toBeDisabled();
    await expect(Number(getComputedStyle(canvas.getByText("Email notifications")).opacity)).toBeLessThan(1);
  },
};

/**
 * A `Field` with no `label` leaves the switch to name itself and gives it the rest: `error` marks
 * it `aria-invalid`, which draws its border in the danger colour, and `required` adds an asterisk
 * to the switch's own label
 */
export const InAField: Story = {
  args: {
    children: "Two-step sign-in",
  },
  render: (args) => (
    <Field error="Turn on two-step sign-in to continue" required={true}>
      <Switch {...args} />
    </Field>
  ),
  play: async ({ canvas }) => {
    const twoStep = canvas.getByRole("switch", { name: "Two-step sign-in" });

    await expect(twoStep).toBeInvalid();
    await expect(twoStep).toBeRequired();
    await expect(twoStep).toHaveAccessibleDescription("Turn on two-step sign-in to continue");
    await expect(borderContrast(twoStep)).toBeGreaterThanOrEqual(3);
  },
};

/**
 * Switches stacked closely each keep a target of at least 24px, and each label is only as wide as
 * its text
 */
export const Stacked: Story = {
  render: (args) => (
    <Stack gap={1}>
      <Switch {...args} />
      <Switch defaultChecked={true}>Text message notifications</Switch>
      <Switch>Push notifications</Switch>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const push = canvas.getByRole<HTMLInputElement>("switch", { name: "Push notifications" });
    const text = canvas.getByText("Push notifications");
    const [label] = push.labels ?? [];

    await expect(label.getBoundingClientRect().width).toBeCloseTo(
      push.getBoundingClientRect().width + text.getBoundingClientRect().width,
      0
    );
  },
};

/**
 * Tab moves focus to the switch and shows a focus ring on the track, Space toggles it, and the next
 * Tab skips a disabled switch
 */
export const KeyboardInteraction: Story = {
  render: (args) => (
    <Stack gap={2}>
      <Switch {...args} />
      <Switch disabled={true}>Text message notifications</Switch>
      <Switch>Push notifications</Switch>
    </Stack>
  ),
  play: async ({ args, canvas }) => {
    const email = canvas.getByRole("switch", { name: "Email notifications" });
    const push = canvas.getByRole("switch", { name: "Push notifications" });

    await userEvent.tab();
    await expect(email).toHaveFocus();
    await expect(email.matches(":focus-visible")).toBe(true);
    await expect(parseFloat(getComputedStyle(email).outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(focusRingContrast(email)).toBeGreaterThanOrEqual(3);
    await expect(borderContrast(email)).toBeGreaterThanOrEqual(3);

    await userEvent.keyboard(" ");
    await expect(email).toBeChecked();
    await expect(args.onChange).toHaveBeenCalled();

    await userEvent.keyboard(" ");
    await expect(email).not.toBeChecked();

    await userEvent.tab();
    await expect(push).toHaveFocus();
  },
};
