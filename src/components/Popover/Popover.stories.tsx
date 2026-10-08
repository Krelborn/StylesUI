import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { memo, useState } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import type { OverlayPlacement } from "../../overlays";
import { focusRingContrast, textContrast } from "../../test/colorContrast";
import { trustedInput } from "../../test/trustedInput";
import { Box } from "../Box";
import { Button } from "../Button";
import { Cluster } from "../Cluster";
import { Link } from "../Link";
import { Stack } from "../Stack";
import { StatusDot } from "../StatusDot";
import { Text } from "../Text";

import { Popover } from "./Popover";
import type { UsePopoverOptions } from "./usePopover";
import { usePopover } from "./usePopover";

const placements: OverlayPlacement[] = ["top", "end", "bottom", "start"];

/**
 * Whether the popover sits wholly on each side of its trigger, in a left-to-right page
 */
const sideChecks: Record<OverlayPlacement, (popover: DOMRect, trigger: DOMRect) => boolean> = {
  bottom: (popover, trigger) => popover.top >= trigger.bottom,
  end: (popover, trigger) => popover.left >= trigger.right,
  start: (popover, trigger) => popover.right <= trigger.left,
  top: (popover, trigger) => popover.bottom <= trigger.top,
};

/**
 * Waits for a popover to show and finish its entrance transition, so its position is final
 *
 * @param popover the popover element
 */
async function waitUntilSettled(popover: HTMLElement): Promise<void> {
  await waitFor(() => expect(popover).toBeVisible());
  await Promise.all(popover.getAnimations().map((animation) => animation.finished));
}

interface DetailsPopoverProps extends UsePopoverOptions {
  /**
   * Text of the button that opens the popover
   */
  label?: string;

  /**
   * Called when the button is clicked, beside the popover opening
   */
  onTriggerClick?: () => void;
}

/**
 * A button that opens a short note with a link
 */
function DetailsPopover({ label = "Show details", onTriggerClick, ...options }: DetailsPopoverProps): JSX.Element {
  const popover = usePopover(options);

  return (
    <>
      <Button {...popover.getTriggerProps({ onClick: onTriggerClick })} variant="secondary">
        {label}
      </Button>
      <Popover {...popover.getOverlayProps()}>
        <Stack gap={2}>
          <Text as="p">{`${label}: pull request #42 is waiting for your review.`}</Text>
          <Link href="#pull-request-42">Open pull request</Link>
        </Stack>
      </Popover>
    </>
  );
}

/**
 * The app's status bar: a ghost button with a warning dot opens a list of problems above it
 */
function ProblemsButton(): JSX.Element {
  const popover = usePopover({ placement: "top" });

  return (
    <Box style={{ alignContent: "end", display: "grid", justifyItems: "start", minBlockSize: "12rem" }}>
      <Button {...popover.getTriggerProps()} variant="ghost">
        <StatusDot tone="warning" variant="ring" />2 problems
      </Button>
      <Popover {...popover.getOverlayProps()}>
        <Stack as="ul" gap={1} style={{ listStyle: "none", padding: 0 }}>
          <Text as="li">Checks failed on #42</Text>
          <Text as="li">Review requested on #57 is overdue</Text>
        </Stack>
      </Popover>
    </Box>
  );
}

/**
 * A popover whose button also counts its own clicks, to show that the button's handler still runs
 */
function ClickCountingPopover(): JSX.Element {
  const [clicks, setClicks] = useState(0);

  return (
    <Stack align="start" gap={3}>
      <DetailsPopover onTriggerClick={() => setClicks((count) => count + 1)} />
      <Text>{`Clicks: ${clicks}`}</Text>
    </Stack>
  );
}

/**
 * A popover whose open state lives in its parent
 */
function ControlledPopover(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <Stack gap={3}>
      <Box>
        <DetailsPopover onOpenChange={setOpen} open={open} />
      </Box>
      <Text>{`Open: ${open ? "yes" : "no"}`}</Text>
    </Stack>
  );
}

/**
 * A popover beside a button that counts its clicks in the popover's owner, so clicking that button closes the popover
 * and renders its owner again at once
 */
function CountingOwnerPopover(): JSX.Element {
  const [clicks, setClicks] = useState(0);
  const popover = usePopover();

  return (
    <Stack align="start" gap={3}>
      <Cluster gap={4}>
        <Button {...popover.getTriggerProps()} variant="secondary">
          Show details
        </Button>
        <Popover {...popover.getOverlayProps()}>
          <Link href="#pull-request-42">Open pull request</Link>
        </Popover>
        <Button onClick={() => setClicks((count) => count + 1)} variant="secondary" data-testid="count">
          Count
        </Button>
      </Cluster>
      <Text>{`Clicks: ${clicks}`}</Text>
    </Stack>
  );
}

const UnchangingPopover = memo(Popover, () => true);

/**
 * A popover its parent holds open: the parent shows what `onOpenChange` last reported and never sets `open` to false.
 * The `Popover` is memoized and never renders again, so only the hook can show it after the browser closes it.
 */
function HeldOpenPopover(): JSX.Element {
  const [lastReport, setLastReport] = useState("nothing yet");
  const popover = usePopover({ onOpenChange: (open) => setLastReport(open ? "open" : "closed"), open: true });

  return (
    <Stack gap={3}>
      <Box>
        <Button {...popover.getTriggerProps()} variant="secondary">
          Show details
        </Button>
        <UnchangingPopover {...popover.getOverlayProps()}>
          <Link href="#pull-request-42">Open pull request</Link>
        </UnchangingPopover>
      </Box>
      <Text>{`Last report: ${lastReport}`}</Text>
    </Stack>
  );
}

const meta = {
  title: "Overlays/Popover",
  component: Popover,
  args: {
    anchorName: "--sui-overlay-story",
    id: "story-popover",
    onBeforeToggle: fn(),
    onToggle: fn(),
    open: false,
    placement: "bottom",
  },
  argTypes: {
    anchorName: { control: false },
    id: { control: false },
    onBeforeToggle: { control: false },
    onToggle: { control: false },
    open: { control: false },
    placement: { control: "select", options: placements },
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: ({ placement }) => <DetailsPopover placement={placement} />,
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Clicking the button opens the popover below it and marks the button expanded. The button's own `onClick` still
 * runs.
 */
export const Default: Story = {
  render: () => <ClickCountingPopover />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Show details" });

    await userEvent.click(trigger);

    const link = await canvas.findByRole("link", { name: "Open pull request" });
    await waitFor(() => expect(link).toBeVisible());
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText("Clicks: 1")).toBeInTheDocument();
  },
};

/**
 * `placement` opens the popover on any side of its button. `start` and `end` follow the writing direction.
 */
export const Placement: Story = {
  render: () => (
    <Box style={{ display: "grid", gap: "3rem", justifyItems: "center", paddingBlock: "10rem" }}>
      {placements.map((placement) => (
        <DetailsPopover key={placement} label={placement} placement={placement} />
      ))}
    </Box>
  ),
  play: async ({ canvas }) => {
    for (const placement of placements) {
      const trigger = canvas.getByRole("button", { name: placement });

      await userEvent.click(trigger);
      const text = await canvas.findByText(`${placement}: pull request #42 is waiting for your review.`);
      const popover = text.closest("[popover]") as HTMLElement;
      await waitUntilSettled(popover);

      const onSide = sideChecks[placement](popover.getBoundingClientRect(), trigger.getBoundingClientRect());

      await expect(onSide, placement).toBe(true);
    }
  },
};

/**
 * The app's status bar: a ghost button with a decorative warning dot opens the list of problems above it
 */
export const ProblemsList: Story = {
  render: () => <ProblemsButton />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "2 problems" });

    await userEvent.click(trigger);

    const problem = await canvas.findByText("Checks failed on #42");
    await waitUntilSettled(problem.closest("[popover]") as HTMLElement);
    await expect(problem).toBeVisible();
    await expect(textContrast(problem)).toBeGreaterThanOrEqual(4.5);
    await expect(problem.getBoundingClientRect().bottom).toBeLessThanOrEqual(trigger.getBoundingClientRect().top);
  },
};

/**
 * With `open` and `onOpenChange` the parent holds the state. Opening is reported and waits for the parent; closing
 * on Escape is reported after it happens.
 */
export const Controlled: Story = {
  render: () => <ControlledPopover />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Show details" }));
    await expect(await canvas.findByText("Open: yes")).toBeInTheDocument();

    const input = trustedInput();

    if (input === null) {
      return;
    }

    await input.pressKey("Escape");
    await expect(await canvas.findByText("Open: no")).toBeInTheDocument();
  },
};

/**
 * A parent that keeps `open` true while it handles `onOpenChange` holds the popover open: Escape is reported as a
 * close, and the popover shows again even when the `Popover` itself does not render again. It is left off the Docs
 * page, where its popover would keep closing the other stories' popovers.
 */
export const HeldOpen: Story = {
  tags: ["!autodocs"],
  render: () => <HeldOpenPopover />,
  play: async ({ canvas }) => {
    const link = await canvas.findByRole("link", { name: "Open pull request" });
    await waitFor(() => expect(link).toBeVisible());
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Show details" })).toHaveFocus();

    const input = trustedInput();

    if (input === null) {
      return;
    }

    await input.pressKey("Escape");

    await waitFor(() => expect(canvas.getByText("Last report: closed")).toBeInTheDocument());
    await waitFor(() => expect(link).toBeVisible());
  },
};

/**
 * A click outside the popover closes it
 */
export const LightDismiss: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Show details" });

    await userEvent.click(trigger);
    const link = await canvas.findByRole("link", { name: "Open pull request" });
    await waitFor(() => expect(link).toBeVisible());

    const input = trustedInput();

    if (input === null) {
      return;
    }

    await input.clickPageCorner();
    await waitFor(() => expect(link).not.toBeVisible());
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};

/**
 * Opening one popover closes any other, and the other's button stops being marked expanded
 */
export const OneAtATime: Story = {
  render: () => (
    <Stack align="start" gap={6}>
      <DetailsPopover label="First" />
      <DetailsPopover label="Second" />
    </Stack>
  ),
  play: async ({ canvas }) => {
    const first = canvas.getByRole("button", { name: "First" });
    const second = canvas.getByRole("button", { name: "Second" });

    await userEvent.click(first);
    await expect(first).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(second);
    await waitFor(() => expect(first).toHaveAttribute("aria-expanded", "false"));
    await expect(second).toHaveAttribute("aria-expanded", "true");
  },
};

/**
 * Enter opens the popover and Tab moves into it. Escape closes it and returns focus to the button. The button's focus
 * ring keeps 3:1 and the text inside keeps 4.5:1.
 */
export const KeyboardInteraction: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Show details" });

    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await expect(trigger.matches(":focus-visible")).toBe(true);
    await expect(focusRingContrast(trigger)).toBeGreaterThanOrEqual(3);

    await userEvent.keyboard("{Enter}");
    const link = await canvas.findByRole("link", { name: "Open pull request" });
    await waitFor(() => expect(link).toBeVisible());
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(
      textContrast(canvas.getByText("Show details: pull request #42 is waiting for your review."))
    ).toBeGreaterThanOrEqual(4.5);

    await userEvent.tab();
    await expect(link).toHaveFocus();

    const input = trustedInput();

    if (input === null) {
      return;
    }

    await input.pressKey("Escape");
    await waitFor(() => expect(link).not.toBeVisible());
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};

/**
 * A click on another button closes the popover, and it stays closed when that button's handler renders the popover's
 * owner again
 */
export const OutsideClickRendersOwner: Story = {
  render: () => <CountingOwnerPopover />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Show details" });

    await userEvent.click(trigger);
    const link = await canvas.findByRole("link", { name: "Open pull request" });
    await waitFor(() => expect(link).toBeVisible());

    const input = trustedInput();

    if (input === null) {
      return;
    }

    await input.clickByTestId("count");
    await expect(await canvas.findByText("Clicks: 1")).toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    await expect(link).not.toBeVisible();
  },
};
