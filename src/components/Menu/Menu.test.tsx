import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { JSX, MouseEvent } from "react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { MissingContextError } from "../../errors";
import { Button } from "../Button";
import { MoreHorizontalIcon } from "../Icon";
import { IconButton } from "../IconButton";

import { Menu } from "./Menu";
import { MenuItem } from "./MenuItem";
import type { UseMenuOptions } from "./useMenu";
import { useMenu } from "./useMenu";

describe("Menu", () => {
  it("must point the trigger at the menu when it renders", () => {
    render(<RowActions />);

    expect(elements.trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
    expect(elements.trigger).toHaveAttribute("aria-controls", elements.menu.id);
    expect(elements.trigger).toHaveAttribute("popovertarget", elements.menu.id);
    expect(elements.menu).toHaveAttribute("popover", "auto");
  });

  it("must open below the trigger's start edge when placement is omitted", () => {
    render(<RowActions />);

    expect(elements.menu).toHaveAttribute("data-placement", "bottom-start");
  });

  it("must name the menu by its trigger when no aria-label is given", () => {
    render(<RowActions defaultOpen={true} />);

    expect(screen.getByRole("menu", { name: "Actions" })).toBe(elements.menu);
  });

  it("must name the menu by aria-label alone when its trigger is an IconButton", () => {
    render(<IconTriggerMenu />);

    expect(screen.getByRole("menu", { name: "Row actions" })).not.toHaveAttribute("aria-labelledby");
  });

  it("must render each item as a button outside the tab order named by its label", () => {
    render(<RowActions />);

    const item = elements.item("Duplicate");

    expect(item.tagName).toBe("BUTTON");
    expect(item).toHaveAttribute("type", "button");
    expect(item).toHaveAttribute("tabindex", "-1");
  });

  it("must throw MissingContextError when an item renders outside a Menu", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<MenuItem>Orphan</MenuItem>)).toThrow(MissingContextError);
  });

  it("must focus the menu itself when a pointer opens it", async () => {
    const user = userEvent.setup();
    render(<RowActions />);

    await user.click(elements.trigger);
    openAsBrowser(elements.menu);

    expect(elements.menu).toHaveFocus();
    expect(elements.trigger).toHaveAttribute("aria-expanded", "true");
  });

  it.each(["{Enter}", " "])("must focus the first item when the keyboard opens the menu with %s", async (key) => {
    const user = userEvent.setup();
    render(<RowActions />);
    elements.trigger.focus();

    await user.keyboard(key);
    openAsBrowser(elements.menu);

    expect(elements.item("Edit")).toHaveFocus();
  });

  it("must focus the first item when the parent opens a controlled menu", async () => {
    const user = userEvent.setup();
    render(<ControlledRowActions />);

    await user.click(screen.getByRole("button", { name: "Open from the toolbar" }));
    openAsBrowser(elements.menu);

    expect(elements.item("Edit")).toHaveFocus();
  });

  it("must run an item's onClick once and close the menu when the item is clicked", async () => {
    const user = userEvent.setup();
    const onDuplicate = vi.fn();
    render(<RowActions defaultOpen={true} onDuplicate={onDuplicate} />);
    openAsBrowser(elements.menu);

    await user.click(elements.item("Duplicate"));

    expect(onDuplicate).toHaveBeenCalledOnce();
    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
    expect(elements.menu).not.toBeVisible();
  });

  it("must return focus to the trigger when an item closes the menu", async () => {
    const user = userEvent.setup();
    render(<RowActions defaultOpen={true} />);
    openAsBrowser(elements.menu);

    await user.click(elements.item("Duplicate"));
    closeAsBrowser(elements.menu);

    expect(elements.trigger).toHaveFocus();
  });

  it("must keep the menu open when an item's onClick prevents the default", async () => {
    const user = userEvent.setup();
    render(<RowActions defaultOpen={true} onDuplicate={(event) => event.preventDefault()} />);
    openAsBrowser(elements.menu);

    await user.click(elements.item("Duplicate"));

    expect(elements.trigger).toHaveAttribute("aria-expanded", "true");
    expect(elements.menu).toBeVisible();
  });

  it("must report closing when an item closes a controlled menu", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<RowActions onOpenChange={onOpenChange} open={true} />);
    openAsBrowser(elements.menu);

    await user.click(elements.item("Duplicate"));

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("must run the consumer's trigger handler when one is given", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<RowActions onTriggerClick={onClick} />);

    await user.click(elements.trigger);

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("must reject role when an item is given one", () => {
    render(
      <BareMenu>
        {/* @ts-expect-error the menu pattern sets the role */}
        <MenuItem role="tab">Edit</MenuItem>
      </BareMenu>
    );

    expect(elements.item("Edit")).toBeInTheDocument();
  });

  it("must reject aria-labelledby when an item is given one", () => {
    render(
      <BareMenu>
        {/* @ts-expect-error the label names the item */}
        <MenuItem aria-labelledby="elsewhere">Edit</MenuItem>
      </BareMenu>
    );

    expect(elements.item("Edit")).toBeInTheDocument();
  });
});

interface RowActionsProps extends UseMenuOptions {
  /**
   * Runs when Duplicate is clicked
   */
  onDuplicate?: (event: MouseEvent<HTMLButtonElement>) => void;

  /**
   * Runs when the trigger is clicked
   */
  onTriggerClick?: () => void;
}

function RowActions({ onDuplicate, onTriggerClick, ...options }: RowActionsProps): JSX.Element {
  const menu = useMenu(options);

  return (
    <>
      <Button {...menu.getTriggerProps({ onClick: onTriggerClick })} variant="secondary">
        Actions
      </Button>
      <Menu {...menu.getMenuProps()}>
        <MenuItem>Edit</MenuItem>
        <MenuItem onClick={onDuplicate}>Duplicate</MenuItem>
        <MenuItem>Archive</MenuItem>
      </Menu>
    </>
  );
}

function ControlledRowActions(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="ghost">
        Open from the toolbar
      </Button>
      <RowActions onOpenChange={setOpen} open={open} />
    </>
  );
}

function IconTriggerMenu(): JSX.Element {
  const menu = useMenu({ defaultOpen: true });

  return (
    <>
      {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- label names the IconButton */}
      <IconButton {...menu.getTriggerProps()} label="Row actions">
        <MoreHorizontalIcon />
      </IconButton>
      <Menu {...menu.getMenuProps({ "aria-label": "Row actions" })}>
        <MenuItem>Edit</MenuItem>
      </Menu>
    </>
  );
}

function BareMenu({ children }: { children: JSX.Element }): JSX.Element {
  return (
    <Menu
      anchorName="--menu"
      close={() => {}}
      id="menu"
      onBeforeToggle={() => {}}
      onToggle={() => {}}
      open={false}
      placement="bottom-start"
      aria-label="Actions"
    >
      {children}
    </Menu>
  );
}

function toggleEvent(type: "beforetoggle" | "toggle", newState: "closed" | "open"): Event {
  return Object.assign(new Event(type, { cancelable: type === "beforetoggle" && newState === "open" }), {
    newState,
    oldState: newState === "open" ? "closed" : "open",
  });
}

/**
 * Opens a menu as a browser does once its trigger is pressed or its parent opens it: `beforetoggle`, the show, then
 * `toggle`. jsdom fires neither event and does not open a popover from its `popovertarget`.
 *
 * @param menu the menu element
 */
function openAsBrowser(menu: HTMLElement): void {
  fireEvent(menu, toggleEvent("beforetoggle", "open"));
  menu.showPopover();
  fireEvent(menu, toggleEvent("toggle", "open"));
}

/**
 * Closes a menu as a browser does once it has been asked to: `beforetoggle`, the hide, then `toggle`
 *
 * @param menu the menu element
 */
function closeAsBrowser(menu: HTMLElement): void {
  fireEvent(menu, toggleEvent("beforetoggle", "closed"));
  menu.hidePopover();
  fireEvent(menu, toggleEvent("toggle", "closed"));
}

const elements = {
  item(name: string): HTMLElement {
    return screen.getByRole("menuitem", { hidden: true, name });
  },
  get menu(): HTMLElement {
    return screen.getByRole("menu", { hidden: true });
  },
  get trigger(): HTMLElement {
    return screen.getByRole("button", { name: "Actions" });
  },
};
