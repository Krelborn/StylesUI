import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { textContrast } from "../../test/colorContrast";
import type { BadgeTone, BadgeVariant } from "../Badge";
import { Cluster } from "../Cluster";
import { Stack } from "../Stack";
import { Text } from "../Text";

import { Counter } from "./Counter";

const tones: BadgeTone[] = ["danger", "info", "neutral", "primary", "success", "warning"];
const variants: BadgeVariant[] = ["solid", "subtle"];

const meta = {
  title: "Feedback/Counter",
  component: Counter,
  args: {
    count: 3,
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Counter>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A neutral, subtle count, such as the number of items in a list
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const counter = canvas.getByText("3");
    const { height } = counter.getBoundingClientRect();

    await expect(height).toBeLessThan(24);
    await expect(parseFloat(getComputedStyle(counter).borderTopLeftRadius)).toBeGreaterThanOrEqual(height);
  },
};

/**
 * Every tone in both variants, in Badge's colours. Each count keeps 4.5:1 text contrast.
 */
export const Tones: Story = {
  render: () => (
    <Stack>
      {variants.map((variant) => (
        <Cluster as="section" key={variant} aria-label={variant}>
          {tones.map((tone, index) => (
            <Counter count={index + 1} key={tone} tone={tone} variant={variant} />
          ))}
        </Cluster>
      ))}
    </Stack>
  ),
  play: async ({ canvas }) => {
    for (const variant of variants) {
      const row = within(canvas.getByRole("region", { name: variant }));

      for (const [index, tone] of tones.entries()) {
        const counter = row.getByText(String(index + 1));

        await expect(textContrast(counter), `${tone} ${variant}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  },
};

/**
 * A count above `max` shows the maximum followed by "+"
 */
export const Max: Story = {
  args: {
    count: 120,
    max: 99,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("99+")).toBeInTheDocument();
  },
};

/**
 * `capped` marks a count known only as a lower bound, such as the first page of search results
 */
export const Capped: Story = {
  args: {
    capped: true,
    count: 30,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("30+")).toBeInTheDocument();
  },
};

/**
 * `hiddenSuffix` gives the number its meaning for screen readers, which read this counter as "3 new"
 */
export const HiddenSuffix: Story = {
  render: () => (
    <Text>
      Inbox <Counter count={3} hiddenSuffix="new" tone="primary" variant="solid" />
    </Text>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText("3").textContent).toBe("3 new");
    await expect(canvas.getByText("new").getBoundingClientRect().width).toBeLessThanOrEqual(1);
  },
};
