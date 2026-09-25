import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Box } from "./Box";

const meta = {
  title: "Primitives/Box",
  component: Box,
  args: {
    children: "Box content",
  },
} satisfies Meta<typeof Box>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AsButton: Story = {
  args: {
    as: "button",
    children: "Click Me",
    onClick: fn(),
  },
};

export const AsSection: Story = {
  args: {
    as: "section",
    "aria-label": "Example section",
  },
};

export const AsLink: Story = {
  render: () => (
    <Box as="a" href="https://example.com">
      Example link
    </Box>
  ),
};
