import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { JSX } from "react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Text } from "../Text";

import { Popover } from "./Popover";
import type { UsePopoverOptions } from "./usePopover";
import { usePopover } from "./usePopover";

describe("usePopover", () => {
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

  it("must run the consumer's trigger handler when one is given", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<ProblemsPopover onTriggerClick={handleClick} />);

    await user.click(elements.trigger);

    expect(handleClick).toHaveBeenCalledOnce();
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

const elements = {
  get popover(): HTMLElement {
    return screen.getByTestId("popover");
  },
  get trigger(): HTMLElement {
    return screen.getByRole("button", { name: "2 problems" });
  },
};
