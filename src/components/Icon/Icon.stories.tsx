import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties, JSX } from "react";
import { expect } from "storybook/test";

import { Box } from "../Box";
import { Cluster } from "../Cluster";
import { IconButton } from "../IconButton";
import { Row } from "../Row";
import { Stack } from "../Stack";
import { Text } from "../Text";

import { AddIcon } from "./AddIcon";
import { ChevronDownIcon } from "./ChevronDownIcon";
import { CloseIcon } from "./CloseIcon";
import { DeleteIcon } from "./DeleteIcon";
import type { IconProps } from "./Icon";
import { InfoIcon } from "./InfoIcon";
import { MoreHorizontalIcon } from "./MoreHorizontalIcon";
import { MoreVerticalIcon } from "./MoreVerticalIcon";
import { RefreshIcon } from "./RefreshIcon";
import { RemoveIcon } from "./RemoveIcon";
import { SendIcon } from "./SendIcon";

interface GalleryIcon {
  /**
   * The icon component
   */
  Component: (props: IconProps) => JSX.Element;

  /**
   * The component's name, shown beside it
   */
  name: string;
}

const icons: GalleryIcon[] = [
  { Component: AddIcon, name: "AddIcon" },
  { Component: ChevronDownIcon, name: "ChevronDownIcon" },
  { Component: CloseIcon, name: "CloseIcon" },
  { Component: DeleteIcon, name: "DeleteIcon" },
  { Component: InfoIcon, name: "InfoIcon" },
  { Component: MoreHorizontalIcon, name: "MoreHorizontalIcon" },
  { Component: MoreVerticalIcon, name: "MoreVerticalIcon" },
  { Component: RefreshIcon, name: "RefreshIcon" },
  { Component: RemoveIcon, name: "RemoveIcon" },
  { Component: SendIcon, name: "SendIcon" },
];

const fontSizes = [16, 24, 32];

const ownColour = "rgb(185, 28, 28)";

const idleButtons = [
  { label: "Close", testId: "close-icon" },
  { label: "Refresh", testId: "refresh-icon" },
];

const meta = {
  title: "Foundations/Icons",
  component: CloseIcon,
  subcomponents: {
    AddIcon,
    ChevronDownIcon,
    DeleteIcon,
    InfoIcon,
    MoreHorizontalIcon,
    MoreVerticalIcon,
    RefreshIcon,
    RemoveIcon,
    SendIcon,
  },
  parameters: {
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Icons drawn in round strokes in `currentColor`, 1em square, so each takes the size and colour of the text around it. Import each icon by name, so a bundle holds only the icons it uses. An icon is hidden from assistive technology unless it has a `label`. `--sui-icon-stroke-width`, set by each theme and overridable on any element, sets the stroke weight. The artwork is from [Lucide](https://lucide.dev), under the licence in `LICENSE`.",
      },
    },
  },
} satisfies Meta<typeof CloseIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Every icon at three font sizes. Each is 1em square, so it matches the size of the text around it.
 */
export const Gallery: Story = {
  render: () => (
    <Stack>
      {icons.map(({ Component, name }) => (
        <Cluster align="center" as="section" key={name} aria-label={name}>
          {fontSizes.map((fontSize) => (
            <Component key={fontSize} style={{ fontSize }} data-testid={`${name}-${fontSize}`} />
          ))}
          <Text>{name}</Text>
        </Cluster>
      ))}
    </Stack>
  ),
  play: async ({ canvas }) => {
    for (const { name } of icons) {
      for (const fontSize of fontSizes) {
        const box = canvas.getByTestId(`${name}-${fontSize}`).getBoundingClientRect();

        await expect(box.width, `${name} at ${fontSize}px wide`).toBeCloseTo(fontSize, 1);
        await expect(box.height, `${name} at ${fontSize}px high`).toBeCloseTo(fontSize, 1);
      }
    }
  },
};

/**
 * An icon that carries meaning on its own takes a `label`, which makes it an image named by the label
 */
export const Labelled: Story = {
  args: {
    label: "Close",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Close" })).toBeInTheDocument();
  },
};

/**
 * An icon in running text sits on the line beside the words, and takes the text's size and colour, in body and muted
 * text alike, unless it is given a colour of its own
 */
export const InText: Story = {
  render: () => (
    <Stack>
      <Text as="p" data-testid="body-text">
        Press <RefreshIcon data-testid="body-icon" /> to load the latest results.
      </Text>
      <Text as="p" size="sm" tone="muted" data-testid="muted-text">
        Dismiss a banner with <CloseIcon data-testid="muted-icon" /> once you have read it.
      </Text>
      <Text as="p">
        An icon can take a colour of its own: <CloseIcon style={{ color: ownColour }} data-testid="own-colour-icon" />
      </Text>
    </Stack>
  ),
  play: async ({ canvas }) => {
    for (const name of ["body", "muted"]) {
      const text = canvas.getByTestId(`${name}-text`);
      const icon = canvas.getByTestId(`${name}-icon`);
      const fontSize = parseFloat(getComputedStyle(text).fontSize);
      const firstLineBottom = text.getBoundingClientRect().top + parseFloat(getComputedStyle(text).lineHeight);

      await expect(getComputedStyle(icon).stroke, `${name} colour`).toBe(getComputedStyle(text).color);
      await expect(icon.getBoundingClientRect().height, `${name} size`).toBeCloseTo(fontSize, 1);
      await expect(icon.getBoundingClientRect().bottom, `${name} on the first line`).toBeLessThanOrEqual(
        firstLineBottom
      );
    }

    await expect(getComputedStyle(canvas.getByTestId("own-colour-icon")).stroke).toBe(ownColour);
  },
};

/**
 * An icon beside text that wraps, in a row too narrow for both, keeps its 1em square rather than giving way to the
 * text
 */
export const InNarrowRow: Story = {
  render: () => (
    <Row style={{ inlineSize: "8rem" }}>
      <CloseIcon data-testid="icon" />
      <Text>A label far too long to fit beside the icon on one line</Text>
    </Row>
  ),
  play: async ({ canvas }) => {
    const icon = canvas.getByTestId("icon");
    const fontSize = parseFloat(getComputedStyle(icon).fontSize);

    await expect(icon.getBoundingClientRect().width).toBeCloseTo(fontSize, 1);
  },
};

/**
 * An icon that points the way the text runs, such as SendIcon, is mirrored in right-to-left text, within its own box
 * and alongside any transform it is given. Other icons, such as RefreshIcon, keep their artwork.
 */
export const RightToLeft: Story = {
  render: () => (
    <Stack>
      <Cluster align="center" dir="ltr">
        <SendIcon style={{ fontSize: 32 }} data-testid="ltr-send" />
        <Text>Left to right</Text>
      </Cluster>
      <Cluster align="center" dir="rtl">
        <SendIcon style={{ fontSize: 32 }} data-testid="rtl-send" />
        <SendIcon style={{ fontSize: 32, transform: "rotate(90deg)" }} data-testid="rtl-rotated-send" />
        <RefreshIcon style={{ fontSize: 32 }} data-testid="rtl-refresh" />
        <Text>Right to left</Text>
      </Cluster>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const mirror = "matrix(-1, 0, 0, 1, 24, 0)";
    const rtlSend = canvas.getByTestId("rtl-send");
    const rtlSendBox = rtlSend.getBoundingClientRect();
    const rtlGlyphBox = glyphOf(rtlSend).getBoundingClientRect();
    const rotatedSend = canvas.getByTestId("rtl-rotated-send");

    await expect(getComputedStyle(glyphOf(canvas.getByTestId("ltr-send"))).transform).toBe("none");
    await expect(getComputedStyle(glyphOf(rtlSend)).transform).toBe(mirror);
    await expect(rtlGlyphBox.left).toBeGreaterThanOrEqual(rtlSendBox.left);
    await expect(rtlGlyphBox.right).toBeLessThanOrEqual(rtlSendBox.right);
    await expect(getComputedStyle(rotatedSend).transform).toBe("matrix(0, 1, -1, 0, 0, 0)");
    await expect(getComputedStyle(glyphOf(rotatedSend)).transform).toBe(mirror);
    await expect(getComputedStyle(glyphOf(canvas.getByTestId("rtl-refresh"))).transform).toBe("none");
  },
};

/**
 * The stroke weight follows `--sui-icon-stroke-width`, which each theme sets and any element can override for the
 * icons inside it
 */
export const StrokeWeight: Story = {
  render: () => (
    <Cluster align="center">
      <RefreshIcon style={{ fontSize: 32 }} data-testid="theme-weight" />
      <Box style={{ "--sui-icon-stroke-width": 3 } as CSSProperties}>
        <RefreshIcon style={{ fontSize: 32 }} data-testid="overridden-weight" />
      </Box>
    </Cluster>
  ),
  play: async ({ canvas }) => {
    await expect(getComputedStyle(canvas.getByTestId("theme-weight")).strokeWidth).toBe("2px");
    await expect(getComputedStyle(canvas.getByTestId("overridden-weight")).strokeWidth).toBe("3px");
  },
};

/**
 * Icons in IconButtons, which name the buttons and size their icons to 1.25em. A busy button shows a spinner in place
 * of its icon.
 */
export const InIconButton: Story = {
  render: () => (
    <Cluster>
      {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- IconButton's label names it */}
      <IconButton label="Close">
        <CloseIcon data-testid="close-icon" />
      </IconButton>
      {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- IconButton's label names it */}
      <IconButton label="Refresh">
        <RefreshIcon data-testid="refresh-icon" />
      </IconButton>
      {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- IconButton's label names it */}
      <IconButton busy={true} label="Refreshing">
        <RefreshIcon />
      </IconButton>
    </Cluster>
  ),
  play: async ({ canvas }) => {
    for (const { label, testId } of idleButtons) {
      const button = canvas.getByRole("button", { name: label });
      const icon = canvas.getByTestId(testId);
      const fontSize = parseFloat(getComputedStyle(button).fontSize);

      await expect(getComputedStyle(icon).stroke, `${label} colour`).toBe(getComputedStyle(button).color);
      await expect(icon.getBoundingClientRect().width, `${label} size`).toBeCloseTo(1.25 * fontSize, 1);
    }

    await expect(canvas.getByRole("button", { name: "Refreshing" })).toHaveAttribute("aria-disabled", "true");
    await expect(canvas.queryByRole("img")).toBeNull();
  },
};

function glyphOf(icon: HTMLElement): Element {
  const glyph = icon.firstElementChild;

  if (!glyph) {
    throw new Error("The icon draws no shapes");
  }

  return glyph;
}
