import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Heading } from "../Heading";
import { Text } from "../Text";

import { Card } from "./Card";

const meta = {
  title: "Layout/Card",
  component: Card,
  args: {
    children: "Card content",
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Paddings: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "1rem" }}>
      <Card padding="sm">Small padding</Card>
      <Card padding="md">Medium padding</Card>
      <Card padding="lg">Large padding</Card>
    </Box>
  ),
};

export const WithContent: Story = {
  render: () => (
    <Card as="article" style={{ maxWidth: "24rem" }}>
      <Heading level={3}>Project update</Heading>
      <Text as="p" style={{ marginTop: "0.5rem" }} tone="muted">
        The theme system now ships with default and playful themes.
      </Text>
      <Box style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        <Button>Open</Button>
        <Button variant="outline">Dismiss</Button>
      </Box>
    </Card>
  ),
};
