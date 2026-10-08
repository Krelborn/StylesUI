import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import type { ControlSize } from "../../forms";
import { borderContrast, focusRingContrast, resolvedColor, textContrast } from "../../test/colorContrast";
import { Button } from "../Button";
import { Cluster } from "../Cluster";
import { Stack } from "../Stack";

import { Segment } from "./Segment";
import { SegmentedControl } from "./SegmentedControl";

const sizes: ControlSize[] = ["sm", "md", "lg"];

function segmentOf(input: HTMLElement): HTMLElement {
  const segment = input.parentElement;

  if (!segment) {
    throw new Error("The input is not inside a segment");
  }

  return segment;
}

// The track has no role of its own, so it is reached through the segment around the input
function trackOf(input: HTMLElement): HTMLElement {
  const track = segmentOf(input).parentElement;

  if (!track) {
    throw new Error("The segment is not inside a track");
  }

  return track;
}

const transparent = "rgba(0, 0, 0, 0)";

// Checking transitions the fill and text colour over 120ms and the lip over a spring, so the settled state is awaited
async function expectChecked(input: HTMLElement, text: HTMLElement): Promise<void> {
  const track = trackOf(input);
  const depth = parseFloat(getComputedStyle(track).getPropertyValue("--sui-control-depth"));
  const fill = resolvedColor(track, "var(--sui-color-primary)");
  const border = resolvedColor(track, "var(--sui-color-control-border)");
  const lip = `${resolvedColor(track, "var(--sui-color-shadow)")} 0px ${depth}px 0px 0px`;
  const textColor = resolvedColor(track, "var(--sui-color-on-primary)");

  await waitFor(() => {
    const style = getComputedStyle(input);

    expect(style.backgroundColor).toBe(fill);
    expect(style.borderTopColor).toBe(border);
    expect(style.boxShadow).toBe(lip);
    expect(getComputedStyle(text).color).toBe(textColor);
  });

  await expect(textContrast(text, "var(--sui-color-primary)")).toBeGreaterThanOrEqual(4.5);
}

async function expectUnchecked(input: HTMLElement, text: HTMLElement): Promise<void> {
  const textColor = resolvedColor(trackOf(input), "var(--sui-color-text)");

  await waitFor(() => {
    const style = getComputedStyle(input);

    expect(style.backgroundColor).toBe(transparent);
    expect(style.borderTopColor).toBe(transparent);
    expect(style.boxShadow).toBe("none");
    expect(getComputedStyle(text).color).toBe(textColor);
  });
}

async function expectDimmed(input: HTMLElement, text: HTMLElement, dimmed: boolean): Promise<void> {
  const opacity = dimmed ? "0.5" : "1";

  await expect(getComputedStyle(input).opacity, `${text.textContent} input`).toBe(opacity);
  await expect(getComputedStyle(text).opacity, `${text.textContent} text`).toBe(opacity);
  await expect(getComputedStyle(input).cursor, `${text.textContent} cursor`).toBe(dimmed ? "not-allowed" : "pointer");
}

const meta = {
  title: "Forms/SegmentedControl",
  component: SegmentedControl,
  args: {
    defaultValue: "system",
    label: "Appearance",
    onValueChange: fn(),
  },
  argTypes: {
    children: {
      control: false,
      description: "The `Segment`s",
      table: { type: { summary: "ReactNode" } },
    },
    label: {
      control: "text",
      description: "Label for the control, rendered as its `legend`, which names it",
      table: { type: { summary: "ReactNode" } },
      type: { name: "other", required: true, value: "ReactNode" },
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: (args) => (
    <SegmentedControl {...args}>
      <Segment value="light">Light</Segment>
      <Segment value="dark">Dark</Segment>
      <Segment value="system">System</Segment>
    </SegmentedControl>
  ),
} satisfies Meta<typeof SegmentedControl>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Three choices in a bordered track. The selected one is filled with the primary colour, and clicking anywhere on a
 * segment, its text included, selects it.
 */
export const Default: Story = {
  play: async ({ args, canvas }) => {
    const dark = canvas.getByRole("radio", { name: "Dark" });
    const darkText = canvas.getByText("Dark");
    const system = canvas.getByRole("radio", { name: "System" });
    const systemText = canvas.getByText("System");
    const track = trackOf(dark);

    await expect(getComputedStyle(track).borderTopColor).toBe(resolvedColor(track, "var(--sui-color-input-border)"));
    await expect(borderContrast(track)).toBeGreaterThanOrEqual(3);
    await expectChecked(system, systemText);
    await expectUnchecked(dark, darkText);
    // axe only sees the resting state, so the hover fill is measured directly
    await expect(textContrast(darkText, "var(--sui-color-secondary-subtle)")).toBeGreaterThanOrEqual(4.5);

    const segment = segmentOf(dark).getBoundingClientRect();
    await expect(dark.getBoundingClientRect().width).toBeCloseTo(segment.width, 0);
    await expect(dark.getBoundingClientRect().height).toBeCloseTo(segment.height, 0);

    // The text sits above the input, so the click has to reach the input through it
    const { height, left, top, width } = darkText.getBoundingClientRect();
    await expect(document.elementFromPoint(left + width / 2, top + height / 2)).toBe(dark);

    await userEvent.click(dark);
    await expect(dark).toBeChecked();
    await expect(args.onValueChange).toHaveBeenLastCalledWith("dark");
    await expectChecked(dark, darkText);
    await expectUnchecked(system, systemText);
  },
};

/**
 * `sm`, `md` and `lg` sit level with a Button of the same size
 */
export const Sizes: Story = {
  render: (args) => (
    <Stack gap={4}>
      {sizes.map((size) => (
        <Cluster align="end" gap={3} key={size}>
          <SegmentedControl {...args} label={`Appearance ${size}`} size={size}>
            <Segment value="light">Light</Segment>
            <Segment value="dark">Dark</Segment>
            <Segment value="system">System</Segment>
          </SegmentedControl>
          <Button size={size} variant="secondary">{`Button ${size}`}</Button>
        </Cluster>
      ))}
    </Stack>
  ),
  play: async ({ canvas }) => {
    for (const size of sizes) {
      const group = within(canvas.getByRole("radiogroup", { name: `Appearance ${size}` }));
      const light = group.getByRole("radio", { name: "Light" });
      const track = trackOf(light);
      const button = canvas.getByRole("button", { name: `Button ${size}` });
      const depth = parseFloat(getComputedStyle(track).getPropertyValue("--sui-control-depth"));

      await expect(
        Math.abs(track.getBoundingClientRect().height - depth - button.getBoundingClientRect().height),
        size
      ).toBeLessThan(1);
      await expect(light.getBoundingClientRect().width, size).toBeGreaterThanOrEqual(24);
    }
  },
};

/**
 * A disabled segment is dimmed and cannot be selected. `disabled` on the control disables every segment.
 */
export const Disabled: Story = {
  render: (args) => (
    <Stack gap={4}>
      <SegmentedControl {...args}>
        <Segment value="light">Light</Segment>
        <Segment disabled={true} value="dark">
          Dark
        </Segment>
        <Segment value="system">System</Segment>
      </SegmentedControl>
      <SegmentedControl {...args} disabled={true} label="Appearance (disabled)">
        <Segment value="light">Light</Segment>
        <Segment value="dark">Dark</Segment>
        <Segment value="system">System</Segment>
      </SegmentedControl>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const segments = within(canvas.getByRole("radiogroup", { name: "Appearance" }));
    const disabledSegments = within(canvas.getByRole("radiogroup", { name: "Appearance (disabled)" }));
    const dark = segments.getByRole("radio", { name: "Dark" });

    await expect(dark).toBeDisabled();
    await expectDimmed(dark, segments.getByText("Dark"), true);
    await expectDimmed(segments.getByRole("radio", { name: "Light" }), segments.getByText("Light"), false);

    for (const name of ["Light", "Dark", "System"]) {
      const input = disabledSegments.getByRole("radio", { name });

      await expect(input).toBeDisabled();
      await expectDimmed(input, disabledSegments.getByText(name), true);
    }
  },
};

/**
 * An `error` draws the track's border in the danger colour and describes the group
 */
export const WithError: Story = {
  args: {
    defaultValue: undefined,
    error: "Choose an appearance",
    required: true,
  },
  play: async ({ canvas }) => {
    const group = canvas.getByRole("radiogroup", { name: "Appearance" });
    const track = trackOf(canvas.getByRole("radio", { name: "Light" }));

    await expect(group).toHaveAccessibleDescription("Choose an appearance");
    await expect(getComputedStyle(track).borderTopColor).toBe(resolvedColor(track, "var(--sui-color-danger-text)"));
    await expect(borderContrast(track)).toBeGreaterThanOrEqual(3);
  },
};

/**
 * The control is one tab stop. The arrow keys move the selection, the focused segment shows a ring, the track's
 * border keeps 3:1, and the selected segment's text keeps 4.5:1 on the primary fill.
 */
export const KeyboardInteraction: Story = {
  render: (args) => (
    <Stack gap={4}>
      <Button>Before the control</Button>
      <SegmentedControl {...args}>
        <Segment value="light">Light</Segment>
        <Segment value="dark">Dark</Segment>
        <Segment value="system">System</Segment>
      </SegmentedControl>
      <Button>After the control</Button>
    </Stack>
  ),
  play: async ({ args, canvas }) => {
    const system = canvas.getByRole("radio", { name: "System" });
    const light = canvas.getByRole("radio", { name: "Light" });
    const track = trackOf(system);

    await userEvent.tab();
    await userEvent.tab();
    await expect(system).toHaveFocus();
    await expect(system.matches(":focus-visible")).toBe(true);
    await expect(parseFloat(getComputedStyle(system).outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(focusRingContrast(system)).toBeGreaterThanOrEqual(3);
    await expect(borderContrast(track)).toBeGreaterThanOrEqual(3);
    await expectChecked(system, canvas.getByText("System"));

    await userEvent.keyboard("{ArrowRight}");
    await expect(light).toHaveFocus();
    await expect(light).toBeChecked();
    await expect(args.onValueChange).toHaveBeenLastCalledWith("light");
    await expect(focusRingContrast(light)).toBeGreaterThanOrEqual(3);
    await expectChecked(light, canvas.getByText("Light"));
    await expectUnchecked(system, canvas.getByText("System"));

    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "After the control" })).toHaveFocus();
  },
};
