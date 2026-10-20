import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { expect, fn } from "storybook/test";

import type { ControlSize } from "../../forms";
import { Box } from "../Box";
import { Button } from "../Button";
import { Counter } from "../Counter";
import { Grid } from "../Grid";
import { AddIcon } from "../Icon";
import { IconButton } from "../IconButton";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { TextInput } from "../TextInput";

import type { AccordionProps } from "./Accordion";
import { Accordion } from "./Accordion";
import { AccordionItem } from "./AccordionItem";

const sizes: ControlSize[] = ["sm", "md", "lg"];

/**
 * A design tool's inspector: dense sections, some with an action beside the toggle, a count, a disabled section and a
 * nested accordion
 */
function Inspector(props: AccordionProps): JSX.Element {
  return (
    <Box style={{ maxInlineSize: "20rem" }}>
      <Accordion {...props}>
        <AccordionItem title="Layout" trailing="Fixed" value="layout">
          <Stack gap={2}>
            <Grid gap={2} minimumItemWidth="6rem">
              <TextInput defaultValue="320" size="sm" aria-label="Width" />
              <TextInput defaultValue="180" size="sm" aria-label="Height" />
            </Grid>
            <Accordion headingLevel={4} size="sm">
              <AccordionItem title="Constraints" trailing="Left, Top" value="constraints">
                <Text as="p" size="sm">
                  Pinned to the left and top of its frame.
                </Text>
              </AccordionItem>
            </Accordion>
          </Stack>
        </AccordionItem>
        <AccordionItem
          actions={
            // oxlint-disable-next-line jsx-a11y/control-has-associated-label -- label names the IconButton
            <IconButton label="Add fill" size="sm">
              <AddIcon />
            </IconButton>
          }
          title="Fill"
          value="fill"
        >
          <Text as="p" size="sm">
            Blue 600 at 100%
          </Text>
        </AccordionItem>
        <AccordionItem
          actions={
            // oxlint-disable-next-line jsx-a11y/control-has-associated-label -- label names the IconButton
            <IconButton label="Add stroke" size="sm">
              <AddIcon />
            </IconButton>
          }
          title="Stroke"
          value="stroke"
        >
          <Text as="p" size="sm">
            No strokes
          </Text>
        </AccordionItem>
        <AccordionItem title="Effects" trailing={<Counter count={2} />} value="effects">
          <Text as="p" size="sm">
            Drop shadow, background blur
          </Text>
        </AccordionItem>
        <AccordionItem disabled={true} title="Prototype" trailing="Select a frame" value="prototype" />
      </Accordion>
    </Box>
  );
}

/**
 * Finds the indicator a toggle draws
 *
 * @param toggle an item's toggle
 * @returns the indicator's svg
 * @throws when the toggle has no indicator
 */
function indicatorOf(toggle: HTMLElement): SVGElement {
  const indicator = toggle.querySelector("svg");

  if (indicator === null) {
    throw new Error("The toggle has no indicator");
  }

  return indicator;
}

/**
 * Finds the element a toggle's panel lays its content out in
 *
 * @param toggle an item's toggle
 * @returns the content element inside the panel the toggle controls
 * @throws when the panel or its content is missing
 */
function contentOf(toggle: HTMLElement): HTMLElement {
  const content = document.getElementById(toggle.getAttribute("aria-controls") ?? "")?.firstElementChild;

  if (!(content instanceof HTMLElement)) {
    throw new Error("The toggle's panel has no content element");
  }

  return content;
}

/**
 * Checks an item's panel content starts where its title does, from the left or, right to left, from the right
 *
 * @param toggle the item's toggle
 * @param title the element holding the item's title
 */
async function expectContentAlignedWithTitle(toggle: HTMLElement, title: HTMLElement): Promise<void> {
  const content = contentOf(toggle);
  const contentBox = content.getBoundingClientRect();
  const titleBox = title.getBoundingClientRect();
  const paddingStart = parseFloat(getComputedStyle(content).paddingInlineStart);
  const rightToLeft = content.matches(":dir(rtl)");
  const contentStart = rightToLeft ? contentBox.right - paddingStart : contentBox.left + paddingStart;

  await expect(Math.abs(contentStart - (rightToLeft ? titleBox.right : titleBox.left))).toBeLessThanOrEqual(0.5);
}

const meta = {
  title: "Disclosure/Accordion",
  component: Accordion,
  subcomponents: { AccordionItem },
  args: {
    defaultValue: ["layout", "fill"],
    headingLevel: 3,
    onValueChange: fn(),
    size: "sm",
  },
  argTypes: {
    children: {
      control: false,
      description: "The `AccordionItem`s",
      table: { type: { summary: "ReactNode" } },
    },
    defaultValue: {
      control: "object",
      description: "Values of the items open at first, which leaves `Accordion` uncontrolled. Defaults to none.",
      table: { type: { summary: "string[]" } },
    },
    value: {
      control: false,
      description: "Values of the open items, which makes `Accordion` controlled. Not accepted with `defaultValue`.",
      table: { type: { summary: "string[]" } },
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: (args) => <Inspector {...args} />,
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Flush sections for an inspector. Each closed section's chevron points the way the text runs and turns down as it
 * opens, and each section's content starts where its title does. Actions sit beside the toggle, a count is read as
 * part of its name, and a disabled section stays in the tab order but never opens.
 */
export const InspectorPanel: Story = {
  play: async ({ canvas }) => {
    const layout = canvas.getByRole("button", { name: "Layout Fixed" });
    const stroke = canvas.getByRole("button", { name: "Stroke" });
    const constraints = canvas.getByRole("button", { name: "Constraints Left, Top" });

    await expect(indicatorOf(layout).getBoundingClientRect().right).toBeLessThanOrEqual(
      canvas.getByText("Layout").getBoundingClientRect().left
    );
    await expect(getComputedStyle(indicatorOf(stroke)).rotate).toBe("-90deg");
    await expect(getComputedStyle(indicatorOf(layout)).rotate).toBe("none");
    await expectContentAlignedWithTitle(layout, canvas.getByText("Layout"));
    await expectContentAlignedWithTitle(canvas.getByRole("button", { name: "Fill" }), canvas.getByText("Fill"));
    await expectContentAlignedWithTitle(constraints, canvas.getByText("Constraints"));
    await expect(canvas.getByRole("button", { name: "Prototype Select a frame" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
  },
};

/**
 * The three sizes, beside a Button of the same size: each header's block padding and text match the Button's
 */
export const Sizes: Story = {
  args: {
    defaultValue: [],
  },
  render: (args) => (
    <Stack gap={6}>
      {sizes.map((size) => (
        <Stack gap={2} key={size}>
          <Accordion {...args} size={size}>
            <AccordionItem title={`Size ${size}`} value={size}>
              <Text as="p">Content</Text>
            </AccordionItem>
          </Accordion>
          <Box>
            <Button size={size} variant="ghost">
              {`Button ${size}`}
            </Button>
          </Box>
        </Stack>
      ))}
    </Stack>
  ),
  play: async ({ canvas }) => {
    for (const size of sizes) {
      const toggle = getComputedStyle(canvas.getByRole("button", { name: `Size ${size}` }));
      const button = getComputedStyle(canvas.getByRole("button", { name: `Button ${size}` }));

      await expect(Math.abs(parseFloat(toggle.paddingTop) - parseFloat(button.paddingTop))).toBeLessThanOrEqual(0.5);
      await expect(Math.abs(parseFloat(toggle.paddingBottom) - parseFloat(button.paddingBottom))).toBeLessThanOrEqual(
        0.5
      );
      await expect(toggle.fontSize).toBe(button.fontSize);
      await expect(parseFloat(toggle.height)).toBeGreaterThanOrEqual(24);
    }
  },
};

/**
 * Right to left, a closed section's chevron points left, and content starts where the title does, from the right
 */
export const RightToLeft: Story = {
  render: (args) => (
    <Box dir="rtl">
      <Inspector {...args} />
    </Box>
  ),
  play: async ({ canvas }) => {
    const layout = canvas.getByRole("button", { name: "Layout Fixed" });

    await expect(indicatorOf(layout).getBoundingClientRect().left).toBeGreaterThanOrEqual(
      canvas.getByText("Layout").getBoundingClientRect().right
    );
    await expect(getComputedStyle(indicatorOf(canvas.getByRole("button", { name: "Stroke" }))).rotate).toBe("90deg");
    await expectContentAlignedWithTitle(layout, canvas.getByText("Layout"));
    await expectContentAlignedWithTitle(
      canvas.getByRole("button", { name: "Constraints Left, Top" }),
      canvas.getByText("Constraints")
    );
  },
};
