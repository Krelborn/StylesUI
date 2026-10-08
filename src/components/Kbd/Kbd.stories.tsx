import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { childrenArgType } from "../../docs/argTypes";
import { textContrast } from "../../test/colorContrast";
import { Prose } from "../Prose";
import { Text } from "../Text";

import { Kbd } from "./Kbd";

const meta = {
  title: "Typography/Kbd",
  component: Kbd,
  args: {
    children: "K",
  },
  argTypes: {
    children: childrenArgType,
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Kbd>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A shortcut written as one keycap per key
 */
export const Default: Story = {
  render: (args) => (
    <Text as="p">
      Press <Kbd>⌘</Kbd> <Kbd {...args} /> to search.
    </Text>
  ),
  play: async ({ canvas }) => {
    for (const key of ["⌘", "K"]) {
      await expect(textContrast(canvas.getByText(key)), key).toBeGreaterThanOrEqual(4.5);
    }
  },
};

/**
 * A raw `kbd` in Prose, such as one from rendered markdown, looks the same as `Kbd`
 */
export const InProse: Story = {
  render: () => (
    <Prose>
      <p>
        Save with <kbd>Ctrl</kbd> + <kbd>S</kbd>, or search with <Kbd>/</Kbd>.
      </p>
    </Prose>
  ),
  play: async ({ canvas }) => {
    const raw = canvas.getByText("Ctrl");
    const component = canvas.getByText("/");

    for (const key of [raw, component]) {
      await expect(textContrast(key), key.textContent ?? "").toBeGreaterThanOrEqual(4.5);
    }

    await expect(parseFloat(getComputedStyle(component).borderBlockEndWidth)).toBeGreaterThan(
      parseFloat(getComputedStyle(component).borderBlockStartWidth)
    );
    await expect(getComputedStyle(raw).borderBlockEndWidth).toBe(getComputedStyle(component).borderBlockEndWidth);
    await expect(getComputedStyle(raw).borderTopColor).toBe(getComputedStyle(component).borderTopColor);
  },
};
