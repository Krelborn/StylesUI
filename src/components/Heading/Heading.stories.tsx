import type { Meta, StoryObj } from "@storybook/react-vite";

import { childrenArgType } from "../../docs/argTypes";
import { Box } from "../Box";

import { Heading } from "./Heading";

const meta = {
  title: "Typography/Heading",
  component: Heading,
  args: {
    children: "Heading",
    level: 2,
  },
  argTypes: {
    children: childrenArgType,
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Heading>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A level 2 heading at its matching `2xl` size
 */
export const Default: Story = {};

/**
 * Each level renders its `h1`–`h6` element with a default size
 */
export const Levels: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "0.5rem" }}>
      <Heading level={1}>Heading level 1</Heading>
      <Heading level={2}>Heading level 2</Heading>
      <Heading level={3}>Heading level 3</Heading>
      <Heading level={4}>Heading level 4</Heading>
      <Heading level={5}>Heading level 5</Heading>
      <Heading level={6}>Heading level 6</Heading>
    </Box>
  ),
};

/**
 * `size` decouples the visual size from the level, so the document outline stays correct
 */
export const SizeOverride: Story = {
  args: {
    children: "Level 1, small size",
    level: 1,
    size: "lg",
  },
};
