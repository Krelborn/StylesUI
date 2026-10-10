import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../components/Box";
import { Heading } from "../components/Heading";
import { Text } from "../components/Text";

import brightPaletteCss from "./palettes/bright.css?raw";
import { declaredTokens, hues, steps } from "./tokenSource";

// Edge colours rather than fills, and Bright's control border is transparent
const unswatchedColours = new Set(["--sui-color-control-border", "--sui-color-shadow"]);
const semanticColours = [...declaredTokens(brightPaletteCss).keys()]
  .filter((name) => name.startsWith("--sui-color-") && !unswatchedColours.has(name))
  .map((name) => name.replace("--sui-color-", ""));
const radii = ["sm", "md", "lg", "full", "control"] as const;
const spaces = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const fontSizes = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"] as const;

interface SwatchProps {
  /**
   * Token name shown under the swatch
   */
  label: string;

  /**
   * CSS colour value painted in the swatch
   */
  value: string;
}

function Swatch({ label, value }: SwatchProps): JSX.Element {
  return (
    <Box style={{ display: "grid", gap: "0.25rem" }}>
      <Box
        style={{
          background: value,
          border: "1px solid var(--sui-color-border)",
          borderRadius: "var(--sui-radius-sm)",
          height: "2.5rem",
        }}
      />
      <Text size="xs" tone="muted">
        {label}
      </Text>
    </Box>
  );
}

const meta = {
  title: "Foundations/Tokens",
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The theme-agnostic colour ramps, from `100` to `900`
 */
export const Ramps: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "1rem" }}>
      {hues.map((hue) => (
        <Box key={hue} style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(9, 1fr)" }}>
          {steps.map((step) => (
            <Swatch key={step} label={`${hue}-${step}`} value={`var(--sui-${hue}-${step})`} />
          ))}
        </Box>
      ))}
    </Box>
  ),
};

/**
 * The semantic colours the current palette and mode set, which components read
 */
export const SemanticColours: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fill, minmax(8rem, 1fr))" }}>
      {semanticColours.map((name) => (
        <Swatch key={name} label={name} value={`var(--sui-color-${name})`} />
      ))}
    </Box>
  ),
};

/**
 * The current theme's radius, spacing and type scale tokens
 */
export const ShapeSpaceType: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "2rem" }}>
      <Heading level={3}>Radius</Heading>
      <Box style={{ display: "flex", gap: "1rem" }}>
        {radii.map((radius) => (
          <Box
            key={radius}
            style={{
              background: "var(--sui-color-primary-subtle)",
              border: "1px solid var(--sui-color-primary)",
              borderRadius: `var(--sui-radius-${radius})`,
              height: "4rem",
              width: "4rem",
            }}
          >
            <Text size="xs">{radius}</Text>
          </Box>
        ))}
      </Box>
      <Heading level={3}>Space</Heading>
      <Box style={{ display: "grid", gap: "0.5rem" }}>
        {spaces.map((space) => (
          <Box key={space} style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            <Text size="xs" style={{ width: "4rem" }} tone="muted">{`space-${space}`}</Text>
            <Box
              style={{ background: "var(--sui-color-primary)", height: "0.75rem", width: `var(--sui-space-${space})` }}
            />
          </Box>
        ))}
      </Box>
      <Heading level={3}>Type scale</Heading>
      <Box style={{ display: "grid", gap: "0.5rem" }}>
        {fontSizes.map((size) => (
          <Heading key={size} level={4} size={size}>{`${size}: The quick brown fox`}</Heading>
        ))}
      </Box>
    </Box>
  ),
};
