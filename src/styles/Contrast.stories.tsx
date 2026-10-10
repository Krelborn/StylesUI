import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Box } from "../components/Box";
import { Text } from "../components/Text";
import { borderContrast, focusRingContrast, textContrast } from "../test/colorContrast";

interface ColourPair {
  /**
   * Semantic colour painted behind, without its `--sui-color-` prefix
   */
  background: string;

  /**
   * Semantic colour drawn in front, without its `--sui-color-` prefix
   */
  foreground: string;
}

const statuses = ["danger", "success", "warning", "info"] as const;

const statusTextPairs: readonly ColourPair[] = statuses.flatMap((status) => [
  { background: "background", foreground: `${status}-text` },
  { background: "surface", foreground: `${status}-text` },
  { background: `${status}-subtle`, foreground: `${status}-text` },
  { background: `${status}-subtle`, foreground: "text" },
]);

const textPairs: readonly ColourPair[] = [
  { background: "background", foreground: "text" },
  { background: "background", foreground: "text-muted" },
  { background: "surface", foreground: "text" },
  { background: "surface", foreground: "text-muted" },
  { background: "field", foreground: "text" },
  { background: "field", foreground: "text-muted" },
  { background: "overlay", foreground: "text" },
  { background: "overlay", foreground: "text-muted" },
  { background: "background", foreground: "primary" },
  { background: "surface", foreground: "primary" },
  { background: "overlay", foreground: "primary" },
  { background: "primary-subtle", foreground: "primary" },
  { background: "primary", foreground: "on-primary" },
  { background: "primary-hover", foreground: "on-primary" },
  { background: "secondary", foreground: "on-secondary" },
  { background: "secondary-hover", foreground: "on-secondary" },
  { background: "success", foreground: "on-success" },
  { background: "warning", foreground: "on-warning" },
  { background: "danger", foreground: "on-danger" },
  { background: "info", foreground: "on-info" },
  { background: "secondary-subtle", foreground: "text" },
  { background: "tooltip", foreground: "on-tooltip" },
  ...statusTextPairs,
];

const focusRingBackgrounds = [
  "background",
  "surface",
  "overlay",
  "secondary-subtle",
  "shadow",
  "danger-subtle",
  "success-subtle",
  "warning-subtle",
  "info-subtle",
] as const;

const inputBorderBackgrounds = ["background", "surface", "overlay"] as const;

function pairLabel({ background, foreground }: ColourPair): string {
  return `${foreground} on ${background}`;
}

const meta = {
  title: "Foundations/Contrast",
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Every text and background pairing the current theme guarantees: both tokens are declared, and each pair is at
 * least 4.5:1
 */
export const TextPairs: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fill, minmax(14rem, 1fr))" }}>
      {textPairs.map((pair) => (
        <Text
          as="p"
          key={pairLabel(pair)}
          style={{
            backgroundColor: `var(--sui-color-${pair.background})`,
            borderRadius: "var(--sui-radius-sm)",
            color: `var(--sui-color-${pair.foreground})`,
            padding: "0.5rem 0.75rem",
          }}
        >
          {pairLabel(pair)}
        </Text>
      ))}
    </Box>
  ),
  play: async ({ canvas }) => {
    for (const pair of textPairs) {
      const label = pairLabel(pair);
      const element = canvas.getByText(label);
      const style = getComputedStyle(element);

      await expect(style.getPropertyValue(`--sui-color-${pair.background}`), `${label} background token`).not.toBe("");
      await expect(style.getPropertyValue(`--sui-color-${pair.foreground}`), `${label} foreground token`).not.toBe("");
      await expect(textContrast(element), label).toBeGreaterThanOrEqual(4.5);
    }
  },
};

/**
 * The focus ring keeps at least 3:1 against the page, a surface, an overlay, the secondary subtle tint a hovered
 * listbox option takes, each status subtle, and the shadow-coloured lip a button's ring crosses in themes where
 * controls have depth
 */
export const FocusRing: Story = {
  render: () => (
    <Box style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
      {focusRingBackgrounds.map((background) => (
        <Box key={background} style={{ backgroundColor: `var(--sui-color-${background})`, padding: "0.75rem" }}>
          <Box
            as="figure"
            style={{
              height: "2rem",
              outline: "var(--sui-focus-ring-width) solid var(--sui-color-focus-ring)",
              outlineOffset: "2px",
              width: "4rem",
            }}
            aria-label={`focus-ring on ${background}`}
          />
        </Box>
      ))}
    </Box>
  ),
  play: async ({ canvas }) => {
    for (const background of focusRingBackgrounds) {
      const ring = canvas.getByRole("figure", { name: `focus-ring on ${background}` });
      const controlsHaveDepth = getComputedStyle(ring).getPropertyValue("--sui-control-depth").trim() !== "0px";

      if (background === "shadow" && !controlsHaveDepth) {
        continue;
      }

      await expect(focusRingContrast(ring), `focus-ring on ${background}`).toBeGreaterThanOrEqual(3);
    }
  },
};

/**
 * The form control border keeps at least 3:1 against the page, a surface and an overlay
 */
export const InputBorder: Story = {
  render: () => (
    <Box style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
      {inputBorderBackgrounds.map((background) => (
        <Box key={background} style={{ backgroundColor: `var(--sui-color-${background})`, padding: "0.75rem" }}>
          <Box
            as="figure"
            style={{
              border: "var(--sui-border-width) solid var(--sui-color-input-border)",
              height: "2rem",
              width: "4rem",
            }}
            aria-label={`input-border on ${background}`}
          />
        </Box>
      ))}
    </Box>
  ),
  play: async ({ canvas }) => {
    for (const background of inputBorderBackgrounds) {
      const border = canvas.getByRole("figure", { name: `input-border on ${background}` });

      await expect(borderContrast(border), `input-border on ${background}`).toBeGreaterThanOrEqual(3);
    }
  },
};
