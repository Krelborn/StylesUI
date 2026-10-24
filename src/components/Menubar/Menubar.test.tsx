import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { JSX } from "react";
import { useState } from "react";
import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";

import { MissingContextError } from "../../errors";
import { Button } from "../Button";
import { MenuItem, MenuItemCheckbox, MenuSeparator, Submenu } from "../Menu";

import { Menubar } from "./Menubar";
import { MenubarMenu } from "./MenubarMenu";

describe("Menubar", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("must name the bar and set its items' roles and states when it renders", () => {
    render(<Editor />);

    expect(screen.getByRole("menubar", { name: "Editor" })).toBeInTheDocument();
    expect(elements.bar("File")).toHaveAttribute("aria-haspopup", "menu");
    expect(elements.bar("File")).toHaveAttribute("aria-expanded", "false");
    expect(elements.bar("File")).toHaveAttribute("aria-controls", elements.menu("File").id);
  });

  it("must make every menu in the bar compact, its submenus included, when it renders", () => {
    render(<Editor />);

    expect(elements.menu("File")).toHaveAttribute("data-density", "compact");
    expect(elements.menu("Open recent")).toHaveAttribute("data-density", "compact");
  });

  it("must make the first bar item the only tab stop when it renders", () => {
    render(<Editor />);

    expect(elements.bar("File")).toHaveAttribute("tabindex", "0");
    expect(elements.bar("Edit")).toHaveAttribute("tabindex", "-1");
    expect(elements.bar("Help")).toHaveAttribute("tabindex", "-1");
  });

  it("must return Tab to the bar item that last had focus when focus comes back to the bar", async () => {
    const { user } = setUpTest();
    render(<Editor />);
    elements.bar("File").focus();
    await user.keyboard("{ArrowRight}");

    await user.tab();
    await user.tab({ shift: true });

    expect(elements.bar("Edit")).toHaveFocus();
    expect(elements.bar("File")).toHaveAttribute("tabindex", "-1");
  });

  it("must give the tab stop to the first bar item when the item holding it unmounts", async () => {
    const { user } = setUpTest();
    render(<Editor />);
    elements.bar("File").focus();
    await user.keyboard("{ArrowRight}");

    await user.click(screen.getByRole("button", { name: "Remove Edit" }));

    expect(screen.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
    expect(elements.bar("File")).toHaveAttribute("tabindex", "0");
  });

  it.each([
    { dir: "ltr" as const, from: "File", key: "{ArrowRight}", to: "Edit" },
    { dir: "ltr" as const, from: "File", key: "{ArrowLeft}", to: "Help" },
    { dir: "ltr" as const, from: "Help", key: "{ArrowRight}", to: "File" },
    { dir: "rtl" as const, from: "File", key: "{ArrowLeft}", to: "Edit" },
    { dir: "rtl" as const, from: "File", key: "{ArrowRight}", to: "Help" },
    { dir: "ltr" as const, from: "View", key: "{Home}", to: "File" },
    { dir: "ltr" as const, from: "File", key: "{End}", to: "Help" },
    { dir: "ltr" as const, from: "File", key: "v", to: "View" },
  ])(
    "must move focus from $from to $to when $key is pressed on the bar in $dir text",
    async ({ dir, from, key, to }) => {
      const { user } = setUpTest();
      render(<Editor dir={dir} />);
      elements.bar(from).focus();

      await user.keyboard(key);

      expect(elements.bar(to)).toHaveFocus();
      expect(elements.bar(to)).toHaveAttribute("aria-expanded", "false");
    }
  );

  it.each(["{Alt>}{ArrowRight}{/Alt}", "{Control>}{ArrowRight}{/Control}", "{Meta>}{ArrowRight}{/Meta}"])(
    "must leave focus where it is when %s is pressed on the bar",
    async (key) => {
      const { user } = setUpTest();
      render(<Editor />);
      elements.bar("File").focus();

      await user.keyboard(key);

      expect(elements.bar("File")).toHaveFocus();
    }
  );

  it.each([
    { key: "{ArrowDown}", to: "New" },
    { key: "{Enter}", to: "New" },
    { key: " ", to: "New" },
    { key: "{ArrowUp}", to: "Close" },
  ])("must open the menu on $to when $key is pressed on a bar item", async ({ key, to }) => {
    const { user } = setUpTest();
    render(<Editor />);
    elements.bar("File").focus();

    await user.keyboard(key);

    await waitFor(() => expect(elements.item(to)).toHaveFocus());
    expect(elements.bar("File")).toHaveAttribute("aria-expanded", "true");
  });

  it("must open the next bar item's menu with focus on it when an arrow key moves along the bar from an item whose menu is open", async () => {
    const { user } = setUpTest();
    render(<Editor />);
    await user.click(elements.bar("File"));
    await waitFor(() => expect(elements.bar("File")).toHaveAttribute("aria-expanded", "true"));

    await user.keyboard("{ArrowRight}");

    await waitFor(() => expect(elements.bar("Edit")).toHaveAttribute("aria-expanded", "true"));
    expect(elements.bar("Edit")).toHaveFocus();
    expect(elements.bar("File")).toHaveAttribute("aria-expanded", "false");
  });

  it("must go into the open menu rather than close it when Enter is pressed on its bar item", async () => {
    const { user } = setUpTest();
    render(<Editor />);
    await openOnFirstItem(user, "File");
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(elements.bar("Edit")).toHaveAttribute("aria-expanded", "true"));

    await user.keyboard("{Enter}");

    await waitFor(() => expect(elements.item("Undo")).toHaveFocus());
    expect(elements.bar("Edit")).toHaveAttribute("aria-expanded", "true");
  });

  it.each([
    { dir: "ltr" as const, key: "{ArrowRight}", to: "Edit" },
    { dir: "ltr" as const, key: "{ArrowLeft}", to: "Help" },
    { dir: "rtl" as const, key: "{ArrowLeft}", to: "Edit" },
    { dir: "rtl" as const, key: "{ArrowRight}", to: "Help" },
  ])(
    "must open $to's menu with focus on its bar item when $key is pressed on an item in File's menu in $dir text",
    async ({ dir, key, to }) => {
      const { user } = setUpTest();
      render(<Editor dir={dir} />);
      await openOnFirstItem(user, "File");

      await user.keyboard(key);

      await waitFor(() => expect(elements.bar(to)).toHaveAttribute("aria-expanded", "true"));
      expect(elements.bar(to)).toHaveFocus();
      expect(elements.menu(to)).toBeVisible();
      expect(elements.bar("File")).toHaveAttribute("aria-expanded", "false");
    }
  );

  it("must open a submenu rather than move along the bar when Right Arrow is pressed on a submenu's item", async () => {
    const { user } = setUpTest();
    render(<Editor />);
    await openOnFirstItem(user, "File");
    await user.keyboard("{ArrowDown}");

    await user.keyboard("{ArrowRight}");

    await waitFor(() => expect(elements.item("Report.md")).toHaveFocus());
    expect(elements.bar("File")).toHaveAttribute("aria-expanded", "true");
  });

  it("must close every menu and open the next bar item's menu when Right Arrow is pressed in a submenu", async () => {
    const { user } = setUpTest();
    render(<Editor />);
    await openOnFirstItem(user, "File");
    await user.keyboard("{ArrowDown}{ArrowRight}");
    await waitFor(() => expect(elements.item("Report.md")).toHaveFocus());

    await user.keyboard("{ArrowRight}");

    await waitFor(() => expect(elements.bar("Edit")).toHaveAttribute("aria-expanded", "true"));
    expect(elements.bar("Edit")).toHaveFocus();
    expect(elements.menu("Open recent")).not.toBeVisible();
    expect(elements.menu("File")).not.toBeVisible();
  });

  it("must close only the submenu when Left Arrow is pressed in it", async () => {
    const { user } = setUpTest();
    render(<Editor />);
    await openOnFirstItem(user, "File");
    await user.keyboard("{ArrowDown}{ArrowRight}");
    await waitFor(() => expect(elements.item("Report.md")).toHaveFocus());

    await user.keyboard("{ArrowLeft}");

    await waitFor(() => expect(elements.item("Open recent")).toHaveFocus());
    expect(elements.menu("File")).toBeVisible();
    expect(elements.bar("Help")).toHaveAttribute("aria-expanded", "false");
  });

  it("must open the menu with focus left on the bar item when a pointer clicks it", async () => {
    const { user } = setUpTest();
    render(<Editor />);

    await user.click(elements.bar("File"));

    await waitFor(() => expect(elements.bar("File")).toHaveAttribute("aria-expanded", "true"));
    expect(elements.bar("File")).toHaveFocus();
  });

  it("must close the menu when its bar item is clicked again", async () => {
    const { user } = setUpTest();
    render(<Editor />);
    await user.click(elements.bar("File"));
    await waitFor(() => expect(elements.bar("File")).toHaveAttribute("aria-expanded", "true"));

    await user.click(elements.bar("File"));

    await waitFor(() => expect(elements.bar("File")).toHaveAttribute("aria-expanded", "false"));
  });

  it("must open another bar item's menu with focus on it when the pointer moves onto it while a menu is open", async () => {
    const { user } = setUpTest();
    render(<Editor />);
    await user.click(elements.bar("File"));
    await waitFor(() => expect(elements.bar("File")).toHaveAttribute("aria-expanded", "true"));

    await user.hover(elements.bar("View"));

    await waitFor(() => expect(elements.bar("View")).toHaveAttribute("aria-expanded", "true"));
    expect(elements.bar("View")).toHaveFocus();
    expect(elements.bar("File")).toHaveAttribute("aria-expanded", "false");
  });

  it("must open nothing when the pointer moves onto a bar item while no menu is open", async () => {
    const { user } = setUpTest();
    render(<Editor />);

    await user.hover(elements.bar("View"));

    expect(elements.menu("View")).not.toBeVisible();
    expect(elements.bar("View")).not.toHaveFocus();
  });

  it("must leave the open menu where it is when a finger moves onto another bar item", async () => {
    const { user } = setUpTest();
    render(<Editor />);
    await user.click(elements.bar("File"));
    await waitFor(() => expect(elements.bar("File")).toHaveAttribute("aria-expanded", "true"));

    // userEvent's pointer moves are a mouse's
    fireEvent.pointerMove(elements.bar("View"), { pointerType: "touch" });

    expect(elements.menu("View")).not.toBeVisible();
    expect(elements.menu("File")).toBeVisible();
  });

  it("must close the menu and return focus to its bar item when an item is chosen", async () => {
    const { onCommand, user } = setUpTest();
    render(<Editor onCommand={onCommand} />);
    await openOnFirstItem(user, "File");

    await user.keyboard("{Enter}");

    await waitFor(() => expect(elements.bar("File")).toHaveFocus());
    expect(elements.menu("File")).not.toBeVisible();
    expect(onCommand).toHaveBeenCalledWith("New");
  });

  it("must leave focus where an item's onClick moves it when the item is chosen", async () => {
    const { user } = setUpTest();
    render(<Editor onCommand={() => screen.getByRole("button", { name: "Share" }).focus()} />);
    await openOnFirstItem(user, "File");

    await user.keyboard("{Enter}");

    await waitFor(() => expect(elements.menu("File")).not.toBeVisible());
    expect(screen.getByRole("button", { name: "Share" })).toHaveFocus();
  });

  it("must return focus to the bar item when Escape closes its menu", async () => {
    const { user } = setUpTest();
    render(<Editor />);
    await openOnFirstItem(user, "File");

    await user.keyboard("{Escape}");
    dismissTopmostAsBrowser();

    await waitFor(() => expect(elements.bar("File")).toHaveAttribute("aria-expanded", "false"));
    expect(elements.bar("File")).toHaveFocus();
  });

  it("must close the menu and move past the bar when Tab is pressed in the menu", async () => {
    const { user } = setUpTest();
    render(<Editor />);
    await openOnFirstItem(user, "File");

    await user.tab();

    expect(screen.getByRole("button", { name: "Share" })).toHaveFocus();
    expect(elements.menu("File")).not.toBeVisible();
  });

  it("must close the menu and return focus to its bar item when Shift+Tab is pressed in the menu", async () => {
    const { user } = setUpTest();
    render(<Editor />);
    await openOnFirstItem(user, "File");

    await user.tab({ shift: true });

    expect(elements.bar("File")).toHaveFocus();
    expect(elements.menu("File")).not.toBeVisible();
  });

  it("must close the menu and move past the bar when Tab is pressed on a bar item whose menu is open", async () => {
    const { user } = setUpTest();
    render(<Editor />);
    await user.click(elements.bar("File"));
    await waitFor(() => expect(elements.bar("File")).toHaveAttribute("aria-expanded", "true"));

    await user.tab();

    expect(screen.getByRole("button", { name: "Share" })).toHaveFocus();
    expect(elements.menu("File")).not.toBeVisible();
  });

  it("must close the menu and leave focus on the page when focus leaves its bar item for the page", async () => {
    const { user } = setUpTest();
    render(<Editor />);
    await user.click(elements.bar("File"));
    await waitFor(() => expect(elements.bar("File")).toHaveAttribute("aria-expanded", "true"));

    elements.bar("File").blur();

    await waitFor(() => expect(elements.bar("File")).toHaveAttribute("aria-expanded", "false"));
    expect(document.body).toHaveFocus();
  });

  it("must throw MissingContextError when a MenubarMenu renders outside a Menubar", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<MenubarMenu label="Orphan" />)).toThrow(MissingContextError);
  });

  it("must reject a menubar when it has no name, a role or a tabIndex", () => {
    render(
      <>
        {/* @ts-expect-error a menubar needs aria-label or aria-labelledby */}
        <Menubar />
        {/* @ts-expect-error the menubar pattern sets the role */}
        <Menubar role="toolbar" aria-label="Editor" />
        {/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- checks that the type rejects it */}
        {/* @ts-expect-error the bar's items are its tab stop */}
        <Menubar tabIndex={0} aria-label="Editor" />
        {/* oxlint-enable jsx-a11y/no-noninteractive-tabindex */}
      </>
    );
  });

  it("must reject a MenubarMenu when it has no label", () => {
    render(
      <Menubar aria-label="Editor">
        {/* @ts-expect-error a bar item needs a label, which names its menu */}
        <MenubarMenu />
      </Menubar>
    );
  });
});

interface EditorProps {
  /**
   * The writing direction around the editor
   */
  dir?: "ltr" | "rtl";

  /**
   * Called with the label of the command chosen
   */
  onCommand?: (command: string) => void;
}

/**
 * An editor's menubar between two buttons, with a submenu in its File menu, and a button after them that removes the
 * Edit menu
 */
function Editor({ dir, onCommand }: EditorProps): JSX.Element {
  const [showsEdit, setShowsEdit] = useState(true);

  return (
    <div dir={dir}>
      <Button>Back</Button>
      <Menubar aria-label="Editor">
        <MenubarMenu label="File">
          <MenuItem onClick={() => onCommand?.("New")}>New</MenuItem>
          <Submenu label="Open recent">
            <MenuItem>Report.md</MenuItem>
            <MenuItem>Notes.md</MenuItem>
          </Submenu>
          <MenuSeparator />
          <MenuItem>Close</MenuItem>
        </MenubarMenu>
        {showsEdit && (
          <MenubarMenu label="Edit">
            <MenuItem>Undo</MenuItem>
            <MenuItem>Redo</MenuItem>
          </MenubarMenu>
        )}
        <MenubarMenu label="View">
          <MenuItemCheckbox>Ruler</MenuItemCheckbox>
        </MenubarMenu>
        <MenubarMenu label="Help">
          <MenuItem>Shortcuts</MenuItem>
        </MenubarMenu>
      </Menubar>
      <Button>Share</Button>
      <Button onClick={() => setShowsEdit(false)}>Remove Edit</Button>
    </div>
  );
}

function setUpTest() {
  popoversAsBrowser();

  return { onCommand: vi.fn(), user: userEvent.setup() };
}

/**
 * Opens a bar item's menu from the keyboard and waits for focus to reach its first item
 *
 * @param user the user-event instance
 * @param name the bar item's label
 */
async function openOnFirstItem(user: ReturnType<typeof userEvent.setup>, name: string): Promise<void> {
  elements.bar(name).focus();
  await user.keyboard("{ArrowDown}");
  await waitFor(() => expect(elements.menu(name)).toContainElement(document.activeElement as HTMLElement));
}

function toggleEvent(type: "beforetoggle" | "toggle", newState: "closed" | "open"): Event {
  return Object.assign(new Event(type, { cancelable: type === "beforetoggle" && newState === "open" }), {
    newState,
    oldState: newState === "open" ? "closed" : "open",
  });
}

/**
 * Makes popovers behave as a browser's do until the test finishes, which jsdom's do not: `beforetoggle` fires as one
 * shows or hides and `toggle` a task later, showing one hides every other open one outside it, hiding one hides those
 * inside it, and a click on a button with `popovertarget` shows or hides its popover unless the click is cancelled
 */
function popoversAsBrowser(): void {
  const isOpen = (popover: Element): boolean => popover.hasAttribute("data-popover-open");
  const openPopovers = (): HTMLElement[] =>
    Array.from(document.querySelectorAll<HTMLElement>("[popover][data-popover-open]"));

  function queueToggle(popover: HTMLElement, newState: "closed" | "open"): void {
    setTimeout(() => {
      fireEvent(popover, toggleEvent("toggle", newState));
    }, 0);
  }

  const show = vi.spyOn(HTMLElement.prototype, "showPopover").mockImplementation(function showPopover(
    this: HTMLElement
  ) {
    if (isOpen(this) || !fireEvent(this, toggleEvent("beforetoggle", "open"))) {
      return;
    }

    for (const other of openPopovers().filter((open) => !open.contains(this))) {
      other.hidePopover();
    }

    this.setAttribute("data-popover-open", "");
    queueToggle(this, "open");
  });
  const hide = vi.spyOn(HTMLElement.prototype, "hidePopover").mockImplementation(function hidePopover(
    this: HTMLElement
  ) {
    if (!isOpen(this)) {
      return;
    }

    for (const inside of openPopovers()
      .filter((open) => open !== this && this.contains(open))
      .reverse()) {
      inside.hidePopover();
    }

    fireEvent(this, toggleEvent("beforetoggle", "closed"));
    this.removeAttribute("data-popover-open");
    queueToggle(this, "closed");
  });

  function handleClick(event: MouseEvent): void {
    const invoker = (event.target as Element).closest("[popovertarget]");
    const popover = document.getElementById(invoker?.getAttribute("popovertarget") ?? "");
    const action = invoker?.getAttribute("popovertargetaction") ?? "toggle";

    if (event.defaultPrevented || popover === null) {
      return;
    }

    if (isOpen(popover) && action !== "show") {
      popover.hidePopover();
    } else if (!isOpen(popover) && action !== "hide") {
      popover.showPopover();
    }
  }

  document.addEventListener("click", handleClick);

  onTestFinished(() => {
    show.mockRestore();
    hide.mockRestore();
    document.removeEventListener("click", handleClick);
  });
}

/**
 * Hides the innermost open popover, as a browser does on Escape
 */
function dismissTopmostAsBrowser(): void {
  Array.from(document.querySelectorAll<HTMLElement>("[popover][data-popover-open]")).at(-1)?.hidePopover();
}

const elements = {
  bar(name: string): HTMLElement {
    return screen.getByRole("menuitem", { name });
  },
  item(name: string): HTMLElement {
    return screen.getByRole("menuitem", { hidden: true, name });
  },
  menu(name: string): HTMLElement {
    // A closed menu's name can't be computed by role, so it is found by the item that labels it
    return screen.getByLabelText(name, { selector: '[role="menu"]' });
  },
};
