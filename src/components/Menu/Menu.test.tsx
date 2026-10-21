import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { JSX, MouseEvent } from "react";
import { useState } from "react";
import { describe, expect, it, onTestFinished, vi } from "vitest";

import { MissingContextError } from "../../errors";
import { Button } from "../Button";
import { MoreHorizontalIcon, RefreshIcon } from "../Icon";
import { IconButton } from "../IconButton";
import { Text } from "../Text";

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

  it.each([
    { from: "Edit", key: "{ArrowDown}", to: "Duplicate" },
    { from: "Archive", key: "{ArrowDown}", to: "Edit" },
    { from: "Duplicate", key: "{ArrowUp}", to: "Edit" },
    { from: "Edit", key: "{ArrowUp}", to: "Archive" },
    { from: "Duplicate", key: "{Home}", to: "Edit" },
    { from: "Duplicate", key: "{End}", to: "Archive" },
  ])("must move focus from $from to $to when $key is pressed", async ({ from, key, to }) => {
    const user = userEvent.setup();
    render(<RowActions defaultOpen={true} />);
    openAsBrowser(elements.menu);
    elements.item(from).focus();

    await user.keyboard(key);

    expect(elements.item(to)).toHaveFocus();
  });

  it.each([
    { key: "{ArrowDown}", to: "Edit" },
    { key: "{ArrowUp}", to: "Archive" },
  ])("must move focus from the menu itself to $to when $key is pressed", async ({ key, to }) => {
    const user = userEvent.setup();
    render(<RowActions />);
    await user.click(elements.trigger);
    openAsBrowser(elements.menu);

    await user.keyboard(key);

    expect(elements.item(to)).toHaveFocus();
  });

  it("must scroll the item it moves to into view when an arrow key is pressed", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView");
    render(<RowActions defaultOpen={true} />);
    openAsBrowser(elements.menu);
    elements.item("Edit").focus();

    await user.keyboard("{ArrowDown}");

    expect(scrollIntoView).toHaveBeenLastCalledWith(expect.objectContaining({ block: "nearest" }));
  });

  it.each(["{Alt>}{ArrowDown}{/Alt}", "{Control>}{ArrowDown}{/Control}", "{Meta>}{End}{/Meta}"])(
    "must leave focus where it is when %s is pressed",
    async (keys) => {
      const user = userEvent.setup();
      render(<RowActions defaultOpen={true} />);
      openAsBrowser(elements.menu);
      elements.item("Edit").focus();

      await user.keyboard(keys);

      expect(elements.item("Edit")).toHaveFocus();
    }
  );

  it.each([
    { key: "{ArrowDown}", to: "Edit" },
    { key: "{ArrowUp}", to: "Archive" },
  ])("must open the menu on $to when $key is pressed on the trigger", async ({ key, to }) => {
    const user = userEvent.setup();
    render(<RowActions />);
    elements.trigger.focus();

    await user.keyboard(key);
    openAsBrowser(elements.menu);

    expect(elements.item(to)).toHaveFocus();
  });

  it("must show the menu when an arrow key is pressed on the trigger", async () => {
    const user = userEvent.setup();
    render(<RowActions />);
    elements.trigger.focus();

    await user.keyboard("{ArrowDown}");

    expect(elements.menu).toBeVisible();
  });

  it("must close the menu and move focus past the trigger when Tab is pressed", async () => {
    const user = userEvent.setup();
    render(<MenuAmongButtons />);
    await user.click(elements.trigger);
    openAsBrowser(elements.menu);
    elements.item("Edit").focus();

    await user.tab();

    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("must close the menu and return focus to the trigger when Shift+Tab is pressed", async () => {
    const user = userEvent.setup();
    render(<MenuAmongButtons />);
    await user.click(elements.trigger);
    openAsBrowser(elements.menu);
    elements.item("Edit").focus();

    await user.tab({ shift: true });

    expect(elements.trigger).toHaveFocus();
    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("must close the menu when focus moves to an element outside it", async () => {
    const user = userEvent.setup();
    render(<MenuAmongButtons />);
    openAsBrowser(elements.menu);
    elements.item("Edit").focus();

    await user.click(screen.getByRole("button", { name: "Last" }));

    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("must leave closing to the trigger when focus moves to it", async () => {
    const user = userEvent.setup();
    render(<MenuAmongButtons />);
    openAsBrowser(elements.menu);
    elements.item("Edit").focus();

    await user.click(elements.trigger);

    expect(elements.trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("must close the menu once focus lands outside it after leaving for nowhere in particular", async () => {
    render(<MenuAmongButtons />);
    openAsBrowser(elements.menu);
    elements.item("Edit").focus();

    elements.item("Edit").blur();

    await waitFor(() => expect(elements.trigger).toHaveAttribute("aria-expanded", "false"));
  });

  it("must move focus to the menu when the focused item is removed", async () => {
    const user = userEvent.setup();
    render(<DismissibleMenu />);
    openAsBrowser(elements.menu);

    await user.click(elements.item("Dismiss"));

    await waitFor(() => expect(elements.menu).toHaveFocus());
    expect(elements.trigger).toHaveAttribute("aria-expanded", "true");
  });

  it.each([
    { from: "Archive", typed: "d", to: "Delete" },
    { from: "Delete", typed: "a", to: "Archive" },
    { from: "Archive", typed: "f", to: "Fix the build" },
    { from: "Fix the build", typed: "f", to: "Fix the tests" },
    { from: "Archive", typed: "fix the t", to: "Fix the tests" },
  ])("must move focus from $from to $to when '$typed' is typed", async ({ from, to, typed }) => {
    const { user } = setUpTest();
    render(<TypeAheadMenu />);
    openAsBrowser(elements.menu);
    elements.item(from).focus();

    await user.keyboard(typed);

    expect(elements.item(to)).toHaveFocus();
  });

  it("must keep the menu open when Space joins a query being typed", async () => {
    const { user } = setUpTest();
    render(<TypeAheadMenu />);
    openAsBrowser(elements.menu);
    elements.item("Archive").focus();

    await user.keyboard("fix ");

    expect(elements.item("Fix the build")).toHaveFocus();
    expect(elements.trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("must choose the focused item when Space is pressed after a query has ended", async () => {
    const { user } = setUpTest();
    render(<TypeAheadMenu />);
    openAsBrowser(elements.menu);
    elements.item("Archive").focus();

    await user.keyboard("d");
    vi.advanceTimersByTime(600);
    await user.keyboard(" ");

    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("must leave an item's icon out of its name when the item has one", () => {
    render(<RichMenu />);

    expect(elements.item("Rename…")).toContainElement(screen.getByTestId("rename-icon"));
    expect(screen.getByTestId("rename-icon")).toHaveAttribute("aria-hidden", "true");
  });

  it("must describe an item by its description, listed before the consumer's, when it has one", () => {
    render(<RichMenu />);

    expect(elements.item("Duplicate")).toHaveAccessibleDescription("Make a copy beside it Keeps its sharing");
  });

  it("must show a shortcut without adding it to the name or description when an item has one", () => {
    render(<RichMenu />);

    expect(screen.getByText("⌘D")).toBeInTheDocument();
    expect(elements.item("Duplicate")).toHaveAttribute("aria-keyshortcuts", "Meta+D");
  });

  it("must mark a disabled item and keep the menu open when it is clicked", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(<RichMenu onExport={onExport} />);
    openAsBrowser(elements.menu);

    await user.click(elements.item("Export"));

    expect(elements.item("Export")).toHaveAttribute("aria-disabled", "true");
    expect(onExport).not.toHaveBeenCalled();
    expect(elements.trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("must reach a disabled item with the arrow keys and type-ahead when it is disabled", async () => {
    const { user } = setUpTest();
    render(<RichMenu />);
    openAsBrowser(elements.menu);
    elements.item("Duplicate").focus();

    await user.keyboard("{ArrowDown}");
    const reachedByArrow = document.activeElement;
    elements.item("Rename…").focus();
    await user.keyboard("e");

    expect(reachedByArrow).toBe(elements.item("Export"));
    expect(elements.item("Export")).toHaveFocus();
  });

  it("must match an item's label alone when its description or shortcut would match", async () => {
    const { user } = setUpTest();
    render(<RichMenu />);
    openAsBrowser(elements.menu);
    elements.item("Rename…").focus();

    await user.keyboard("m");

    expect(elements.item("Rename…")).toHaveFocus();
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

function MenuAmongButtons(): JSX.Element {
  const menu = useMenu();

  return (
    <>
      <Button {...menu.getTriggerProps()} variant="secondary">
        Actions
      </Button>
      <Button variant="ghost">After</Button>
      <Menu {...menu.getMenuProps()}>
        <MenuItem>Edit</MenuItem>
        <MenuItem>Duplicate</MenuItem>
      </Menu>
      <Button variant="ghost">Last</Button>
    </>
  );
}

function DismissibleMenu(): JSX.Element {
  const [dismissed, setDismissed] = useState(false);
  const menu = useMenu({ defaultOpen: true });

  function dismiss(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    setDismissed(true);
  }

  return (
    <>
      <Button {...menu.getTriggerProps()} variant="secondary">
        Actions
      </Button>
      <Menu {...menu.getMenuProps()}>
        <MenuItem>Edit</MenuItem>
        {!dismissed && <MenuItem onClick={dismiss}>Dismiss</MenuItem>}
      </Menu>
    </>
  );
}

interface RichMenuProps {
  /**
   * Runs when the disabled Export is clicked, which it must not be
   */
  onExport?: () => void;
}

function RichMenu({ onExport }: RichMenuProps): JSX.Element {
  const menu = useMenu({ defaultOpen: true });

  return (
    <>
      <Button {...menu.getTriggerProps()} variant="secondary">
        Actions
      </Button>
      <Menu {...menu.getMenuProps()}>
        <MenuItem icon={<RefreshIcon data-testid="rename-icon" />}>Rename…</MenuItem>
        <MenuItem
          description="Make a copy beside it"
          shortcut="⌘D"
          aria-describedby="duplicate-note"
          aria-keyshortcuts="Meta+D"
        >
          Duplicate
        </MenuItem>
        <MenuItem disabled={true} onClick={onExport}>
          Export
        </MenuItem>
        <MenuItem tone="danger">Delete</MenuItem>
      </Menu>
      <Text id="duplicate-note">Keeps its sharing</Text>
    </>
  );
}

function TypeAheadMenu(): JSX.Element {
  const menu = useMenu({ defaultOpen: true });

  return (
    <>
      <Button {...menu.getTriggerProps()} variant="secondary">
        Actions
      </Button>
      <Menu {...menu.getMenuProps()}>
        <MenuItem>Archive</MenuItem>
        <MenuItem>Fix the build</MenuItem>
        <MenuItem>Fix the tests</MenuItem>
        <MenuItem>Delete</MenuItem>
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

function setUpTest() {
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.useRealTimers();
  });

  return { user: userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) }) };
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
