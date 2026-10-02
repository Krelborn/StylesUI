import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX, ReactNode } from "react";
import { useState } from "react";
import { expect, userEvent, waitFor } from "storybook/test";

import type { OverlayPlacement } from "../../overlays";
import { focusRingContrast, textContrast } from "../../test/colorContrast";
import { Box } from "../Box";
import { Button } from "../Button";
import { Checkbox } from "../Checkbox";
import { Stack } from "../Stack";

import { Tooltip } from "./Tooltip";
import type { UseTooltipOptions } from "./useTooltip";
import { useTooltip } from "./useTooltip";

type PhysicalSide = "bottom" | "left" | "right" | "top";

interface PublishButtonProps extends UseTooltipOptions {
  /**
   * Tooltip text
   */
  children: ReactNode;
}

/**
 * A Publish button described by a tooltip
 */
function PublishButton({ children, ...options }: PublishButtonProps): JSX.Element {
  const tooltip = useTooltip(options);

  return (
    <>
      <Button {...tooltip.getTriggerProps()}>Publish</Button>
      <Tooltip {...tooltip.getOverlayProps()}>{children}</Tooltip>
    </>
  );
}

/**
 * An icon-only button named by its tooltip
 */
function CopyLinkButton(): JSX.Element {
  const tooltip = useTooltip({ relationship: "label" });

  return (
    <>
      <Button {...tooltip.getTriggerProps()} variant="secondary">
        <Box
          as="svg"
          fill="none"
          height="16"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 16 16"
          width="16"
          aria-hidden="true"
        >
          <Box as="rect" height="9" rx="1" width="9" x="5" y="5" />
          <Box as="path" d="M11 3H4a1 1 0 0 0-1 1v7" />
        </Box>
      </Button>
      <Tooltip {...tooltip.getOverlayProps()}>Copy link</Tooltip>
    </>
  );
}

interface PlacementButtonProps {
  /**
   * Side of the button the tooltip opens on
   */
  placement: OverlayPlacement;
}

/**
 * A button whose tooltip is held open on one side
 */
function PlacementButton({ placement }: PlacementButtonProps): JSX.Element {
  const tooltip = useTooltip({ open: true, placement });

  return (
    <>
      <Button {...tooltip.getTriggerProps()} variant="secondary">
        {placement}
      </Button>
      <Tooltip {...tooltip.getOverlayProps()}>{placement} side</Tooltip>
    </>
  );
}

/**
 * A tooltip opened and closed by a checkbox through `open` and `onOpenChange`
 */
function ControlledTooltip(): JSX.Element {
  const [open, setOpen] = useState(false);
  const tooltip = useTooltip({ onOpenChange: setOpen, open });

  return (
    <Stack gap={3}>
      <Checkbox checked={open} onChange={(event) => setOpen(event.currentTarget.checked)}>
        Show tooltip
      </Checkbox>
      <Box>
        <Button {...tooltip.getTriggerProps()}>Publish</Button>
        <Tooltip {...tooltip.getOverlayProps()}>Sends to all subscribers</Tooltip>
      </Box>
    </Stack>
  );
}

const sideChecks: Record<PhysicalSide, (tooltip: DOMRect, trigger: DOMRect) => boolean> = {
  bottom: (tooltip, trigger) => tooltip.top >= trigger.bottom,
  left: (tooltip, trigger) => tooltip.right <= trigger.left,
  right: (tooltip, trigger) => tooltip.left >= trigger.right,
  top: (tooltip, trigger) => tooltip.bottom <= trigger.top,
};

/**
 * Whether one box sits wholly on the given side of another
 *
 * @param side the side of `trigger` that `tooltip` should be on
 * @param tooltip the tooltip's bounding box
 * @param trigger the trigger's bounding box
 * @returns true when no part of `tooltip` crosses onto `trigger`'s other sides
 */
function isOnSide(side: PhysicalSide, tooltip: DOMRect, trigger: DOMRect): boolean {
  return sideChecks[side](tooltip, trigger);
}

/**
 * Resolves after the given time
 *
 * @param milliseconds how long to wait
 * @returns a promise that resolves after `milliseconds`
 */
function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

const placementColumn = { display: "grid", gap: "3rem", justifyItems: "center", paddingBlock: "4rem" } as const;

const meta = {
  title: "Overlays/Tooltip",
  component: Tooltip,
  args: {
    anchorName: "--sui-overlay-story",
    children: "Sends to all subscribers",
    id: "story-tooltip",
    open: false,
    placement: "top",
  },
  argTypes: {
    anchorName: { control: false },
    children: { control: "text" },
    id: { control: false },
    open: { control: false },
    placement: { control: "select", options: ["top", "end", "bottom", "start"] },
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: ({ children, placement }) => <PublishButton placement={placement}>{children}</PublishButton>,
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Resting the pointer on the button shows its tooltip after a short delay. The tooltip describes the button, even
 * while it is hidden.
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const publish = canvas.getByRole("button", { name: "Publish" });

    await expect(publish).toHaveAccessibleDescription("Sends to all subscribers");
    await expect(canvas.queryByRole("tooltip")).toBeNull();

    await userEvent.hover(publish);

    await expect(await canvas.findByRole("tooltip", { name: "Sends to all subscribers" })).toBeInTheDocument();
  },
};

/**
 * With `relationship: "label"` the tooltip names a button that has no text of its own, so the name is written once
 */
export const Label: Story = {
  render: () => <CopyLinkButton />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Copy link" })).not.toHaveAccessibleDescription();
  },
};

/**
 * `placement` puts the tooltip on any side of its trigger. `start` and `end` follow the writing direction.
 */
export const Placement: Story = {
  render: () => (
    <Box style={placementColumn}>
      <PlacementButton placement="top" />
      <PlacementButton placement="end" />
      <PlacementButton placement="bottom" />
      <PlacementButton placement="start" />
    </Box>
  ),
  play: async ({ canvas }) => {
    const expectedSides: Record<OverlayPlacement, PhysicalSide> = {
      bottom: "bottom",
      end: "right",
      start: "left",
      top: "top",
    };

    for (const [placement, side] of Object.entries(expectedSides)) {
      const trigger = canvas.getByRole("button", { name: placement }).getBoundingClientRect();
      const tooltip = canvas.getByRole("tooltip", { name: `${placement} side` }).getBoundingClientRect();

      await expect(isOnSide(side, tooltip, trigger), `${placement} tooltip on the ${side}`).toBe(true);
    }
  },
};

/**
 * In a right-to-left container, `start` opens on the right of the trigger and `end` on the left
 */
export const RightToLeft: Story = {
  render: () => (
    <Box dir="rtl" style={placementColumn}>
      <PlacementButton placement="start" />
      <PlacementButton placement="end" />
    </Box>
  ),
  play: async ({ canvas }) => {
    const startTrigger = canvas.getByRole("button", { name: "start" }).getBoundingClientRect();
    const startTooltip = canvas.getByRole("tooltip", { name: "start side" }).getBoundingClientRect();
    const endTrigger = canvas.getByRole("button", { name: "end" }).getBoundingClientRect();
    const endTooltip = canvas.getByRole("tooltip", { name: "end side" }).getBoundingClientRect();

    await expect(isOnSide("right", startTooltip, startTrigger), "start tooltip on the right").toBe(true);
    await expect(isOnSide("left", endTooltip, endTrigger), "end tooltip on the left").toBe(true);
  },
};

/**
 * A tooltip with no room above its button opens below it, and stays on screen at the edge of the viewport
 */
export const Flip: Story = {
  parameters: {
    layout: "fullscreen",
  },
  render: ({ children }) => <PublishButton open={true}>{children}</PublishButton>,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Publish" }).getBoundingClientRect();
    const tooltip = (await canvas.findByRole("tooltip", { name: "Sends to all subscribers" })).getBoundingClientRect();

    await expect(isOnSide("bottom", tooltip, trigger), "tooltip below its trigger").toBe(true);
    await expect(tooltip.left).toBeGreaterThanOrEqual(0);
  },
};

/**
 * `delay` sets how long the pointer rests before the tooltip shows and how long the tooltip stays once the pointer
 * leaves. Here it shows at once and stays for a second.
 */
export const Delays: Story = {
  render: ({ children }) => <PublishButton delay={{ hide: 1000, show: 0 }}>{children}</PublishButton>,
  play: async ({ canvas }) => {
    const publish = canvas.getByRole("button", { name: "Publish" });

    await userEvent.hover(publish);
    await expect(await canvas.findByRole("tooltip", { name: "Sends to all subscribers" })).toBeInTheDocument();

    await userEvent.unhover(publish);
    await wait(500);
    await expect(canvas.getByRole("tooltip", { name: "Sends to all subscribers" })).toBeInTheDocument();
    await waitFor(() => expect(canvas.queryByRole("tooltip")).toBeNull(), { timeout: 1500 });
  },
};

/**
 * `open` and `onOpenChange` control the tooltip from outside, here from a checkbox
 */
export const Controlled: Story = {
  render: () => <ControlledTooltip />,
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole("checkbox", { name: "Show tooltip" });

    await userEvent.click(toggle);
    await expect(await canvas.findByRole("tooltip", { name: "Sends to all subscribers" })).toBeInTheDocument();

    await userEvent.click(toggle);
    await waitFor(() => expect(canvas.queryByRole("tooltip")).toBeNull());
  },
};

/**
 * Tab moves focus to the button and shows its tooltip at once. Escape hides the tooltip and leaves focus on the
 * button, and the next Tab moves on with the tooltip hidden.
 */
export const KeyboardInteraction: Story = {
  render: ({ children }) => (
    <Box style={{ display: "flex", gap: "0.5rem" }}>
      <PublishButton>{children}</PublishButton>
      <Button variant="secondary">Cancel</Button>
    </Box>
  ),
  play: async ({ canvas }) => {
    const publish = canvas.getByRole("button", { name: "Publish" });
    const cancel = canvas.getByRole("button", { name: "Cancel" });

    await userEvent.tab();
    await expect(publish).toHaveFocus();
    await expect(publish.matches(":focus-visible")).toBe(true);
    await expect(focusRingContrast(publish)).toBeGreaterThanOrEqual(3);

    const tooltip = await canvas.findByRole("tooltip", { name: "Sends to all subscribers" });
    await expect(publish).toHaveAccessibleDescription("Sends to all subscribers");
    await expect(textContrast(tooltip)).toBeGreaterThanOrEqual(4.5);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("tooltip")).toBeNull());
    await expect(publish).toHaveFocus();

    await userEvent.tab();
    await expect(cancel).toHaveFocus();
    await expect(canvas.queryByRole("tooltip")).toBeNull();
  },
};

/**
 * The pointer can move from the button onto its tooltip without the tooltip closing, and the tooltip closes shortly
 * after the pointer leaves both
 */
export const PointerInteraction: Story = {
  play: async ({ canvas }) => {
    const publish = canvas.getByRole("button", { name: "Publish" });

    await userEvent.hover(publish);
    const tooltip = await canvas.findByRole("tooltip", { name: "Sends to all subscribers" });

    await userEvent.unhover(publish);
    await userEvent.hover(tooltip);
    await wait(400);
    await expect(canvas.getByRole("tooltip", { name: "Sends to all subscribers" })).toBeInTheDocument();

    await userEvent.unhover(tooltip);
    await waitFor(() => expect(canvas.queryByRole("tooltip")).toBeNull());
  },
};
