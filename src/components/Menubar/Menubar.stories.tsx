import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties, JSX } from "react";
import { useState } from "react";
import { expect, userEvent, waitFor } from "storybook/test";

import { focusRingContrast, isSameColor, textContrast } from "../../test/colorContrast";
import { trustedInput } from "../../test/trustedInput";
import { Button } from "../Button";
import { Cluster } from "../Cluster";
import { MenuItem, MenuItemCheckbox, MenuItemRadio, MenuRadioGroup, MenuSeparator, Submenu } from "../Menu";
import { Stack } from "../Stack";
import { Text } from "../Text";

import { Menubar } from "./Menubar";
import { MenubarMenu } from "./MenubarMenu";

interface EditorProps {
  /**
   * The writing direction around the editor
   */
  dir?: "ltr" | "rtl";

  /**
   * Styles for the editor's frame, such as a width
   */
  style?: CSSProperties;
}

/**
 * An editor's header holding its menubar between two buttons, so Tab has somewhere to go on either side, and the last
 * command chosen below it
 */
function Editor({ dir, style }: EditorProps): JSX.Element {
  const [lastCommand, setLastCommand] = useState("none");
  const [showRuler, setShowRuler] = useState(true);
  const [zoom, setZoom] = useState("fit");

  return (
    <Stack dir={dir} gap={3} style={{ minBlockSize: "20rem", ...style }} data-testid="editor">
      <Cluster
        gap={2}
        style={{
          borderBlockEnd: "var(--sui-border-width, 1px) solid var(--sui-color-border, #d1d5db)",
          paddingBlock: "var(--sui-space-1, 0.25rem)",
        }}
      >
        <Button size="sm" variant="ghost">
          Back
        </Button>
        <Menubar aria-label="Editor">
          <MenubarMenu label="File">
            <MenuItem onClick={() => setLastCommand("New")} shortcut="⌘N" aria-keyshortcuts="Meta+N">
              New
            </MenuItem>
            <Submenu label="Open recent">
              <MenuItem onClick={() => setLastCommand("Open Report.md")}>Report.md</MenuItem>
              <MenuItem onClick={() => setLastCommand("Open Notes.md")}>Notes.md</MenuItem>
            </Submenu>
            <MenuSeparator />
            <MenuItem onClick={() => setLastCommand("Close")}>Close</MenuItem>
          </MenubarMenu>
          <MenubarMenu label="Edit">
            <MenuItem onClick={() => setLastCommand("Undo")} shortcut="⌘Z" aria-keyshortcuts="Meta+Z">
              Undo
            </MenuItem>
            <MenuItem onClick={() => setLastCommand("Redo")}>Redo</MenuItem>
            <MenuSeparator />
            <MenuItem onClick={() => setLastCommand("Cut")}>Cut</MenuItem>
            <MenuItem onClick={() => setLastCommand("Copy")}>Copy</MenuItem>
            <MenuItem onClick={() => setLastCommand("Paste")}>Paste</MenuItem>
          </MenubarMenu>
          <MenubarMenu label="View">
            <MenuItemCheckbox checked={showRuler} onCheckedChange={setShowRuler}>
              Ruler
            </MenuItemCheckbox>
            <MenuRadioGroup label="Zoom" onValueChange={setZoom} value={zoom}>
              <MenuItemRadio value="fit">Fit</MenuItemRadio>
              <MenuItemRadio value="100">100%</MenuItemRadio>
            </MenuRadioGroup>
          </MenubarMenu>
          <MenubarMenu label="Insert">
            <MenuItem onClick={() => setLastCommand("Image")}>Image</MenuItem>
            <MenuItem onClick={() => setLastCommand("Table")}>Table</MenuItem>
          </MenubarMenu>
          <MenubarMenu label="Format">
            <MenuItem onClick={() => setLastCommand("Bold")}>Bold</MenuItem>
            <MenuItem onClick={() => setLastCommand("Italic")}>Italic</MenuItem>
          </MenubarMenu>
          <MenubarMenu label="Help">
            <MenuItem onClick={() => setLastCommand("Shortcuts")}>Keyboard shortcuts</MenuItem>
          </MenubarMenu>
        </Menubar>
        <Button size="sm" variant="ghost">
          Share
        </Button>
      </Cluster>
      <Text>{`Last command: ${lastCommand}`}</Text>
    </Stack>
  );
}

const meta = {
  title: "Overlays/Menubar",
  component: Menubar,
  subcomponents: { MenubarMenu },
  args: {
    "aria-label": "Editor",
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: () => <Editor />,
} satisfies Meta<typeof Menubar>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * An editor's menubar. Clicking a bar item opens its menu below it, with focus left on the bar item, and choosing an
 * item runs it, closes the menu and returns focus to the bar item.
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const file = canvas.getByRole("menuitem", { name: "File" });

    await userEvent.click(file);

    const menu = await canvas.findByRole("menu", { name: "File" });
    await waitFor(() => expect(menu).toBeVisible());
    await expect(file).toHaveFocus();
    await expect(file).toHaveAttribute("aria-expanded", "true");
    await expect(menu).toHaveAttribute("data-density", "compact");

    await userEvent.click(canvas.getByRole("menuitem", { name: "Close" }));

    await waitFor(() => expect(menu).not.toBeVisible());
    await expect(canvas.getByText("Last command: Close")).toBeInTheDocument();
    await expect(file).toHaveFocus();
  },
};

/**
 * The bar is one stop in the tab order. Left and Right Arrow move along it, wrapping, Home and End go to its ends, and
 * typing moves to the item whose label starts with the typed text. Down Arrow opens a menu on its first item. In a
 * menu, Right and Left Arrow move to the next or previous menu, opening it with focus on its bar item, except where
 * they open or close a submenu. Escape closes the menu and leaves focus on the bar, and Tab leaves the bar, closing
 * any open menu. The rings keep 3:1 and the highlighted labels 4.5:1.
 */
export const KeyboardInteraction: Story = {
  play: async ({ canvas }) => {
    // After a trusted click in an earlier story, focus from userEvent.tab() only matches :focus-visible once a trusted
    // key has been pressed
    await trustedInput()?.pressKey("Shift");
    const bar = (name: string): HTMLElement => canvas.getByRole("menuitem", { name });
    const item = (name: string): HTMLElement => canvas.getByRole("menuitem", { hidden: true, name });
    // A closed menu's name can't be computed by role, so it is found by the bar item that labels it
    const menu = (name: string): HTMLElement => canvas.getByLabelText(name, { selector: '[role="menu"]' });

    await userEvent.tab();
    await userEvent.tab();
    await expect(bar("File")).toHaveFocus();
    await expect(focusRingContrast(bar("File"))).toBeGreaterThanOrEqual(3);
    await expect(textContrast(bar("File"))).toBeGreaterThanOrEqual(4.5);

    await userEvent.keyboard("{ArrowRight}");
    await expect(bar("Edit")).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    await expect(bar("Help")).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect(bar("File")).toHaveFocus();
    await userEvent.keyboard("{End}");
    await expect(bar("Help")).toHaveFocus();
    await userEvent.keyboard("e");
    await expect(bar("Edit")).toHaveFocus();
    await expect(menu("Edit")).not.toBeVisible();

    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(item("Undo")).toHaveFocus());
    await expect(focusRingContrast(item("Undo"))).toBeGreaterThanOrEqual(3);

    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(menu("View")).toBeVisible());
    await expect(bar("View")).toHaveFocus();
    await expect(bar("View")).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(menu("Edit")).not.toBeVisible());

    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(menu("Insert")).toBeVisible());
    await expect(bar("Insert")).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(item("Image")).toHaveFocus());
    await expect(menu("Insert")).toBeVisible();

    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(menu("View")).toBeVisible());
    await expect(bar("View")).toHaveFocus();

    const input = trustedInput();

    if (input === null) {
      return;
    }

    await input.pressKey("Escape");
    await waitFor(() => expect(menu("View")).not.toBeVisible());
    await expect(bar("View")).toHaveFocus();

    await input.pressKey("Home");
    await expect(bar("File")).toHaveFocus();
    await expect(menu("File")).not.toBeVisible();
    await input.pressKey("Enter");
    await waitFor(() => expect(item("New")).toHaveFocus());
    await input.pressKey("ArrowDown");
    await input.pressKey("ArrowRight");
    await waitFor(() => expect(item("Report.md")).toHaveFocus());
    await input.pressKey("ArrowLeft");
    await waitFor(() => expect(item("Open recent")).toHaveFocus());
    await expect(menu("File")).toBeVisible();

    await input.pressKey("ArrowLeft");
    await waitFor(() => expect(menu("Help")).toBeVisible());
    await expect(bar("Help")).toHaveFocus();
    await waitFor(() => expect(menu("File")).not.toBeVisible());

    await input.pressKey("Tab");
    await waitFor(() => expect(menu("Help")).not.toBeVisible());
    await expect(canvas.getByRole("button", { name: "Share" })).toHaveFocus();

    await input.pressKey("Shift+Tab");
    await expect(bar("Help")).toHaveFocus();
  },
};

/**
 * Clicking a bar item opens its menu, with focus on the bar item. While it is open, moving the pointer onto another
 * bar item opens that one's menu instead, and clicking the bar item of the open menu closes it. With no menu open,
 * hovering a bar item opens nothing, and a click outside closes an open menu, leaving focus where the click put it.
 */
export const PointerInteraction: Story = {
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const bar = (name: string): HTMLElement => canvas.getByRole("menuitem", { name });
    // A closed menu's name can't be computed by role, so it is found by the bar item that labels it
    const menu = (name: string): HTMLElement => canvas.getByLabelText(name, { selector: '[role="menu"]' });

    for (const name of ["File", "Edit", "View"]) {
      bar(name).dataset.testid = `${name.toLowerCase()}-bar-item`;
    }

    await input.clickByTestId("file-bar-item");
    await waitFor(() => expect(menu("File")).toBeVisible());
    await expect(bar("File")).toHaveFocus();

    await input.hoverByTestId("edit-bar-item");
    await waitFor(() => expect(menu("Edit")).toBeVisible());
    await waitFor(() => expect(menu("File")).not.toBeVisible());
    await expect(bar("Edit")).toHaveFocus();

    await input.clickByTestId("edit-bar-item");
    await waitFor(() => expect(menu("Edit")).not.toBeVisible());

    await input.hoverByTestId("view-bar-item");
    await expect(menu("View")).not.toBeVisible();
    await expect(bar("View")).toHaveAttribute("aria-expanded", "false");

    await input.clickByTestId("view-bar-item");
    await waitFor(() => expect(menu("View")).toBeVisible());

    await input.clickPageCorner();
    await waitFor(() => expect(menu("View")).not.toBeVisible());
    await expect(bar("View")).not.toHaveFocus();
  },
};

/**
 * In right-to-left text, Left Arrow moves to the next bar item and Right Arrow to the previous one, and each menu
 * lines up with its bar item's right edge.
 */
export const RightToLeft: Story = {
  render: () => <Editor dir="rtl" />,
  play: async ({ canvas }) => {
    const bar = (name: string): HTMLElement => canvas.getByRole("menuitem", { name });
    const item = (name: string): HTMLElement => canvas.getByRole("menuitem", { hidden: true, name });
    // A closed menu's name can't be computed by role, so it is found by the bar item that labels it
    const menu = (name: string): HTMLElement => canvas.getByLabelText(name, { selector: '[role="menu"]' });

    bar("File").focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(bar("Edit")).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(item("Undo")).toHaveFocus());
    await expect(menu("Edit").getBoundingClientRect().right).toBeCloseTo(bar("Edit").getBoundingClientRect().right, 0);

    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(menu("View")).toBeVisible());
    await expect(bar("View")).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(menu("Edit")).toBeVisible());
    await expect(bar("Edit")).toHaveFocus();
  },
};

/**
 * In a 320px frame the bar wraps onto more lines where its items don't fit, rather than scrolling, and its menus fit
 * the window
 */
export const Narrow: Story = {
  render: () => <Editor style={{ inlineSize: "20rem" }} />,
  play: async ({ canvas }) => {
    const bar = (name: string): HTMLElement => canvas.getByRole("menuitem", { name });
    // A closed menu's name can't be computed by role, so it is found by the bar item that labels it
    const menu = (name: string): HTMLElement => canvas.getByLabelText(name, { selector: '[role="menu"]' });

    const frame = canvas.getByTestId("editor").getBoundingClientRect();
    await expect(frame.width).toBeCloseTo(320, 0);

    for (const item of canvas.getAllByRole("menuitem")) {
      await expect(item.getBoundingClientRect().right, String(item.textContent)).toBeLessThanOrEqual(frame.right);
    }

    await userEvent.click(bar("Help"));
    await waitFor(() => expect(menu("Help")).toBeVisible());

    const rectangle = menu("Help").getBoundingClientRect();
    await expect(rectangle.left).toBeGreaterThanOrEqual(0);
    await expect(rectangle.right).toBeLessThanOrEqual(window.innerWidth);
  },
};

/**
 * A hovered bar item takes the menu items' highlight, and its label keeps 4.5:1 on it
 */
export const HoverContrast: Story = {
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const file = canvas.getByRole("menuitem", { name: "File" });
    file.dataset.testid = "file-bar-item";

    await input.hoverByTestId("file-bar-item");
    await Promise.all(file.getAnimations().map((transition) => transition.finished));

    await expect(file.matches(":hover")).toBe(true);
    await expect(textContrast(file)).toBeGreaterThanOrEqual(4.5);
  },
};

/**
 * Under forced colours, as Windows High Contrast applies them, the bar item whose menu is open is `Highlight` with
 * `HighlightText`
 */
export const ForcedColors: Story = {
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const file = canvas.getByRole("menuitem", { name: "File" });
    await userEvent.click(file);
    await waitFor(() => expect(file).toHaveAttribute("aria-expanded", "true"));

    await input.emulateForcedColors(true);

    try {
      await Promise.all(file.getAnimations().map((transition) => transition.finished));

      await expect(isSameColor(file, getComputedStyle(file).backgroundColor, "Highlight")).toBe(true);
      await expect(isSameColor(file, getComputedStyle(file).color, "HighlightText")).toBe(true);
    } finally {
      await input.emulateForcedColors(false);
    }
  },
};
