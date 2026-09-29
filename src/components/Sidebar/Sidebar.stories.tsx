import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { asArgType } from "../../docs/argTypes";
import { Box } from "../Box";
import { Card } from "../Card";

import { Sidebar } from "./Sidebar";

const meta = {
  title: "Layout/Sidebar",
  component: Sidebar,
  argTypes: {
    as: asArgType("div", ["div", "main", "section"]),
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Sidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Without `sideWidth` the sidebar takes its content width and the main pane takes the rest
 */
export const Default: Story = {
  render: (args) => (
    <Box style={{ width: "360px" }}>
      <Sidebar {...args}>
        <Card padding="sm">Article</Card>
        <Card padding="sm">TOC</Card>
      </Sidebar>
    </Box>
  ),
  play: async ({ canvas }) => {
    const main = canvas.getByText("Article").getBoundingClientRect();
    const side = canvas.getByText("TOC").getBoundingClientRect();

    await expect(side.top).toBe(main.top);
    await expect(main.width).toBeGreaterThan(side.width);
  },
};

/**
 * `side="start"` makes the first child the sidebar
 */
export const SideStart: Story = {
  args: {
    side: "start",
    sideWidth: "8rem",
  },
  render: (args) => (
    <Sidebar {...args}>
      <Card padding="sm">Author</Card>
      <Card padding="sm">Article</Card>
    </Sidebar>
  ),
};

/**
 * With an 8rem sidebar, a 360px container keeps the panes side by side and a 200px container stacks them
 */
export const Stacking: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "1rem" }}>
      <Box style={{ width: "360px" }}>
        <Sidebar sideWidth="8rem">
          <Card padding="sm">Wide main</Card>
          <Card padding="sm">Wide side</Card>
        </Sidebar>
      </Box>
      <Box style={{ width: "200px" }}>
        <Sidebar sideWidth="8rem">
          <Card padding="sm">Narrow main</Card>
          <Card padding="sm">Narrow side</Card>
        </Sidebar>
      </Box>
    </Box>
  ),
  play: async ({ canvas }) => {
    const wideMain = canvas.getByText("Wide main").getBoundingClientRect();
    const wideSide = canvas.getByText("Wide side").getBoundingClientRect();
    const narrowMain = canvas.getByText("Narrow main").getBoundingClientRect();
    const narrowSide = canvas.getByText("Narrow side").getBoundingClientRect();

    await expect(wideSide.top).toBe(wideMain.top);
    await expect(wideSide.left).toBeGreaterThan(wideMain.left);
    await expect(narrowSide.top).toBeGreaterThan(narrowMain.top);
  },
};
