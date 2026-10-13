import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";

import { expectHaloStates, expectOnSpaceScale, textStart } from "../../test/choiceControl";
import { borderContrast, focusRingContrast } from "../../test/colorContrast";
import { trustedInput } from "../../test/trustedInput";
import { Button } from "../Button";
import { Stack } from "../Stack";
import { Text } from "../Text";

import { Radio } from "./Radio";

const meta = {
  title: "Forms/Radio",
  component: Radio,
  args: {
    children: "Pay monthly",
    onChange: fn(),
    value: "monthly",
  },
  argTypes: {
    children: {
      control: "text",
    },
    defaultChecked: {
      control: "boolean",
      description: "Whether the radio starts selected",
      table: { type: { summary: "boolean" } },
    },
    disabled: {
      control: "boolean",
      description: "Prevents selecting and dims the radio and its label",
      table: { type: { summary: "boolean" } },
    },
    value: {
      control: "text",
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Radio>;

export default meta;

type Story = StoryObj<typeof meta>;

const wrappingLabel = "Pay yearly, with two months free and a reminder before each renewal";

/**
 * The children are the label that names the radio, and clicking the label selects it. An unselected
 * radio has a boundary that stands out from the page, and a selected radio fills with the primary
 * colour and shows a dot.
 */
export const Default: Story = {
  play: async ({ args, canvas }) => {
    const radio = canvas.getByRole("radio", { name: "Pay monthly" });

    await expect(radio).not.toBeChecked();
    await expect(borderContrast(radio)).toBeGreaterThanOrEqual(3);

    await userEvent.click(canvas.getByText("Pay monthly"));
    await expect(radio).toBeChecked();
    await expect(args.onChange).toHaveBeenCalled();
  },
};

/**
 * A disabled radio is dimmed along with its label, skipped by the keyboard and keeps its state
 */
export const Disabled: Story = {
  args: {
    defaultChecked: true,
    disabled: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("radio", { name: "Pay monthly" })).toBeDisabled();
    await expect(Number(getComputedStyle(canvas.getByText("Pay monthly")).opacity)).toBeLessThan(1);
  },
};

/**
 * The dot is `--sui-space-4` across and centred halfway between the capital and the lowercase
 * letters of the first line of its label, and the label text starts `--sui-space-6` from it in
 * every theme. Text below a radio lines up with its label when it is padded by
 * `var(--sui-space-6)`.
 */
export const AlignedText: Story = {
  render: (args) => (
    <Stack gap={2} style={{ maxInlineSize: "18rem" }}>
      <Stack gap={0}>
        <Radio {...args} name="billing" />
        <Text as="p" size="sm" style={{ paddingInlineStart: "var(--sui-space-6)" }} tone="muted">
          Cancel any time
        </Text>
      </Stack>
      <Radio name="billing" value="yearly">
        {wrappingLabel}
      </Radio>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const wrappingText = canvas.getByText(wrappingLabel);

    await expect(wrappingText.getBoundingClientRect().height, "the long label wraps").toBeGreaterThan(
      parseFloat(getComputedStyle(wrappingText).lineHeight)
    );

    for (const name of ["Pay monthly", wrappingLabel]) {
      await expectOnSpaceScale(canvas.getByRole<HTMLInputElement>("radio", { name }), canvas.getByText(name));
    }

    await expect(textStart(canvas.getByText("Cancel any time"))).toBeCloseTo(
      textStart(canvas.getByText("Pay monthly")),
      0
    );
  },
};

/**
 * Radios outside a `RadioGroup` that share a `name` behave as one native group. Tab focuses a radio and
 * shows a focus ring, Space selects it, and the arrow keys move the selection. Once one is selected the
 * group is a single tab stop.
 */
export const KeyboardInteraction: Story = {
  render: (args) => (
    <Stack gap={2}>
      <Radio {...args} name="billing" />
      <Radio name="billing" value="yearly">
        Pay yearly
      </Radio>
      <Button>Continue</Button>
    </Stack>
  ),
  play: async ({ args, canvas }) => {
    const monthly = canvas.getByRole("radio", { name: "Pay monthly" });
    const yearly = canvas.getByRole("radio", { name: "Pay yearly" });
    const continueButton = canvas.getByRole("button", { name: "Continue" });

    await userEvent.tab();
    await expect(monthly).toHaveFocus();
    await expect(monthly.matches(":focus-visible")).toBe(true);
    await expect(parseFloat(getComputedStyle(monthly).outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(focusRingContrast(monthly)).toBeGreaterThanOrEqual(3);
    await expect(borderContrast(monthly)).toBeGreaterThanOrEqual(3);

    await userEvent.keyboard(" ");
    await expect(monthly).toBeChecked();
    await expect(args.onChange).toHaveBeenCalled();

    await userEvent.keyboard("{ArrowDown}");
    await expect(yearly).toHaveFocus();
    await expect(yearly).toBeChecked();
    await expect(monthly).not.toBeChecked();

    await userEvent.tab();
    await expect(continueButton).toHaveFocus();

    await userEvent.tab({ shift: true });
    await expect(yearly).toHaveFocus();
  },
};

/**
 * Hovering anywhere on the label tints a halo around the dot that fills the gap before the text,
 * and pressing darkens it. The halo is the text colour around an unselected radio and the primary
 * colour around a selected one, and a disabled radio has none.
 */
export const Halo: Story = {
  render: (args) => (
    <Stack gap={2}>
      <Radio {...args} name="billing">
        <span data-testid="unchecked">Pay monthly</span>
      </Radio>
      <Radio defaultChecked={true} name="billing" value="yearly">
        <span data-testid="checked">Pay yearly</span>
      </Radio>
      <Radio disabled={true} name="billing" value="quarterly">
        <span data-testid="disabled">Pay quarterly</span>
      </Radio>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const input = trustedInput();
    const unchecked = canvas.getByRole<HTMLInputElement>("radio", { name: "Pay monthly" });
    const checked = canvas.getByRole<HTMLInputElement>("radio", { name: "Pay yearly" });
    const disabled = canvas.getByRole<HTMLInputElement>("radio", { name: "Pay quarterly" });

    if (input === null) {
      return;
    }

    await expectHaloStates(input, { checked, disabled, unchecked });
  },
};
