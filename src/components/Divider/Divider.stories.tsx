import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Row } from "../Row";
import { Stack } from "../Stack";
import { Text } from "../Text";

import { Divider } from "./Divider";

const meta = {
  title: "Layout/Divider",
  component: Divider,
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Divider>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A horizontal divider spans the width of its container, here separating two blocks in a `Stack`
 */
export const Horizontal: Story = {
  render: () => (
    <Stack>
      <Text>Getting started</Text>
      <Divider />
      <Text>Advanced usage</Text>
    </Stack>
  ),
};

/**
 * A vertical divider stretches to the height of its `Row` and sets `aria-orientation="vertical"`
 */
export const Vertical: Story = {
  render: () => (
    <Row>
      <Text>Home</Text>
      <Divider orientation="vertical" />
      <Text>Docs</Text>
      <Divider orientation="vertical" />
      <Text>Blog</Text>
    </Row>
  ),
  play: async ({ canvas }) => {
    for (const divider of canvas.getAllByRole("separator")) {
      const { height, width } = divider.getBoundingClientRect();

      await expect(height).toBeGreaterThan(width);
    }
  },
};
