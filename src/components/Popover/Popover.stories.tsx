import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { memo, useRef, useState } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import type { OverlayPlacement } from "../../overlays";
import { focusRingContrast, textContrast } from "../../test/colorContrast";
import { trustedInput } from "../../test/trustedInput";
import { Box } from "../Box";
import { Button } from "../Button";
import { Cluster } from "../Cluster";
import { IconButton } from "../IconButton";
import { Link } from "../Link";
import { Stack } from "../Stack";
import { StatusDot } from "../StatusDot";
import { Text } from "../Text";

import { Popover } from "./Popover";
import type { UsePopoverOptions } from "./usePopover";
import { usePopover } from "./usePopover";

const sidePlacements: OverlayPlacement[] = ["top", "end", "bottom", "start"];

const alignedPlacements: OverlayPlacement[] = ["top-start", "top-end", "bottom-start", "bottom-end"];

const placementColumn = { display: "grid", gap: "3rem", justifyItems: "center", paddingBlock: "10rem" } as const;

/**
 * Whether two edges are in the same place, to within rounding
 */
function meets(first: number, second: number): boolean {
  return Math.abs(first - second) < 1;
}

/**
 * Whether the popover sits wholly on its side of the trigger and, when aligned, meets the trigger's edge, in a
 * left-to-right page
 */
const placementChecks: Record<OverlayPlacement, (popover: DOMRect, trigger: DOMRect) => boolean> = {
  bottom: (popover, trigger) => popover.top >= trigger.bottom,
  "bottom-end": (popover, trigger) => popover.top >= trigger.bottom && meets(popover.right, trigger.right),
  "bottom-start": (popover, trigger) => popover.top >= trigger.bottom && meets(popover.left, trigger.left),
  end: (popover, trigger) => popover.left >= trigger.right,
  start: (popover, trigger) => popover.right <= trigger.left,
  top: (popover, trigger) => popover.bottom <= trigger.top,
  "top-end": (popover, trigger) => popover.bottom <= trigger.top && meets(popover.right, trigger.right),
  "top-start": (popover, trigger) => popover.bottom <= trigger.top && meets(popover.left, trigger.left),
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

interface SettledPosition {
  /**
   * Where the popover sits
   */
  popover: DOMRect;

  /**
   * Where its trigger sits
   */
  trigger: DOMRect;
}

/**
 * Clicks a trigger and waits for the popover it controls to settle
 *
 * @param trigger the button that opens the popover
 * @returns where the popover and the trigger sit once it has settled
 * @throws when the trigger controls no popover
 */
async function openSettled(trigger: HTMLElement): Promise<SettledPosition> {
  await userEvent.click(trigger);
  const popover = document.getElementById(trigger.getAttribute("aria-controls") ?? "");

  if (popover === null) {
    throw new Error("The trigger controls no popover");
  }

  await waitUntilSettled(popover);

  return { popover: popover.getBoundingClientRect(), trigger: trigger.getBoundingClientRect() };
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
 * An icon-only button, named by its own tooltip, that opens a problem with a link to it
 */
function IconTriggerPopover(): JSX.Element {
  const popover = usePopover();

  return (
    <>
      <IconButton {...popover.getTriggerProps()} label="Problems">
        <Box
          as="svg"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <Box as="path" d="M12 3 2 21h20Z" />
          <Box as="path" d="M12 10v4M12 17v.01" />
        </Box>
      </IconButton>
      <Popover {...popover.getOverlayProps()}>
        <Stack gap={2}>
          <Text as="p">Checks failed on #42</Text>
          <Link href="#pull-request-42">Open pull request</Link>
        </Stack>
      </Popover>
    </>
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

/**
 * Discard at the start of a panel, whose confirmation opens with focus on Cancel
 */
function DiscardConfirmation(options: Omit<UsePopoverOptions, "initialFocus" | "placement">): JSX.Element {
  const cancel = useRef<HTMLButtonElement>(null);
  const popover = usePopover({ ...options, initialFocus: cancel, placement: "top-start" });

  return (
    <Box style={{ paddingBlockStart: "10rem" }}>
      <Button {...popover.getTriggerProps()} size="sm" variant="outline-danger">
        Discard
      </Button>
      {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a Popover always renders a div */}
      <Popover {...popover.getOverlayProps()} role="dialog" aria-label="Discard this comment?">
        <Stack gap={2}>
          <Text as="p">It hasn't been sent, and you can't get it back.</Text>
          <Cluster gap={2} justify="end">
            <Button onClick={popover.close} ref={cancel} size="sm" variant="secondary">
              Cancel
            </Button>
            <Button onClick={popover.close} size="sm" variant="danger">
              Discard comment
            </Button>
          </Cluster>
        </Stack>
      </Popover>
    </Box>
  );
}

/**
 * A confirmation its parent can also open from a toolbar button, as a keyboard shortcut would
 */
function DiscardConfirmationOpenedElsewhere(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <Stack align="start" gap={3}>
      <Button onClick={() => setOpen(true)} variant="ghost">
        Discard from the toolbar
      </Button>
      <DiscardConfirmation onOpenChange={setOpen} open={open} />
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
    placement: { control: "select", options: [...sidePlacements, ...alignedPlacements] },
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: ({ placement }) => <DetailsPopover placement={placement} />,
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Clicking the button opens the popover below it and marks the button expanded, and clicking it again closes the
 * popover. The button's own `onClick` still runs.
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

    await userEvent.click(trigger);

    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    await expect(link).not.toBeVisible();
    await expect(canvas.getByText("Clicks: 2")).toBeInTheDocument();
  },
};

/**
 * `placement` opens the popover on any side of its button. `start` and `end` follow the writing direction.
 */
export const Placement: Story = {
  render: () => (
    <Box style={placementColumn}>
      {sidePlacements.map((placement) => (
        <DetailsPopover key={placement} label={placement} placement={placement} />
      ))}
    </Box>
  ),
  play: async ({ canvas }) => {
    for (const placement of sidePlacements) {
      const { popover, trigger } = await openSettled(canvas.getByRole("button", { name: placement }));

      await expect(placementChecks[placement](popover, trigger), placement).toBe(true);
    }
  },
};

/**
 * `top-start`, `top-end`, `bottom-start` and `bottom-end` line the popover up with the button's start or end edge
 * instead of centring it, so it grows away from that edge, as from a button at the start of a narrow panel
 */
export const AlignedPlacement: Story = {
  render: () => (
    <Box style={placementColumn}>
      {alignedPlacements.map((placement) => (
        <DetailsPopover key={placement} label={placement} placement={placement} />
      ))}
    </Box>
  ),
  play: async ({ canvas }) => {
    for (const placement of alignedPlacements) {
      const { popover, trigger } = await openSettled(canvas.getByRole("button", { name: placement }));

      await expect(placementChecks[placement](popover, trigger), placement).toBe(true);
    }
  },
};

/**
 * In a right-to-left container the start edge is on the right, so `top-start` meets the button's right edge and
 * `top-end` its left edge
 */
export const AlignedPlacementRightToLeft: Story = {
  render: () => (
    <Box dir="rtl" style={placementColumn}>
      <DetailsPopover label="top-start" placement="top-start" />
      <DetailsPopover label="top-end" placement="top-end" />
    </Box>
  ),
  play: async ({ canvas }) => {
    const start = await openSettled(canvas.getByRole("button", { name: "top-start" }));

    await expect(start.popover.bottom).toBeLessThanOrEqual(start.trigger.top);
    await expect(meets(start.popover.right, start.trigger.right), "top-start meets the right edge").toBe(true);

    const end = await openSettled(canvas.getByRole("button", { name: "top-end" }));

    await expect(end.popover.bottom).toBeLessThanOrEqual(end.trigger.top);
    await expect(meets(end.popover.left, end.trigger.left), "top-end meets the left edge").toBe(true);
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
 * Opening a controlled popover with the keyboard reports the opening, and the popover shows once the parent sets
 * `open`
 */
export const ControlledKeyboardOpening: Story = {
  render: () => <ControlledPopover />,
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const trigger = canvas.getByRole("button", { name: "Show details" });

    await input.pressKey("Tab");
    await expect(trigger).toHaveFocus();
    await input.pressKey("Enter");

    await expect(await canvas.findByText("Open: yes")).toBeInTheDocument();
    const link = await canvas.findByRole("link", { name: "Open pull request" });
    await waitFor(() => expect(link).toBeVisible());
  },
};

/**
 * A controlled popover that Escape closed opens again from its button
 */
export const ControlledReopening: Story = {
  render: () => <ControlledPopover />,
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const trigger = canvas.getByRole("button", { name: "Show details" });

    await input.pressKey("Tab");
    await expect(trigger).toHaveFocus();
    await input.pressKey("Enter");
    const link = await canvas.findByRole("link", { name: "Open pull request" });
    await waitFor(() => expect(link).toBeVisible());

    await input.pressKey("Escape");
    await expect(await canvas.findByText("Open: no")).toBeInTheDocument();
    await waitFor(() => expect(link).not.toBeVisible());
    await expect(trigger).toHaveFocus();

    await input.pressKey("Enter");

    await expect(await canvas.findByText("Open: yes")).toBeInTheDocument();
    await waitFor(() => expect(link).toBeVisible());
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
    // After a trusted click in an earlier story, focus from userEvent.tab() only matches :focus-visible once a trusted
    // key has been pressed
    await trustedInput()?.pressKey("Shift");
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
 * Escape from inside a popover that a click opened closes it and returns focus to the button
 */
export const EscapeFromInside: Story = {
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const trigger = canvas.getByRole("button", { name: "Show details" });

    await userEvent.click(trigger);
    const link = await canvas.findByRole("link", { name: "Open pull request" });
    await waitFor(() => expect(link).toBeVisible());
    await input.pressKey("Tab");
    await expect(link).toHaveFocus();

    await input.pressKey("Escape");

    await waitFor(() => expect(link).not.toBeVisible());
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};

/**
 * `initialFocus` moves focus into a confirmation as it opens. Closing it with focus inside, by Escape or with Cancel,
 * returns focus to the button that opened it.
 */
export const Confirmation: Story = {
  render: () => <DiscardConfirmation />,
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const trigger = canvas.getByRole("button", { name: "Discard" });

    await input.pressKey("Tab");
    await expect(trigger).toHaveFocus();
    await input.pressKey("Enter");
    const cancel = await canvas.findByRole("button", { name: "Cancel" });
    await waitFor(() => expect(cancel).toHaveFocus());
    await expect(focusRingContrast(cancel)).toBeGreaterThanOrEqual(3);

    await input.pressKey("Escape");
    await waitFor(() => expect(cancel).not.toBeVisible());
    await expect(trigger).toHaveFocus();

    await input.pressKey("Enter");
    await waitFor(() => expect(cancel).toHaveFocus());
    await input.pressKey("Enter");
    await waitFor(() => expect(cancel).not.toBeVisible());
    await expect(trigger).toHaveFocus();
  },
};

/**
 * A click outside closes the confirmation and leaves focus where the click put it, not on the button
 */
export const ConfirmationClickOutside: Story = {
  render: () => <DiscardConfirmation />,
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const trigger = canvas.getByRole("button", { name: "Discard" });

    await userEvent.click(trigger);
    const cancel = await canvas.findByRole("button", { name: "Cancel" });
    await waitFor(() => expect(cancel).toHaveFocus());

    await input.clickPageCorner();
    await waitFor(() => expect(cancel).not.toBeVisible());
    await expect(trigger).not.toHaveFocus();
  },
};

/**
 * Opened from somewhere other than its button, such as a toolbar button or a shortcut, a confirmation gives focus back
 * to where it was before, which the browser restores
 */
export const ConfirmationOpenedElsewhere: Story = {
  render: () => <DiscardConfirmationOpenedElsewhere />,
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const opener = canvas.getByRole("button", { name: "Discard from the toolbar" });

    await userEvent.click(opener);
    const cancel = await canvas.findByRole("button", { name: "Cancel" });
    await waitFor(() => expect(cancel).toHaveFocus());

    await input.pressKey("Escape");
    await waitFor(() => expect(cancel).not.toBeVisible());
    await expect(opener).toHaveFocus();
  },
};

/**
 * A confirmation open from the start had nothing focused before it, so the browser returns focus to nothing and the
 * hook gives it to the button. It is left off the Docs page, where it would take focus as the page opens.
 */
export const ConfirmationOpenOnLoad: Story = {
  tags: ["!autodocs"],
  render: () => <DiscardConfirmation defaultOpen={true} />,
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const trigger = canvas.getByRole("button", { name: "Discard" });
    const cancel = await canvas.findByRole("button", { name: "Cancel" });
    await waitFor(() => expect(cancel).toHaveFocus());

    await input.pressKey("Escape");
    await waitFor(() => expect(cancel).not.toBeVisible());
    await expect(trigger).toHaveFocus();
  },
};

/**
 * An `IconButton` can open a popover. Pressing it hides its tooltip, so a single Escape closes the popover and leaves
 * focus on the button.
 */
export const IconButtonTrigger: Story = {
  render: () => <IconTriggerPopover />,
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const trigger = canvas.getByRole("button", { name: "Problems" });

    await input.pressKey("Tab");
    await expect(trigger).toHaveFocus();
    await expect(await canvas.findByRole("tooltip", { name: "Problems" })).toBeInTheDocument();

    await input.pressKey("Enter");
    const problem = await canvas.findByText("Checks failed on #42");
    await waitFor(() => expect(problem).toBeVisible());

    await input.pressKey("Escape");
    await waitFor(() => expect(problem).not.toBeVisible());
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};

/**
 * Escape from inside a popover that an `IconButton` opened closes it and returns focus to the button, whose tooltip
 * then shows its name
 */
export const IconButtonEscapeFromInside: Story = {
  render: () => <IconTriggerPopover />,
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const trigger = canvas.getByRole("button", { name: "Problems" });

    await userEvent.click(trigger);
    const link = await canvas.findByRole("link", { name: "Open pull request" });
    await waitFor(() => expect(link).toBeVisible());
    await input.pressKey("Tab");
    await expect(link).toHaveFocus();

    await input.pressKey("Escape");

    await waitFor(() => expect(link).not.toBeVisible());
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    const tooltip = await canvas.findByRole("tooltip", { name: "Problems" });
    await waitFor(() => expect(tooltip).toBeVisible());
  },
};
