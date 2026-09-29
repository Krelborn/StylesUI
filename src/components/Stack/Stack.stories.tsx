import type { Meta, StoryObj } from "@storybook/react-vite";

import { asArgType } from "../../docs/argTypes";
import { Card } from "../Card";
import { Text } from "../Text";

import { Stack } from "./Stack";

const meta = {
  title: "Layout/Stack",
  component: Stack,
  argTypes: {
    as: asArgType("div", ["div", "article", "section", "aside"]),
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: (args) => (
    <Stack {...args}>
      <Card padding="sm">First</Card>
      <Card padding="sm">Second</Card>
      <Card padding="sm">Third</Card>
    </Stack>
  ),
} satisfies Meta<typeof Stack>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Children stretch to the stack's width with the default gap of `4`
 */
export const Default: Story = {};

/**
 * `align="start"` lets children keep their own width
 */
export const AlignStart: Story = {
  args: {
    align: "start",
  },
};

/**
 * Rendered as a `ul`, the stack drops list markers and stays a list for assistive technology
 */
export const AsList: Story = {
  render: () => (
    <Stack as="ul" gap={2}>
      <li>
        <Text>Designing with intrinsic layouts</Text>
      </li>
      <li>
        <Text>Why every post needs a summary</Text>
      </li>
      <li>
        <Text>Theming with light-dark()</Text>
      </li>
    </Stack>
  ),
};
