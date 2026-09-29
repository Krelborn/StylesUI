import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { asArgType } from "../../docs/argTypes";
import { Box } from "../Box";
import { Card } from "../Card";
import { Text } from "../Text";

import { Row } from "./Row";

const meta = {
  title: "Layout/Row",
  component: Row,
  argTypes: {
    as: asArgType("div", ["div", "header", "footer", "nav"]),
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: (args) => (
    <Row {...args}>
      <Card padding="sm">One</Card>
      <Card padding="sm">Two</Card>
      <Card padding="sm">Three</Card>
    </Row>
  ),
} satisfies Meta<typeof Row>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Children sit on one line, centred vertically, with the default gap of `2`
 */
export const Default: Story = {};

/**
 * `justify="between"` pushes the first and last children to the edges, as in a site header
 */
export const SpaceBetween: Story = {
  args: {
    justify: "between",
  },
};

/**
 * A post byline: author, date and reading time on one line
 */
export const Byline: Story = {
  render: () => (
    <Row gap={3}>
      <Text weight="bold">Ada Lovelace</Text>
      <Text tone="muted">29 September 2026</Text>
      <Text tone="muted">6 min read</Text>
    </Row>
  ),
};

/**
 * In a container too narrow for its children, a row keeps them on one line rather than wrapping
 */
export const NoWrap: Story = {
  render: () => (
    <Box style={{ overflow: "hidden", width: "10rem" }}>
      <Row>
        <Card padding="sm">Design</Card>
        <Card padding="sm">Layout</Card>
        <Card padding="sm">React</Card>
      </Row>
    </Box>
  ),
  play: async ({ canvas }) => {
    const first = canvas.getByText("Design").getBoundingClientRect();
    const last = canvas.getByText("React").getBoundingClientRect();

    await expect(last.top).toBe(first.top);
  },
};

/**
 * Rendered as a `ul`, the row drops list markers and stays a list for assistive technology
 */
export const AsList: Story = {
  render: () => (
    <Row as="ul" aria-label="Share">
      <li>
        <Text>Email</Text>
      </li>
      <li>
        <Text>Copy link</Text>
      </li>
    </Row>
  ),
};
