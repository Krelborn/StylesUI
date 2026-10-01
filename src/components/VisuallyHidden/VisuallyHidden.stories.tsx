import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { asArgType, childrenArgType } from "../../docs/argTypes";
import { Box } from "../Box";
import { Button } from "../Button";

import { VisuallyHidden } from "./VisuallyHidden";

const meta = {
  title: "Utilities/VisuallyHidden",
  component: VisuallyHidden,
  args: {
    children: "Close",
  },
  argTypes: {
    as: asArgType("span", ["span", "div", "p", "strong", "em", "small"]),
    children: childrenArgType,
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: (args) => (
    <Button>
      <Box as="span" aria-hidden={true}>
        ×
      </Box>
      <VisuallyHidden {...args} />
    </Button>
  ),
} satisfies Meta<typeof VisuallyHidden>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * An icon-only button gets its accessible name from the hidden text, while the glyph is hidden from
 * assistive technology
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Close" })).toBeInTheDocument();

    const hiddenText = canvas.getByText("Close");
    await expect(hiddenText.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  },
};
