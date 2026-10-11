import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import { childrenArgType } from "../../docs/argTypes";
import { fillContrast, focusRingContrast, textContrast } from "../../test/colorContrast";
import type { TrustedInput } from "../../test/trustedInput";
import { trustedInput } from "../../test/trustedInput";
import { Box } from "../Box";
import { Card } from "../Card";
import { Kbd } from "../Kbd";
import { Row } from "../Row";
import { Stack } from "../Stack";

import type { ButtonVariant } from "./Button";
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

// About the step from white to gray-100, the faintest change of fill that still reads as a new state
const distinctFillContrast = 1.1;

const sizes = ["sm", "md", "lg"] as const;

const statusVariants = ["danger", "warning", "info", "success"] as const;

const outlineVariants = [
  "outline-primary",
  "outline-secondary",
  "outline-danger",
  "outline-warning",
  "outline-info",
  "outline-success",
] as const;

interface VariantRowsProps {
  /**
   * Variants to show, one row each
   */
  variants: readonly ButtonVariant[];
}

/**
 * One row per variant: the button at each size, then disabled and busy, each named for its variant and state
 */
function VariantRows({ variants }: VariantRowsProps): JSX.Element {
  return (
    <Stack gap={3}>
      {variants.map((variant) => (
        <Row align="center" gap={2} key={variant}>
          {sizes.map((size) => (
            <Button key={size} size={size} variant={variant}>
              {`${variant} ${size}`}
            </Button>
          ))}
          <Button disabled={true} variant={variant}>
            {`${variant} disabled`}
          </Button>
          <Button busy={true} variant={variant}>
            {`${variant} busy`}
          </Button>
        </Row>
      ))}
    </Stack>
  );
}

/**
 * Checks that a busy button's spinner is drawn in the text colour its variant has at rest
 *
 * @param idle a button of the variant at rest
 * @param busy a busy button of the same variant
 * @param variant the variant, for the failure message
 */
async function expectSpinnerInTextColour(idle: HTMLElement, busy: HTMLElement, variant: ButtonVariant): Promise<void> {
  const spinner = busy.querySelector("svg");

  await expect(spinner, `${variant} spinner`).not.toBeNull();
  await expect(getComputedStyle(spinner as SVGElement).color, `${variant} spinner colour`).toBe(
    getComputedStyle(idle).color
  );
}

/**
 * Waits for a button's fill to finish changing into the state the real pointer has just put it in
 *
 * @param button the button under the pointer
 * @param state the pseudo-class the pointer applies
 * @returns the button's background colour in that state
 */
async function settledFill(button: HTMLElement, state: ":active" | ":hover"): Promise<string> {
  await waitFor(() => expect(button.matches(state)).toBe(true));
  await Promise.all(button.getAnimations().map((animation) => animation.finished));

  return getComputedStyle(button).backgroundColor;
}

/**
 * Hovers and then presses a button with the real pointer, and checks that rest, hover and press are three fills that
 * can be told apart, each keeping the text readable
 *
 * @param input the trusted input that moves and presses the pointer
 * @param button the button
 * @param testId the button's `data-testid`
 */
async function expectDistinctPointerStates(input: TrustedInput, button: HTMLElement, testId: string): Promise<void> {
  await input.hoverByTestId(testId);
  const hovered = await settledFill(button, ":hover");

  await expect(textContrast(button), `${testId} hovered text`).toBeGreaterThanOrEqual(4.5);
  await expect(fillContrast(button, "transparent", hovered), `${testId} rest to hover`).toBeGreaterThanOrEqual(
    distinctFillContrast
  );

  // Synthetic pointer events never apply :active
  await input.holdPointerByTestId(testId);

  try {
    const pressed = await settledFill(button, ":active");

    await expect(textContrast(button), `${testId} pressed text`).toBeGreaterThanOrEqual(4.5);
    await expect(fillContrast(button, hovered, pressed), `${testId} hover to press`).toBeGreaterThanOrEqual(
      distinctFillContrast
    );
  } finally {
    await input.releasePointer();
  }
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
 * No border, and no fill until hovered, for quiet actions in toolbars and status bars. It stays flat in every theme.
 * Hovering and pressing tint it with its text colour, so both show on the page, on a surface and on any tint.
 */
export const Ghost: Story = {
  args: {
    variant: "ghost",
  },
  render: (args) => (
    <Row gap={2}>
      <Button {...args} data-testid="ghost-on-page">
        On the page
      </Button>
      <Card padding="sm">
        <Button {...args} data-testid="ghost-on-surface">
          On a surface
        </Button>
      </Card>
    </Row>
  ),
  play: async ({ canvas }) => {
    const input = trustedInput();

    for (const testId of ["ghost-on-page", "ghost-on-surface"]) {
      const button = canvas.getByTestId(testId);
      const style = getComputedStyle(button);

      await expect(style.getPropertyValue("--sui-button-depth").trim()).toBe("0px");
      await expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");

      if (input !== null) {
        await expectDistinctPointerStates(input, button, testId);
      }
    }
  },
};

/**
 * Filled in a status colour: `danger` for an action that destroys something, such as deleting, and `warning`, `info`
 * or `success` for an action tied to that status. Each works at every size, disabled and busy, and hovering changes its
 * fill enough to see.
 */
export const StatusVariants: Story = {
  render: () => <VariantRows variants={statusVariants} />,
  play: async ({ canvas }) => {
    for (const variant of statusVariants) {
      const button = canvas.getByRole("button", { name: `${variant} md` });

      await expect(
        fillContrast(button, "var(--sui-button-bg)", "var(--sui-button-bg-hover)"),
        `${variant} rest to hover`
      ).toBeGreaterThanOrEqual(distinctFillContrast);
      await expectSpinnerInTextColour(button, canvas.getByRole("button", { name: `${variant} busy` }), variant);
    }
  },
};

/**
 * Transparent inside a border of any colour, and filled with that colour's subtle tint on hover: `outline-primary` for
 * lower-emphasis actions, `outline-secondary` for neutral ones, and a status outline for a quieter action tied to that
 * status, such as `outline-danger`. Each works at every size, disabled and busy.
 */
export const OutlineVariants: Story = {
  render: () => <VariantRows variants={outlineVariants} />,
  play: async ({ canvas }) => {
    for (const variant of outlineVariants) {
      const button = canvas.getByRole("button", { name: `${variant} md` });

      await expect(getComputedStyle(button).backgroundColor, `${variant} at rest`).toBe("rgba(0, 0, 0, 0)");
      await expectSpinnerInTextColour(button, canvas.getByRole("button", { name: `${variant} busy` }), variant);
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
      {outlineVariants.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
      <Button variant="ghost">Ghost</Button>
      {statusVariants.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
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
