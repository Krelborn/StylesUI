import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { childrenArgType } from "../../docs/argTypes";
import { focusRingContrast, textContrast } from "../../test/colorContrast";
import { Box } from "../Box";
import { Cluster } from "../Cluster";
import { Stack } from "../Stack";

import type { BadgeTone, BadgeVariant } from "./Badge";
import { Badge } from "./Badge";

const tones: BadgeTone[] = ["danger", "info", "neutral", "primary", "success", "warning"];
const variants: BadgeVariant[] = ["solid", "subtle"];

const unbrokenWord = "Pneumonoultramicroscopicsilicovolcanoconiosis";

const meta = {
  title: "Feedback/Badge",
  component: Badge,
  args: {
    children: "Beta",
  },
  argTypes: {
    as: {
      control: "select",
      description:
        "Element to render: a `span`, or an `a` or `button` for a badge that links or acts. The badge accepts every prop that element supports, including `ref`.",
      options: ["span", "a", "button"],
      table: {
        defaultValue: { summary: "span" },
        type: { summary: '"a" | "button" | "span"' },
      },
    },
    children: childrenArgType,
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A neutral, subtle badge: a small label for a tag, a status or a count
 */
export const Default: Story = {};

/**
 * Every tone in both variants. `solid` fills with the tone and `subtle` tints the background and
 * colours the text, so neither relies on colour alone: the label says what the badge means.
 */
export const Tones: Story = {
  render: () => (
    <Stack>
      {variants.map((variant) => (
        <Cluster as="section" key={variant} aria-label={variant}>
          {tones.map((tone) => (
            <Badge key={tone} tone={tone} variant={variant}>
              {tone}
            </Badge>
          ))}
        </Cluster>
      ))}
    </Stack>
  ),
  play: async ({ canvas }) => {
    for (const variant of variants) {
      const row = within(canvas.getByRole("region", { name: variant }));

      for (const tone of tones) {
        await expect(textContrast(row.getByText(tone))).toBeGreaterThanOrEqual(4.5);
      }
    }
  },
};

/**
 * `as="a"` renders the badge as a link, for a tag that goes to its own page. It keeps the badge's
 * colours, shows a focus ring and is at least 24px tall so it is a large enough target.
 */
export const AsLink: Story = {
  render: () => (
    <Badge as="a" href="#release-notes" tone="primary" variant="solid">
      Release notes
    </Badge>
  ),
  play: async ({ canvas }) => {
    const badge = canvas.getByRole("link", { name: "Release notes" });

    await expect(getComputedStyle(badge).textDecorationLine).toBe("none");
    await expect(textContrast(badge)).toBeGreaterThanOrEqual(4.5);

    const { height, width } = badge.getBoundingClientRect();
    await expect(height).toBeGreaterThanOrEqual(24);
    await expect(width).toBeGreaterThanOrEqual(24);

    await userEvent.tab();
    await expect(badge).toHaveFocus();
    await expect(badge.matches(":focus-visible")).toBe(true);
    await expect(parseFloat(getComputedStyle(badge).outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(focusRingContrast(badge)).toBeGreaterThanOrEqual(3);
  },
};

/**
 * Text with no space to break at wraps inside the badge instead of pushing it wider than its
 * container
 */
export const LongText: Story = {
  render: () => (
    <Box as="section" aria-label="Narrow column" style={{ inlineSize: "8rem" }}>
      <Badge tone="warning">{unbrokenWord}</Badge>
    </Box>
  ),
  play: async ({ canvas }) => {
    const column = canvas.getByRole("region", { name: "Narrow column" });
    const badge = canvas.getByText(unbrokenWord);

    await expect(badge.getBoundingClientRect().width).toBeLessThanOrEqual(column.getBoundingClientRect().width);
    await expect(badge.scrollWidth).toBeLessThanOrEqual(badge.clientWidth);
  },
};
