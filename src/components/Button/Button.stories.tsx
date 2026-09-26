import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";

import { focusRingContrast, textContrast } from "../../test/colorContrast";
import { Box } from "../Box";

import { Button } from "./Button";

const meta = {
  title: "Actions/Button",
  component: Button,
  args: {
    children: "Button",
    onClick: fn(),
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    variant: "secondary",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <Box style={{ alignItems: "center", display: "flex", gap: "0.5rem" }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </Box>
  ),
};

export const HoverContrast: Story = {
  render: () => (
    <Box style={{ display: "flex", gap: "0.5rem" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
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
