import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { JSX, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Box } from "../Box";
import type { ButtonProps } from "../Button";
import { Button } from "../Button";
import { Field } from "../Field";
import { TextInput } from "../TextInput";

import { Tooltip } from "./Tooltip";
import type { UseTooltipOptions } from "./useTooltip";
import { useTooltip } from "./useTooltip";

describe("useTooltip", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("must describe the trigger with the tooltip text when relationship is omitted", () => {
    render(<Example />);

    expect(elements.publishButton).toHaveAccessibleDescription("Sends to all subscribers");
    expect(elements.visibleTooltip).toBeNull();
  });

  it("must name the trigger with the tooltip text when relationship is label", () => {
    render(
      <Example label={copyIcon} relationship="label">
        Copy link
      </Example>
    );

    expect(screen.getByRole("button", { name: "Copy link" })).not.toHaveAccessibleDescription();
  });

  it("must show the tooltip when open is true", () => {
    render(<Example open={true} />);

    expect(elements.visibleTooltip).toHaveAccessibleName("Sends to all subscribers");
  });

  it("must show the tooltip when defaultOpen is true", () => {
    render(<Example defaultOpen={true} />);

    expect(elements.visibleTooltip).toHaveAccessibleName("Sends to all subscribers");
  });

  it("must give each tooltip its own id when two are rendered", () => {
    render(
      <>
        <Example />
        <Example label="Archive">Hides it from subscribers</Example>
      </>
    );

    expect(elements.publishButton).toHaveAccessibleDescription("Sends to all subscribers");
    expect(screen.getByRole("button", { name: "Archive" })).toHaveAccessibleDescription("Hides it from subscribers");
  });

  it("must list the tooltip before the trigger's own description when getTriggerProps is given one", () => {
    render(
      <>
        <Example triggerProps={{ "aria-describedby": "publish-note" }} />
        <Box as="span" id="publish-note">
          Takes effect tomorrow
        </Box>
      </>
    );

    expect(elements.publishButton).toHaveAccessibleDescription("Sends to all subscribers Takes effect tomorrow");
  });

  it("must add the tooltip after the field's description when the trigger is a Field control", () => {
    render(<FieldExample />);

    expect(screen.getByRole("textbox", { name: "Display name" })).toHaveAccessibleDescription(
      "Shown on your profile Use the name people know you by"
    );
  });

  it("must show the tooltip after the show delay when the pointer rests on the trigger", async () => {
    const { advance, user } = setUpTest();
    render(<Example />);

    await user.hover(elements.publishButton);
    advance(399);

    expect(elements.visibleTooltip).toBeNull();

    advance(1);

    expect(elements.visibleTooltip).toHaveAccessibleName("Sends to all subscribers");
  });

  it("must use the given show delay and keep the default hide delay when only delay.show is given", async () => {
    const { advance, user } = setUpTest();
    render(<Example delay={{ show: 100 }} />);

    await user.hover(elements.publishButton);
    advance(100);

    expect(elements.visibleTooltip).not.toBeNull();

    await user.unhover(elements.publishButton);
    advance(149);

    expect(elements.visibleTooltip).not.toBeNull();

    advance(1);

    expect(elements.visibleTooltip).toBeNull();
  });

  it("must hide the tooltip after the hide delay when the pointer leaves the trigger", async () => {
    const { advance, user } = setUpTest();
    render(<Example />);
    await user.hover(elements.publishButton);
    advance(400);

    await user.unhover(elements.publishButton);
    advance(149);

    expect(elements.visibleTooltip).not.toBeNull();

    advance(1);

    expect(elements.visibleTooltip).toBeNull();
  });

  it("must stay open when the pointer moves from the trigger onto the tooltip", async () => {
    const { advance, user } = setUpTest();
    render(<Example />);
    await user.hover(elements.publishButton);
    advance(400);
    const tooltip = screen.getByRole("tooltip");

    await user.unhover(elements.publishButton);
    await user.hover(tooltip);
    advance(1000);

    expect(elements.visibleTooltip).toBe(tooltip);
  });

  it("must hide the tooltip after the hide delay when the pointer leaves the tooltip", async () => {
    const { advance, user } = setUpTest();
    render(<Example />);
    await user.hover(elements.publishButton);
    advance(400);
    const tooltip = screen.getByRole("tooltip");
    await user.unhover(elements.publishButton);
    await user.hover(tooltip);

    await user.unhover(tooltip);
    advance(150);

    expect(elements.visibleTooltip).toBeNull();
  });

  it("must show the tooltip at once when the trigger takes keyboard focus", async () => {
    const { user } = setUpTest();
    render(<Example />);

    await user.tab();

    expect(elements.publishButton).toHaveFocus();
    expect(elements.visibleTooltip).toHaveAccessibleName("Sends to all subscribers");
  });

  it("must not show the tooltip when the trigger is focused by a click", async () => {
    const { advance, user } = setUpTest();
    render(<Example />);

    await user.click(elements.publishButton);
    advance(1000);

    expect(elements.publishButton).toHaveFocus();
    expect(elements.visibleTooltip).toBeNull();
  });

  it("must hide the tooltip when the trigger loses focus", async () => {
    const { user } = setUpTest();
    render(
      <>
        <Example />
        <Button>Cancel</Button>
      </>
    );
    await user.tab();

    await user.tab();

    expect(elements.cancelButton).toHaveFocus();
    expect(elements.visibleTooltip).toBeNull();
  });

  it("must keep the tooltip open when the pointer leaves a trigger that has keyboard focus", async () => {
    const { advance, user } = setUpTest();
    render(<Example />);
    await user.tab();

    await user.hover(elements.publishButton);
    await user.unhover(elements.publishButton);
    advance(1000);

    expect(elements.visibleTooltip).toHaveAccessibleName("Sends to all subscribers");
  });

  it("must hide the tooltip and keep focus on the trigger when Escape is pressed", async () => {
    const { user } = setUpTest();
    render(<Example />);
    await user.tab();

    await user.keyboard("{Escape}");

    expect(elements.visibleTooltip).toBeNull();
    expect(elements.publishButton).toHaveFocus();
  });

  it("must keep Escape from the page only when it hides a tooltip", async () => {
    const { user } = setUpTest();
    const escapePrevented: boolean[] = [];
    const listening = new AbortController();
    render(<Example />);
    await user.tab();
    window.addEventListener("keydown", (event) => escapePrevented.push(event.defaultPrevented), {
      signal: listening.signal,
    });

    await user.keyboard("{Escape}");
    await user.keyboard("{Escape}");
    listening.abort();

    expect(escapePrevented).toEqual([true, false]);
  });

  it("must hide the tooltip when the trigger is pressed", async () => {
    const { advance, user } = setUpTest();
    render(<Example />);
    await user.hover(elements.publishButton);
    advance(400);

    await user.pointer({ keys: "[MouseLeft>]", target: elements.publishButton });

    expect(elements.visibleTooltip).toBeNull();
  });

  it("must not show the tooltip when the trigger is touched", async () => {
    const { advance, user } = setUpTest();
    render(<Example />);

    await user.pointer([{ keys: "[TouchA]", target: elements.publishButton }]);
    advance(1000);

    expect(elements.visibleTooltip).toBeNull();
  });

  it("must report the request and stay closed when open is controlled", async () => {
    const { advance, user } = setUpTest();
    const onOpenChange = vi.fn();
    render(<Example onOpenChange={onOpenChange} open={false} />);

    await user.hover(elements.publishButton);
    advance(400);

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(elements.visibleTooltip).toBeNull();
  });

  it("must call onOpenChange with false when an uncontrolled tooltip hides", async () => {
    const { user } = setUpTest();
    const onOpenChange = vi.fn();
    render(<Example onOpenChange={onOpenChange} />);
    await user.tab();

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("must run the trigger's own focus handler and still show the tooltip when getTriggerProps is given one", async () => {
    const { user } = setUpTest();
    const onFocus = vi.fn();
    render(<Example triggerProps={{ onFocus }} />);

    await user.tab();

    expect(onFocus).toHaveBeenCalled();
    expect(elements.visibleTooltip).toHaveAccessibleName("Sends to all subscribers");
  });

  it("must hide the open tooltip when another tooltip opens", async () => {
    const { user } = setUpTest();
    render(
      <>
        <Example />
        <Example label="Archive">Hides it from subscribers</Example>
      </>
    );
    await user.tab();

    await user.hover(elements.archiveButton);

    expect(screen.getAllByRole("tooltip")).toHaveLength(1);
    expect(elements.visibleTooltip).toHaveAccessibleName("Hides it from subscribers");
  });

  it("must skip the show delay when another tooltip closed less than 300ms ago", async () => {
    const { advance, user } = setUpTest();
    render(
      <>
        <Example />
        <Example label="Archive">Hides it from subscribers</Example>
      </>
    );
    await user.hover(elements.publishButton);
    advance(400);
    await user.unhover(elements.publishButton);
    advance(150);

    advance(149);
    await user.hover(elements.archiveButton);

    expect(elements.visibleTooltip).toHaveAccessibleName("Hides it from subscribers");
  });

  it("must wait for the show delay when the last tooltip closed 300ms ago", async () => {
    const { advance, user } = setUpTest();
    render(
      <>
        <Example />
        <Example label="Archive">Hides it from subscribers</Example>
      </>
    );
    await user.hover(elements.publishButton);
    advance(400);
    await user.unhover(elements.publishButton);
    advance(150);

    advance(300);
    await user.hover(elements.archiveButton);

    expect(elements.visibleTooltip).toBeNull();

    advance(400);

    expect(elements.visibleTooltip).toHaveAccessibleName("Hides it from subscribers");
  });

  it("must open the next tooltip after its show delay when the open tooltip unmounts", async () => {
    const { advance, user } = setUpTest();
    const { rerender } = render(
      <>
        <Example key="publish" />
        <Example key="archive" label="Archive">
          Hides it from subscribers
        </Example>
      </>
    );
    await user.tab();

    rerender(
      <Example key="archive" label="Archive">
        Hides it from subscribers
      </Example>
    );
    advance(1000);
    await user.hover(elements.archiveButton);

    expect(elements.visibleTooltip).toBeNull();

    advance(400);

    expect(elements.visibleTooltip).toHaveAccessibleName("Hides it from subscribers");
  });
});

interface ExampleProps extends UseTooltipOptions {
  /**
   * Tooltip text
   */
  children?: string;

  /**
   * Content of the trigger button
   */
  label?: ReactNode;

  /**
   * Props the trigger passes through `getTriggerProps`
   */
  triggerProps?: Pick<ButtonProps, "aria-describedby" | "onFocus">;
}

function Example({
  children = "Sends to all subscribers",
  label = "Publish",
  triggerProps,
  ...options
}: ExampleProps): JSX.Element {
  const tooltip = useTooltip(options);

  return (
    <>
      <Button {...tooltip.getTriggerProps(triggerProps)}>{label}</Button>
      <Tooltip {...tooltip.getOverlayProps()}>{children}</Tooltip>
    </>
  );
}

function FieldExample(): JSX.Element {
  const tooltip = useTooltip();

  return (
    <Field description="Shown on your profile" label="Display name">
      <TextInput {...tooltip.getTriggerProps()} />
      <Tooltip {...tooltip.getOverlayProps()}>Use the name people know you by</Tooltip>
    </Field>
  );
}

let hoursAhead = 0;

function setUpTest() {
  // The tooltip coordinator keeps state across tests; starting each test an hour later keeps one test's closed
  // tooltip from skipping the next test's show delay
  hoursAhead += 1;
  vi.useFakeTimers();
  vi.setSystemTime(Date.now() + hoursAhead * 3_600_000);

  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  function advance(milliseconds: number): void {
    act(() => {
      vi.advanceTimersByTime(milliseconds);
    });
  }

  return { advance, user };
}

const copyIcon = (
  <Box as="svg" viewBox="0 0 16 16" aria-hidden="true">
    <Box as="path" d="M4 4h8v8H4z" />
  </Box>
);

const elements = {
  get archiveButton() {
    return screen.getByRole("button", { name: "Archive" });
  },
  get cancelButton() {
    return screen.getByRole("button", { name: "Cancel" });
  },
  get publishButton() {
    return screen.getByRole("button", { name: "Publish" });
  },
  get visibleTooltip() {
    return screen.queryByRole("tooltip");
  },
};
