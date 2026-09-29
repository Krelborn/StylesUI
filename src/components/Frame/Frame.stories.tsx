import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Box } from "../Box";
import { Text } from "../Text";

import { Frame } from "./Frame";

const squareImage = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#4f46e5"/><circle cx="200" cy="200" r="120" fill="#c7d2fe"/></svg>'
)}`;

const meta = {
  title: "Layout/Frame",
  component: Frame,
  parameters: {
    a11y: { test: "error" },
  },
  render: (args) => (
    <Box style={{ width: "320px" }}>
      <Frame {...args}>
        <img alt="Abstract circle" src={squareImage} />
      </Frame>
    </Box>
  ),
} satisfies Meta<typeof Frame>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A square image cropped to the default 16:9 frame, filling it edge to edge
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const image = canvas.getByRole("img", { name: "Abstract circle" });
    const frame = image.parentElement;

    if (!frame) {
      throw new Error("Expected the frame to render");
    }

    const frameBox = frame.getBoundingClientRect();
    const imageBox = image.getBoundingClientRect();

    await expect(Math.abs(frameBox.height - (frameBox.width * 9) / 16)).toBeLessThan(1);
    await expect(Math.abs(imageBox.width - frameBox.width)).toBeLessThan(1);
    await expect(Math.abs(imageBox.height - frameBox.height)).toBeLessThan(1);
  },
};

/**
 * `ratio` sets any width-to-height ratio
 */
export const FourByThree: Story = {
  args: {
    ratio: "4 / 3",
  },
};

/**
 * For a caption, the frame goes inside a `figure` so the caption is not cropped
 */
export const WithCaption: Story = {
  render: () => (
    <Box as="figure" style={{ margin: 0, width: "320px" }}>
      <Frame>
        <img alt="Abstract circle" src={squareImage} />
      </Frame>
      <Text as="figcaption" size="sm" tone="muted">
        The circle is cropped, the caption is not.
      </Text>
    </Box>
  ),
};
