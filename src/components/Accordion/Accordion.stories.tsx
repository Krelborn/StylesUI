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
import { Code } from "../Code";
import { Counter } from "../Counter";
import { Grid } from "../Grid";
import { AddIcon } from "../Icon";
import { IconButton } from "../IconButton";
import { Link } from "../Link";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { TextInput } from "../TextInput";

import type { AccordionProps, AccordionVariant } from "./Accordion";
import { Accordion } from "./Accordion";
import { AccordionItem } from "./AccordionItem";

const sizes: ControlSize[] = ["sm", "md", "lg"];
const variants: AccordionVariant[] = ["flush", "joined", "separated"];

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
 * A settings page: joined items with descriptions, one open at a time
 */
function Settings(props: AccordionProps): JSX.Element {
  return (
    <Box style={{ maxInlineSize: "28rem" }}>
      <Accordion {...props} exclusive={true} size="md" variant="joined">
        <AccordionItem
          description="Mentions, reviews and the weekly digest"
          title="Notifications"
          value="notifications"
        >
          <Text as="p">Mentions arrive at once, and the digest goes out on Monday mornings.</Text>
        </AccordionItem>
        <AccordionItem
          description="Who can see your profile"
          title="Privacy"
          value="privacy"
          data-testid="privacy-item"
        >
          <Text as="p">Your profile is public. Activity is shown only to your organisation.</Text>
        </AccordionItem>
        <AccordionItem description="GitHub and Google" title="Connected accounts" value="accounts">
          <Text as="p">Two accounts are connected.</Text>
        </AccordionItem>
      </Accordion>
    </Box>
  );
}

/**
 * A shop's FAQ: separated cards holding rich answers, any number open
 */
function Faq(props: AccordionProps): JSX.Element {
  return (
    <Box style={{ maxInlineSize: "36rem" }}>
      <Accordion {...props} size="lg" variant="separated">
        <AccordionItem title="How long does delivery take?" value="delivery" data-testid="delivery-item">
          <Stack gap={2}>
            <Text as="p">Orders ship within two working days, and a tracking link arrives by email.</Text>
            <Box as="ul">
              <Box as="li">UK: 1 to 2 days</Box>
              <Box as="li">EU: 3 to 5 days</Box>
            </Box>
            <Text as="p">
              <Link href="#delivery-policy">Read the delivery policy</Link>
            </Text>
          </Stack>
        </AccordionItem>
        <AccordionItem
          description="Up to 30 days after delivery"
          title="Can I return a kit?"
          value="returns"
          data-testid="returns-item"
        >
          <Stack gap={3}>
            <Text as="p">Print the label from your order page and drop the box at any post office.</Text>
            <Box>
              <Button size="sm">Start a return</Button>
            </Box>
          </Stack>
        </AccordionItem>
        <AccordionItem title="Do you ship outside Europe?" value="worldwide">
          <Text as="p">
            Not yet. Use the code <Code>NOTIFY</Code> at checkout to hear when we do.
          </Text>
        </AccordionItem>
        <AccordionItem
          disabled={true}
          title="Gift wrapping"
          trailing="Coming soon"
          value="gifts"
          data-testid="gifts-item"
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
 * Hovers a separated card's toggle with the real pointer and checks the card rises by half the theme's control depth,
 * or stays put when it is disabled
 *
 * @param input the trusted input that moves the pointer
 * @param card the card's element
 * @param testId the card's `data-testid`
 * @param lifts whether the card should rise
 */
async function expectCardLift(input: TrustedInput, card: HTMLElement, testId: string, lifts: boolean): Promise<void> {
  const top = card.getBoundingClientRect().top;
  const depth = parseFloat(getComputedStyle(card).getPropertyValue("--sui-control-depth"));

  await input.hoverByTestId(testId);
  await waitFor(() => expect(card.matches(":hover")).toBe(true));
  await Promise.all(card.getAnimations().map((animation) => animation.finished));

  await expect(card.getBoundingClientRect().top - top, `${testId} lift`).toBeCloseTo(lifts ? -depth / 2 : 0, 1);
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
          {variants.map((variant) => (
            <Accordion {...args} key={variant} size={size} variant={variant}>
              <AccordionItem title={`${variant} ${size}`} value={size}>
                <Text as="p">Content</Text>
              </AccordionItem>
            </Accordion>
          ))}
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
      const button = getComputedStyle(canvas.getByRole("button", { name: `Button ${size}` }));

      for (const variant of variants) {
        const toggle = getComputedStyle(canvas.getByRole("button", { name: `${variant} ${size}` }));

        await expect(
          Math.abs(parseFloat(toggle.paddingTop) - parseFloat(button.paddingTop)),
          `${variant} ${size} padding`
        ).toBeLessThanOrEqual(0.5);
        await expect(
          Math.abs(parseFloat(toggle.paddingBottom) - parseFloat(button.paddingBottom)),
          `${variant} ${size} padding`
        ).toBeLessThanOrEqual(0.5);
        await expect(toggle.fontSize, `${variant} ${size} text`).toBe(button.fontSize);
        await expect(parseFloat(toggle.height), `${variant} ${size} height`).toBeGreaterThanOrEqual(24);
      }
    }
  },
};

/**
 * Joined items for a settings page: one bordered box, a heading-font title with a description, and a chevron after the
 * title that turns up as the item opens. Each panel is a region named by its title, and opening one item closes the
 * other.
 */
export const SettingsPage: Story = {
  args: {
    defaultValue: ["notifications"],
  },
  render: (args) => <Settings {...args} />,
  play: async ({ canvas }) => {
    const notifications = canvas.getByRole("button", { name: "Notifications Mentions, reviews and the weekly digest" });
    const privacy = canvas.getByRole("button", { name: "Privacy Who can see your profile" });

    await expect(canvas.getByRole("region", { name: "Notifications" })).toBeVisible();
    await expect(indicatorOf(notifications).getBoundingClientRect().left).toBeGreaterThanOrEqual(
      canvas.getByText("Notifications").getBoundingClientRect().right
    );
    await expect(getComputedStyle(indicatorOf(notifications)).rotate).toBe("180deg");
    await expect(getComputedStyle(indicatorOf(privacy)).rotate).toBe("none");
    await expectContentAlignedWithTitle(notifications, canvas.getByText("Notifications"));

    await userEvent.click(privacy);
    await expect(privacy).toHaveAttribute("aria-expanded", "true");
    await expect(notifications).toHaveAttribute("aria-expanded", "false");
    await expectContentAlignedWithTitle(privacy, canvas.getByText("Privacy"));
  },
};

/**
 * Separated cards for rich content on a website. Each card is drawn as a Card is, with a chevron in a disc after the
 * title that fills with the primary colour as the card opens. Each panel is a region named by its title.
 */
export const FaqPage: Story = {
  args: {
    defaultValue: ["delivery"],
    headingLevel: 2,
  },
  render: (args) => <Faq {...args} />,
  play: async ({ canvas }) => {
    const delivery = canvas.getByRole("button", { name: "How long does delivery take?" });
    const returns = canvas.getByRole("button", { name: "Can I return a kit? Up to 30 days after delivery" });

    await expect(canvas.getByRole("region", { name: "How long does delivery take?" })).toBeVisible();
    await expect(indicatorOf(delivery).getBoundingClientRect().left).toBeGreaterThanOrEqual(
      canvas.getByText("How long does delivery take?").getBoundingClientRect().right
    );
    await expect(graphicContrast(indicatorOf(delivery)), "open indicator").toBeGreaterThanOrEqual(3);
    await expect(graphicContrast(indicatorOf(returns)), "closed indicator").toBeGreaterThanOrEqual(3);
    await expectContentAlignedWithTitle(delivery, canvas.getByText("How long does delivery take?"));
  },
};

/**
 * Right to left, a closed flush section's chevron points left, a joined or separated item's chevron sits left of its
 * title, and content starts where the title does, from the right
 */
export const RightToLeft: Story = {
  render: (args) => (
    <Stack dir="rtl" gap={6}>
      <Inspector {...args} />
      <Settings defaultValue={["notifications"]} headingLevel={2} />
      <Faq defaultValue={["delivery"]} headingLevel={2} />
    </Stack>
  ),
  play: async ({ canvas }) => {
    const layout = canvas.getByRole("button", { name: "Layout Fixed" });
    const delivery = canvas.getByRole("button", { name: "How long does delivery take?" });
    const notifications = canvas.getByRole("button", { name: "Notifications Mentions, reviews and the weekly digest" });

    await expect(indicatorOf(layout).getBoundingClientRect().left).toBeGreaterThanOrEqual(
      canvas.getByText("Layout").getBoundingClientRect().right
    );
    await expect(getComputedStyle(indicatorOf(canvas.getByRole("button", { name: "Stroke" }))).rotate).toBe("90deg");
    await expectContentAlignedWithTitle(layout, canvas.getByText("Layout"));
    await expectContentAlignedWithTitle(
      canvas.getByRole("button", { name: "Constraints Left, Top" }),
      canvas.getByText("Constraints")
    );
    await expect(indicatorOf(notifications).getBoundingClientRect().right).toBeLessThanOrEqual(
      canvas.getByText("Notifications").getBoundingClientRect().left
    );
    await expectContentAlignedWithTitle(notifications, canvas.getByText("Notifications"));
    await expect(indicatorOf(delivery).getBoundingClientRect().right).toBeLessThanOrEqual(
      canvas.getByText("How long does delivery take?").getBoundingClientRect().left
    );
    await expectContentAlignedWithTitle(delivery, canvas.getByText("How long does delivery take?"));
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
      <Settings headingLevel={2} />
      <Faq headingLevel={2} />
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

    await input.pressKey("Tab");
    await input.pressKey("Tab");
    await input.pressKey("Tab");
    await input.pressKey("Tab");
    await input.pressKey("Tab");
    await input.pressKey("Tab");
    await expectFocusRing(
      canvas.getByRole("button", { name: "Notifications Mentions, reviews and the weekly digest" })
    );
    await userEvent.keyboard("{End}");
    await expectFocusRing(canvas.getByRole("button", { name: "Connected accounts GitHub and Google" }));

    await input.pressKey("Tab");
    await expectFocusRing(canvas.getByRole("button", { name: "How long does delivery take?" }));
    await userEvent.keyboard("{End}");
    await expectFocusRing(canvas.getByRole("button", { name: "Gift wrapping Coming soon" }));
  },
};

/**
 * Hovering a flush or joined toggle tints it with the text colour and pressing darkens the tint, so rest, hover and
 * press can be told apart, while the title and the chevron stay readable. Hovering a separated card lifts it by half
 * the theme's control depth. A disabled item shows no tint and does not move.
 */
export const States: Story = {
  args: {
    defaultValue: [],
  },
  render: (args) => (
    <Stack gap={6}>
      <Inspector {...args} />
      <Settings headingLevel={2} />
      <Faq headingLevel={2} />
    </Stack>
  ),
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    await expectDistinctToggleStates(input, canvas.getByRole("button", { name: "Effects 2" }), "effects-item");
    await expectDistinctToggleStates(
      input,
      canvas.getByRole("button", { name: "Privacy Who can see your profile" }),
      "privacy-item"
    );

    const prototype = canvas.getByRole("button", { name: "Prototype Select a frame" });

    await input.hoverByTestId("prototype-item");
    await waitFor(() => expect(prototype.matches(":hover")).toBe(true));
    await expect(getComputedStyle(prototype).backgroundColor).toBe("rgba(0, 0, 0, 0)");

    await expectCardLift(input, canvas.getByTestId("returns-item"), "returns-item", true);
    await expectCardLift(input, canvas.getByTestId("gifts-item"), "gifts-item", false);
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
