import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Box } from "../Box";

import { Button } from "./Button";

const meta = {
  title: "Actions/Button",
  component: Button,
  args: {
    children: "Button",
    onClick: fn(),
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
