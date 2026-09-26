import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";

import { Theme } from "./Theme";

const meta = {
  title: "Theming/Theme",
  component: Theme,
  args: {
    children: "Themed content",
    style: { padding: "1rem" },
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Theme>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PlayfulDark: Story = {
  args: {
    mode: "dark",
    theme: "playful",
  },
};

export const NestedIslands: Story = {
  render: () => (
    <Theme mode="light" style={{ padding: "1rem" }} theme="default">
      Default light
      <Theme mode="dark" style={{ marginTop: "1rem", padding: "1rem" }} theme="playful">
        Playful dark
        <Theme mode="light" style={{ marginTop: "1rem", padding: "1rem" }}>
          <Box as="span">Playful light (inherits theme, overrides mode)</Box>
        </Theme>
      </Theme>
    </Theme>
  ),
};
