import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import { childrenArgType } from "../../docs/argTypes";
import { focusRingContrast, resolvedColor, textContrast } from "../../test/colorContrast";
import { trustedInput } from "../../test/trustedInput";
import { Box } from "../Box";
import { Card } from "../Card";
import { Kbd } from "../Kbd";
import { Row } from "../Row";

import { Button } from "./Button";

/**
 * Finds the key a button holds
 *
 * @param button the button to search
 * @returns the button's `kbd` element
 * @throws when the button holds no `kbd`
 */
function findKbd(button: HTMLElement): HTMLElement {
  const kbd = button.querySelector("kbd");

  if (kbd === null) {
    throw new Error("The button holds no kbd");
  }

  return kbd;
}

const meta = {
  title: "Actions/Button",
  component: Button,
  args: {
    children: "Button",
    onClick: fn(),
  },
  argTypes: {
    children: childrenArgType,
    disabled: {
      control: "boolean",
      description: "Prevents interaction and dims the button",
      table: { type: { summary: "boolean" } },
    },
    type: {
      control: "select",
      description: "Native button type",
      options: ["button", "submit", "reset"],
      table: { type: { summary: '"button" | "submit" | "reset"' } },
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The default filled button, for the main action in a view
 */
export const Primary: Story = {};

/**
 * Filled in the secondary colour, for actions alongside the primary one
 */
export const Secondary: Story = {
  args: {
    variant: "secondary",
  },
};

/**
 * Primary-coloured outline, for lower-emphasis actions
 */
export const Outline: Story = {
  args: {
    variant: "outline",
  },
};

/**
 * No border, and no fill until hovered, for quiet actions in toolbars and status bars. It stays flat in every theme,
 * and fills with the secondary colour while pressed.
 */
export const Ghost: Story = {
  args: {
    variant: "ghost",
  },
  render: (args) => <Button {...args} data-testid="ghost" />,
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Button" });
    const style = getComputedStyle(button);

    await expect(style.getPropertyValue("--sui-button-depth").trim()).toBe("0px");
    await expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");

    const input = trustedInput();

    if (input === null) {
      return;
    }

    const pressedFill = resolvedColor(button, "var(--sui-color-secondary)");
    const pressedText = resolvedColor(button, "var(--sui-color-on-secondary)");

    // Synthetic pointer events never apply :active
    await input.holdPointerByTestId("ghost");

    try {
      await waitFor(() => {
        expect(style.backgroundColor).toBe(pressedFill);
        expect(style.color).toBe(pressedText);
      });
      await expect(textContrast(button)).toBeGreaterThanOrEqual(4.5);
    } finally {
      await input.releasePointer();
    }
  },
};

/**
 * A disabled button is skipped by the keyboard and ignores clicks
 */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

/**
 * A busy button shows a spinner in place of everything it holds, even a child with colours of its own, and keeps its
 * width. It stays focusable and keeps its name, but ignores presses. Pair it with a status message that announces the
 * outcome.
 */
export const Busy: Story = {
  args: {
    busy: true,
    children: "Save changes",
  },
  render: (args) => (
    <Row gap={2}>
      <Button {...args}>
        {args.children}
        <Kbd aria-hidden={true}>⌘S</Kbd>
      </Button>
      <Button variant={args.variant}>
        Save changes
        <Kbd aria-hidden={true}>⌘S</Kbd>
      </Button>
    </Row>
  ),
  play: async ({ args, canvas }) => {
    // After the Ghost story's trusted press, focus from userEvent.tab() only matches :focus-visible once a trusted key
    // has been pressed
    await trustedInput()?.pressKey("Shift");
    const [busy, idle] = canvas.getAllByRole("button", { name: "Save changes" });
    const spinner = busy.querySelector("svg");

    await expect(busy).toHaveAttribute("aria-disabled", "true");
    await expect(spinner).not.toBeNull();
    await expect(getComputedStyle(findKbd(busy)).opacity).toBe("0");
    await expect(getComputedStyle(findKbd(idle)).opacity).toBe("1");
    await expect(getComputedStyle(spinner as SVGElement).color).not.toBe("rgba(0, 0, 0, 0)");
    await expect(busy.getBoundingClientRect().width).toBeCloseTo(idle.getBoundingClientRect().width, 0);

    await userEvent.tab();
    await expect(busy).toHaveFocus();
    await expect(focusRingContrast(busy)).toBeGreaterThanOrEqual(3);

    await userEvent.click(busy);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

/**
 * `size` scales padding and font size
 */
export const Sizes: Story = {
  render: () => (
    <Box style={{ alignItems: "center", display: "flex", gap: "0.5rem" }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </Box>
  ),
};

/**
 * Every variant keeps at least 4.5:1 text contrast when hovered
 */
export const HoverContrast: Story = {
  render: () => (
    <Box style={{ alignItems: "center", display: "flex", gap: "0.5rem" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Card padding="sm">
        <Button variant="ghost">Ghost on a card</Button>
      </Card>
    </Box>
  ),
  // axe only sees the resting state, so the hover background is measured directly
  play: async ({ canvas }) => {
    for (const button of canvas.getAllByRole("button")) {
      const ratio = textContrast(button, "var(--sui-button-bg-hover)");

      await expect(ratio, `${button.textContent} hover text contrast`).toBeGreaterThanOrEqual(4.5);
    }
  },
};

/**
 * Tab moves focus between enabled buttons and shows a focus ring; Enter and Space activate the focused button
 */
export const KeyboardInteraction: Story = {
  args: {
    children: "Save",
  },
  render: (args) => (
    <Box style={{ display: "flex", gap: "0.5rem" }}>
      <Button {...args} />
      <Button disabled={true}>Delete</Button>
      <Button variant="secondary">Cancel</Button>
    </Box>
  ),
  play: async ({ args, canvas }) => {
    // After the Ghost story's trusted press, focus from userEvent.tab() only matches :focus-visible once a trusted key
    // has been pressed
    await trustedInput()?.pressKey("Shift");
    const save = canvas.getByRole("button", { name: "Save" });
    const cancel = canvas.getByRole("button", { name: "Cancel" });

    await userEvent.tab();
    await expect(save).toHaveFocus();
    await expect(save.matches(":focus-visible")).toBe(true);
    await expect(parseFloat(getComputedStyle(save).outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(focusRingContrast(save)).toBeGreaterThanOrEqual(3);

    await userEvent.tab();
    await expect(cancel).toHaveFocus();

    await userEvent.tab({ shift: true });
    await expect(save).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    await expect(args.onClick).toHaveBeenCalledTimes(1);

    await userEvent.keyboard(" ");
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};
