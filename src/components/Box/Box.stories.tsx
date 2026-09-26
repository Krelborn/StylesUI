import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { asArgType, childrenArgType } from "../../docs/argTypes";

import { Box } from "./Box";

const meta = {
  title: "Primitives/Box",
  component: Box,
  args: {
    children: "Box content",
  },
  argTypes: {
    as: asArgType("div", ["div", "section", "article", "button", "a", "span"]),
    children: childrenArgType,
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Box>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Renders a `div` when `as` is omitted
 */
export const Default: Story = {};

/**
 * With `as="button"`, button props such as `onClick` are accepted and type-checked
 */
export const AsButton: Story = {
  args: {
    as: "button",
    children: "Click Me",
    onClick: fn(),
  },
};

/**
 * Any intrinsic element works, along with its ARIA attributes
 */
export const AsSection: Story = {
  args: {
    as: "section",
    "aria-label": "Example section",
  },
};

/**
 * With `as="a"`, anchor props such as `href` are accepted
 */
export const AsLink: Story = {
  render: () => (
    <Box as="a" href="https://example.com">
      Example link
    </Box>
  ),
};
