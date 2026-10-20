import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { useId } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import type { ControlSize } from "../../forms";
import {
  distinctFillContrast,
  fillContrast,
  focusRingContrast,
  graphicContrast,
  textContrast,
} from "../../test/colorContrast";
import type { TrustedInput } from "../../test/trustedInput";
import { trustedInput } from "../../test/trustedInput";
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
        <AccordionItem title="Effects" trailing={<Counter count={2} />} value="effects" data-testid="effects-item">
          <Text as="p" size="sm">
            Drop shadow, background blur
          </Text>
        </AccordionItem>
        <AccordionItem
          disabled={true}
          title="Prototype"
          trailing="Select a frame"
          value="prototype"
          data-testid="prototype-item"
        />
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

/**
 * Waits for a toggle's fill to finish changing into the state the real pointer has just put it in
 *
 * @param toggle the toggle under the pointer
 * @param state the pseudo-class the pointer applies
 * @returns the toggle's background colour in that state
 */
async function settledToggleFill(toggle: HTMLElement, state: ":active" | ":hover"): Promise<string> {
  await waitFor(() => expect(toggle.matches(state)).toBe(true));
  await Promise.all(toggle.getAnimations().map((animation) => animation.finished));

  return getComputedStyle(toggle).backgroundColor;
}

/**
 * Hovers and then presses an item with the real pointer, and checks that rest, hover and press are fills that can be
 * told apart while the title and the indicator stay readable
 *
 * @param input the trusted input that moves and presses the pointer
 * @param toggle the item's toggle
 * @param testId the item's `data-testid`
 */
async function expectDistinctToggleStates(input: TrustedInput, toggle: HTMLElement, testId: string): Promise<void> {
  await expect(getComputedStyle(toggle).backgroundColor, `${testId} at rest`).toBe("rgba(0, 0, 0, 0)");
  await expect(graphicContrast(indicatorOf(toggle)), `${testId} indicator at rest`).toBeGreaterThanOrEqual(3);

  await input.hoverByTestId(testId);
  const hovered = await settledToggleFill(toggle, ":hover");

  await expect(fillContrast(toggle, "transparent", hovered), `${testId} rest to hover`).toBeGreaterThanOrEqual(
    distinctFillContrast
  );
  await expect(textContrast(toggle), `${testId} hovered title`).toBeGreaterThanOrEqual(4.5);
  await expect(graphicContrast(indicatorOf(toggle)), `${testId} hovered indicator`).toBeGreaterThanOrEqual(3);

  // Synthetic pointer events never apply :active
  await input.holdPointerByTestId(testId);

  try {
    const pressed = await settledToggleFill(toggle, ":active");

    await expect(fillContrast(toggle, hovered, pressed), `${testId} hover to press`).toBeGreaterThanOrEqual(
      distinctFillContrast
    );
    await expect(textContrast(toggle), `${testId} pressed title`).toBeGreaterThanOrEqual(4.5);
  } finally {
    await input.releasePointer();
  }
}

/**
 * Checks a toggle has keyboard focus and shows a focus ring that keeps 3:1
 *
 * @param toggle the toggle that should have focus
 */
async function expectFocusRing(toggle: HTMLElement): Promise<void> {
  await expect(toggle).toHaveFocus();
  await expect(toggle.matches(":focus-visible")).toBe(true);
  await expect(parseFloat(getComputedStyle(toggle).outlineWidth)).toBeGreaterThanOrEqual(2);
  await expect(focusRingContrast(toggle)).toBeGreaterThanOrEqual(3);
}

/**
 * A short FAQ whose closed answer holds a fragment a link can point at
 */
function ReturnsFaq(props: AccordionProps): JSX.Element {
  const policyId = useId();

  return (
    <Stack gap={4}>
      <Accordion {...props}>
        <AccordionItem title="How long does delivery take?" value="delivery">
          <Text as="p">Orders ship within two working days.</Text>
        </AccordionItem>
        <AccordionItem title="Can I return a kit?" value="returns">
          <Text as="p" id={policyId}>
            Returns are free for 30 days after delivery.
          </Text>
        </AccordionItem>
      </Accordion>
      <Text as="p">
        <a href={`#${policyId}`}>Read the returns policy</a>
      </Text>
    </Stack>
  );
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

/**
 * Every toggle and action is in the tab order, and nothing inside a closed section is. Down and Up move between the
 * toggles without wrapping, Home and End go to either end, Enter and Space open and close a section, and a disabled
 * section is reached but never opens. Each toggle shows a focus ring inside its edge.
 */
export const KeyboardInteraction: Story = {
  args: {
    defaultValue: [],
  },
  render: (args) => (
    <Stack gap={4}>
      <Box>
        <Button>Before the inspector</Button>
      </Box>
      <Inspector {...args} />
    </Stack>
  ),
  play: async ({ canvas }) => {
    // Synthetic Tab cannot see that content hidden until found is skipped by the browser's focus navigation
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const layout = canvas.getByRole("button", { name: "Layout Fixed" });
    const fill = canvas.getByRole("button", { name: "Fill" });
    const prototype = canvas.getByRole("button", { name: "Prototype Select a frame" });

    canvas.getByRole("button", { name: "Before the inspector" }).focus();
    await input.pressKey("Tab");
    await expectFocusRing(layout);

    await input.pressKey("Tab");
    await expect(fill).toHaveFocus();
    await input.pressKey("Tab");
    await expect(canvas.getByRole("button", { name: "Add fill" })).toHaveFocus();

    await input.pressKey("Shift+Tab");
    await userEvent.keyboard("{ArrowUp}");
    await expectFocusRing(layout);

    await userEvent.keyboard("{End}");
    await expectFocusRing(prototype);
    await userEvent.keyboard("{Enter}");
    await expect(prototype).toHaveAttribute("aria-expanded", "false");

    await userEvent.keyboard("{Home}");
    await userEvent.keyboard("{Enter}");
    await expect(layout).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard(" ");
    await expect(layout).toHaveAttribute("aria-expanded", "false");

    await userEvent.keyboard("{ArrowDown}");
    await expectFocusRing(fill);
  },
};

/**
 * Hovering a section's toggle tints it with the text colour and pressing darkens the tint, so rest, hover and press
 * can be told apart, while the title and the chevron stay readable. A disabled section shows no tint.
 */
export const States: Story = {
  args: {
    defaultValue: [],
  },
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    await expectDistinctToggleStates(input, canvas.getByRole("button", { name: "Effects 2" }), "effects-item");

    const prototype = canvas.getByRole("button", { name: "Prototype Select a frame" });

    await input.hoverByTestId("prototype-item");
    await waitFor(() => expect(prototype.matches(":hover")).toBe(true));
    await expect(getComputedStyle(prototype).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  },
};

/**
 * A link to text inside a closed section opens that section, because a closed panel is hidden until found. Find in
 * page opens it the same way.
 */
export const FragmentLink: Story = {
  args: {
    defaultValue: [],
    headingLevel: 2,
    size: "md",
  },
  render: (args) => <ReturnsFaq {...args} />,
  play: async ({ canvas }) => {
    const returns = canvas.getByRole("button", { name: "Can I return a kit?" });
    const link = canvas.getByRole("link", { name: "Read the returns policy" });
    const url = window.location.href;

    await expect(returns).toHaveAttribute("aria-expanded", "false");

    try {
      window.location.hash = link.getAttribute("href") ?? "";
      await waitFor(() => expect(returns).toHaveAttribute("aria-expanded", "true"));
      await expect(canvas.getByText("Returns are free for 30 days after delivery.")).toBeVisible();
    } finally {
      window.history.replaceState(window.history.state, "", url);
    }
  },
};
