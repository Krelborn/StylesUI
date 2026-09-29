import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Box } from "../components/Box";
import { Text } from "../components/Text";
import { focusRingContrast, textContrast } from "../test/colorContrast";

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

const textPairs: readonly ColourPair[] = [
  { background: "background", foreground: "text" },
  { background: "background", foreground: "text-muted" },
  { background: "surface", foreground: "text" },
  { background: "surface", foreground: "text-muted" },
  { background: "background", foreground: "primary" },
  { background: "surface", foreground: "primary" },
  { background: "primary-subtle", foreground: "primary" },
  { background: "primary", foreground: "on-primary" },
  { background: "primary-hover", foreground: "on-primary" },
  { background: "secondary", foreground: "on-secondary" },
  { background: "secondary-hover", foreground: "on-secondary" },
  { background: "success", foreground: "on-success" },
  { background: "warning", foreground: "on-warning" },
  { background: "danger", foreground: "on-danger" },
  { background: "info", foreground: "on-info" },
];

const focusRingBackgrounds = ["background", "surface", "shadow"] as const;

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
 * Every text and background pairing the current theme guarantees, each at least 4.5:1
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

      await expect(textContrast(canvas.getByText(label)), label).toBeGreaterThanOrEqual(4.5);
    }
  },
};

/**
 * The focus ring keeps at least 3:1 against the page, a surface, and the shadow-coloured lip a
 * button's ring crosses in themes where controls have depth
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
