import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Center } from "../Center";
import { Text } from "../Text";

import { PageLayout } from "./PageLayout";

const meta = {
  title: "Layout/PageLayout",
  component: PageLayout,
  parameters: {
    a11y: { test: "error" },
    docs: { story: { height: "24rem", inline: false } },
    layout: "fullscreen",
  },
} satisfies Meta<typeof PageLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * On a short page the footer still sits at the bottom of the viewport, and a `Center` region still fills the
 * width of a viewport narrower than its column
 */
export const Default: Story = {
  render: (args) => (
    <PageLayout {...args}>
      <Center as="header">
        <Text weight="bold">Field Notes</Text>
      </Center>
      <Center as="main">
        <Text>A short post.</Text>
      </Center>
      <Center as="footer">
        <Text tone="muted">Written in the open</Text>
      </Center>
    </PageLayout>
  ),
  play: async ({ canvas }) => {
    const main = canvas.getByRole("main");
    const layout = main.parentElement;

    if (!layout) {
      throw new Error("Expected the page layout to render");
    }

    const shell = layout.getBoundingClientRect();
    const footer = canvas.getByRole("contentinfo").getBoundingClientRect();

    await expect(shell.height).toBeGreaterThanOrEqual(window.innerHeight - 1);
    await expect(Math.abs(footer.bottom - shell.bottom)).toBeLessThan(1);
    await expect(Math.abs(main.getBoundingClientRect().width - shell.width)).toBeLessThan(1);
  },
};
