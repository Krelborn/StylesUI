import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../components/Box";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Heading } from "../components/Heading";
import { Text } from "../components/Text";
import type { ThemeMode, ThemeName } from "../components/Theme";
import { Theme } from "../components/Theme";

const combinations: ReadonlyArray<{ mode: ThemeMode; name: ThemeName }> = [
  { mode: "light", name: "default" },
  { mode: "dark", name: "default" },
  { mode: "light", name: "playful" },
  { mode: "dark", name: "playful" },
];

function SampleCard(): JSX.Element {
  return (
    <Card as="article">
      <Heading level={3}>Project update</Heading>
      <Text as="p" style={{ marginTop: "0.5rem" }} tone="muted">
        Colours, radius, spacing and font all come from the active theme.
      </Text>
      <Box style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
      </Box>
    </Card>
  );
}

const meta = {
  title: "Foundations/Theme showcase",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllCombinations: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))" }}>
      {combinations.map(({ mode, name }) => (
        <Theme key={`${name}-${mode}`} mode={mode} name={name} style={{ padding: "1rem" }}>
          <Text size="sm" style={{ display: "block", marginBottom: "0.5rem" }} tone="muted" weight="medium">
            {`${name} / ${mode}`}
          </Text>
          <SampleCard />
        </Theme>
      ))}
    </Box>
  ),
};
