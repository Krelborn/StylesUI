import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { expect, within } from "storybook/test";

import { borderContrast, resolvedColor, textContrast } from "../../test/colorContrast";
import type { BadgeTone } from "../Badge";
import { Box } from "../Box";
import { Card } from "../Card";
import { Cluster } from "../Cluster";
import { Stack } from "../Stack";
import { Text } from "../Text";

import type { StatusDotVariant } from "./StatusDot";
import { StatusDot } from "./StatusDot";

const tones: BadgeTone[] = ["danger", "info", "neutral", "primary", "success", "warning"];
const variants: StatusDotVariant[] = ["solid", "ring"];

const toneTokens: Record<BadgeTone, string> = {
  danger: "--sui-color-danger-text",
  info: "--sui-color-info-text",
  neutral: "--sui-color-input-border",
  primary: "--sui-color-primary",
  success: "--sui-color-success-text",
  warning: "--sui-color-warning-text",
};

const transparent = "rgba(0, 0, 0, 0)";

const selectionStyle = {
  "--sui-status-dot-color": "currentColor",
  backgroundColor: "var(--sui-color-primary, #2563eb)",
  color: "var(--sui-color-on-primary, #ffffff)",
  padding: "0.5rem",
} as CSSProperties;

function remToPixels(rem: number): number {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

async function expectDrawnDot(
  dot: HTMLElement,
  tone: BadgeTone,
  variant: StatusDotVariant,
  message: string
): Promise<void> {
  const style = getComputedStyle(dot);

  await expect(dot.getBoundingClientRect().width, `${message} width`).toBeCloseTo(remToPixels(0.5), 1);
  await expect(dot.getBoundingClientRect().height, `${message} height`).toBeCloseTo(remToPixels(0.5), 1);
  await expect(style.color, `${message} colour`).toBe(resolvedColor(dot, `var(${toneTokens[tone]})`));

  if (variant === "solid") {
    await expect(style.backgroundColor, `${message} fill`).toBe(style.color);
    await expect(textContrast(dot, "transparent"), message).toBeGreaterThanOrEqual(3);
  } else {
    await expect(style.backgroundColor, `${message} fill`).toBe(transparent);
    await expect(borderContrast(dot), message).toBeGreaterThanOrEqual(3);
  }
}

const meta = {
  title: "Feedback/StatusDot",
  component: StatusDot,
  args: {
    label: "Checks passing",
    tone: "success",
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof StatusDot>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A labelled dot, read by screen readers as an image named "Checks passing"
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const dot = canvas.getByRole("img", { name: "Checks passing" });

    await expect(dot.getBoundingClientRect().width).toBeCloseTo(remToPixels(0.5), 1);
    await expect(getComputedStyle(dot).backgroundColor).not.toBe(transparent);
  },
};

/**
 * Every tone in both variants, on the page and on a card. Each dot keeps 3:1 against what is behind it.
 */
export const Tones: Story = {
  render: () => (
    <Stack>
      {variants.map((variant) => (
        <Cluster as="section" key={variant} aria-label={variant}>
          {tones.map((tone) => (
            <StatusDot key={tone} label={`${tone} ${variant}`} tone={tone} variant={variant} />
          ))}
        </Cluster>
      ))}
      <Card as="section" padding="sm" aria-label="on a card">
        <Cluster>
          {tones.map((tone) => (
            <StatusDot key={tone} label={`${tone} on a card`} tone={tone} />
          ))}
        </Cluster>
      </Card>
    </Stack>
  ),
  play: async ({ canvas }) => {
    for (const variant of variants) {
      const row = within(canvas.getByRole("region", { name: variant }));

      for (const tone of tones) {
        const dot = row.getByRole("img", { name: `${tone} ${variant}` });

        await expectDrawnDot(dot, tone, variant, `${tone} ${variant}`);
      }
    }

    const card = canvas.getByRole("region", { name: "on a card" });

    await expect(getComputedStyle(card).backgroundColor, "card surface").not.toBe(transparent);

    for (const tone of tones) {
      const dot = within(card).getByRole("img", { name: `${tone} on a card` });

      await expectDrawnDot(dot, tone, "solid", `${tone} on a card`);
    }
  },
};

/**
 * A container that sets `--sui-status-dot-color: currentColor` gives the dots inside it its text colour, for a row
 * filled with the primary colour, where no tone keeps 3:1
 */
export const OnSelection: Story = {
  render: () => (
    <Box as="section" style={selectionStyle} aria-label="selected">
      <Cluster align="center">
        {variants.flatMap((variant) =>
          tones.map((tone) => (
            <StatusDot key={`${tone}-${variant}`} label={`${tone} ${variant}`} tone={tone} variant={variant} />
          ))
        )}
      </Cluster>
    </Box>
  ),
  play: async ({ canvas }) => {
    const selection = canvas.getByRole("region", { name: "selected" });
    const selectionColor = getComputedStyle(selection).color;

    for (const variant of variants) {
      for (const tone of tones) {
        const message = `${tone} ${variant}`;
        const dot = within(selection).getByRole("img", { name: message });

        await expect(getComputedStyle(dot).color, `${message} colour`).toBe(selectionColor);

        if (variant === "solid") {
          await expect(getComputedStyle(dot).backgroundColor, `${message} fill`).toBe(selectionColor);
          await expect(textContrast(dot, "transparent"), message).toBeGreaterThanOrEqual(3);
        } else {
          await expect(borderContrast(dot), message).toBeGreaterThanOrEqual(3);
        }
      }
    }
  },
};

/**
 * A dot beside text that already says what it means is decorative: leave out `label` and screen readers skip it
 */
export const Labelled: Story = {
  render: () => (
    <Stack gap={2}>
      <Text>
        <StatusDot label="Checks failing" tone="danger" /> Build
      </Text>
      <Text>
        <StatusDot tone="warning" variant="ring" data-testid="decorative-dot" /> 2 problems
      </Text>
    </Stack>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Checks failing" })).toBeInTheDocument();
    await expect(canvas.getByTestId("decorative-dot")).toHaveAttribute("aria-hidden", "true");
    await expect(canvas.getAllByRole("img")).toHaveLength(1);
  },
};

/**
 * `sm` (0.375rem) and `md` (0.5rem)
 */
export const Sizes: Story = {
  render: () => (
    <Cluster align="center">
      <StatusDot label="Small" size="sm" tone="primary" />
      <StatusDot label="Medium" size="md" tone="primary" />
    </Cluster>
  ),
  play: async ({ canvas }) => {
    const small = canvas.getByRole("img", { name: "Small" }).getBoundingClientRect();
    const medium = canvas.getByRole("img", { name: "Medium" }).getBoundingClientRect();

    await expect(small.width).toBeCloseTo(remToPixels(0.375), 1);
    await expect(small.height).toBeCloseTo(remToPixels(0.375), 1);
    await expect(medium.width).toBeCloseTo(remToPixels(0.5), 1);
    await expect(medium.height).toBeCloseTo(remToPixels(0.5), 1);
  },
};
