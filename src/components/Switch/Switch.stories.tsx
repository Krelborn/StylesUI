import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";

import { expectOnSpaceScale, settledHalo, textStart } from "../../test/choiceControl";
import { borderContrast, focusRingContrast } from "../../test/colorContrast";
import { trustedInput } from "../../test/trustedInput";
import { Field } from "../Field";
import { Stack } from "../Stack";
import { Text } from "../Text";

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

const switchLayout = { boxWidth: "var(--sui-space-6)", indent: "var(--sui-space-8)" };

const wrappingLabel = "Show a preview of every new message on the lock screen";

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
 * A `Field` with no `label` leaves the switch to name itself and gives it the rest. When the
 * setting fails to take effect, `error` describes the switch and marks it `aria-invalid`, which
 * draws its border in the danger colour
 */
export const InAField: Story = {
  args: {
    children: "Two-step sign-in",
  },
  render: (args) => (
    <Field error="Two-step sign-in could not be turned on. Try again.">
      <Switch {...args} />
    </Field>
  ),
  play: async ({ canvas }) => {
    const twoStep = canvas.getByRole("switch", { name: "Two-step sign-in" });

    await expect(twoStep).toBeInvalid();
    await expect(twoStep).toHaveAccessibleDescription("Two-step sign-in could not be turned on. Try again.");
    await expect(borderContrast(twoStep)).toBeGreaterThanOrEqual(3);
  },
};

/**
 * Stacked closely, each switch's label is a target at least 24px tall, and only as wide as its
 * track and text. The track is `--sui-space-6` by `--sui-space-4`.
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

    await expectOnSpaceScale(push, text, switchLayout);
    await expect(label.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    await expect(label.getBoundingClientRect().width).toBeCloseTo(
      push.getBoundingClientRect().width + text.getBoundingClientRect().width,
      0
    );
  },
};

/**
 * The track is `--sui-space-6` by `--sui-space-4`, centred halfway between the capital and the
 * lowercase letters of the first line of its label, so a one-line label is one line tall, and the
 * label text starts `--sui-space-8` from the track in every theme. Text below a switch lines up
 * with its label when it is padded by `var(--sui-space-8)`.
 */
export const AlignedText: Story = {
  render: (args) => (
    <Stack gap={2} style={{ maxInlineSize: "18rem" }}>
      <Stack gap={0}>
        <Switch {...args} />
        <Text as="p" size="sm" style={{ paddingInlineStart: "var(--sui-space-8)" }} tone="muted">
          When someone replies to you
        </Text>
      </Stack>
      <Switch>{wrappingLabel}</Switch>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const wrappingText = canvas.getByText(wrappingLabel);
    const [label] = canvas.getByRole<HTMLInputElement>("switch", { name: "Email notifications" }).labels ?? [];

    await expect(wrappingText.getBoundingClientRect().height, "the long label wraps").toBeGreaterThan(
      parseFloat(getComputedStyle(wrappingText).lineHeight)
    );
    await expect(label.getBoundingClientRect().height, "one-line label height").toBeCloseTo(
      parseFloat(getComputedStyle(label).lineHeight),
      0
    );

    for (const name of ["Email notifications", wrappingLabel]) {
      await expectOnSpaceScale(
        canvas.getByRole<HTMLInputElement>("switch", { name }),
        canvas.getByText(name),
        switchLayout
      );
    }

    await expect(textStart(canvas.getByText("When someone replies to you"))).toBeCloseTo(
      textStart(canvas.getByText("Email notifications")),
      0
    );
  },
};

/**
 * In a right-to-left layout the track sits at the right, and the label text, its wrapped lines
 * and text padded by `var(--sui-space-8)` below start `--sui-space-8` to its left
 */
export const RightToLeft: Story = {
  ...AlignedText,
  decorators: [
    (Story) => (
      <div dir="rtl">
        <Story />
      </div>
    ),
  ],
};

/**
 * A switch named by `aria-label` alone takes up no more room than its track, which is still a
 * target at least 24px square
 */
export const WithoutText: Story = {
  args: {
    "aria-label": "Email notifications",
    children: undefined,
  },
  play: async ({ canvas }) => {
    const notifications = canvas.getByRole<HTMLInputElement>("switch", { name: "Email notifications" });
    const [label] = notifications.labels ?? [];
    const { height, width } = label.getBoundingClientRect();

    await expect(width, "label width").toBeCloseTo(notifications.getBoundingClientRect().width, 0);
    await expect(width, "target width").toBeGreaterThanOrEqual(24);
    await expect(height, "target height").toBeGreaterThanOrEqual(24);
  },
};

/**
 * Tab moves focus to the switch and shows a focus ring on the track, which stops short of the label
 * text. Space toggles it, and the next Tab skips a disabled switch.
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

    const { outlineOffset, outlineWidth } = getComputedStyle(email);
    const ringEnd = email.getBoundingClientRect().right + parseFloat(outlineOffset) + parseFloat(outlineWidth);

    await expect(ringEnd, "focus ring end").toBeLessThan(textStart(canvas.getByText("Email notifications")));

    await userEvent.keyboard(" ");
    await expect(email).toBeChecked();
    await expect(args.onChange).toHaveBeenCalled();

    await userEvent.keyboard(" ");
    await expect(email).not.toBeChecked();

    await userEvent.tab();
    await expect(push).toHaveFocus();
  },
};

/**
 * A switch draws no halo when its label is hovered, unlike a checkbox or radio
 */
export const NoHalo: Story = {
  render: (args) => (
    <Switch {...args}>
      <span data-testid="switch">Email notifications</span>
    </Switch>
  ),
  play: async ({ canvas }) => {
    const input = trustedInput();
    const email = canvas.getByRole<HTMLInputElement>("switch", { name: "Email notifications" });

    if (input === null) {
      return;
    }

    await input.hoverByTestId("switch");
    await expect((await settledHalo(email, ":hover")).spread, "halo spread").toBe(0);
  },
};
