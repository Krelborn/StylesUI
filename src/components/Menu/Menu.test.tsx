import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentPropsWithRef, JSX, MouseEvent } from "react";
import { useState } from "react";
import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";

import { MissingContextError } from "../../errors";
import { Box } from "../Box";
import { Button } from "../Button";
import { MoreHorizontalIcon, RefreshIcon } from "../Icon";
import { IconButton } from "../IconButton";
import { Text } from "../Text";

import type { MenuDensity } from "./Menu";
import { Menu } from "./Menu";
import { MenuGroup } from "./MenuGroup";
import { MenuItem } from "./MenuItem";
import { MenuItemCheckbox } from "./MenuItemCheckbox";
import { MenuItemRadio } from "./MenuItemRadio";
import { MenuRadioGroup } from "./MenuRadioGroup";
import { MenuSeparator } from "./MenuSeparator";
import { Submenu } from "./Submenu";
import type { UseMenuOptions } from "./useMenu";
import { useMenu } from "./useMenu";

describe("Menu", () => {
  afterEach(() => {
    window.location.hash = "";
  });

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

  it.each([
    { description: "a secondary press", releasedOn: "trigger", keys: "MouseRight" },
    { description: "a press released off the trigger", releasedOn: "page", keys: "MouseLeft" },
  ])(
    "must focus the first item when assistive technology opens the menu after $description",
    async ({ keys, releasedOn }) => {
      const user = userEvent.setup();
      render(<RowActions />);
      elements.trigger.focus();
      await user.pointer([
        { keys: `[${keys}>]`, target: elements.trigger },
        { target: releasedOn === "trigger" ? elements.trigger : document.body },
        { keys: `[/${keys}]` },
      ]);

      fireEvent.click(elements.trigger);
      openAsBrowser(elements.menu);

      expect(elements.item("Edit")).toHaveFocus();
    }
  );

  it("must leave focus where it is when a popover of the consumer's inside the menu opens", async () => {
    const user = userEvent.setup();
    render(<NestedPopoverMenu />);
    await user.click(elements.trigger);
    openAsBrowser(elements.menu);

    fireEvent(screen.getByText("Saved to Inbox"), toggleEvent("toggle", "open"));

    expect(elements.menu).toHaveFocus();
  });

  it("must focus the first item when the parent opens a controlled menu", async () => {
    const user = userEvent.setup();
    render(<ControlledRowActions />);

    await user.click(screen.getByRole("button", { name: "Open from the toolbar" }));
    openAsBrowser(elements.menu);

    expect(elements.item("Edit")).toHaveFocus();
  });

  it("must focus the last item when the parent accepts a request from ArrowUp to open a controlled menu", async () => {
    const user = userEvent.setup();
    showPopoverAsBrowser();
    render(<ControlledRowActions />);
    elements.trigger.focus();

    await user.keyboard("{ArrowUp}");
    fireEvent(elements.menu, toggleEvent("toggle", "open"));

    expect(elements.item("Archive")).toHaveFocus();
  });

  it("must focus the first item when the parent opens a controlled menu after ignoring a request from ArrowUp", async () => {
    const user = userEvent.setup();
    showPopoverAsBrowser();
    render(<ControlledRowActions ignoresRequests={true} />);
    elements.trigger.focus();
    await user.keyboard("{ArrowUp}");

    await user.click(screen.getByRole("button", { name: "Open from the toolbar" }));
    fireEvent(elements.menu, toggleEvent("toggle", "open"));

    expect(elements.item("Edit")).toHaveFocus();
  });

  it("must focus the first item when the parent opens a controlled menu after the trigger's click was cancelled", async () => {
    const user = userEvent.setup();
    render(<ControlledRowActions onTriggerClick={(event) => event.preventDefault()} />);
    await user.click(elements.trigger);

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
    reportClosedAsBrowser(elements.menu);

    expect(elements.menu).not.toBeVisible();
    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Last" })).toHaveFocus();
  });

  it("must leave closing to the trigger when focus moves to it", async () => {
    const user = userEvent.setup();
    render(<MenuAmongButtons />);
    openAsBrowser(elements.menu);
    elements.item("Edit").focus();

    await user.click(elements.trigger);

    expect(elements.trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("must close the menu and leave focus on the page once focus leaves it for nowhere in particular", async () => {
    render(<MenuAmongButtons />);
    openAsBrowser(elements.menu);
    elements.item("Edit").focus();

    elements.item("Edit").blur();
    await waitFor(() => expect(elements.menu).not.toBeVisible());
    reportClosedAsBrowser(elements.menu);

    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
    expect(document.body).toHaveFocus();
  });

  it("must close the menu when focus leaves it for nowhere in particular as other content in it changes", async () => {
    render(<MenuAmongButtons />);
    openAsBrowser(elements.menu);
    elements.item("Edit").focus();

    elements.item("Edit").blur();
    elements.menu.append(document.createElement("span"));

    await waitFor(() => expect(elements.menu).not.toBeVisible());
    expect(document.body).toHaveFocus();
  });

  it("must move focus to the menu when the item focused as it opened is removed", async () => {
    const { rerender } = render(<RemovableFirstItemMenu />);
    openAsBrowser(elements.menu);

    rerender(<RemovableFirstItemMenu showsEdit={false} />);

    await waitFor(() => expect(elements.menu).toHaveFocus());
  });

  it("must move focus to the menu when the focused item is removed", async () => {
    const user = userEvent.setup();
    render(<DismissibleMenu />);
    openAsBrowser(elements.menu);

    await user.click(elements.item("Dismiss"));

    await waitFor(() => expect(elements.menu).toHaveFocus());
    expect(elements.trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("must move focus to the open submenu around a removed submenu that held focus", async () => {
    const user = userEvent.setup();
    render(<DismissibleNestedSubmenuMenu />);
    await openSubmenu(user);
    elements.item("Archive").focus();
    await user.keyboard("{ArrowRight}");
    fireEvent(elements.submenu("Archive"), toggleEvent("toggle", "open"));

    await user.click(elements.item("Dismiss"));

    await waitFor(() => expect(elements.submenu("Move to")).toHaveFocus());
    expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "true");
  });

  it("must move focus to the submenu when its focused item is removed along with an item of the menu around it", async () => {
    const user = userEvent.setup();
    render(<DismissibleSubmenuMenu />);
    await openSubmenu(user);

    await user.click(elements.item("Dismiss"));

    await waitFor(() => expect(elements.submenu("Move to")).toHaveFocus());
    expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "true");
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

  it("must choose the focused item when Space is pressed in a menu reopened straight after a query", async () => {
    const { user } = setUpTest();
    render(<TypeAheadMenu />);
    openAsBrowser(elements.menu);
    elements.item("Archive").focus();
    await user.keyboard("d");
    closeAsBrowser(elements.menu);
    openAsBrowser(elements.menu);

    await user.keyboard(" ");

    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
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

  it("must leave the menu's items alone when Space is pressed on the menu itself", async () => {
    const user = userEvent.setup();
    render(<SubmenuBeforeCheckboxMenu />);
    openAsBrowser(elements.menu);
    elements.menu.focus();

    await user.keyboard(" ");

    expect(elements.checkbox("Pinned")).toHaveAttribute("aria-checked", "false");
  });

  it("must leave the menu around a submenu alone when Space chooses an item in the submenu", async () => {
    const user = userEvent.setup();
    render(<SubmenuBeforeCheckboxMenu />);
    await openSubmenu(user);

    await user.keyboard(" ");

    expect(elements.checkbox("Pinned")).toHaveAttribute("aria-checked", "false");
  });

  it("must choose a submenu's item when Space is pressed in it straight after a query in the menu around it", async () => {
    const { user } = setUpTest();
    render(<SubmenuMenu />);
    openAsBrowser(elements.menu);
    elements.item("Edit").focus();
    await user.keyboard("m{ArrowRight}");
    fireEvent(elements.submenu("Move to"), toggleEvent("toggle", "open"));

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

  it("must name a group by its label when it has one", () => {
    render(<GroupedMenu />);

    expect(screen.getByRole("group", { name: "Sort by" })).toContainElement(elements.item("Name"));
  });

  it("must render a group without a name when it has no label", () => {
    render(<GroupedMenu />);

    expect(screen.getByRole("group", { name: "" })).toContainElement(elements.item("Edit"));
  });

  it("must name a group by the consumer's aria-labelledby when it has no label", () => {
    render(
      <>
        <Text id="filters-heading">Filters</Text>
        <BareMenu>
          <MenuGroup aria-labelledby="filters-heading">
            <MenuItem>Starred</MenuItem>
          </MenuGroup>
        </BareMenu>
      </>
    );

    expect(screen.getByRole("group", { hidden: true, name: "Filters" })).toContainElement(elements.item("Starred"));
  });

  it("must separate items with a separator when one is given", () => {
    render(<GroupedMenu />);

    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it.each([
    { from: "Duplicate", key: "{ArrowDown}", to: "Name" },
    { from: "Name", key: "{ArrowUp}", to: "Duplicate" },
    { from: "Edit", key: "s", to: "Size" },
  ])("must move focus from $from to $to across groups when $key is pressed", async ({ from, key, to }) => {
    const { user } = setUpTest();
    render(<GroupedMenu />);
    openAsBrowser(elements.menu);
    elements.item(from).focus();

    await user.keyboard(key);

    expect(elements.item(to)).toHaveFocus();
  });

  it("must throw MissingContextError when a group renders outside a Menu", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<MenuGroup>Orphan</MenuGroup>)).toThrow(MissingContextError);
  });

  it("must render a link with the menuitem role when an item's as is a", () => {
    render(<LinkMenu />);

    expect(elements.item("Help").tagName).toBe("A");
    expect(elements.item("Help")).toHaveAttribute("href", "#help");
    expect(elements.item("Help")).toHaveAttribute("tabindex", "-1");
  });

  it("must pass the item's role and props to a component given in as", () => {
    render(<LinkMenu />);

    expect(elements.item("Settings").tagName).toBe("A");
    expect(elements.item("Settings")).toHaveAttribute("href", "#/settings");
    expect(elements.item("Settings")).toHaveAttribute("tabindex", "-1");
  });

  it("must follow a link item and close the menu when it is clicked", async () => {
    const user = userEvent.setup();
    render(<LinkMenu />);
    openAsBrowser(elements.menu);

    await user.click(elements.item("Help"));

    expect(window.location.hash).toBe("#help");
    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("must follow a link item when Space is pressed on it", async () => {
    const user = userEvent.setup();
    render(<LinkMenu />);
    openAsBrowser(elements.menu);
    elements.item("Settings").focus();

    await user.keyboard(" ");

    expect(window.location.hash).toBe("#/settings");
  });

  it("must not follow a disabled link item when it is clicked", async () => {
    const user = userEvent.setup();
    render(<LinkMenu />);
    openAsBrowser(elements.menu);

    await user.click(elements.item("Billing"));

    expect(window.location.hash).not.toBe("#billing");
    expect(elements.trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("must leave a link item without its href when it is disabled", () => {
    render(<LinkMenu />);

    expect(elements.item("Billing")).not.toHaveAttribute("href");
  });

  it("must close the menu when a link item is middle-clicked", () => {
    render(<LinkMenu />);
    openAsBrowser(elements.menu);

    fireEvent(elements.item("Help"), new MouseEvent("auxclick", { bubbles: true, button: 1, cancelable: true }));

    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("must keep the menu open when a link item is clicked with the secondary button", () => {
    render(<LinkMenu />);
    openAsBrowser(elements.menu);

    fireEvent(elements.item("Help"), new MouseEvent("auxclick", { bubbles: true, button: 2, cancelable: true }));

    expect(elements.trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("must keep the menu open when a button item is middle-clicked", () => {
    render(<RowActions defaultOpen={true} />);
    openAsBrowser(elements.menu);

    fireEvent(elements.item("Duplicate"), new MouseEvent("auxclick", { bubbles: true, button: 1, cancelable: true }));

    expect(elements.trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("must keep a middle click from opening a disabled item given as a component", () => {
    render(<LinkMenu />);

    const opened = fireEvent(
      elements.item("Plans"),
      new MouseEvent("auxclick", { bubbles: true, button: 1, cancelable: true })
    );

    expect(opened).toBe(false);
  });

  it("must reject a link's props when an item's as is button", () => {
    render(
      <BareMenu>
        {/* @ts-expect-error a button has no href */}
        <MenuItem as="button" href="#help">
          Help
        </MenuItem>
      </BareMenu>
    );

    expect(elements.item("Help")).toBeInTheDocument();
  });

  it("must reject an element other than a link or button when one is given in as", () => {
    render(
      <BareMenu>
        {/* @ts-expect-error a menu item renders a link, a button or a component, never another element */}
        <MenuItem as="div">Help</MenuItem>
      </BareMenu>
    );

    expect(elements.item("Help")).toBeInTheDocument();
  });

  it("must require a component's own props when one is given in as", () => {
    render(
      <BareMenu>
        {/* @ts-expect-error RouterLink requires to */}
        <MenuItem as={RouterLink}>Settings</MenuItem>
      </BareMenu>
    );

    expect(elements.item("Settings")).toBeInTheDocument();
  });

  it("must mark a checkbox item checked when defaultChecked is true", () => {
    render(<CheckboxMenu />);

    expect(elements.checkbox("Show archived")).toHaveAttribute("aria-checked", "true");
    expect(elements.checkbox("Compact rows")).toHaveAttribute("aria-checked", "false");
    expect(elements.checkbox("Compact rows")).toHaveAttribute("tabindex", "-1");
  });

  it("must toggle an uncontrolled checkbox item, report it and close the menu when it is clicked", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<CheckboxMenu onCompactChange={onCheckedChange} />);
    openAsBrowser(elements.menu);

    await user.click(elements.checkbox("Compact rows"));

    expect(elements.checkbox("Compact rows")).toHaveAttribute("aria-checked", "true");
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("must report a toggle but follow checked when a controlled checkbox item is clicked", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<CheckboxMenu archivedChecked={true} onArchivedChange={onCheckedChange} />);
    openAsBrowser(elements.menu);

    await user.click(elements.checkbox("Show archived"));

    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
    expect(elements.checkbox("Show archived")).toHaveAttribute("aria-checked", "true");
  });

  it("must toggle a checkbox item and close the menu when Enter is pressed on it", async () => {
    const user = userEvent.setup();
    render(<CheckboxMenu />);
    openAsBrowser(elements.menu);
    elements.checkbox("Compact rows").focus();

    await user.keyboard("{Enter}");

    expect(elements.checkbox("Compact rows")).toHaveAttribute("aria-checked", "true");
    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("must toggle a checkbox item and keep the menu open when Space is pressed on it", async () => {
    const { user } = setUpTest();
    render(<CheckboxMenu />);
    openAsBrowser(elements.menu);
    elements.checkbox("Compact rows").focus();

    await user.keyboard(" ");

    expect(elements.checkbox("Compact rows")).toHaveAttribute("aria-checked", "true");
    expect(elements.trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("must toggle a checkbox item once when Space is held on it", async () => {
    const { user } = setUpTest();
    render(<CheckboxMenu />);
    openAsBrowser(elements.menu);
    elements.checkbox("Compact rows").focus();

    await user.keyboard("[Space>2/]");

    expect(elements.checkbox("Compact rows")).toHaveAttribute("aria-checked", "true");
  });

  it("must leave a checkbox item alone when Space joins a query being typed", async () => {
    const { user } = setUpTest();
    render(<CheckboxMenu />);
    openAsBrowser(elements.menu);
    elements.checkbox("Compact rows").focus();

    await user.keyboard("s ");

    expect(elements.checkbox("Show archived")).toHaveFocus();
    expect(elements.checkbox("Show archived")).toHaveAttribute("aria-checked", "true");
  });

  it("must leave a disabled checkbox item unchanged when it is clicked", async () => {
    const user = userEvent.setup();
    render(<CheckboxMenu />);
    openAsBrowser(elements.menu);

    await user.click(elements.checkbox("Sync"));

    expect(elements.checkbox("Sync")).toHaveAttribute("aria-checked", "false");
    expect(elements.trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("must reject an icon when a checkbox item is given one", () => {
    render(
      <BareMenu>
        {/* @ts-expect-error the check takes the icon's place */}
        <MenuItemCheckbox icon={<RefreshIcon />}>Show archived</MenuItemCheckbox>
      </BareMenu>
    );

    expect(elements.checkbox("Show archived")).toBeInTheDocument();
  });

  it("must check the radio item whose value is the group's defaultValue", () => {
    render(<SortMenu />);

    expect(screen.getByRole("group", { name: "Sort by" })).toContainElement(elements.radio("Name"));
    expect(elements.radio("Name")).toHaveAttribute("aria-checked", "true");
    expect(elements.radio("Size")).toHaveAttribute("aria-checked", "false");
  });

  it("must check a radio item, report its value and close the menu when it is clicked", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SortMenu onValueChange={onValueChange} />);
    openAsBrowser(elements.menu);

    await user.click(elements.radio("Size"));

    expect(elements.radio("Size")).toHaveAttribute("aria-checked", "true");
    expect(elements.radio("Name")).toHaveAttribute("aria-checked", "false");
    expect(onValueChange).toHaveBeenLastCalledWith("size");
    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("must report a choice but follow value when a controlled group's radio item is clicked", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SortMenu onValueChange={onValueChange} value="name" />);
    openAsBrowser(elements.menu);

    await user.click(elements.radio("Size"));

    expect(onValueChange).toHaveBeenLastCalledWith("size");
    expect(elements.radio("Name")).toHaveAttribute("aria-checked", "true");
  });

  it("must not report a choice when the checked radio item is clicked", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SortMenu onValueChange={onValueChange} />);
    openAsBrowser(elements.menu);

    await user.click(elements.radio("Name"));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("must check a radio item and keep the menu open when Space is pressed on it", async () => {
    const { user } = setUpTest();
    render(<SortMenu />);
    openAsBrowser(elements.menu);
    elements.radio("Size").focus();

    await user.keyboard(" ");

    expect(elements.radio("Size")).toHaveAttribute("aria-checked", "true");
    expect(elements.trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("must leave a disabled radio item unchecked when it is clicked", async () => {
    const user = userEvent.setup();
    render(<SortMenu />);
    openAsBrowser(elements.menu);

    await user.click(elements.radio("Owner"));

    expect(elements.radio("Owner")).toHaveAttribute("aria-checked", "false");
    expect(elements.trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("must throw MissingContextError when a radio item renders outside a MenuRadioGroup", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      render(
        <BareMenu>
          <MenuItemRadio value="name">Name</MenuItemRadio>
        </BareMenu>
      )
    ).toThrow(MissingContextError);
  });

  it("must require a label when a radio group renders", () => {
    render(
      <BareMenu>
        {/* @ts-expect-error a radio group is named by its label */}
        <MenuRadioGroup>
          <MenuItemRadio value="name">Name</MenuItemRadio>
        </MenuRadioGroup>
      </BareMenu>
    );

    expect(elements.radio("Name")).toBeInTheDocument();
  });

  it("must point a submenu's item at the submenu, which it names, when it renders", async () => {
    const user = userEvent.setup();
    render(<SubmenuMenu />);
    openAsBrowser(elements.menu);
    elements.item("Move to").focus();

    await user.keyboard("{ArrowRight}");

    expect(elements.item("Move to")).toHaveAttribute("aria-haspopup", "menu");
    expect(screen.getByRole("menu", { name: "Move to" })).toBe(elements.submenu("Move to"));
  });

  it.each(["{ArrowRight}", "{Enter}", " "])(
    "must open a submenu on its first item when %s is pressed on its item",
    async (key) => {
      const user = userEvent.setup();
      render(<SubmenuMenu />);
      openAsBrowser(elements.menu);
      elements.item("Move to").focus();

      await user.keyboard(key);
      fireEvent(elements.submenu("Move to"), toggleEvent("toggle", "open"));

      expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "true");
      expect(elements.item("Inbox")).toHaveFocus();
    }
  );

  it.each([
    { description: "a secondary press", releasedOn: "item", keys: "MouseRight" },
    { description: "a press released off the item", releasedOn: "page", keys: "MouseLeft" },
  ])(
    "must open a submenu on its first item when assistive technology clicks its item after $description",
    async ({ keys, releasedOn }) => {
      const user = userEvent.setup();
      render(<SubmenuMenu />);
      openAsBrowser(elements.menu);
      elements.item("Move to").focus();
      await user.pointer([
        { keys: `[${keys}>]`, target: elements.item("Move to") },
        { target: releasedOn === "item" ? elements.item("Move to") : document.body },
        { keys: `[/${keys}]` },
      ]);

      fireEvent.click(elements.item("Move to"));
      fireEvent(elements.submenu("Move to"), toggleEvent("toggle", "open"));

      expect(elements.item("Inbox")).toHaveFocus();
    }
  );

  it("must leave focus on a submenu's item when a click on the item opens the submenu", async () => {
    const user = userEvent.setup();
    render(<SubmenuMenu />);
    openAsBrowser(elements.menu);

    await user.click(elements.item("Move to"));
    fireEvent(elements.submenu("Move to"), toggleEvent("toggle", "open"));

    expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "true");
    expect(elements.item("Move to")).toHaveFocus();
  });

  it("must focus a submenu itself when it opens from the keyboard with no items", async () => {
    const user = userEvent.setup();
    render(<EmptySubmenuMenu />);
    openAsBrowser(elements.menu);
    elements.item("Recent").focus();

    await user.keyboard("{ArrowRight}");
    fireEvent(elements.submenu("Recent"), toggleEvent("toggle", "open"));

    expect(elements.submenu("Recent")).toHaveFocus();
  });

  it("must open a submenu with ArrowLeft when the text runs right to left", async () => {
    const user = userEvent.setup();
    render(<SubmenuMenu dir="rtl" />);
    openAsBrowser(elements.menu);
    elements.item("Move to").focus();

    await user.keyboard("{ArrowLeft}");

    expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "true");
  });

  it("must leave a submenu closed when ArrowRight is pressed on another item", async () => {
    const user = userEvent.setup();
    render(<SubmenuMenu />);
    openAsBrowser(elements.menu);
    elements.item("Edit").focus();

    await user.keyboard("{ArrowRight}");

    expect(elements.item("Edit")).toHaveFocus();
    expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "false");
  });

  it("must close a submenu and focus its item when ArrowLeft is pressed in it", async () => {
    const user = userEvent.setup();
    render(<SubmenuMenu />);
    await openSubmenu(user);

    await user.keyboard("{ArrowLeft}");

    expect(elements.item("Move to")).toHaveFocus();
    expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "false");
    expect(elements.trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("must focus a submenu's item when the browser closes the submenu on Escape", async () => {
    const user = userEvent.setup();
    render(<SubmenuMenu />);
    await openSubmenu(user);

    closeAsBrowser(elements.submenu("Move to"));

    expect(elements.item("Move to")).toHaveFocus();
    expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "false");
  });

  it("must keep a submenu open when a popover of the consumer's inside it closes", async () => {
    const user = userEvent.setup();
    render(<NestedPopoverSubmenuMenu />);
    await openSubmenu(user);

    fireEvent(screen.getByText("Moves are undoable"), toggleEvent("toggle", "closed"));

    expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "true");
    expect(elements.item("Inbox")).toHaveFocus();
  });

  it("must run an item's onClick and close every menu when an item in a submenu is chosen", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<SubmenuMenu onMove={onMove} />);
    await openSubmenu(user);

    await user.keyboard("{Enter}");

    expect(onMove).toHaveBeenCalledOnce();
    expect(elements.trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("must move through a submenu's own items when keys are pressed in it", async () => {
    const { user } = setUpTest();
    render(<SubmenuMenu />);
    await openSubmenu(user);

    await user.keyboard("{ArrowDown}");
    const afterArrow = document.activeElement;
    await user.keyboard("i");

    expect(afterArrow).toBe(elements.item("Projects"));
    expect(elements.item("Inbox")).toHaveFocus();
  });

  it("must close a submenu when focus moves to another item of its parent", async () => {
    const user = userEvent.setup();
    render(<SubmenuMenu />);
    openAsBrowser(elements.menu);
    await user.click(elements.item("Move to"));

    await user.keyboard("{ArrowDown}");

    expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "false");
  });

  it("must leave a disabled submenu closed when its item is clicked", async () => {
    const user = userEvent.setup();
    render(<SubmenuMenu />);
    openAsBrowser(elements.menu);

    await user.click(elements.item("Share"));

    expect(elements.item("Share")).toHaveAttribute("aria-disabled", "true");
    expect(elements.item("Share")).toHaveAttribute("aria-expanded", "false");
  });

  it("must focus an item when the pointer moves onto it", async () => {
    const { user } = setUpTest();
    render(<SubmenuMenu />);
    openAsBrowser(elements.menu);

    await user.hover(elements.item("Delete"));

    expect(elements.item("Delete")).toHaveFocus();
  });

  it("must open a submenu 100ms after the pointer rests on its item, leaving focus on the item", async () => {
    const { user } = setUpTest();
    render(<SubmenuMenu />);
    openAsBrowser(elements.menu);

    await user.hover(elements.item("Move to"));
    act(() => vi.advanceTimersByTime(99));
    const expandedEarly = elements.item("Move to").getAttribute("aria-expanded");
    act(() => vi.advanceTimersByTime(1));

    expect(expandedEarly).toBe("false");
    expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "true");
    expect(elements.item("Move to")).toHaveFocus();
  });

  it("must leave a submenu closed when the pointer leaves its item within 100ms", async () => {
    const { user } = setUpTest();
    render(<SubmenuMenu />);
    openAsBrowser(elements.menu);

    await user.hover(elements.item("Move to"));
    act(() => vi.advanceTimersByTime(50));
    await user.hover(elements.item("Delete"));
    act(() => vi.advanceTimersByTime(200));

    expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "false");
  });

  it("must leave a submenu closed when the keyboard moves focus off its item within 100ms of the pointer resting on it", async () => {
    const { user } = setUpTest();
    render(<SubmenuMenu />);
    openAsBrowser(elements.menu);

    await user.hover(elements.item("Move to"));
    await user.keyboard("{ArrowDown}");
    act(() => vi.advanceTimersByTime(200));

    expect(elements.item("Share")).toHaveFocus();
    expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "false");
  });

  it("must leave a submenu closed when it is disabled while the pointer rests on its item", async () => {
    const { user } = setUpTest();
    const { rerender } = render(<SubmenuMenu />);
    openAsBrowser(elements.menu);
    await user.hover(elements.item("Move to"));
    act(() => vi.advanceTimersByTime(50));

    rerender(<SubmenuMenu moveToDisabled={true} />);
    act(() => vi.advanceTimersByTime(100));

    expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "false");
  });

  it("must close an open submenu when it is disabled", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SubmenuMenu />);
    await openSubmenu(user);

    rerender(<SubmenuMenu moveToDisabled={true} />);

    expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "false");
  });

  it("must close an open submenu 100ms after the pointer moves onto another item away from it", async () => {
    const { user } = setUpTest();
    render(<SubmenuMenu />);
    openAsBrowser(elements.menu);
    await user.hover(elements.item("Move to"));
    act(() => vi.advanceTimersByTime(100));

    await user.hover(elements.item("Edit"));
    act(() => vi.advanceTimersByTime(99));
    const expandedEarly = elements.item("Move to").getAttribute("aria-expanded");
    act(() => vi.advanceTimersByTime(1));

    expect(expandedEarly).toBe("true");
    expect(elements.item("Edit")).toHaveFocus();
    expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "false");
  });

  it("must leave focus where the keyboard moved it while the pointer waited to take it from an open submenu", async () => {
    const { user } = setUpTest();
    render(<SubmenuMenu />);
    openAsBrowser(elements.menu);
    await user.hover(elements.item("Move to"));
    act(() => vi.advanceTimersByTime(100));
    await user.hover(elements.item("Edit"));

    await user.keyboard("{ArrowDown}");
    act(() => vi.advanceTimersByTime(100));

    expect(elements.item("Share")).toHaveFocus();
  });

  it("must keep a submenu open when the pointer leaves the menu within 100ms of reaching another item", async () => {
    const { user } = setUpTest();
    render(<SubmenuMenu />);
    openAsBrowser(elements.menu);
    await user.hover(elements.item("Move to"));
    act(() => vi.advanceTimersByTime(100));
    await user.hover(elements.item("Edit"));

    fireEvent.pointerOut(elements.item("Edit"), { relatedTarget: document.body });
    act(() => vi.advanceTimersByTime(100));

    expect(elements.item("Move to")).toHaveFocus();
    expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "true");
  });

  it("must keep a submenu open while the pointer crosses other items towards it", async () => {
    const { user } = setUpTest();
    render(<SubmenuMenu />);
    openAsBrowser(elements.menu);
    vi.spyOn(elements.submenu("Move to"), "getBoundingClientRect").mockReturnValue(new DOMRect(200, 40, 150, 160));
    await user.pointer({ coords: { clientX: 180, clientY: 60 }, target: elements.item("Move to") });
    act(() => vi.advanceTimersByTime(100));

    await user.pointer({ coords: { clientX: 185, clientY: 80 }, target: elements.item("Delete") });
    act(() => vi.advanceTimersByTime(300));
    await user.pointer({ coords: { clientX: 192, clientY: 110 }, target: elements.item("Delete") });
    act(() => vi.advanceTimersByTime(300));

    expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "true");
    expect(elements.item("Delete")).not.toHaveFocus();
  });

  it("must close a submenu 400ms after the pointer stops on another item inside the triangle", async () => {
    const { user } = setUpTest();
    render(<SubmenuMenu />);
    openAsBrowser(elements.menu);
    vi.spyOn(elements.submenu("Move to"), "getBoundingClientRect").mockReturnValue(new DOMRect(200, 40, 150, 160));
    await user.pointer({ coords: { clientX: 180, clientY: 60 }, target: elements.item("Move to") });
    act(() => vi.advanceTimersByTime(100));

    await user.pointer({ coords: { clientX: 185, clientY: 80 }, target: elements.item("Delete") });
    act(() => vi.advanceTimersByTime(400));

    expect(elements.item("Delete")).toHaveFocus();
    expect(elements.item("Move to")).toHaveAttribute("aria-expanded", "false");
  });

  it("must mark the menu with its density, and its submenus with the same, when density is compact", async () => {
    const user = userEvent.setup();
    render(<SubmenuMenu density="compact" />);
    openAsBrowser(elements.menu);
    elements.item("Move to").focus();

    await user.keyboard("{ArrowRight}");

    expect(elements.menu).toHaveAttribute("data-density", "compact");
    expect(elements.submenu("Move to")).toHaveAttribute("data-density", "compact");
  });

  it("must use the default density when none is given", () => {
    render(<SubmenuMenu />);

    expect(elements.menu).toHaveAttribute("data-density", "default");
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

  it("must reject an item without a label", () => {
    render(
      <BareMenu>
        <>
          {/* oxlint-disable jsx-a11y/control-has-associated-label -- these items are unlabelled to test that the types reject them */}
          {/* @ts-expect-error the label names the item */}
          <MenuItem />
          {/* @ts-expect-error the label names the item */}
          <MenuItemCheckbox />
          <MenuRadioGroup label="Sort by">
            {/* @ts-expect-error the label names the item */}
            <MenuItemRadio value="name" />
          </MenuRadioGroup>
          {/* oxlint-enable jsx-a11y/control-has-associated-label */}
        </>
      </BareMenu>
    );

    expect(screen.getByRole("menuitemradio", { hidden: true })).toBeInTheDocument();
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
  onTriggerClick?: (event: MouseEvent<HTMLElement>) => void;
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

function DismissibleNestedSubmenuMenu(): JSX.Element {
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
        <Submenu label="Move to">
          <MenuItem>Inbox</MenuItem>
          {!dismissed && (
            <Submenu label="Archive">
              <MenuItem onClick={dismiss}>Dismiss</MenuItem>
            </Submenu>
          )}
        </Submenu>
      </Menu>
    </>
  );
}

function EmptySubmenuMenu(): JSX.Element {
  const menu = useMenu({ defaultOpen: true });

  return (
    <>
      <Button {...menu.getTriggerProps()} variant="secondary">
        Actions
      </Button>
      <Menu {...menu.getMenuProps()}>
        <MenuItem>Edit</MenuItem>
        <Submenu label="Recent" />
      </Menu>
    </>
  );
}

function DismissibleSubmenuMenu(): JSX.Element {
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
        <Submenu label="Move to">
          <MenuItem>Inbox</MenuItem>
          {!dismissed && <MenuItem onClick={dismiss}>Dismiss</MenuItem>}
        </Submenu>
        <MenuGroup>
          <MenuItem>Copy</MenuItem>
          {!dismissed && <MenuItem>Undo</MenuItem>}
        </MenuGroup>
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

function GroupedMenu(): JSX.Element {
  const menu = useMenu({ defaultOpen: true });

  return (
    <>
      <Button {...menu.getTriggerProps()} variant="secondary">
        Actions
      </Button>
      <Menu {...menu.getMenuProps()}>
        <MenuGroup>
          <MenuItem>Edit</MenuItem>
          <MenuItem>Duplicate</MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup label="Sort by">
          <MenuItem>Name</MenuItem>
          <MenuItem>Size</MenuItem>
        </MenuGroup>
      </Menu>
    </>
  );
}

interface RouterLinkProps extends Omit<ComponentPropsWithRef<"a">, "href"> {
  /**
   * Route to navigate to, in place of `href`
   */
  to: string;
}

/**
 * Stand-in for a hash router's link
 */
function RouterLink({ children, to, ...rest }: RouterLinkProps): JSX.Element {
  return (
    <Box as="a" href={`#${to}`} {...rest}>
      {children}
    </Box>
  );
}

function LinkMenu(): JSX.Element {
  const menu = useMenu({ defaultOpen: true });

  return (
    <>
      <Button {...menu.getTriggerProps()} variant="secondary">
        Actions
      </Button>
      <Menu {...menu.getMenuProps()}>
        <MenuItem as="a" href="#help">
          Help
        </MenuItem>
        <MenuItem as={RouterLink} to="/settings">
          Settings
        </MenuItem>
        <MenuItem as="a" disabled={true} href="#billing">
          Billing
        </MenuItem>
        <MenuItem as={RouterLink} disabled={true} to="/plans">
          Plans
        </MenuItem>
      </Menu>
    </>
  );
}

interface CheckboxMenuProps {
  /**
   * Controls whether Show archived is checked
   */
  archivedChecked?: boolean;

  /**
   * Called when Show archived is toggled
   */
  onArchivedChange?: (checked: boolean) => void;

  /**
   * Called when Compact rows is toggled
   */
  onCompactChange?: (checked: boolean) => void;
}

function CheckboxMenu({ archivedChecked, onArchivedChange, onCompactChange }: CheckboxMenuProps): JSX.Element {
  const menu = useMenu({ defaultOpen: true });

  return (
    <>
      <Button {...menu.getTriggerProps()} variant="secondary">
        Actions
      </Button>
      <Menu {...menu.getMenuProps()}>
        <MenuItemCheckbox onCheckedChange={onCompactChange}>Compact rows</MenuItemCheckbox>
        <MenuItemCheckbox checked={archivedChecked} defaultChecked={true} onCheckedChange={onArchivedChange}>
          Show archived
        </MenuItemCheckbox>
        <MenuItemCheckbox disabled={true}>Sync</MenuItemCheckbox>
      </Menu>
    </>
  );
}

interface SortMenuProps {
  /**
   * Called with the chosen sort order
   */
  onValueChange?: (value: string) => void;

  /**
   * Controls the sort order
   */
  value?: string;
}

function SortMenu({ onValueChange, value }: SortMenuProps): JSX.Element {
  const menu = useMenu({ defaultOpen: true });

  return (
    <>
      <Button {...menu.getTriggerProps()} variant="secondary">
        Actions
      </Button>
      <Menu {...menu.getMenuProps()}>
        <MenuRadioGroup defaultValue="name" label="Sort by" onValueChange={onValueChange} value={value}>
          <MenuItemRadio value="name">Name</MenuItemRadio>
          <MenuItemRadio value="size">Size</MenuItemRadio>
          <MenuItemRadio disabled={true} value="owner">
            Owner
          </MenuItemRadio>
        </MenuRadioGroup>
      </Menu>
    </>
  );
}

interface SubmenuMenuProps {
  /**
   * How tightly the menu's rows are spaced
   */
  density?: MenuDensity;

  /**
   * Writing direction around the menu
   */
  dir?: "ltr" | "rtl";

  /**
   * Whether Move to is disabled
   */
  moveToDisabled?: boolean;

  /**
   * Runs when Inbox is chosen
   */
  onMove?: () => void;
}

function SubmenuMenu({ density, dir, moveToDisabled, onMove }: SubmenuMenuProps): JSX.Element {
  const menu = useMenu({ defaultOpen: true });

  return (
    <Box dir={dir}>
      <Button {...menu.getTriggerProps()} variant="secondary">
        Actions
      </Button>
      <Menu {...menu.getMenuProps()} density={density}>
        <MenuItem>Edit</MenuItem>
        <Submenu disabled={moveToDisabled} label="Move to">
          <MenuItem onClick={onMove}>Inbox</MenuItem>
          <MenuItem>Projects</MenuItem>
        </Submenu>
        <Submenu disabled={true} label="Share">
          <MenuItem>Link</MenuItem>
        </Submenu>
        <MenuItem>Delete</MenuItem>
      </Menu>
    </Box>
  );
}

/**
 * Opens the root menu and its Move to submenu from the keyboard, leaving focus on the submenu's first item
 *
 * @param user the user-event instance
 */
async function openSubmenu(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  openAsBrowser(elements.menu);
  elements.item("Move to").focus();
  await user.keyboard("{ArrowRight}");
  fireEvent(elements.submenu("Move to"), toggleEvent("toggle", "open"));
}

interface RemovableFirstItemMenuProps {
  /**
   * Whether Edit, the first item, is rendered
   */
  showsEdit?: boolean;
}

function RemovableFirstItemMenu({ showsEdit = true }: RemovableFirstItemMenuProps): JSX.Element {
  const menu = useMenu({ defaultOpen: true });

  return (
    <>
      <Button {...menu.getTriggerProps()} variant="secondary">
        Actions
      </Button>
      <Menu {...menu.getMenuProps()}>
        {showsEdit && <MenuItem>Edit</MenuItem>}
        <MenuItem>Duplicate</MenuItem>
      </Menu>
    </>
  );
}

function NestedPopoverMenu(): JSX.Element {
  const menu = useMenu();

  return (
    <>
      <Button {...menu.getTriggerProps()} variant="secondary">
        Actions
      </Button>
      <Menu {...menu.getMenuProps()}>
        <MenuItem>Edit</MenuItem>
        <Box onToggle={() => {}} popover="manual">
          Saved to Inbox
        </Box>
      </Menu>
    </>
  );
}

function NestedPopoverSubmenuMenu(): JSX.Element {
  const menu = useMenu({ defaultOpen: true });

  return (
    <>
      <Button {...menu.getTriggerProps()} variant="secondary">
        Actions
      </Button>
      <Menu {...menu.getMenuProps()}>
        <Submenu label="Move to">
          <MenuItem>Inbox</MenuItem>
          <Box onToggle={() => {}} popover="manual">
            Moves are undoable
          </Box>
        </Submenu>
      </Menu>
    </>
  );
}

function SubmenuBeforeCheckboxMenu(): JSX.Element {
  const menu = useMenu({ defaultOpen: true });

  return (
    <>
      <Button {...menu.getTriggerProps()} variant="secondary">
        Actions
      </Button>
      <Menu {...menu.getMenuProps()}>
        <Submenu label="Move to">
          <MenuItem>Inbox</MenuItem>
        </Submenu>
        <MenuItemCheckbox>Pinned</MenuItemCheckbox>
      </Menu>
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

interface ControlledRowActionsProps {
  /**
   * Whether the parent ignores the menu's requests to open, opening it only from the toolbar
   */
  ignoresRequests?: boolean;

  /**
   * Runs when the trigger is clicked
   */
  onTriggerClick?: (event: MouseEvent<HTMLElement>) => void;
}

function ControlledRowActions({ ignoresRequests = false, onTriggerClick }: ControlledRowActionsProps): JSX.Element {
  const [open, setOpen] = useState(false);

  function handleOpenChange(next: boolean): void {
    if (!ignoresRequests || !next) {
      setOpen(next);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="ghost">
        Open from the toolbar
      </Button>
      <RowActions onOpenChange={handleOpenChange} onTriggerClick={onTriggerClick} open={open} />
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

/**
 * Makes `showPopover()` fire a cancellable `beforetoggle` first and show the popover only when it is not cancelled, as
 * a browser does, until the test finishes
 */
function showPopoverAsBrowser(): void {
  const spy = vi.spyOn(HTMLElement.prototype, "showPopover").mockImplementation(function show(this: HTMLElement) {
    if (fireEvent(this, toggleEvent("beforetoggle", "open"))) {
      this.setAttribute("data-popover-open", "");
    }
  });

  onTestFinished(() => {
    spy.mockRestore();
  });
}

/**
 * Fires the events a browser fires as it hides a menu that script has hidden, which jsdom's `hidePopover()` does not
 *
 * @param menu the menu element
 */
function reportClosedAsBrowser(menu: HTMLElement): void {
  fireEvent(menu, toggleEvent("beforetoggle", "closed"));
  fireEvent(menu, toggleEvent("toggle", "closed"));
}

const elements = {
  checkbox(name: string): HTMLElement {
    return screen.getByRole("menuitemcheckbox", { hidden: true, name });
  },
  item(name: string): HTMLElement {
    return screen.getByRole("menuitem", { hidden: true, name });
  },
  get menu(): HTMLElement {
    return screen.getAllByRole("menu", { hidden: true })[0];
  },
  radio(name: string): HTMLElement {
    return screen.getByRole("menuitemradio", { hidden: true, name });
  },
  submenu(itemName: string): HTMLElement {
    const submenu = document.getElementById(elements.item(itemName).getAttribute("aria-controls") ?? "");

    if (submenu === null) {
      throw new Error(`${itemName} controls no element`);
    }

    return submenu;
  },
  get trigger(): HTMLElement {
    return screen.getByRole("button", { name: "Actions" });
  },
};
