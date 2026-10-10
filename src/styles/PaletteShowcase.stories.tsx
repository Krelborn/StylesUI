import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Alert } from "../components/Alert";
import type { AlertTone } from "../components/Alert";
import { Badge } from "../components/Badge";
import type { BadgeTone } from "../components/Badge";
import { Box } from "../components/Box";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Checkbox } from "../components/Checkbox";
import { Code } from "../components/Code";
import { Field } from "../components/Field";
import { Heading } from "../components/Heading";
import { Kbd } from "../components/Kbd";
import { Listbox, ListboxOption } from "../components/Listbox";
import { NavList, NavListItem } from "../components/NavList";
import { Tab, TabList, TabPanel, Tabs } from "../components/Tabs";
import type { TabsVariant } from "../components/Tabs";
import { Text } from "../components/Text";
import { TextInput } from "../components/TextInput";
import type { PaletteName } from "../components/Theme";
import { Theme } from "../components/Theme";

import { paletteNames } from "./tokenSource";

const alertTones: readonly AlertTone[] = ["info", "success", "warning", "danger"];
const badgeTones: readonly BadgeTone[] = ["neutral", "primary", "info", "success", "warning", "danger"];
const tabsVariants: readonly TabsVariant[] = ["underline", "pill"];

const sampleGrid = { display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))" };
const sampleRow = { alignItems: "center", display: "flex", flexWrap: "wrap", gap: "0.5rem" } as const;

interface PaletteSamplesProps {
  /**
   * Palette the samples render in
   */
  palette: PaletteName;
}

function PaletteSamples({ palette }: PaletteSamplesProps): JSX.Element {
  return (
    <Theme as="section" palette={palette} style={{ padding: "1.5rem" }} aria-label={`${palette} palette`}>
      <Heading level={2} size="lg">
        {palette}
      </Heading>
      <Box style={{ ...sampleGrid, marginTop: "1rem" }}>
        <Box style={{ display: "grid", gap: "1rem" }}>
          <Box style={sampleRow}>
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </Box>
          <Box style={sampleRow}>
            {badgeTones.map((tone) => (
              <Badge key={tone} tone={tone}>
                {tone}
              </Badge>
            ))}
          </Box>
          <Box style={sampleRow}>
            {badgeTones.map((tone) => (
              <Badge key={tone} tone={tone} variant="solid">
                {tone}
              </Badge>
            ))}
          </Box>
          <Field description="Used for receipts only" label="Email">
            <TextInput type="email" />
          </Field>
          <Checkbox>Remember this device</Checkbox>
        </Box>
        <Box style={{ display: "grid", gap: "0.75rem" }}>
          {alertTones.map((tone) => (
            <Alert key={tone} title={`${tone} alert`} tone={tone}>
              Body text sits on the status's subtle tint.
            </Alert>
          ))}
        </Box>
        <Box style={{ display: "grid", gap: "1rem" }}>
          {tabsVariants.map((variant) => (
            <Tabs defaultValue="code" key={variant} variant={variant}>
              <TabList aria-label={`Repository, ${variant} tabs`}>
                <Tab value="code">Code</Tab>
                <Tab value="issues">Issues</Tab>
              </TabList>
              <TabPanel value="code">The code tab is selected.</TabPanel>
              <TabPanel value="issues">The issues tab is selected.</TabPanel>
            </Tabs>
          ))}
          <Card padding="sm">
            <Text as="p">
              Run <Code>pnpm build</Code>, or press <Kbd>⌘</Kbd> <Kbd>B</Kbd>.
            </Text>
          </Card>
        </Box>
        <Box style={{ display: "grid", gap: "1rem" }}>
          <NavList aria-label="Sections">
            <NavListItem href="#overview" aria-current="page">
              Overview
            </NavListItem>
            <NavListItem href="#deployments">Deployments</NavListItem>
          </NavList>
          <Listbox aria-label="Pull requests" defaultValue="build">
            <ListboxOption value="build">Fix the build</ListboxOption>
            <ListboxOption value="tests">Fix the tests</ListboxOption>
            <ListboxOption disabled={true} value="docs">
              Update the docs
            </ListboxOption>
          </Listbox>
        </Box>
      </Box>
    </Theme>
  );
}

const meta = {
  title: "Foundations/Palette showcase",
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The same components in every palette, in the current theme and mode, so a palette's colours can be compared on real
 * buttons, badges, alerts, form controls, tabs, cards, navigation and lists
 */
export const AllPalettes: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "1rem" }}>
      {paletteNames.map((palette) => (
        <PaletteSamples key={palette} palette={palette} />
      ))}
    </Box>
  ),
};
