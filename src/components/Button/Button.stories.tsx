import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";

import { childrenArgType } from "../../docs/argTypes";
import { focusRingContrast, textContrast } from "../../test/colorContrast";
import { Box } from "../Box";
import { Card } from "../Card";

import { Button } from "./Button";

const meta = {
  title: "Actions/Button",
  component: Button,
  args: {
    children: "Button",
    onClick: fn(),
  },
  argTypes: {
    children: childrenArgType,
    disabled: {
      control: "boolean",
      description: "Prevents interaction and dims the button",
      table: { type: { summary: "boolean" } },
    },
    type: {
      control: "select",
      description: "Native button type",
      options: ["button", "submit", "reset"],
      table: { type: { summary: '"button" | "submit" | "reset"' } },
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The default filled button, for the main action in a view
 */
export const Primary: Story = {};

/**
 * Filled in the secondary colour, for actions alongside the primary one
 */
export const Secondary: Story = {
  args: {
    variant: "secondary",
  },
};

/**
 * Primary-coloured outline, for lower-emphasis actions
 */
export const Outline: Story = {
  args: {
    variant: "outline",
  },
};

/**
 * No fill or border until hovered, for quiet actions in toolbars and status bars. It stays flat in every theme, and
 * fills with the secondary colour while pressed.
 */
export const Ghost: Story = {
  args: {
    variant: "ghost",
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Button" });
    const style = getComputedStyle(button);

    await expect(style.getPropertyValue("--sui-button-depth").trim()).toBe("0px");
    await expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  },
};

/**
 * A disabled button is skipped by the keyboard and ignores clicks
 */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

/**
 * `size` scales padding and font size
 */
export const Sizes: Story = {
  render: () => (
    <Box style={{ alignItems: "center", display: "flex", gap: "0.5rem" }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </Box>
  ),
};

/**
 * Every variant keeps at least 4.5:1 text contrast when hovered
 */
export const HoverContrast: Story = {
  render: () => (
    <Box style={{ alignItems: "center", display: "flex", gap: "0.5rem" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Card padding="sm">
        <Button variant="ghost">Ghost on a card</Button>
      </Card>
    </Box>
  ),
  // axe only sees the resting state, so the hover background is measured directly
  play: async ({ canvas }) => {
    for (const button of canvas.getAllByRole("button")) {
      const ratio = textContrast(button, "var(--sui-button-bg-hover)");

      await expect(ratio, `${button.textContent} hover text contrast`).toBeGreaterThanOrEqual(4.5);
    }
  },
};

/**
 * Tab moves focus between enabled buttons and shows a focus ring; Enter and Space activate the focused button
 */
export const KeyboardInteraction: Story = {
  args: {
    children: "Save",
  },
  render: (args) => (
    <Box style={{ display: "flex", gap: "0.5rem" }}>
      <Button {...args} />
      <Button disabled={true}>Delete</Button>
      <Button variant="secondary">Cancel</Button>
    </Box>
  ),
  play: async ({ args, canvas }) => {
    const save = canvas.getByRole("button", { name: "Save" });
    const cancel = canvas.getByRole("button", { name: "Cancel" });

    await userEvent.tab();
    await expect(save).toHaveFocus();
    await expect(save.matches(":focus-visible")).toBe(true);
    await expect(parseFloat(getComputedStyle(save).outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(focusRingContrast(save)).toBeGreaterThanOrEqual(3);

    await userEvent.tab();
    await expect(cancel).toHaveFocus();

    await userEvent.tab({ shift: true });
    await expect(save).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    await expect(args.onClick).toHaveBeenCalledTimes(1);

    await userEvent.keyboard(" ");
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};
