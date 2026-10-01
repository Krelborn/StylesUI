import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";

import { borderContrast, focusRingContrast } from "../../test/colorContrast";
import { Button } from "../Button";
import { Field } from "../Field";
import { Row } from "../Row";
import { Stack } from "../Stack";

import { Select } from "./Select";

const sizes = [
  { name: "Small", size: "sm" },
  { name: "Medium", size: "md" },
  { name: "Large", size: "lg" },
] as const;

const countryOptions = (
  <>
    <option value="fr">France</option>
    <option value="jp">Japan</option>
    <option value="nz">New Zealand</option>
  </>
);

const meta = {
  title: "Forms/Select",
  component: Select,
  args: {
    onChange: fn(),
  },
  argTypes: {
    children: {
      control: false,
      description: "Native `option` and `optgroup` elements",
      table: { type: { summary: "ReactNode" } },
    },
    disabled: {
      control: "boolean",
      description: "Prevents choosing an option and dims the select",
      table: { type: { summary: "boolean" } },
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: (args) => (
    <Field label="Country" style={{ maxWidth: "24rem" }}>
      <Select {...args}>{countryOptions}</Select>
    </Field>
  ),
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A native select labelled by the `Field` around it, with a chevron in the text colour
 */
export const Default: Story = {};

/**
 * `size` scales padding and font size in step with `Button`, so a select is as tall as a button of
 * the same size beside it
 */
export const Sizes: Story = {
  render: () => (
    <Stack align="start">
      {sizes.map(({ name, size }) => (
        <Row key={size}>
          <Select size={size} aria-label={name}>
            {countryOptions}
          </Select>
          <Button size={size}>{name}</Button>
        </Row>
      ))}
    </Stack>
  ),
  play: async ({ canvas }) => {
    for (const { name } of sizes) {
      const select = canvas.getByRole("combobox", { name });
      const button = canvas.getByRole("button", { name });

      await expect(select.getBoundingClientRect().height, `${name} select height`).toBe(
        button.getBoundingClientRect().height
      );
    }
  },
};

/**
 * An error on the `Field` marks the select `aria-invalid`, which draws its border in the danger
 * colour
 */
export const Invalid: Story = {
  args: {
    defaultValue: "",
  },
  render: (args) => (
    <Field error="Choose the country the order ships to" label="Country" style={{ maxWidth: "24rem" }}>
      <Select {...args}>
        <option value="">Choose a country</option>
        {countryOptions}
      </Select>
    </Field>
  ),
  play: async ({ canvas }) => {
    const select = canvas.getByRole("combobox", { name: "Country" });

    await expect(select).toBeInvalid();
    await expect(borderContrast(select)).toBeGreaterThanOrEqual(3);
  },
};

/**
 * A disabled select is dimmed, skipped by the keyboard and keeps its value. Disable the `Field`
 * instead to dim its label as well.
 */
export const Disabled: Story = {
  args: {
    defaultValue: "jp",
    disabled: true,
  },
};

/**
 * Tab moves focus to the select and shows a focus ring, choosing an option changes its value, and
 * the next Tab skips a disabled select
 */
export const KeyboardInteraction: Story = {
  render: (args) => (
    <Stack style={{ maxWidth: "24rem" }}>
      <Field label="Country">
        <Select {...args}>{countryOptions}</Select>
      </Field>
      <Field disabled={true} label="Currency">
        <Select>
          <option value="eur">Euro</option>
        </Select>
      </Field>
      <Field label="Delivery">
        <Select>
          <option value="standard">Standard</option>
          <option value="express">Express</option>
        </Select>
      </Field>
    </Stack>
  ),
  play: async ({ args, canvas }) => {
    const country = canvas.getByRole("combobox", { name: "Country" });
    const delivery = canvas.getByRole("combobox", { name: "Delivery" });

    await userEvent.tab();
    await expect(country).toHaveFocus();
    await expect(country.matches(":focus-visible")).toBe(true);
    await expect(parseFloat(getComputedStyle(country).outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(focusRingContrast(country)).toBeGreaterThanOrEqual(3);
    await expect(borderContrast(country)).toBeGreaterThanOrEqual(3);

    await userEvent.selectOptions(country, "Japan");
    await expect(country).toHaveValue("jp");
    await expect(args.onChange).toHaveBeenCalled();

    await userEvent.tab();
    await expect(delivery).toHaveFocus();
  },
};
