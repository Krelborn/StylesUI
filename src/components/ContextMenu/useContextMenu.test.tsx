import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { JSX, ReactNode } from "react";
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

  it.each([
    { key: "Shift+F10", keys: "{Shift>}{F10}{/Shift}" },
    { key: "the ContextMenu key", keys: "{ContextMenu}" },
  ])(
    "must open below the focused element's start edge with focus on the first item when $key is pressed",
    async ({ keys }) => {
      const { user } = setUpTest();
      render(<FileList />);
      setRegionBounds({ height: 300, width: 400, x: 100, y: 50 });
      setBounds(elements.row("notes.txt"), { height: 20, width: 200, x: 110, y: 80 });
      focus(elements.row("notes.txt"));

      await user.keyboard(keys);

      expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveFocus();
      expect(screen.getByRole("menu", { name: "Actions for notes.txt" })).toBe(elements.menu);
      expect(elements.menu.style.getPropertyValue("--_sui-context-menu-left")).toBe("10px");
      expect(elements.menu.style.getPropertyValue("--_sui-context-menu-top")).toBe("50px");
    }
  );

  it("must keep the browser from acting on the key when the ContextMenu key opens the menu", () => {
    setUpTest();
    render(<FileList />);

    const notCancelled = fireEvent.keyDown(elements.row("notes.txt"), { key: "ContextMenu" });

    expect(notCancelled).toBe(false);
  });

  it("must open below the focused element's end edge when the text runs right to left", async () => {
    const { user } = setUpTest();
    render(<FileList dir="rtl" />);
    setRegionBounds({ height: 300, width: 400, x: 100, y: 50 });
    setBounds(elements.row("notes.txt"), { height: 20, width: 200, x: 110, y: 80 });
    focus(elements.row("notes.txt"));

    await user.keyboard("{ContextMenu}");

    expect(elements.menu.style.getPropertyValue("--_sui-context-menu-right")).toBe("190px");
  });

  it("must open at the window's edge when the focused element's edge is beyond it", async () => {
    const { user } = setUpTest();
    render(<FileList />);
    setRegionBounds({ height: 3000, width: 400, x: 100, y: 50 });
    setBounds(elements.row("notes.txt"), { height: 20, width: 200, x: 110, y: 2000 });
    focus(elements.row("notes.txt"));

    await user.keyboard("{ContextMenu}");

    expect(elements.menu.style.getPropertyValue("--_sui-context-menu-top")).toBe(`${window.innerHeight - 50}px`);
  });

  it.each(["altKey", "ctrlKey", "metaKey"])(
    "must leave the ContextMenu key alone when it is pressed with %s",
    (modifier) => {
      setUpTest();
      render(<FileList />);

      const notCancelled = fireEvent.keyDown(elements.row("notes.txt"), { key: "ContextMenu", [modifier]: true });

      expect(notCancelled).toBe(true);
      expect(elements.menu).not.toBeVisible();
    }
  );

  it("must leave F10 alone when it is pressed without Shift", () => {
    setUpTest();
    render(<FileList />);

    const notCancelled = fireEvent.keyDown(elements.row("notes.txt"), { key: "F10" });

    expect(notCancelled).toBe(true);
    expect(elements.menu).not.toBeVisible();
  });

  it("must open at the focused element with focus on the first item when a contextmenu comes with no pointer", () => {
    setUpTest();
    render(<FileList />);
    focus(elements.row("notes.txt"));

    const notCancelled = fireEvent(elements.row("notes.txt"), noPointerContextMenu());

    expect(notCancelled).toBe(false);
    expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveFocus();
    expect(screen.getByRole("menu", { name: "Actions for notes.txt" })).toBe(elements.menu);
  });

  it("must ignore a contextmenu with no pointer when a key has just opened the menu", async () => {
    const { user } = setUpTest();
    render(<FileList />);
    focus(elements.row("notes.txt"));
    await user.keyboard("{ContextMenu}");

    const notCancelled = fireEvent(elements.row("report.pdf"), noPointerContextMenu());

    expect(notCancelled).toBe(false);
    expect(screen.getByRole("menu", { name: "Actions for notes.txt" })).toBe(elements.menu);
    expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveFocus();
  });

  it("must keep the browser's menu and the region's from opening when the menu is right-clicked", async () => {
    const { user } = setUpTest();
    render(<FileList menuInRegion={true} />);
    focus(elements.row("notes.txt"));
    await user.keyboard("{ContextMenu}");

    const notCancelled = fireEvent.contextMenu(screen.getByRole("menuitem", { name: "Close" }));

    expect(notCancelled).toBe(false);
    expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveFocus();
  });

  it("must return focus to the focused element when a menu a key opened closes", async () => {
    const { user } = setUpTest();
    render(<FileList />);
    focus(elements.row("notes.txt"));
    await user.keyboard("{ContextMenu}");

    closeAsBrowser(elements.menu);

    expect(elements.row("notes.txt")).toHaveFocus();
  });

  it.each([
    { field: "a text input", ui: <input aria-label="Field" /> },
    { field: "a search input", ui: <input aria-label="Field" type="search" /> },
    { field: "a textarea", ui: <textarea aria-label="Field" /> },
    {
      field: "a select",
      ui: (
        <select aria-label="Field">
          <option>One</option>
        </select>
      ),
    },
    { field: "an editable element", ui: <p aria-label="Field" contentEditable={true} /> },
  ])("must leave the browser's own menu to $field in the region when it is right-clicked", ({ ui }) => {
    setUpTest();
    render(<FileList>{ui}</FileList>);

    const notCancelled = fireEvent.contextMenu(screen.getByLabelText("Field"));

    expect(notCancelled).toBe(true);
    expect(elements.menu).not.toBeVisible();
  });

  it("must leave Shift+F10 to a text input in the region when it is pressed there", () => {
    setUpTest();
    render(
      <FileList>
        <input aria-label="Field" />
      </FileList>
    );

    const notCancelled = fireEvent.keyDown(screen.getByLabelText("Field"), { key: "F10", shiftKey: true });

    expect(notCancelled).toBe(true);
    expect(elements.menu).not.toBeVisible();
  });

  it("must open the menu when a checkbox in the region is right-clicked", () => {
    setUpTest();
    render(
      <FileList>
        <input aria-label="Field" type="checkbox" />
      </FileList>
    );

    const notCancelled = fireEvent.contextMenu(screen.getByLabelText("Field"));

    expect(notCancelled).toBe(false);
    expect(elements.menu).toBeVisible();
  });

  it("must leave a right-click alone when a region inside this one has already handled it", () => {
    setUpTest();
    render(
      <FileList>
        <div data-testid="inner" onContextMenu={(event) => event.preventDefault()} />
      </FileList>
    );

    fireEvent.contextMenu(screen.getByTestId("inner"));

    expect(elements.menu).not.toBeVisible();
  });

  it("must leave the browser's own menu to a right-click made with Shift held", () => {
    setUpTest();
    render(<FileList />);

    const notCancelled = fireEvent.contextMenu(elements.row("notes.txt"), { shiftKey: true });

    expect(notCancelled).toBe(true);
    expect(elements.menu).not.toBeVisible();
  });

  it("must open the menu when a contextmenu with no pointer comes with Shift held, as Shift+F10's may", () => {
    setUpTest();
    render(<FileList />);
    focus(elements.row("notes.txt"));

    const notCancelled = fireEvent(elements.row("notes.txt"), noPointerContextMenu({ shiftKey: true }));

    expect(notCancelled).toBe(false);
    expect(elements.menu).toBeVisible();
  });

  it("must open the menu at the touch with focus on the menu when a touch is held for 500ms", () => {
    const { hold, touchDown } = setUpTestWithTouch();
    render(<FileList />);
    setRegionBounds({ height: 300, width: 400, x: 100, y: 50 });

    touchDown(elements.row("notes.txt"), { clientX: 130, clientY: 90 });
    hold(500);

    expect(screen.getByRole("menu", { name: "Actions for notes.txt" })).toHaveFocus();
    expect(elements.menu.style.getPropertyValue("--_sui-context-menu-left")).toBe("30px");
    expect(elements.menu.style.getPropertyValue("--_sui-context-menu-top")).toBe("40px");
  });

  it("must keep the menu closed when a touch is held for less than 500ms", () => {
    const { hold, touchDown } = setUpTestWithTouch();
    render(<FileList />);

    touchDown(elements.row("notes.txt"));
    hold(499);

    expect(elements.menu).not.toBeVisible();
  });

  it("must hold the touch on the menu when a long-press opens it, so lifting the finger lands on the menu", () => {
    const { hold, setPointerCapture, touchDown } = setUpTestWithTouch();
    render(<FileList />);

    touchDown(elements.row("notes.txt"));
    hold(500);

    expect(setPointerCapture.mock.contexts).toEqual([elements.menu]);
    expect(setPointerCapture).toHaveBeenCalledWith(touchId);
  });

  it("must open the menu when a held touch moves no more than 10px", () => {
    const { hold, touchDown, touchMove } = setUpTestWithTouch();
    render(<FileList />);

    touchDown(elements.row("notes.txt"), { clientX: 130, clientY: 90 });
    touchMove(elements.row("notes.txt"), { clientX: 136, clientY: 98 });
    hold(500);

    expect(elements.menu).toBeVisible();
  });

  it("must keep the menu closed when a held touch moves more than 10px", () => {
    const { hold, touchDown, touchMove } = setUpTestWithTouch();
    render(<FileList />);

    touchDown(elements.row("notes.txt"), { clientX: 130, clientY: 90 });
    touchMove(elements.row("notes.txt"), { clientX: 137, clientY: 98 });
    hold(500);

    expect(elements.menu).not.toBeVisible();
  });

  it.each(["pointerUp", "pointerCancel"] as const)(
    "must keep the menu closed when the touch ends with %s before 500ms",
    (ending) => {
      const { hold, touchDown, touchEnd } = setUpTestWithTouch();
      render(<FileList />);

      touchDown(elements.row("notes.txt"));
      hold(300);
      touchEnd(elements.row("notes.txt"), ending);
      hold(200);

      expect(elements.menu).not.toBeVisible();
    }
  );

  it("must keep the menu closed when a second finger touches before 500ms", () => {
    const { hold, touchDown } = setUpTestWithTouch();
    render(<FileList />);

    touchDown(elements.row("notes.txt"));
    hold(300);
    touchDown(elements.row("report.pdf"), { pointerId: touchId + 1 });
    hold(500);

    expect(elements.menu).not.toBeVisible();
  });

  it("must open the menu again for a later touch when an earlier one was lifted", () => {
    const { hold, touchDown, touchEnd } = setUpTestWithTouch();
    render(<FileList />);
    touchDown(elements.row("notes.txt"));
    touchEnd(elements.row("notes.txt"), "pointerUp");

    touchDown(elements.row("report.pdf"));
    hold(500);

    expect(screen.getByRole("menu", { name: "Actions for report.pdf" })).toBeVisible();
  });

  it("must ignore the platform's own contextmenu when it comes after a long-press has opened the menu", () => {
    const { hold, touchDown } = setUpTestWithTouch();
    render(<FileList />);
    setRegionBounds({ height: 300, width: 400, x: 100, y: 50 });
    touchDown(elements.row("notes.txt"), { clientX: 130, clientY: 90 });
    hold(500);

    const notCancelled = fireEvent(elements.row("notes.txt"), touchContextMenu({ clientX: 160, clientY: 90 }));

    expect(notCancelled).toBe(false);
    expect(elements.menu.style.getPropertyValue("--_sui-context-menu-left")).toBe("30px");
  });

  it("must not open the menu again when the platform's own contextmenu has opened it before the long-press", () => {
    const { hold, touchDown } = setUpTestWithTouch();
    render(<FileList />);
    touchDown(elements.row("notes.txt"));
    hold(400);
    fireEvent(elements.row("notes.txt"), touchContextMenu());
    closeAsBrowser(elements.menu);

    hold(100);

    expect(elements.menu).not.toBeVisible();
  });

  it("must keep the touch from ending in mouse events and a click when a long-press has opened the menu", () => {
    const { hold, touchDown, touchEnd } = setUpTestWithTouch();
    render(<FileList />);
    touchDown(elements.row("notes.txt"));
    hold(500);
    touchEnd(elements.row("notes.txt"), "pointerUp");

    const notCancelled = fireEvent.touchEnd(elements.row("notes.txt"));

    expect(notCancelled).toBe(false);
  });

  it("must let a touch end as usual when it was lifted before a long-press", () => {
    const { touchDown, touchEnd } = setUpTestWithTouch();
    render(<FileList />);
    touchDown(elements.row("notes.txt"));
    touchEnd(elements.row("notes.txt"), "pointerUp");

    const notCancelled = fireEvent.touchEnd(elements.row("notes.txt"));

    expect(notCancelled).toBe(true);
  });

  it.each([
    { after: "the touch that opened the menu has ended", end: () => fireEvent.touchEnd(elements.row("notes.txt")) },
    {
      after: "the touch that opened the menu was cancelled",
      end: () => fireEvent.touchCancel(elements.row("notes.txt")),
    },
  ])("must let later touches end as usual when $after", ({ end }) => {
    const { hold, touchDown, touchEnd } = setUpTestWithTouch();
    render(<FileList />);
    touchDown(elements.row("notes.txt"));
    hold(500);
    touchEnd(elements.row("notes.txt"), "pointerUp");
    end();

    const notCancelled = fireEvent.touchEnd(elements.row("report.pdf"));

    expect(notCancelled).toBe(true);
  });

  it("must stop text selection starting while a touch is held", () => {
    const { touchDown } = setUpTestWithTouch();
    render(<FileList />);

    touchDown(elements.row("notes.txt"));
    const notCancelled = fireEvent(
      elements.row("notes.txt"),
      new Event("selectstart", { bubbles: true, cancelable: true })
    );

    expect(notCancelled).toBe(false);
  });

  it("must let text selection start when the touch has been lifted", () => {
    const { touchDown, touchEnd } = setUpTestWithTouch();
    render(<FileList />);
    touchDown(elements.row("notes.txt"));
    touchEnd(elements.row("notes.txt"), "pointerUp");

    const notCancelled = fireEvent(
      elements.row("notes.txt"),
      new Event("selectstart", { bubbles: true, cancelable: true })
    );

    expect(notCancelled).toBe(true);
  });

  it("must leave a long-press to a text input in the region", () => {
    const { hold, touchDown } = setUpTestWithTouch();
    render(
      <FileList>
        <input aria-label="Field" />
      </FileList>
    );

    touchDown(screen.getByLabelText("Field"));
    hold(500);

    expect(elements.menu).not.toBeVisible();
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
  children?: ReactNode;
  dir?: "ltr" | "rtl";
  menuInRegion?: boolean;
  onRename?: (name: string) => void;
}

function FileList({ children, dir, menuInRegion = false, onRename, ...options }: FileListProps): JSX.Element {
  const contextMenu = useContextMenu(options);
  const name = contextMenu.target?.closest("[data-name]")?.getAttribute("data-name") ?? "file";
  const menu = (
    <Menu {...contextMenu.getMenuProps({ "aria-label": `Actions for ${name}` })}>
      <MenuItem onClick={() => onRename?.(name)}>Rename</MenuItem>
      <MenuItem onClick={contextMenu.close}>Close</MenuItem>
    </Menu>
  );

  return (
    <div dir={dir}>
      <Button variant="secondary">Before</Button>
      <div {...contextMenu.getTargetProps()} data-testid="region">
        <ul aria-label="Files">
          {["report.pdf", "notes.txt"].map((file) => (
            <li key={file} tabIndex={-1} data-name={file}>
              {file}
            </li>
          ))}
        </ul>
        {children}
        {menuInRegion && menu}
      </div>
      <Button variant="secondary">After</Button>
      {!menuInRegion && menu}
    </div>
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

  // user-event sends its mouse's contextmenu with no pointer type, which a browser gives only the keyboard's, so it is
  // sent again as a browser sends it
  const markAsMouse = (event: Event): void => {
    if (!(event instanceof PointerEvent) || event.pointerType !== "" || event.button !== 2) {
      return;
    }

    event.stopImmediatePropagation();

    const resent = new PointerEvent("contextmenu", {
      bubbles: true,
      button: event.button,
      buttons: event.buttons,
      cancelable: true,
      clientX: event.clientX,
      clientY: event.clientY,
      pointerId: event.pointerId,
      pointerType: "mouse",
    });

    if (!(event.target as Element).dispatchEvent(resent)) {
      event.preventDefault();
    }
  };
  window.addEventListener("contextmenu", markAsMouse, true);

  onTestFinished(() => {
    show.mockRestore();
    hide.mockRestore();
    Reflect.deleteProperty(HTMLElement.prototype, "setPointerCapture");
    window.removeEventListener("contextmenu", markAsMouse, true);
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

const touchId = 7;

/**
 * Sets up a test with fake timers and a finger to press with
 *
 * @returns what `setUpTest` returns, and helpers to touch, move, lift and hold
 */
function setUpTestWithTouch() {
  const setup = setUpTest();
  vi.useFakeTimers();

  onTestFinished(() => {
    vi.useRealTimers();
  });

  const touchDown = (target: Element, { clientX = 0, clientY = 0, pointerId = touchId } = {}): void => {
    fireEvent.pointerDown(target, { clientX, clientY, pointerId, pointerType: "touch" });
  };
  const touchMove = (target: Element, { clientX = 0, clientY = 0 } = {}): void => {
    fireEvent.pointerMove(target, { clientX, clientY, pointerId: touchId, pointerType: "touch" });
  };
  const touchEnd = (target: Element, ending: "pointerCancel" | "pointerUp"): void => {
    fireEvent[ending](target, { pointerId: touchId, pointerType: "touch" });
  };
  const hold = (milliseconds: number): void => {
    act(() => {
      vi.advanceTimersByTime(milliseconds);
    });
  };

  return { ...setup, hold, touchDown, touchEnd, touchMove };
}

/**
 * A `contextmenu` as Android sends it for a long-press
 *
 * @param point where the touch is
 * @returns the event
 */
function touchContextMenu({ clientX = 0, clientY = 0 } = {}): Event {
  return new PointerEvent("contextmenu", {
    bubbles: true,
    buttons: 1,
    cancelable: true,
    clientX,
    clientY,
    pointerId: touchId,
    pointerType: "touch",
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

interface Bounds {
  height: number;
  width: number;
  x: number;
  y: number;
}

function setBounds(element: Element, bounds: Bounds): void {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue(DOMRect.fromRect(bounds));
}

function setRegionBounds(bounds: Bounds): void {
  setBounds(elements.region, bounds);
}

function focus(element: HTMLElement): void {
  act(() => {
    element.focus();
  });
}

/**
 * A `contextmenu` as the keyboard or a screen reader sends it, which browsers mark with an empty pointer type
 *
 * @param options whether Shift was held, as some browsers mark Shift+F10's
 * @returns the event
 */
function noPointerContextMenu({ shiftKey = false } = {}): Event {
  return new PointerEvent("contextmenu", { bubbles: true, cancelable: true, pointerType: "", shiftKey });
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
