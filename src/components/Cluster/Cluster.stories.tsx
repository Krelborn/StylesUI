import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { asArgType } from "../../docs/argTypes";
import { Box } from "../Box";
import { Card } from "../Card";
import { Text } from "../Text";

import { Cluster } from "./Cluster";

const meta = {
  title: "Layout/Cluster",
  component: Cluster,
  argTypes: {
    as: asArgType("div", ["div", "nav", "footer"]),
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: (args) => (
    <Cluster {...args}>
      <Card padding="sm">Design</Card>
      <Card padding="sm">Layout</Card>
      <Card padding="sm">CSS</Card>
      <Card padding="sm">React</Card>
      <Card padding="sm">Accessibility</Card>
    </Cluster>
  ),
} satisfies Meta<typeof Cluster>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Children flow along a line and wrap when they run out of room
 */
export const Default: Story = {};

/**
 * `justify="center"` centres each wrapped line
 */
export const Centred: Story = {
  args: {
    justify: "center",
  },
};

/**
 * In a narrow container the children wrap onto new lines
 */
export const Wrapping: Story = {
  render: () => (
    <Box style={{ width: "10rem" }}>
      <Cluster>
        <Card padding="sm">Design</Card>
        <Card padding="sm">Layout</Card>
        <Card padding="sm">React</Card>
      </Cluster>
    </Box>
  ),
  play: async ({ canvas }) => {
    const first = canvas.getByText("Design").getBoundingClientRect();
    const last = canvas.getByText("React").getBoundingClientRect();

    await expect(last.top).toBeGreaterThan(first.top);
  },
};

/**
 * A post's tag list, rendered as a labelled `ul` that stays a list for assistive technology
 */
export const AsList: Story = {
  render: () => (
    <Cluster as="ul" aria-label="Tags">
      <li>
        <Text>#css</Text>
      </li>
      <li>
        <Text>#layout</Text>
      </li>
      <li>
        <Text>#react</Text>
      </li>
    </Cluster>
  ),
};
