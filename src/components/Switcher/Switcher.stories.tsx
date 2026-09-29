import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { asArgType } from "../../docs/argTypes";
import { Box } from "../Box";
import { Card } from "../Card";
import { Text } from "../Text";

import { Switcher } from "./Switcher";

const meta = {
  title: "Layout/Switcher",
  component: Switcher,
  argTypes: {
    as: asArgType("div", ["div", "nav", "section"]),
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: (args) => (
    <Switcher {...args}>
      <Card>Previous: Designing with tokens</Card>
      <Card>Next: Intrinsic layouts</Card>
    </Switcher>
  ),
} satisfies Meta<typeof Switcher>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Items share a row until the container is narrower than the default 30rem threshold
 */
export const Default: Story = {};

/**
 * With a 15rem threshold, a 360px container keeps the items in a row and a 200px container stacks them
 */
export const Threshold: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "1rem" }}>
      <Box style={{ width: "360px" }}>
        <Switcher threshold="15rem">
          <Card padding="sm">Wide A</Card>
          <Card padding="sm">Wide B</Card>
        </Switcher>
      </Box>
      <Box style={{ width: "200px" }}>
        <Switcher threshold="15rem">
          <Card padding="sm">Narrow A</Card>
          <Card padding="sm">Narrow B</Card>
        </Switcher>
      </Box>
    </Box>
  ),
  play: async ({ canvas }) => {
    const wideA = canvas.getByText("Wide A").getBoundingClientRect();
    const wideB = canvas.getByText("Wide B").getBoundingClientRect();
    const narrowA = canvas.getByText("Narrow A").getBoundingClientRect();
    const narrowB = canvas.getByText("Narrow B").getBoundingClientRect();

    await expect(wideB.top).toBe(wideA.top);
    await expect(Math.abs(wideB.width - wideA.width)).toBeLessThan(1);
    await expect(narrowB.top).toBeGreaterThan(narrowA.top);
  },
};

/**
 * Rendered as an `ol`, the switcher drops list markers and stays a list for assistive technology
 */
export const AsList: Story = {
  render: () => (
    <Switcher as="ol" threshold="20rem">
      <li>
        <Text>Draft</Text>
      </li>
      <li>
        <Text>Review</Text>
      </li>
      <li>
        <Text>Publish</Text>
      </li>
    </Switcher>
  ),
};
