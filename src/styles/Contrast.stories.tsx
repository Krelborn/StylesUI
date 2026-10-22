import type { JSX, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Box } from "../components/Box";
import { Heading } from "../components/Heading";
import { Text } from "../components/Text";
import type { PaletteName } from "../components/Theme";
import { Theme } from "../components/Theme";
import { borderContrast, focusRingContrast, textContrast } from "../test/colorContrast";

import { paletteNames } from "./tokenSource";

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
  { background: `${status}-hover`, foreground: `on-${status}` },
  { background: "background", foreground: `${status}-text` },
  { background: "surface", foreground: `${status}-text` },
  { background: "overlay", foreground: `${status}-text` },
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
  { background: "sunken", foreground: "text" },
  { background: "sunken", foreground: "text-muted" },
  { background: "background", foreground: "primary" },
  { background: "surface", foreground: "primary" },
  { background: "overlay", foreground: "primary" },
  { background: "primary-subtle", foreground: "primary" },
  { background: "primary-subtle", foreground: "text-muted" },
  { background: "primary", foreground: "on-primary" },
  { background: "primary-hover", foreground: "on-primary" },
  { background: "secondary", foreground: "on-secondary" },
  { background: "secondary-hover", foreground: "on-secondary" },
  { background: "success", foreground: "on-success" },
  { background: "warning", foreground: "on-warning" },
  { background: "danger", foreground: "on-danger" },
  { background: "info", foreground: "on-info" },
  { background: "secondary-subtle", foreground: "text" },
  { background: "secondary-subtle", foreground: "text-muted" },
  { background: "tooltip", foreground: "on-tooltip" },
  ...statusTextPairs,
];

const focusRingBackgrounds = [
  "background",
  "surface",
  "field",
  "overlay",
  "sunken",
  "secondary-subtle",
  "shadow",
  "danger-subtle",
  "success-subtle",
  "warning-subtle",
  "info-subtle",
] as const;

const inputBorderBackgrounds = ["background", "surface", "overlay"] as const;

interface PaletteIslandsProps {
  /**
   * Renders the samples for one palette, inside that palette's island
   */
  children: (palette: PaletteName) => ReactNode;
}

/**
 * Renders the same samples once per shipped palette, each in a `Theme` island named after it
 */
function PaletteIslands({ children }: PaletteIslandsProps): JSX.Element {
  return (
    <Box style={{ display: "grid", gap: "1.5rem" }}>
      {paletteNames.map((palette) => (
        <Theme as="section" key={palette} palette={palette} style={{ padding: "1rem" }} aria-label={palette}>
          <Heading level={2} size="md">
            {palette}
          </Heading>
          {children(palette)}
        </Theme>
      ))}
    </Box>
  );
}

function pairLabel(palette: PaletteName, { background, foreground }: ColourPair): string {
  return `${palette}: ${foreground} on ${background}`;
}

function focusRingLabel(palette: PaletteName, background: (typeof focusRingBackgrounds)[number]): string {
  return `${palette}: focus-ring on ${background}`;
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
 * Every text and background pairing each palette guarantees, in the current theme and mode: both tokens are declared,
 * and each pair is at least 4.5:1
 */
export const TextPairs: Story = {
  render: () => (
    <PaletteIslands>
      {(palette) => (
        <Box style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fill, minmax(14rem, 1fr))" }}>
          {textPairs.map((pair) => (
            <Text
              as="p"
              key={pairLabel(palette, pair)}
              style={{
                backgroundColor: `var(--sui-color-${pair.background})`,
                borderRadius: "var(--sui-radius-sm)",
                color: `var(--sui-color-${pair.foreground})`,
                padding: "0.5rem 0.75rem",
              }}
            >
              {pairLabel(palette, pair)}
            </Text>
          ))}
        </Box>
      )}
    </PaletteIslands>
  ),
  play: async ({ canvas }) => {
    for (const palette of paletteNames) {
      for (const pair of textPairs) {
        const label = pairLabel(palette, pair);
        const element = canvas.getByText(label);
        const style = getComputedStyle(element);

        await expect(style.getPropertyValue(`--sui-color-${pair.background}`), `${label} background token`).not.toBe(
          ""
        );
        await expect(style.getPropertyValue(`--sui-color-${pair.foreground}`), `${label} foreground token`).not.toBe(
          ""
        );
        await expect(textContrast(element), label).toBeGreaterThanOrEqual(4.5);
      }
    }
  },
};

/**
 * In every palette, the focus ring keeps at least 3:1 against the page, a surface, a field, an overlay, a sunken
 * chip, the secondary subtle tint a hovered listbox option takes, each status subtle, and the shadow-coloured lip a button's
 * ring crosses in themes where controls have depth
 */
export const FocusRing: Story = {
  render: () => (
    <PaletteIslands>
      {(palette) => (
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
                aria-label={focusRingLabel(palette, background)}
              />
            </Box>
          ))}
        </Box>
      )}
    </PaletteIslands>
  ),
  play: async ({ canvas, canvasElement }) => {
    const controlsHaveDepth = getComputedStyle(canvasElement).getPropertyValue("--sui-control-depth").trim() !== "0px";
    const backgrounds = focusRingBackgrounds.filter((background) => controlsHaveDepth || background !== "shadow");
    const labels = paletteNames.flatMap((palette) =>
      backgrounds.map((background) => focusRingLabel(palette, background))
    );

    for (const label of labels) {
      await expect(focusRingContrast(canvas.getByRole("figure", { name: label })), label).toBeGreaterThanOrEqual(3);
    }
  },
};

/**
 * In every palette, the form control border keeps at least 3:1 against the page, a surface and an overlay
 */
export const InputBorder: Story = {
  render: () => (
    <PaletteIslands>
      {(palette) => (
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
                aria-label={`${palette}: input-border on ${background}`}
              />
            </Box>
          ))}
        </Box>
      )}
    </PaletteIslands>
  ),
  play: async ({ canvas }) => {
    for (const palette of paletteNames) {
      for (const background of inputBorderBackgrounds) {
        const label = `${palette}: input-border on ${background}`;
        const border = canvas.getByRole("figure", { name: label });

        await expect(borderContrast(border), label).toBeGreaterThanOrEqual(3);
      }
    }
  },
};
