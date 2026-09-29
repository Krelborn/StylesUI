import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { asArgType } from "../../docs/argTypes";
import { Heading } from "../Heading";
import { Text } from "../Text";

import { Cover } from "./Cover";

const meta = {
  title: "Layout/Cover",
  component: Cover,
  args: {
    minimumHeight: "20rem",
  },
  argTypes: {
    as: asArgType("div", ["div", "section", "header"]),
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Cover>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A hero with a label pinned to the top, a note pinned to the bottom and the title centred between them
 */
export const Default: Story = {
  args: {
    bottom: <Text tone="muted">Updated weekly</Text>,
    top: <Text tone="muted">Featured</Text>,
  },
  render: ({ bottom, gap, minimumHeight, padding, top }) => (
    <Cover
      as="section"
      bottom={bottom}
      gap={gap}
      minimumHeight={minimumHeight}
      padding={padding}
      top={top}
      aria-label="Welcome"
    >
      <Heading level={1}>Notes on layout</Heading>
    </Cover>
  ),
  play: async ({ canvas }) => {
    const cover = canvas.getByRole("region", { name: "Welcome" }).getBoundingClientRect();
    const title = canvas.getByRole("heading", { name: "Notes on layout" }).getBoundingClientRect();

    await expect(cover.height).toBeGreaterThanOrEqual(320);
    await expect(Math.abs(title.top + title.height / 2 - (cover.top + cover.height / 2))).toBeLessThan(2);
  },
};

/**
 * Without `top` or `bottom` the children are still centred vertically
 */
export const CentredOnly: Story = {
  render: ({ bottom, gap, minimumHeight, padding, top }) => (
    <Cover
      as="section"
      bottom={bottom}
      gap={gap}
      minimumHeight={minimumHeight}
      padding={padding}
      top={top}
      aria-label="Welcome"
    >
      <Heading level={1}>Notes on layout</Heading>
    </Cover>
  ),
  play: async ({ canvas }) => {
    const cover = canvas.getByRole("region", { name: "Welcome" }).getBoundingClientRect();
    const title = canvas.getByRole("heading", { name: "Notes on layout" }).getBoundingClientRect();

    await expect(Math.abs(title.top + title.height / 2 - (cover.top + cover.height / 2))).toBeLessThan(2);
  },
};
