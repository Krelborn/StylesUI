import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { childrenArgType } from "../../docs/argTypes";
import { textContrast } from "../../test/colorContrast";
import { Box } from "../Box";
import { Card } from "../Card";
import { Stack } from "../Stack";

import { Heading } from "./Heading";

const meta = {
  title: "Typography/Heading",
  component: Heading,
  args: {
    children: "Heading",
    level: 2,
  },
  argTypes: {
    children: childrenArgType,
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Heading>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A level 2 heading at its matching `2xl` size
 */
export const Default: Story = {};

/**
 * Each level renders its `h1`–`h6` element with a default size
 */
export const Levels: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "0.5rem" }}>
      <Heading level={1}>Heading level 1</Heading>
      <Heading level={2}>Heading level 2</Heading>
      <Heading level={3}>Heading level 3</Heading>
      <Heading level={4}>Heading level 4</Heading>
      <Heading level={5}>Heading level 5</Heading>
      <Heading level={6}>Heading level 6</Heading>
    </Box>
  ),
};

/**
 * `size` decouples the visual size from the level, so the document outline stays correct
 */
export const SizeOverride: Story = {
  args: {
    children: "Level 1, small size",
    level: 1,
    size: "lg",
  },
};

/**
 * `muted` quiets a heading that labels a group, such as a sidebar section. Both tones keep 4.5:1 contrast on the
 * page and on a surface.
 */
export const Tones: Story = {
  render: () => (
    <Stack gap={3}>
      <Heading level={2}>Default tone</Heading>
      <Heading level={2} size="xs" tone="muted">
        Muted tone
      </Heading>
      <Card padding="sm">
        <Heading level={3} size="xs" tone="muted">
          Muted tone on a card
        </Heading>
      </Card>
    </Stack>
  ),
  play: async ({ canvas }) => {
    for (const name of ["Default tone", "Muted tone", "Muted tone on a card"]) {
      await expect(textContrast(canvas.getByRole("heading", { name })), name).toBeGreaterThanOrEqual(4.5);
    }
  },
};
