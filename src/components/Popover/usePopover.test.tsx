import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { JSX, RefObject } from "react";
import { createRef, memo, useRef, useState } from "react";
import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";

import { rejectInvalidShowPopover } from "../../test/rejectInvalidShowPopover";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Text } from "../Text";

import { Popover } from "./Popover";
import type { UsePopoverOptions } from "./usePopover";
import { usePopover } from "./usePopover";

describe("usePopover", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("must point the trigger at the popover when it renders", () => {
    render(<ProblemsPopover />);

    expect(elements.trigger).toHaveAttribute("popovertarget", elements.popover.id);
    expect(elements.trigger).toHaveAttribute("aria-controls", elements.popover.id);
    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
    expect(elements.popover).toHaveAttribute("popover", "auto");
  });

  it("must anchor the popover below the trigger when placement is omitted", () => {
    render(<ProblemsPopover />);

    expect(elements.popover).toHaveAttribute("data-placement", "bottom");
    expect(elements.trigger.style.getPropertyValue("anchor-name")).toBe(
      elements.popover.style.getPropertyValue("position-anchor")
    );
  });

  it("must show the popover when defaultOpen is true", () => {
    render(<ProblemsPopover defaultOpen={true} />);

    expect(elements.popover).toBeVisible();
    expect(elements.trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("must follow and report the browser when it opens an uncontrolled popover", () => {
    const onOpenChange = vi.fn();
    render(<ProblemsPopover onOpenChange={onOpenChange} />);

    fireEvent(elements.popover, toggleEvent("toggle", "open"));

    expect(elements.trigger).toHaveAttribute("aria-expanded", "true");
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });

  it("must follow and report the browser when it closes an uncontrolled popover", () => {
    const onOpenChange = vi.fn();
    render(<ProblemsPopover defaultOpen={true} onOpenChange={onOpenChange} />);

    elements.popover.hidePopover();
    fireEvent(elements.popover, toggleEvent("toggle", "closed"));

    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("must cancel an opening and report it when the popover is controlled and closed", () => {
    const onOpenChange = vi.fn();
    render(<ProblemsPopover onOpenChange={onOpenChange} open={false} />);

    const notCancelled = fireEvent(elements.popover, toggleEvent("beforetoggle", "open"));

    expect(notCancelled).toBe(false);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("must let an opening through when the popover is controlled and open", () => {
    render(<ProblemsPopover onOpenChange={vi.fn()} open={true} />);

    expect(fireEvent(elements.popover, toggleEvent("beforetoggle", "open"))).toBe(true);
  });

  it("must show the popover again when the browser closes it while the parent keeps it open", () => {
    const onOpenChange = vi.fn();
    render(<ProblemsPopover onOpenChange={onOpenChange} open={true} />);

    elements.popover.hidePopover();
    fireEvent(elements.popover, toggleEvent("toggle", "closed"));

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(elements.popover).toBeVisible();
  });

  it("must not report the browser when it only confirms a state the parent already set", () => {
    const onOpenChange = vi.fn();
    render(<ProblemsPopover onOpenChange={onOpenChange} open={true} />);

    fireEvent(elements.popover, toggleEvent("toggle", "open"));

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("must show the popover again when the browser closes it and the Popover does not re-render", () => {
    render(<HeldOpenPopover />);

    elements.popover.hidePopover();
    fireEvent(elements.popover, toggleEvent("toggle", "closed"));

    expect(elements.popover).toBeVisible();
  });

  it("must show the popover only once when the browser closes it and the Popover re-renders", () => {
    rejectInvalidShowPopover();
    render(<ProblemsPopover onOpenChange={vi.fn()} open={true} />);

    elements.popover.hidePopover();
    fireEvent(elements.popover, toggleEvent("toggle", "closed"));

    expect(elements.popover).toBeVisible();
  });

  it("must show a controlled popover once on the next task when the browser refuses to show it at first", () => {
    const { advance } = setUpTest();
    rejectInvalidShowPopover().mockImplementationOnce(refuse);
    render(<ProblemsPopover onOpenChange={vi.fn()} open={true} />);

    advance(0);
    fireEvent(elements.popover, toggleEvent("toggle", "open"));

    expect(elements.popover).toBeVisible();
  });

  it("must show the popover again on the next task when the browser refuses at first after closing it while the parent keeps it open", () => {
    const { advance } = setUpTest();
    const showPopover = rejectInvalidShowPopover();
    render(<ProblemsPopover onOpenChange={vi.fn()} open={true} />);
    showPopover.mockImplementationOnce(refuse);

    elements.popover.hidePopover();
    fireEvent(elements.popover, toggleEvent("toggle", "closed"));

    expect(elements.popover).not.toBeVisible();

    advance(0);

    expect(elements.popover).toBeVisible();
  });

  it("must show the new popover when a remount replaced the one the browser closed", async () => {
    const user = userEvent.setup();
    rejectInvalidShowPopover();
    render(<RemountingPopover />);

    elements.popover.hidePopover();
    fireEvent(elements.popover, toggleEvent("toggle", "closed"));
    await user.click(elements.trigger);

    expect(elements.popover).toBeVisible();
  });

  it("must keep the popover hidden when the browser closes it and the parent follows onOpenChange", () => {
    render(<FollowingPopover />);

    elements.popover.hidePopover();
    fireEvent(elements.popover, toggleEvent("toggle", "closed"));

    expect(elements.popover).not.toBeVisible();
    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("must hide an uncontrolled popover and report it when close is called", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ProblemsPopover defaultOpen={true} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(elements.popover).not.toBeVisible();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("must only report closing when close is called on a controlled popover", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ProblemsPopover onOpenChange={onOpenChange} open={true} />);

    await user.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(elements.popover).toBeVisible();
  });

  it("must not report anything when close is called on a closed popover", () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() => usePopover({ onOpenChange }));

    result.current.close();

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it.each([
    { name: "an uncontrolled", options: { defaultOpen: true } },
    { name: "a controlled", options: { onOpenChange: vi.fn(), open: true } },
  ])("must focus initialFocus when $name popover opens", ({ options }) => {
    render(<ConfirmationPopover {...options} />);

    fireEvent(elements.popover, toggleEvent("toggle", "open"));

    expect(elements.cancel).toHaveFocus();
  });

  it("must leave focus where it is when a popover without initialFocus opens", () => {
    render(<ConfirmationPopover defaultOpen={true} focusesCancel={false} />);
    elements.elsewhere.focus();

    fireEvent(elements.popover, toggleEvent("toggle", "open"));

    expect(elements.elsewhere).toHaveFocus();
  });

  it("must return focus to the trigger when the browser closes the popover with focus inside it", () => {
    render(<ConfirmationPopover defaultOpen={true} />);
    fireEvent(elements.popover, toggleEvent("toggle", "open"));

    closeAsBrowser(elements.popover);

    expect(elements.trigger).toHaveFocus();
  });

  it("must leave focus where it is when the browser closes the popover with focus outside it", () => {
    render(<ConfirmationPopover defaultOpen={true} />);
    fireEvent(elements.popover, toggleEvent("toggle", "open"));
    elements.elsewhere.focus();

    closeAsBrowser(elements.popover);

    expect(elements.elsewhere).toHaveFocus();
  });

  it.each([
    { name: "an uncontrolled", ui: <ConfirmationPopover defaultOpen={true} /> },
    { name: "a controlled", ui: <ControlledConfirmation /> },
  ])("must return focus to the trigger when close is called on $name popover with focus inside it", async ({ ui }) => {
    const user = userEvent.setup();
    render(ui);
    fireEvent(elements.popover, toggleEvent("toggle", "open"));

    await user.click(elements.cancel);
    closeAsBrowser(elements.popover);

    expect(elements.trigger).toHaveFocus();
  });

  it.each([
    { name: "an uncontrolled", ui: <ConfirmationPopover defaultOpen={true} /> },
    { name: "a controlled", ui: <ControlledConfirmation /> },
  ])("must return focus to the trigger when close is called on $name popover with focus lost to the page", ({ ui }) => {
    render(ui);
    fireEvent(elements.popover, toggleEvent("toggle", "open"));
    elements.cancel.blur();

    // fireEvent, unlike userEvent, does not focus the button, as WebKit does not
    fireEvent.click(elements.cancel);
    closeAsBrowser(elements.popover);

    expect(elements.trigger).toHaveFocus();
  });

  it("must leave focus where it is when close is called with focus outside the popover", () => {
    render(<ConfirmationPopover defaultOpen={true} />);
    fireEvent(elements.popover, toggleEvent("toggle", "open"));
    elements.elsewhere.focus();

    fireEvent.click(elements.cancel);
    closeAsBrowser(elements.popover);

    expect(elements.elsewhere).toHaveFocus();
  });

  it("must return focus to a trigger that has a ref of its own", () => {
    const triggerRef = createRef<HTMLButtonElement>();
    render(<ConfirmationPopover defaultOpen={true} triggerRef={triggerRef} />);
    fireEvent(elements.popover, toggleEvent("toggle", "open"));

    closeAsBrowser(elements.popover);

    expect(triggerRef.current).toBe(elements.trigger);
    expect(elements.trigger).toHaveFocus();
  });

  it("must run the consumer's trigger handler when one is given", async () => {
    const user = userEvent.setup();
    render(<ClickCountingPopover />);

    await user.click(elements.trigger);

    expect(screen.getByText("Clicks: 1")).toBeInTheDocument();
  });

  it("must anchor to an IconButton that also anchors its tooltip", () => {
    render(<IconTriggerPopover />);

    const trigger = screen.getByRole("button", { name: "Problems" });
    const anchorNames = trigger.style.getPropertyValue("anchor-name").split(", ");
    expect(anchorNames).toContain(elements.popover.style.getPropertyValue("position-anchor"));
    expect(anchorNames).toHaveLength(2);
  });
});

interface ProblemsPopoverProps extends UsePopoverOptions {
  onTriggerClick?: () => void;
}

/**
 * A "2 problems" button whose popover lists them, with a button that closes it
 */
function ProblemsPopover({ onTriggerClick, ...options }: ProblemsPopoverProps): JSX.Element {
  const popover = usePopover(options);

  return (
    <>
      <Button {...popover.getTriggerProps({ onClick: onTriggerClick })}>2 problems</Button>
      <Popover {...popover.getOverlayProps()} data-testid="popover">
        <Text as="p">Checks are failing</Text>
        <Button onClick={popover.close}>Dismiss</Button>
      </Popover>
    </>
  );
}

/**
 * A popover whose trigger also counts its own clicks
 */
function ClickCountingPopover(): JSX.Element {
  const [clicks, setClicks] = useState(0);

  return (
    <>
      <ProblemsPopover onTriggerClick={() => setClicks((count) => count + 1)} />
      <Text>{`Clicks: ${clicks}`}</Text>
    </>
  );
}

/**
 * A popover its parent keeps open, rendered through a `Popover` that never re-renders, as when a consumer caches the
 * element
 */
function HeldOpenPopover(): JSX.Element {
  const popover = usePopover({ onOpenChange: vi.fn(), open: true });

  return (
    <>
      <Button {...popover.getTriggerProps()}>2 problems</Button>
      <UnchangingPopover {...popover.getOverlayProps()} data-testid="popover">
        <Text as="p">Checks are failing</Text>
      </UnchangingPopover>
    </>
  );
}

/**
 * A controlled popover whose parent closes it when asked to
 */
function FollowingPopover(): JSX.Element {
  const [open, setOpen] = useState(true);
  const popover = usePopover({ onOpenChange: setOpen, open });

  return (
    <>
      <Button {...popover.getTriggerProps()}>2 problems</Button>
      <Popover {...popover.getOverlayProps()} data-testid="popover">
        <Text as="p">Checks are failing</Text>
      </Popover>
    </>
  );
}

/**
 * A controlled popover that only renders its `Popover` while open, so each opening mounts a new element
 */
function RemountingPopover(): JSX.Element {
  const [open, setOpen] = useState(true);
  const popover = usePopover({ onOpenChange: setOpen, open });

  return (
    <>
      <Button {...popover.getTriggerProps({ onClick: () => setOpen(true) })}>2 problems</Button>
      {popover.open && (
        <Popover {...popover.getOverlayProps()} data-testid="popover">
          <Text as="p">Checks are failing</Text>
        </Popover>
      )}
    </>
  );
}

interface ConfirmationPopoverProps extends UsePopoverOptions {
  /**
   * Whether Cancel takes focus as the popover opens. Defaults to `true`.
   */
  focusesCancel?: boolean;

  /**
   * The consumer's own ref on the trigger
   */
  triggerRef?: RefObject<HTMLButtonElement | null>;
}

/**
 * A "2 problems" button whose popover asks for confirmation, with a Cancel that closes it, beside a button outside it
 */
function ConfirmationPopover({ focusesCancel = true, triggerRef, ...options }: ConfirmationPopoverProps): JSX.Element {
  const cancel = useRef<HTMLButtonElement>(null);
  const popover = usePopover({ ...options, initialFocus: focusesCancel ? cancel : undefined });

  return (
    <>
      <Button {...popover.getTriggerProps()} ref={triggerRef}>
        2 problems
      </Button>
      <Popover {...popover.getOverlayProps()} data-testid="popover">
        <Button onClick={popover.close} ref={cancel}>
          Cancel
        </Button>
      </Popover>
      <Button>Elsewhere</Button>
    </>
  );
}

/**
 * A confirmation whose parent holds its open state and follows `onOpenChange`
 */
function ControlledConfirmation(): JSX.Element {
  const [open, setOpen] = useState(true);

  return <ConfirmationPopover onOpenChange={setOpen} open={open} />;
}

/**
 * An icon-only button that anchors both its own tooltip and a popover
 */
function IconTriggerPopover(): JSX.Element {
  const popover = usePopover();

  return (
    <>
      <IconButton {...popover.getTriggerProps()} label="Problems">
        !
      </IconButton>
      <Popover {...popover.getOverlayProps()} data-testid="popover">
        <Text as="p">Checks are failing</Text>
      </Popover>
    </>
  );
}

/**
 * Builds the `toggle` or `beforetoggle` event a browser fires as a popover opens or closes, which jsdom never fires
 *
 * @param type the event type
 * @param newState the state the popover is moving to
 * @returns the event, cancelable only for an opening `beforetoggle`, as in a browser
 */
function toggleEvent(type: "beforetoggle" | "toggle", newState: "closed" | "open"): Event {
  return Object.assign(new Event(type, { cancelable: type === "beforetoggle" && newState === "open" }), {
    newState,
    oldState: newState === "open" ? "closed" : "open",
  });
}

/**
 * Closes a popover as a browser does, on Escape or once `close()` has asked it to: `beforetoggle`, the hide, then
 * `toggle`. jsdom fires neither event.
 *
 * @param popover the popover element
 */
function closeAsBrowser(popover: HTMLElement): void {
  fireEvent(popover, toggleEvent("beforetoggle", "closed"));
  popover.hidePopover();
  fireEvent(popover, toggleEvent("toggle", "closed"));
}

function setUpTest() {
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.useRealTimers();
  });

  function advance(milliseconds: number): void {
    act(() => {
      vi.advanceTimersByTime(milliseconds);
    });
  }

  return { advance };
}

/**
 * Throws as the browser does when asked to show a popover while it shows or hides another
 */
function refuse(): never {
  throw new DOMException("Invalid to show a popover during another show operation", "InvalidStateError");
}

const UnchangingPopover = memo(Popover, () => true);

const elements = {
  get cancel(): HTMLElement {
    return screen.getByRole("button", { name: "Cancel" });
  },
  get elsewhere(): HTMLElement {
    return screen.getByRole("button", { name: "Elsewhere" });
  },
  get popover(): HTMLElement {
    return screen.getByTestId("popover");
  },
  get trigger(): HTMLElement {
    return screen.getByRole("button", { name: "2 problems" });
  },
};
