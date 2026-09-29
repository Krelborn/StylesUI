import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { asArgType } from "../../docs/argTypes";
import { Box } from "../Box";
import { Card } from "../Card";
import { Heading } from "../Heading";
import { Text } from "../Text";

import { Grid } from "./Grid";

const meta = {
  title: "Layout/Grid",
  component: Grid,
  argTypes: {
    as: asArgType("div", ["div", "section"]),
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: (args) => (
    <Grid {...args}>
      <Card>First post</Card>
      <Card>Second post</Card>
      <Card>Third post</Card>
      <Card>Fourth post</Card>
    </Grid>
  ),
} satisfies Meta<typeof Grid>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * As many columns as fit at the default 16rem minimum item width
 */
export const Default: Story = {};

/**
 * Post previews in a `ul`, which stays a list for assistive technology
 */
export const AsList: Story = {
  render: () => (
    <Grid as="ul" minimumItemWidth="12rem">
      <li>
        <Card as="article">
          <Heading level={3} size="md">
            Intrinsic layouts
          </Heading>
          <Text tone="muted">Let content decide where things wrap.</Text>
        </Card>
      </li>
      <li>
        <Card as="article">
          <Heading level={3} size="md">
            Theming tokens
          </Heading>
          <Text tone="muted">Semantic colours with light-dark().</Text>
        </Card>
      </li>
    </Grid>
  ),
};

/**
 * With a 10rem minimum item width, a 360px container fits two columns
 */
export const TwoColumns: Story = {
  render: () => (
    <Box style={{ width: "360px" }}>
      <Grid minimumItemWidth="10rem">
        <Card padding="sm">One</Card>
        <Card padding="sm">Two</Card>
        <Card padding="sm">Three</Card>
      </Grid>
    </Box>
  ),
  play: async ({ canvas }) => {
    const one = canvas.getByText("One").getBoundingClientRect();
    const two = canvas.getByText("Two").getBoundingClientRect();
    const three = canvas.getByText("Three").getBoundingClientRect();

    await expect(two.top).toBe(one.top);
    await expect(three.top).toBeGreaterThan(one.top);
  },
};

/**
 * In a container narrower than the minimum item width, items shrink to fit rather than overflow
 */
export const NarrowContainer: Story = {
  render: () => (
    <Box style={{ width: "120px" }}>
      <Grid minimumItemWidth="10rem">
        <Card padding="sm">Only</Card>
      </Grid>
    </Box>
  ),
  play: async ({ canvas }) => {
    const item = canvas.getByText("Only");
    const container = item.parentElement?.parentElement;

    if (!container) {
      throw new Error("Expected the item and its container to render");
    }

    await expect(item.getBoundingClientRect().width).toBeLessThanOrEqual(container.getBoundingClientRect().width);
  },
};
