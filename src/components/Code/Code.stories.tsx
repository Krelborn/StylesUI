import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { childrenArgType } from "../../docs/argTypes";
import { textContrast } from "../../test/colorContrast";
import { Box } from "../Box";
import { Text } from "../Text";

import { Code } from "./Code";

const unbrokenPath = "src/renderer/components/PullRequestList/PullRequestList.module.css";

const meta = {
  title: "Typography/Code",
  component: Code,
  args: {
    children: "pnpm install",
  },
  argTypes: {
    children: childrenArgType,
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Code>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Inline code inside a sentence, in the monospace font on the sunken colour
 */
export const Default: Story = {
  render: (args) => (
    <Text as="p">
      Run <Code {...args} /> before starting the app.
    </Text>
  ),
  play: async ({ canvas }) => {
    await expect(textContrast(canvas.getByText("pnpm install"))).toBeGreaterThanOrEqual(4.5);
  },
};

/**
 * A long value with no space to break at wraps inside its column instead of overflowing it
 */
export const LongText: Story = {
  render: () => (
    <Box as="section" style={{ inlineSize: "12rem" }} aria-label="Narrow column">
      <Text>
        Edit <Code>{unbrokenPath}</Code>.
      </Text>
    </Box>
  ),
  play: async ({ canvas }) => {
    const column = canvas.getByRole("region", { name: "Narrow column" }).getBoundingClientRect();
    const code = canvas.getByText(unbrokenPath).getBoundingClientRect();

    await expect(code.right).toBeLessThanOrEqual(column.right);
  },
};
