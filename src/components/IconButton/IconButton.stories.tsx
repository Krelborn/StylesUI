import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";

import { focusRingContrast } from "../../test/colorContrast";
import type { ButtonSize, ButtonVariant } from "../Button";
import { Cluster } from "../Cluster";
import { RefreshIcon } from "../Icon";

import { IconButton } from "./IconButton";

const sizes: ButtonSize[] = ["sm", "md", "lg"];
const variants: ButtonVariant[] = ["ghost", "outline", "primary", "secondary"];

/**
 * Finds the one element a selector names inside a button
 *
 * @param button the button to search
 * @param selector a CSS selector for a single child of the button
 * @returns the matching element
 * @throws when nothing in the button matches
 */
function findInside(button: HTMLElement, selector: string): Element {
  const element = button.querySelector(selector);

  if (element === null) {
    throw new Error(`No element matches ${selector} inside the button`);
  }

  return element;
}

const meta = {
  title: "Actions/IconButton",
  component: IconButton,
  args: {
    children: <RefreshIcon />,
    label: "Refresh",
    onClick: fn(),
  },
  argTypes: {
    busy: {
      control: "boolean",
      description:
        "Whether the button's action is running. A busy button shows a spinner in place of its icon, keeps its focus and tooltip, and ignores presses.",
      table: { defaultValue: { summary: "false" }, type: { summary: "boolean" } },
    },
    children: {
      control: false,
      description: "The icon, hidden from assistive technology",
      table: { type: { summary: "ReactNode" } },
    },
    size: {
      control: "select",
      description: "Button size, which scales the square",
      options: sizes,
      table: { defaultValue: { summary: "md" }, type: { summary: '"sm" | "md" | "lg"' } },
    },
    variant: {
      control: "select",
      description: "Visual style. The default, `ghost`, has no border and no fill until it is hovered.",
      options: variants,
      table: {
        defaultValue: { summary: "ghost" },
        type: { summary: '"ghost" | "outline" | "primary" | "secondary"' },
      },
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A ghost button showing only an icon, named "Refresh" by its tooltip
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  },
};

/**
 * Every `Button` variant; ghost is the default
 */
export const Variants: Story = {
  render: (args) => (
    <Cluster>
      {variants.map((variant) => (
        <IconButton {...args} key={variant} label={`Refresh ${variant}`} variant={variant} />
      ))}
    </Cluster>
  ),
};

/**
 * Square at each `Button` size; `sm` is still a target of at least 24px
 */
export const Sizes: Story = {
  render: (args) => (
    <Cluster>
      {sizes.map((size) => (
        <IconButton {...args} key={size} label={`Refresh ${size}`} size={size} />
      ))}
    </Cluster>
  ),
  play: async ({ canvas }) => {
    let smallerHeight = 0;

    for (const size of sizes) {
      const { height, width } = canvas.getByRole("button", { name: `Refresh ${size}` }).getBoundingClientRect();

      await expect(Math.abs(height - width), `${size} is square`).toBeLessThan(1);
      await expect(height, `${size} is at least 24px`).toBeGreaterThanOrEqual(24);
      await expect(height, `${size} is taller than the size before it`).toBeGreaterThan(smallerHeight);

      smallerHeight = height;
    }
  },
};

/**
 * `shortcut` shows the key after the label in the tooltip. `aria-keyshortcuts` tells screen readers about it.
 */
export const WithShortcut: Story = {
  args: {
    "aria-keyshortcuts": "Meta+R",
    shortcut: "⌘R",
  },
  play: async ({ canvas }) => {
    await userEvent.tab();

    const tooltip = await canvas.findByRole("tooltip");
    await expect(tooltip).toHaveTextContent("⌘R");
    await expect(canvas.getByRole("button", { name: "Refresh" })).toHaveAttribute("aria-keyshortcuts", "Meta+R");
  },
};

/**
 * While busy, a spinner replaces the icon, even one with colours of its own, and the button keeps its size. Presses
 * are ignored, but the button keeps focus and its tooltip.
 */
export const Busy: Story = {
  args: {
    busy: true,
    children: <RefreshIcon style={{ color: "#dc2626" }} />,
  },
  render: (args) => (
    <Cluster>
      <IconButton {...args} />
      <IconButton {...args} busy={false} label="Refresh idle" />
    </Cluster>
  ),
  play: async ({ args, canvas }) => {
    const busy = canvas.getByRole("button", { name: "Refresh" });
    const idle = canvas.getByRole("button", { name: "Refresh idle" });
    const spinner = findInside(busy, ":scope > svg");

    await expect(busy).toHaveAttribute("aria-disabled", "true");
    await expect(getComputedStyle(findInside(busy, ":scope > span")).opacity).toBe("0");
    await expect(getComputedStyle(findInside(idle, ":scope > span")).opacity).toBe("1");
    await expect(getComputedStyle(spinner).color).not.toBe("rgba(0, 0, 0, 0)");
    await expect(busy.getBoundingClientRect().width).toBeCloseTo(idle.getBoundingClientRect().width, 0);
    await expect(busy.getBoundingClientRect().height).toBeCloseTo(idle.getBoundingClientRect().height, 0);

    await userEvent.tab();
    await expect(busy).toHaveFocus();
    await expect(focusRingContrast(busy)).toBeGreaterThanOrEqual(3);
    await expect(await canvas.findByRole("tooltip", { name: "Refresh" })).toBeInTheDocument();

    await userEvent.click(busy);
    await userEvent.keyboard("{Enter}");
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

/**
 * Tab focuses the button and shows its tooltip at once. The focus ring keeps 3:1, and the target is at least 24px.
 */
export const KeyboardInteraction: Story = {
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole("button", { name: "Refresh" });

    await userEvent.tab();
    await expect(button).toHaveFocus();
    await expect(button.matches(":focus-visible")).toBe(true);
    await expect(focusRingContrast(button)).toBeGreaterThanOrEqual(3);
    await expect(await canvas.findByRole("tooltip", { name: "Refresh" })).toBeInTheDocument();

    const { height, width } = button.getBoundingClientRect();
    await expect(height).toBeGreaterThanOrEqual(24);
    await expect(width).toBeGreaterThanOrEqual(24);

    await userEvent.keyboard("{Enter}");
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
