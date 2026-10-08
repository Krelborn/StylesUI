import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { useState } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import type { ControlSize } from "../../forms";
import { focusRingContrast, resolvedColor, textContrast } from "../../test/colorContrast";
import { Box } from "../Box";
import { Button } from "../Button";
import { Cluster } from "../Cluster";
import { Stack } from "../Stack";
import { Text } from "../Text";

import { Tab } from "./Tab";
import { TabList } from "./TabList";
import { TabPanel } from "./TabPanel";
import type { TabsProps } from "./Tabs";
import { Tabs } from "./Tabs";

const sizes: ControlSize[] = ["sm", "md", "lg"];

function RepositoryTabs(props: TabsProps): JSX.Element {
  return (
    <Tabs {...props}>
      <TabList aria-label="Repository">
        <Tab value="code">Code</Tab>
        <Tab value="issues">Issues</Tab>
        <Tab value="wiki">Wiki</Tab>
      </TabList>
      <TabPanel value="code">
        <Text as="p">The files in the repository.</Text>
      </TabPanel>
      <TabPanel value="issues">
        <Text as="p">Bugs and feature requests.</Text>
      </TabPanel>
      <TabPanel value="wiki">
        <Text as="p">Longer documentation.</Text>
      </TabPanel>
    </Tabs>
  );
}

function colorAlpha(color: string): number {
  const alpha = color.match(/(?:rgba\(.*,|\/)\s*([\d.]+)\s*\)$/)?.[1];

  return alpha === undefined ? 1 : Number(alpha);
}

function indicatorScale(tab: HTMLElement): number {
  return new DOMMatrix(getComputedStyle(tab, "::after").transform).a;
}

// Selecting transitions colours, the bar and the lift over 120ms or a spring, so the settled state is awaited first
async function expectUnderlineState(tab: HTMLElement, selected: boolean): Promise<void> {
  const textColor = resolvedColor(tab, selected ? "var(--sui-color-text)" : "var(--sui-color-text-muted)");

  await waitFor(() => {
    expect(getComputedStyle(tab).color).toBe(textColor);
    expect(indicatorScale(tab)).toBe(selected ? 1 : 0);
  });

  if (selected) {
    const indicator = getComputedStyle(tab, "::after");

    await expect(indicator.backgroundColor).toBe(resolvedColor(tab, "var(--sui-color-primary)"));
    await expect(parseFloat(indicator.height)).toBe(2 * parseFloat(getComputedStyle(tab).borderTopWidth));
  }

  await expect(textContrast(tab)).toBeGreaterThanOrEqual(4.5);
}

async function expectPillState(tab: HTMLElement, selected: boolean): Promise<void> {
  const fill = selected ? resolvedColor(tab, "var(--sui-color-primary)") : "rgba(0, 0, 0, 0)";
  const textColor = resolvedColor(tab, selected ? "var(--sui-color-on-primary)" : "var(--sui-color-text-muted)");
  const lift = selected ? -parseFloat(getComputedStyle(tab).getPropertyValue("--sui-control-depth")) / 2 : 0;

  await waitFor(() => {
    const style = getComputedStyle(tab);

    expect(style.backgroundColor).toBe(fill);
    expect(style.color).toBe(textColor);
    expect(new DOMMatrix(style.transform).m42).toBeCloseTo(lift);
  });

  await expect(textContrast(tab)).toBeGreaterThanOrEqual(4.5);
}

const meta = {
  title: "Navigation/Tabs",
  component: Tabs,
  subcomponents: { Tab, TabList, TabPanel },
  args: {
    defaultValue: "code",
    onValueChange: fn(),
  },
  argTypes: {
    children: {
      control: false,
      description: "One `TabList` and a `TabPanel` for each `Tab`",
      table: { type: { summary: "ReactNode" } },
    },
    defaultValue: {
      control: "text",
      description: "The tab selected at first, which leaves `Tabs` uncontrolled. Give this or `value`.",
      table: { type: { summary: "string" } },
    },
    value: {
      control: false,
      description: "The selected tab, which makes `Tabs` controlled. Give this or `defaultValue`.",
      table: { type: { summary: "string" } },
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: (args) => <RepositoryTabs {...args} />,
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Underlined tabs above their panels. The selected tab is in the text colour over a primary bar; the others are
 * muted. Choosing a tab shows its panel and reports its value.
 */
export const Default: Story = {
  play: async ({ args, canvas }) => {
    const list = canvas.getByRole("tablist", { name: "Repository" });
    const code = canvas.getByRole("tab", { name: "Code" });
    const issues = canvas.getByRole("tab", { name: "Issues" });

    await expect(parseFloat(getComputedStyle(list).borderBottomWidth)).toBe(
      parseFloat(getComputedStyle(code).borderTopWidth)
    );
    await expectUnderlineState(code, true);
    await expectUnderlineState(issues, false);

    await userEvent.click(issues);
    await expect(canvas.getByRole("tabpanel", { name: "Issues" })).toBeVisible();
    await expect(args.onValueChange).toHaveBeenLastCalledWith("issues");
    await expectUnderlineState(issues, true);
    await expectUnderlineState(code, false);
  },
};

/**
 * Pills for switching views in a toolbar. The selected pill is filled with the primary colour and, in `playful`,
 * springs up onto a lip.
 */
export const Pill: Story = {
  args: {
    variant: "pill",
  },
  play: async ({ canvas }) => {
    const list = canvas.getByRole("tablist", { name: "Repository" });
    const code = canvas.getByRole("tab", { name: "Code" });
    const issues = canvas.getByRole("tab", { name: "Issues" });

    await expect(getComputedStyle(list).borderBottomWidth).toBe("0px");
    await expectPillState(code, true);
    await expectPillState(issues, false);

    await userEvent.click(issues);
    await expectPillState(issues, true);
    await expectPillState(code, false);
  },
};

/**
 * `sm`, `md` and `lg` match the `Button` sizes, so a tab is as tall as a button of the same size
 */
export const Sizes: Story = {
  render: () => (
    <Stack gap={4}>
      {sizes.map((size) => (
        <Cluster align="start" gap={3} key={size}>
          <Tabs defaultValue="code" size={size} variant="pill">
            <TabList aria-label={`Repository ${size}`}>
              <Tab value="code">{`Code ${size}`}</Tab>
              <Tab value="issues">{`Issues ${size}`}</Tab>
            </TabList>
            <TabPanel value="code">
              <Text as="p">The files in the repository.</Text>
            </TabPanel>
            <TabPanel value="issues">
              <Text as="p">Bugs and feature requests.</Text>
            </TabPanel>
          </Tabs>
          <Button size={size} variant="secondary">{`Button ${size}`}</Button>
        </Cluster>
      ))}
    </Stack>
  ),
  play: async ({ canvas }) => {
    for (const size of sizes) {
      const tab = canvas.getByRole("tab", { name: `Code ${size}` }).getBoundingClientRect();
      const button = canvas.getByRole("button", { name: `Button ${size}` }).getBoundingClientRect();

      await expect(Math.abs(tab.height - button.height), size).toBeLessThan(1);
      await expect(tab.height, size).toBeGreaterThanOrEqual(24);
    }
  },
};

/**
 * Vertical tabs sit beside their panels. Up and Down move between them, and Left and Right are left to the page.
 */
export const Vertical: Story = {
  args: {
    orientation: "vertical",
  },
  play: async ({ canvas }) => {
    const list = canvas.getByRole("tablist", { name: "Repository" });
    const panel = canvas.getByRole("tabpanel", { name: "Code" });
    const code = canvas.getByRole("tab", { name: "Code" });
    const issues = canvas.getByRole("tab", { name: "Issues" });

    await expect(list).toHaveAttribute("aria-orientation", "vertical");
    await expect(list.getBoundingClientRect().right).toBeLessThanOrEqual(panel.getBoundingClientRect().left);
    await expect(code.getBoundingClientRect().bottom).toBeLessThanOrEqual(issues.getBoundingClientRect().top);

    const borderWidth = parseFloat(getComputedStyle(code).borderTopWidth);
    const indicator = getComputedStyle(code, "::after");

    await expect(parseFloat(indicator.width)).toBe(2 * borderWidth);
    await expect(parseFloat(indicator.height)).toBeCloseTo(code.getBoundingClientRect().height - 2 * borderWidth, 0);
    await expect(getComputedStyle(list).borderBottomWidth).toBe("0px");
    await expect(parseFloat(getComputedStyle(list).borderRightWidth)).toBe(borderWidth);

    await userEvent.click(code);
    await userEvent.keyboard("{ArrowDown}");
    await expect(issues).toHaveFocus();
  },
};

/**
 * With `activation="manual"` the arrow keys only move focus, and a click, Enter or Space selects. Use it when showing
 * a panel is slow.
 */
export const ManualActivation: Story = {
  args: {
    activation: "manual",
  },
  play: async ({ canvas }) => {
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("tab", { name: "Issues" })).toHaveFocus();
    await expect(canvas.getByRole("tab", { name: "Code" })).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByRole("tab", { name: "Issues" })).toHaveAttribute("aria-selected", "true");
  },
};

/**
 * A disabled tab is dimmed and never selected, but the arrow keys still reach it so its label is read
 */
export const Disabled: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabList aria-label="Repository">
        <Tab value="code">Code</Tab>
        <Tab disabled={true} value="issues">
          Issues
        </Tab>
        <Tab value="wiki">Wiki</Tab>
      </TabList>
      <TabPanel value="code">
        <Text as="p">The files in the repository.</Text>
      </TabPanel>
      <TabPanel value="issues">
        <Text as="p">Bugs and feature requests.</Text>
      </TabPanel>
      <TabPanel value="wiki">
        <Text as="p">Longer documentation.</Text>
      </TabPanel>
    </Tabs>
  ),
  play: async ({ canvas }) => {
    const issues = canvas.getByRole("tab", { name: "Issues" });

    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    await expect(issues).toHaveFocus();
    await expect(issues).toHaveAttribute("aria-selected", "false");
    await expect(getComputedStyle(issues).opacity).toBe("1");
    await expect(colorAlpha(getComputedStyle(issues).color)).toBeCloseTo(0.5, 2);
    await expect(getComputedStyle(issues).cursor).toBe("not-allowed");
    await expect(focusRingContrast(issues)).toBeGreaterThanOrEqual(3);

    await userEvent.click(issues);
    await expect(canvas.getByRole("tab", { name: "Code" })).toHaveAttribute("aria-selected", "true");
  },
};

/**
 * A class that sets `display` on a `TabPanel`, such as a flex layout for its content, does not show the panel while
 * its tab is not selected
 */
export const StyledPanels: Story = {
  render: (args) => (
    <>
      <style>{".styledPanel { display: flex; gap: 1rem; }"}</style>
      <Tabs {...args}>
        <TabList aria-label="Repository">
          <Tab value="code">Code</Tab>
          <Tab value="issues">Issues</Tab>
        </TabList>
        <TabPanel className="styledPanel" value="code">
          <Text as="p">The files in the repository.</Text>
        </TabPanel>
        <TabPanel className="styledPanel" value="issues">
          <Text as="p">Bugs and feature requests.</Text>
        </TabPanel>
      </Tabs>
    </>
  ),
  play: async ({ canvas }) => {
    const [codePanel, issuesPanel] = canvas.getAllByRole("tabpanel", { hidden: true });

    await expect(getComputedStyle(codePanel).display).toBe("flex");
    await expect(getComputedStyle(issuesPanel).display).toBe("none");

    await userEvent.click(canvas.getByRole("tab", { name: "Issues" }));
    await expect(getComputedStyle(issuesPanel).display).toBe("flex");
    await expect(getComputedStyle(codePanel).display).toBe("none");
  },
};

function ControlledTabs(args: TabsProps): JSX.Element {
  const [tab, setTab] = useState("code");

  return (
    <Stack gap={3}>
      <RepositoryTabs
        {...args}
        defaultValue={undefined}
        onValueChange={(nextTab) => {
          args.onValueChange?.(nextTab);
          setTab(nextTab);
        }}
        value={tab}
      />
      <Text>Selected: {tab}</Text>
    </Stack>
  );
}

/**
 * `value` makes the tabs controlled: the selection is whatever the parent passes, so update it from `onValueChange`
 */
export const Controlled: Story = {
  render: (args) => <ControlledTabs {...args} />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Wiki" }));
    await expect(canvas.getByText("Selected: wiki")).toBeInTheDocument();
    await expect(canvas.getByRole("tab", { name: "Wiki" })).toHaveAttribute("aria-selected", "true");
  },
};

/**
 * Right to left, the tabs run from the right, so Left moves to the next tab
 */
export const RightToLeft: Story = {
  render: (args) => (
    <Box dir="rtl">
      <RepositoryTabs {...args} />
    </Box>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("tab", { name: "Code" }).getBoundingClientRect().left).toBeGreaterThan(
      canvas.getByRole("tab", { name: "Issues" }).getBoundingClientRect().left
    );

    await userEvent.tab();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(canvas.getByRole("tab", { name: "Issues" })).toHaveFocus();
  },
};

/**
 * Tab enters at the selected tab and the next Tab moves to its panel. The arrow keys move between tabs and wrap,
 * Home and End jump to either end, and both tab and panel show a focus ring.
 */
export const KeyboardInteraction: Story = {
  args: {
    variant: "pill",
  },
  render: (args) => (
    <Stack gap={4}>
      <Button>Before the tabs</Button>
      <RepositoryTabs {...args} />
    </Stack>
  ),
  play: async ({ canvas }) => {
    const code = canvas.getByRole("tab", { name: "Code" });
    const wiki = canvas.getByRole("tab", { name: "Wiki" });

    await userEvent.tab();
    await userEvent.tab();
    await expect(code).toHaveFocus();
    await expect(code.matches(":focus-visible")).toBe(true);
    await expect(parseFloat(getComputedStyle(code).outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(focusRingContrast(code)).toBeGreaterThanOrEqual(3);
    await expect(textContrast(code)).toBeGreaterThanOrEqual(4.5);

    await userEvent.keyboard("{ArrowLeft}");
    await expect(wiki).toHaveFocus();
    await expect(wiki).toHaveAttribute("aria-selected", "true");
    await expectPillState(wiki, true);
    await expect(focusRingContrast(wiki)).toBeGreaterThanOrEqual(3);

    await userEvent.keyboard("{Home}");
    await expect(code).toHaveFocus();

    await userEvent.keyboard("{End}");
    await expect(wiki).toHaveFocus();

    await userEvent.tab();
    const panel = canvas.getByRole("tabpanel", { name: "Wiki" });
    await expect(panel).toHaveFocus();
    await expect(focusRingContrast(panel)).toBeGreaterThanOrEqual(3);
  },
};
