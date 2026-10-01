import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";

import { childrenArgType } from "../../docs/argTypes";
import { focusRingContrast, textContrast } from "../../test/colorContrast";
import { Box } from "../Box";
import { Stack } from "../Stack";
import { Text } from "../Text";

import { SkipLink } from "./SkipLink";

const meta = {
  title: "Navigation/SkipLink",
  component: SkipLink,
  args: {
    children: "Skip to main content",
    href: "#main",
  },
  argTypes: {
    children: childrenArgType,
    href: {
      control: "text",
      description: "Fragment naming the element to skip to, such as `#main`. That element needs the matching `id`.",
      table: { type: { summary: "`#${string}`" } },
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: ({ children, ...args }) => (
    <Stack>
      <SkipLink {...args}>{children}</SkipLink>
      <Text as="p">Press Tab to reveal the skip link.</Text>
      <Box as="main" id="main">
        <Text as="p">The main content of the page.</Text>
      </Box>
    </Stack>
  ),
} satisfies Meta<typeof SkipLink>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Hidden until it receives keyboard focus, so it is the first thing a keyboard user reaches. The
 * `href` names the `main` element below by its `id`.
 */
export const Default: Story = {};

/**
 * Tab focuses the link, which then shows pinned to the top-left of the page with a focus ring
 */
export const KeyboardInteraction: Story = {
  play: async ({ canvas }) => {
    const skipLink = canvas.getByRole("link", { name: "Skip to main content" });

    await expect(skipLink.getBoundingClientRect().width).toBeLessThanOrEqual(1);

    await userEvent.tab();
    await expect(skipLink).toHaveFocus();
    await expect(skipLink.matches(":focus-visible")).toBe(true);
    await expect(getComputedStyle(skipLink).position).toBe("fixed");
    await expect(skipLink.getBoundingClientRect().width).toBeGreaterThan(1);
    await expect(skipLink.getBoundingClientRect().height).toBeGreaterThan(1);
    await expect(parseFloat(getComputedStyle(skipLink).outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(focusRingContrast(skipLink)).toBeGreaterThanOrEqual(3);
    await expect(textContrast(skipLink)).toBeGreaterThanOrEqual(4.5);
  },
};
