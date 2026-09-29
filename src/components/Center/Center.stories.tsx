import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { asArgType, childrenArgType } from "../../docs/argTypes";
import { Box } from "../Box";
import { Button } from "../Button";
import { Card } from "../Card";

import { Center } from "./Center";

const narrowColumn = { "--sui-width-content": "12rem" } as CSSProperties;

const meta = {
  title: "Layout/Center",
  component: Center,
  args: {
    children: "Centred column content",
  },
  argTypes: {
    as: asArgType("div", ["div", "main", "header", "footer", "section"]),
    children: childrenArgType,
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Center>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A column capped at the `content` width and centred in the space available
 */
export const Default: Story = {
  render: (args) => (
    <Center {...args}>
      <Card>{args.children}</Card>
    </Center>
  ),
};

/**
 * `width="prose"` caps the column at a comfortable reading measure
 */
export const Prose: Story = {
  args: {
    width: "prose",
  },
  render: (args) => (
    <Center {...args}>
      <Card>
        Long-form article text reads best at around 65 characters per line, which is what the prose width gives you by
        default.
      </Card>
    </Center>
  ),
};

/**
 * `intrinsic` also centres children narrower than the column
 */
export const Intrinsic: Story = {
  args: {
    intrinsic: true,
  },
  render: (args) => (
    <Center {...args}>
      <Button>Read more</Button>
    </Center>
  ),
};

/**
 * Overriding `--sui-width-content` narrows the column, which stays centred with equal space either side
 */
export const CustomWidth: Story = {
  render: () => (
    <Box style={{ width: "360px" }}>
      <Center style={narrowColumn}>
        <Card padding="sm">Narrow column</Card>
      </Center>
    </Box>
  ),
  play: async ({ canvas }) => {
    const center = canvas.getByText("Narrow column").parentElement;
    const wrapper = center?.parentElement;

    if (!center || !wrapper) {
      throw new Error("Expected the column and its wrapper to render");
    }

    const column = center.getBoundingClientRect();
    const container = wrapper.getBoundingClientRect();

    await expect(column.width).toBeLessThan(container.width);
    await expect(Math.abs(column.left - container.left - (container.right - column.right))).toBeLessThan(1);
  },
};
