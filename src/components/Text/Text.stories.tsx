import type { Meta, StoryObj } from "@storybook/react-vite";

import { asArgType, childrenArgType } from "../../docs/argTypes";
import { Box } from "../Box";

import { Text } from "./Text";

const meta = {
  title: "Typography/Text",
  component: Text,
  args: {
    children: "The quick brown fox jumps over the lazy dog",
  },
  argTypes: {
    as: asArgType("span", ["span", "p", "strong", "em", "small"]),
    children: childrenArgType,
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Inline body text at the `md` size
 */
export const Default: Story = {};

/**
 * The `muted` tone is for secondary information
 */
export const Muted: Story = {
  args: {
    tone: "muted",
  },
};

/**
 * `size` maps to the theme's font size tokens
 */
export const Sizes: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "0.5rem" }}>
      <Text size="xs">Extra small</Text>
      <Text size="sm">Small</Text>
      <Text size="md">Medium</Text>
      <Text size="lg">Large</Text>
      <Text size="xl">Extra large</Text>
    </Box>
  ),
};

/**
 * `weight` maps to the theme's font weight tokens
 */
export const Weights: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "0.5rem" }}>
      <Text weight="regular">Regular</Text>
      <Text weight="medium">Medium</Text>
      <Text weight="bold">Bold</Text>
    </Box>
  ),
};
