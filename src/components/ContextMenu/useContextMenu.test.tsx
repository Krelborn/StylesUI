import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { JSX } from "react";
import { describe, expect, it, onTestFinished, vi } from "vitest";

import { Button } from "../Button";
import { Menu, MenuItem } from "../Menu";

import type { UseContextMenuOptions } from "./useContextMenu";
import { useContextMenu } from "./useContextMenu";

describe("useContextMenu", () => {
  it("must open the menu when the region is right-clicked", async () => {
    const { rightClick } = setUpTest();
    render(<FileList />);

    await rightClick(elements.row("notes.txt"));

    expect(elements.menu).toBeVisible();
  });

  it("must hold the press on the menu when it opens before the button is released", async () => {
    const { setPointerCapture, user } = setUpTest();
    render(<FileList />);

    await user.pointer({ keys: "[MouseRight>]", target: elements.row("notes.txt") });

    expect(setPointerCapture.mock.contexts).toEqual([elements.menu]);
  });

  it("must keep the browser's own menu from opening when the region is right-clicked", () => {
    setUpTest();
    render(<FileList />);

    const notCancelled = fireEvent.contextMenu(elements.row("notes.txt"));

    expect(notCancelled).toBe(false);
  });

  it("must place the menu at the pointer's distances from the region's edges when it opens", async () => {
    const { rightClick } = setUpTest();
    render(<FileList />);
    setRegionBounds({ height: 300, width: 400, x: 100, y: 50 });

    await rightClick(elements.row("notes.txt"), { clientX: 130, clientY: 90 });

    expect(elements.menu.style.getPropertyValue("--_sui-context-menu-left")).toBe("30px");
    expect(elements.menu.style.getPropertyValue("--_sui-context-menu-top")).toBe("40px");
    expect(elements.menu.style.getPropertyValue("--_sui-context-menu-right")).toBe("370px");
    expect(elements.menu.style.getPropertyValue("--_sui-context-menu-bottom")).toBe("260px");
  });

  it("must mark the menu for placement at its point when it renders", () => {
    setUpTest();
    render(<FileList />);

    expect(elements.menu).toHaveAttribute("data-context-menu");
  });

  it("must make the region the menu's anchor when it renders", () => {
    setUpTest();
    render(<FileList />);

    expect(elements.region.style.anchorName).toBe(elements.menu.style.positionAnchor);
  });

  it("must focus the menu itself when a right-click opens it", async () => {
    const { rightClick } = setUpTest();
    render(<FileList />);

    await rightClick(elements.row("notes.txt"));

    expect(elements.menu).toHaveFocus();
  });

  it("must report the element under the pointer as the target when a right-click opens the menu", async () => {
    const { rightClick } = setUpTest();
    render(<FileList />);

    await rightClick(elements.row("notes.txt"));

    expect(screen.getByRole("menu", { name: "Actions for notes.txt" })).toBe(elements.menu);
  });

  it("must report no target when the menu has not opened", () => {
    setUpTest();
    render(<FileList />);

    expect(elements.menu).toHaveAttribute("aria-label", "Actions for file");
  });

  it("must move to the new point and target when the region is right-clicked again while the menu is open", async () => {
    const { rightClick } = setUpTest();
    render(<FileList />);
    setRegionBounds({ height: 300, width: 400, x: 100, y: 50 });
    await rightClick(elements.row("notes.txt"), { clientX: 130, clientY: 90 });

    await rightClick(elements.row("report.pdf"), { clientX: 150, clientY: 60 });

    expect(screen.getByRole("menu", { name: "Actions for report.pdf" })).toHaveFocus();
    expect(elements.menu.style.getPropertyValue("--_sui-context-menu-left")).toBe("50px");
    expect(elements.menu.style.getPropertyValue("--_sui-context-menu-top")).toBe("10px");
  });

  it("must report each opening and closing when onOpenChange is given", async () => {
    const { rightClick } = setUpTest();
    const onOpenChange = vi.fn();
    render(<FileList onOpenChange={onOpenChange} />);
    await rightClick(elements.row("notes.txt"));

    closeAsBrowser(elements.menu);

    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it("must return focus to the element focused at opening when the browser closes the menu on Escape", async () => {
    const { rightClick } = setUpTest();
    render(<FileList />);
    await rightClick(elements.row("notes.txt"));

    closeAsBrowser(elements.menu);

    expect(elements.row("notes.txt")).toHaveFocus();
  });

  it("must run the item's onClick, close the menu and return focus when an item is chosen", async () => {
    const { rightClick, user } = setUpTest();
    const onRename = vi.fn();
    render(<FileList onRename={onRename} />);
    await rightClick(elements.row("notes.txt"));

    await user.keyboard("{ArrowDown}{Enter}");

    expect(onRename).toHaveBeenCalledWith("notes.txt");
    expect(elements.menu).not.toBeVisible();
    expect(elements.row("notes.txt")).toHaveFocus();
  });

  it("must return focus to the element focused at opening when close() is called", async () => {
    const { rightClick, user } = setUpTest();
    render(<FileList />);
    await rightClick(elements.row("notes.txt"));

    await user.click(screen.getByRole("menuitem", { name: "Close" }));

    expect(elements.menu).not.toBeVisible();
    expect(elements.row("notes.txt")).toHaveFocus();
  });

  it("must close the menu and move on from the element focused at opening when Tab is pressed", async () => {
    const { rightClick, user } = setUpTest();
    render(<FileList />);
    await rightClick(elements.row("notes.txt"));

    const notCancelled = fireEvent.keyDown(elements.menu, { key: "Tab" });

    expect(notCancelled).toBe(true);
    expect(elements.menu).not.toBeVisible();
    expect(elements.row("notes.txt")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("must close the menu and stop on the element focused at opening when Shift+Tab is pressed", async () => {
    const { rightClick } = setUpTest();
    render(<FileList />);
    await rightClick(elements.row("notes.txt"));

    const notCancelled = fireEvent.keyDown(elements.menu, { key: "Tab", shiftKey: true });

    expect(notCancelled).toBe(false);
    expect(elements.menu).not.toBeVisible();
    expect(elements.row("notes.txt")).toHaveFocus();
  });

  it("must close the menu and leave focus where it went when focus moves out of the menu", async () => {
    const { rightClick } = setUpTest();
    render(<FileList />);
    await rightClick(elements.row("notes.txt"));

    act(() => {
      screen.getByRole("button", { name: "After" }).focus();
    });

    expect(elements.menu).not.toBeVisible();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("must require a name for the menu when its props are got", () => {
    function UnnamedMenu(): JSX.Element {
      const contextMenu = useContextMenu();

      // @ts-expect-error -- no trigger names a context menu, so aria-label or aria-labelledby is required
      return <Menu {...contextMenu.getMenuProps({})} />;
    }

    expect(UnnamedMenu).toBeTypeOf("function");
  });
});

interface FileListProps extends UseContextMenuOptions {
  onRename?: (name: string) => void;
}

function FileList({ onRename, ...options }: FileListProps): JSX.Element {
  const contextMenu = useContextMenu(options);
  const name = contextMenu.target?.closest("[data-name]")?.getAttribute("data-name") ?? "file";

  return (
    <>
      <Button variant="secondary">Before</Button>
      <ul {...contextMenu.getTargetProps()} aria-label="Files" data-testid="region">
        {["report.pdf", "notes.txt"].map((file) => (
          <li key={file} tabIndex={-1} data-name={file}>
            {file}
          </li>
        ))}
      </ul>
      <Button variant="secondary">After</Button>
      <Menu {...contextMenu.getMenuProps({ "aria-label": `Actions for ${name}` })}>
        <MenuItem onClick={() => onRename?.(name)}>Rename</MenuItem>
        <MenuItem onClick={contextMenu.close}>Close</MenuItem>
      </Menu>
    </>
  );
}

/**
 * Makes `showPopover()` and `hidePopover()` fire the toggle events a browser fires, until the test finishes, and sets
 * up a user to right-click with
 *
 * @returns the user, and a right-click at an optional point that presses, opens the menu and releases, as a mouse does
 */
function setUpTest() {
  const user = userEvent.setup();
  const show = vi.spyOn(HTMLElement.prototype, "showPopover").mockImplementation(function showAsBrowser(
    this: HTMLElement
  ) {
    if (this.dispatchEvent(toggleEvent("beforetoggle", "open"))) {
      this.setAttribute("data-popover-open", "");
      this.dispatchEvent(toggleEvent("toggle", "open"));
    }
  });
  const hide = vi.spyOn(HTMLElement.prototype, "hidePopover").mockImplementation(function hideAsBrowser(
    this: HTMLElement
  ) {
    this.dispatchEvent(toggleEvent("beforetoggle", "closed"));
    this.removeAttribute("data-popover-open");
    this.dispatchEvent(toggleEvent("toggle", "closed"));
  });

  // jsdom has no pointer capture
  const setPointerCapture = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", { configurable: true, value: setPointerCapture });

  onTestFinished(() => {
    show.mockRestore();
    hide.mockRestore();
    Reflect.deleteProperty(HTMLElement.prototype, "setPointerCapture");
  });

  const rightClick = async (target: Element, coords = { clientX: 0, clientY: 0 }): Promise<void> => {
    await user.pointer({ coords, keys: "[MouseRight]", target });
  };

  return { rightClick, setPointerCapture, user };
}

function toggleEvent(type: "beforetoggle" | "toggle", newState: "closed" | "open"): Event {
  return Object.assign(new Event(type, { cancelable: type === "beforetoggle" && newState === "open" }), {
    newState,
    oldState: newState === "open" ? "closed" : "open",
  });
}

/**
 * Closes a menu as a browser does on Escape or a light dismiss
 *
 * @param menu the menu element
 */
function closeAsBrowser(menu: HTMLElement): void {
  act(() => {
    menu.hidePopover();
  });
}

function setRegionBounds(bounds: { height: number; width: number; x: number; y: number }): void {
  vi.spyOn(elements.region, "getBoundingClientRect").mockReturnValue(DOMRect.fromRect(bounds));
}

const elements = {
  get menu() {
    return screen.getByRole("menu", { hidden: true });
  },
  get region() {
    return screen.getByTestId("region");
  },
  row(name: string) {
    return screen.getByText(name);
  },
};
