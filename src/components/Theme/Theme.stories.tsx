import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { asArgType, childrenArgType } from "../../docs/argTypes";
import { isSameColor } from "../../test/colorContrast";
import { Box } from "../Box";
import { Button } from "../Button";

import { Theme } from "./Theme";

const popPrimary = "light-dark(var(--sui-violet-600), var(--sui-violet-400))";
const brightPrimary = "light-dark(var(--sui-blue-600), var(--sui-blue-400))";
const brightBackground = "light-dark(var(--sui-white), var(--sui-gray-900))";
const brightInk = "var(--sui-gray-900)";
const brightHardShadow = "light-dark(var(--sui-gray-900), var(--sui-gray-600))";
const softShadow = "light-dark(rgb(0 0 0 / 0.12), rgb(0 0 0 / 0.5))";

/**
 * Asserts that a colour token resolves to the expected colour inside a region
 *
 * @param region the region the token is resolved in
 * @param token the semantic colour, without its `--sui-color-` prefix
 * @param expected a CSS colour the token must match
 */
async function expectTokenColor(region: HTMLElement, token: string, expected: string): Promise<void> {
  const label = `${region.getAttribute("aria-label")} ${token}`;

  await expect(isSameColor(region, `var(--sui-color-${token})`, expected), label).toBe(true);
}

const meta = {
  title: "Theming/Theme",
  component: Theme,
  args: {
    children: "Themed content",
    style: { padding: "1rem" },
  },
  argTypes: {
    as: asArgType("div", ["div", "section", "main"]),
    children: childrenArgType,
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Theme>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Switches a subtree to the playful theme in dark mode
 */
export const PlayfulDark: Story = {
  args: {
    mode: "dark",
    theme: "playful",
  },
};

/**
 * Themes and modes nest independently: an inner `Theme` can change the mode and inherit the theme
 */
export const NestedIslands: Story = {
  render: () => (
    <Theme mode="light" style={{ padding: "1rem" }} theme="default">
      Default light
      <Theme mode="dark" style={{ marginTop: "1rem", padding: "1rem" }} theme="playful">
        Playful dark
        <Theme mode="light" style={{ marginTop: "1rem", padding: "1rem" }}>
          <Box as="span">Playful light (inherits theme, overrides mode)</Box>
        </Theme>
      </Theme>
    </Theme>
  ),
};

/**
 * Setting a theme also sets its companion palette: Bright for default and Pop for playful. `palette` overrides it on
 * the same element or on any element inside, and playful's outlines and hard shadows take the colours of whichever
 * palette is in effect. A palette set around a theme does not reach through it, because the theme's companion is
 * nearer.
 */
export const CompanionPalettes: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "1rem" }}>
      <Theme as="section" style={{ padding: "1rem" }} theme="playful" aria-label="Playful">
        <Button>Playful, in Pop</Button>
      </Theme>
      <Theme as="section" palette="bright" style={{ padding: "1rem" }} theme="playful" aria-label="Playful in Bright">
        <Button>Playful in Bright</Button>
      </Theme>
      <Theme as="section" palette="pop" style={{ padding: "1rem" }} theme="default" aria-label="Default in Pop">
        <Button>Default in Pop</Button>
      </Theme>
      <Theme style={{ padding: "1rem" }} theme="playful">
        <Theme as="section" palette="bright" style={{ padding: "1rem" }} aria-label="Bright inside playful">
          <Button>Bright inside playful</Button>
        </Theme>
      </Theme>
      <Theme palette="pop" style={{ padding: "1rem" }}>
        <Theme as="section" style={{ padding: "1rem" }} theme="default" aria-label="Default inside Pop">
          <Button>Default inside Pop</Button>
        </Theme>
      </Theme>
    </Box>
  ),
  play: async ({ canvas }) => {
    const playful = canvas.getByRole("region", { name: "Playful" });
    await expectTokenColor(playful, "primary", popPrimary);

    const playfulInBright = canvas.getByRole("region", { name: "Playful in Bright" });
    await expectTokenColor(playfulInBright, "primary", brightPrimary);
    await expectTokenColor(playfulInBright, "control-border", brightInk);
    await expectTokenColor(playfulInBright, "shadow", brightHardShadow);

    const defaultInPop = canvas.getByRole("region", { name: "Default in Pop" });
    await expectTokenColor(defaultInPop, "primary", popPrimary);
    await expectTokenColor(defaultInPop, "control-border", "transparent");
    await expectTokenColor(defaultInPop, "shadow", softShadow);

    const brightInsidePlayful = canvas.getByRole("region", { name: "Bright inside playful" });
    await expectTokenColor(brightInsidePlayful, "primary", brightPrimary);
    await expectTokenColor(brightInsidePlayful, "control-border", brightInk);
    await expectTokenColor(brightInsidePlayful, "shadow", brightHardShadow);
    await expect(
      isSameColor(brightInsidePlayful, getComputedStyle(brightInsidePlayful).backgroundColor, brightBackground),
      "a palette island paints its own background"
    ).toBe(true);

    const defaultInsidePop = canvas.getByRole("region", { name: "Default inside Pop" });
    await expectTokenColor(defaultInsidePop, "primary", brightPrimary);
    await expectTokenColor(defaultInsidePop, "control-border", "transparent");
  },
};
