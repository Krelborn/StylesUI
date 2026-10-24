import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { useState } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import { focusRingContrast } from "../../test/colorContrast";
import type { TrustedInput } from "../../test/trustedInput";
import { trustedInput } from "../../test/trustedInput";
import { Box } from "../Box";
import { Button } from "../Button";
import { Menu, MenuItem, MenuSeparator } from "../Menu";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { TextInput } from "../TextInput";

import { useContextMenu } from "./useContextMenu";

const files = ["report.pdf", "notes.txt", "budget.xlsx"];

/**
 * A list of files whose rows open when clicked and share one menu of actions, which acts on the row it opened for, and
 * which reports the last action
 */
function FileList(): JSX.Element {
  const [lastAction, setLastAction] = useState("none");
  const contextMenu = useContextMenu();
  const file = contextMenu.target?.closest("[data-name]")?.getAttribute("data-name") ?? "file";

  return (
    <Stack align="start" gap={3}>
      <Stack {...contextMenu.getTargetProps()} as="ul" gap={1} aria-label="Files" data-testid="files">
        {files.map((name) => (
          <li key={name} data-name={name}>
            <Button onClick={() => setLastAction(`Open ${name}`)} variant="ghost" data-testid={`file-${name}`}>
              {name}
            </Button>
          </li>
        ))}
      </Stack>
      <Text>{`Last action: ${lastAction}`}</Text>
      <Menu {...contextMenu.getMenuProps({ "aria-label": `Actions for ${file}` })}>
        <MenuItem onClick={() => setLastAction(`Rename ${file}`)}>Rename…</MenuItem>
        <MenuItem onClick={() => setLastAction(`Duplicate ${file}`)}>Duplicate</MenuItem>
        <MenuSeparator />
        <MenuItem onClick={() => setLastAction(`Delete ${file}`)} tone="danger">
          Delete…
        </MenuItem>
      </Menu>
    </Stack>
  );
}

/**
 * A list of files with a filter field above them, both inside the region, so the field keeps the browser's own menu
 */
function FilteredFileList(): JSX.Element {
  const contextMenu = useContextMenu();
  const file = contextMenu.target?.closest("[data-name]")?.getAttribute("data-name") ?? "file";

  return (
    <Stack {...contextMenu.getTargetProps()} align="start" gap={3}>
      <TextInput aria-label="Filter files" data-testid="filter" />
      <Stack as="ul" gap={1} aria-label="Files">
        {files.map((name) => (
          <li key={name} data-name={name}>
            <Button variant="ghost" data-testid={`file-${name}`}>
              {name}
            </Button>
          </li>
        ))}
      </Stack>
      <Menu {...contextMenu.getMenuProps({ "aria-label": `Actions for ${file}` })}>
        <MenuItem>Rename…</MenuItem>
        <MenuItem>Duplicate</MenuItem>
      </Menu>
    </Stack>
  );
}

/**
 * Two shapes on a canvas, whose menu acts on the shape it opened for, or offers canvas actions when it opened on empty
 * space
 */
function ShapeCanvas(): JSX.Element {
  const [lastAction, setLastAction] = useState("none");
  const contextMenu = useContextMenu();
  const shape = contextMenu.target?.closest("[data-shape]")?.getAttribute("data-shape") ?? null;

  return (
    <Stack align="start" gap={3}>
      <Box
        {...contextMenu.getTargetProps({
          style: {
            blockSize: "12rem",
            border: "var(--sui-border-width, 1px) solid var(--sui-color-border, #d1d5db)",
            borderRadius: "var(--sui-radius-lg, 8px)",
            inlineSize: "20rem",
            position: "relative",
          },
        })}
        aria-label="Canvas"
        as="section"
        data-testid="canvas"
      >
        <Button
          onClick={() => setLastAction("Select circle")}
          style={{ insetBlockStart: "2rem", insetInlineStart: "2rem", position: "absolute" }}
          variant="secondary"
          data-shape="circle"
          data-testid="shape-circle"
        >
          Circle
        </Button>
        <Button
          onClick={() => setLastAction("Select square")}
          style={{ insetBlockStart: "6rem", insetInlineStart: "10rem", position: "absolute" }}
          variant="secondary"
          data-shape="square"
          data-testid="shape-square"
        >
          Square
        </Button>
      </Box>
      <Text>{`Last action: ${lastAction}`}</Text>
      <Menu {...contextMenu.getMenuProps({ "aria-label": shape === null ? "Canvas actions" : `Actions for ${shape}` })}>
        {shape === null ? (
          <>
            <MenuItem onClick={() => setLastAction("Add a shape")}>Add a shape</MenuItem>
            <MenuItem onClick={() => setLastAction("Select all")}>Select all</MenuItem>
          </>
        ) : (
          <>
            <MenuItem onClick={() => setLastAction(`Bring ${shape} to front`)}>Bring to front</MenuItem>
            <MenuItem onClick={() => setLastAction(`Duplicate ${shape}`)}>Duplicate</MenuItem>
            <MenuSeparator />
            <MenuItem onClick={() => setLastAction(`Delete ${shape}`)} tone="danger">
              Delete
            </MenuItem>
          </>
        )}
      </Menu>
    </Stack>
  );
}

/**
 * A region filling the story's frame, so a right-click can land near each of the window's corners
 */
function FullFrameRegion(): JSX.Element {
  const contextMenu = useContextMenu();

  return (
    <>
      <Box
        {...contextMenu.getTargetProps({
          style: { blockSize: "100vh", inlineSize: "100%", padding: "var(--sui-space-4, 1rem)" },
        })}
        data-testid="frame-region"
      >
        <Text>Right-click near any corner</Text>
      </Box>
      <Menu {...contextMenu.getMenuProps({ "aria-label": "Actions" })}>
        <MenuItem>Cut</MenuItem>
        <MenuItem>Copy</MenuItem>
        <MenuItem>Paste</MenuItem>
      </Menu>
    </>
  );
}

/**
 * Which of a menu's edges sit on the point it opened at
 */
interface Edges {
  block: "bottom" | "top";
  inline: "left" | "right";
}

/**
 * Right-clicks 20px in from each corner of the region filling the frame, and in the middle of its top edge, and checks
 * the menu has the edges on the point that leave it room: the start edge where there is room after the point
 *
 * @param input the trusted input
 * @param region the region
 * @param menu the menu
 * @param startEdge the menu's start edge in the region's writing direction
 */
async function expectPlacedAtEachCorner(
  input: TrustedInput,
  region: HTMLElement,
  menu: HTMLElement,
  startEdge: Edges["inline"]
): Promise<void> {
  const bounds = region.getBoundingClientRect();
  const points: { at: { x: number; y: number }; edges: Edges }[] = [
    { at: { x: 20, y: 20 }, edges: { block: "top", inline: "left" } },
    { at: { x: bounds.width - 20, y: 20 }, edges: { block: "top", inline: "right" } },
    { at: { x: 20, y: bounds.height - 20 }, edges: { block: "bottom", inline: "left" } },
    { at: { x: bounds.width - 20, y: bounds.height - 20 }, edges: { block: "bottom", inline: "right" } },
    { at: { x: bounds.width / 2, y: 20 }, edges: { block: "top", inline: startEdge } },
  ];

  for (const { at, edges } of points) {
    await input.contextClickByTestId("frame-region", at);
    await waitFor(() => expect(menu).toHaveFocus());

    const placed = menu.getBoundingClientRect();
    await expect(Math.abs(placed[edges.inline] - (bounds.left + at.x))).toBeLessThanOrEqual(1);
    await expect(Math.abs(placed[edges.block] - (bounds.top + at.y))).toBeLessThanOrEqual(1);

    await input.pressKey("Escape");
    await waitFor(() => expect(menu).not.toBeVisible());
  }
}

const meta = {
  title: "Overlays/Context menu",
  component: Menu,
  args: {
    anchorName: "--sui-overlay-story",
    close: fn(),
    id: "story-context-menu",
    onBeforeToggle: fn(),
    onToggle: fn(),
    open: false,
    placement: "bottom-start",
  },
  argTypes: {
    anchorName: { control: false },
    close: { control: false },
    id: { control: false },
    onBeforeToggle: { control: false },
    onToggle: { control: false },
    open: { control: false },
    placement: { control: false },
  },
  parameters: {
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "`useContextMenu` opens a `Menu` at the pointer when its region is right-clicked. Spread `getTargetProps()` on the region, such as a list or a canvas, and `getMenuProps()` on the menu, which must be given a name. `target` is the element the menu opened for, so one menu can serve every row. Every action in a context menu must also be reachable somewhere visible, since nothing shows the menu is there.",
      },
    },
  },
  render: () => <FileList />,
} satisfies Meta<typeof Menu>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Right-click a file to open its actions at the pointer
 */
export const Default: Story = {};

/**
 * Shift+F10 or the ContextMenu key on a focused row opens the menu below the row's start edge with focus on its first
 * item. Escape returns focus to the row, and Tab returns it there and moves on to the next row.
 */
export const KeyboardInteraction: Story = {
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const row = (name: string): HTMLElement => canvas.getByRole("button", { name });
    const item = (name: string): HTMLElement => canvas.getByRole("menuitem", { hidden: true, name });
    const menu = canvas.getByRole("menu", { hidden: true });

    // After a trusted click in an earlier story, focus from userEvent.tab() only matches :focus-visible once a trusted
    // key has been pressed
    await input.pressKey("Shift");
    await userEvent.tab();
    await userEvent.tab();
    await expect(row("notes.txt")).toHaveFocus();

    await input.pressKey("Shift+F10");

    await waitFor(() => expect(item("Rename…")).toHaveFocus());
    await expect(menu).toHaveAccessibleName("Actions for notes.txt");
    await expect(item("Rename…").matches(":focus-visible")).toBe(true);
    await expect(focusRingContrast(item("Rename…"))).toBeGreaterThanOrEqual(3);
    const rowBounds = row("notes.txt").getBoundingClientRect();
    const menuBounds = menu.getBoundingClientRect();
    await expect(Math.abs(menuBounds.left - rowBounds.left)).toBeLessThanOrEqual(1);
    await expect(Math.abs(menuBounds.top - rowBounds.bottom)).toBeLessThanOrEqual(1);

    await input.pressKey("Escape");
    await waitFor(() => expect(menu).not.toBeVisible());
    await expect(row("notes.txt")).toHaveFocus();

    await input.pressKey("ContextMenu");
    await waitFor(() => expect(item("Rename…")).toHaveFocus());

    await input.pressKey("Tab");
    await waitFor(() => expect(menu).not.toBeVisible());
    await expect(row("budget.xlsx")).toHaveFocus();
  },
};

/**
 * A right-click opens the menu with its corner on the pointer and focus on the menu itself, so no item is highlighted
 * under the pointer, and Down moves to the first item. Escape closes it and returns focus to the row; a click outside
 * closes it and leaves focus where the click put it.
 */
export const PointerInteraction: Story = {
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const row = canvas.getByRole("button", { name: "report.pdf" });
    const item = (name: string): HTMLElement => canvas.getByRole("menuitem", { hidden: true, name });

    // On the list, which doesn't lift under the pointer as a playful button does, so its bounds stay put
    await input.contextClickByTestId("files", { x: 12, y: 6 });

    const menu = await canvas.findByRole("menu", { name: "Actions for report.pdf" });
    await waitFor(() => expect(menu).toHaveFocus());
    const listBounds = canvas.getByRole("list", { name: "Files" }).getBoundingClientRect();
    const menuBounds = menu.getBoundingClientRect();
    await expect(Math.abs(menuBounds.left - (listBounds.left + 12))).toBeLessThanOrEqual(1);
    await expect(Math.abs(menuBounds.top - (listBounds.top + 6))).toBeLessThanOrEqual(1);

    await input.pressKey("ArrowDown");
    await expect(item("Rename…")).toHaveFocus();
    await expect(focusRingContrast(item("Rename…"))).toBeGreaterThanOrEqual(3);

    await input.pressKey("Escape");
    await waitFor(() => expect(menu).not.toBeVisible());
    await expect(row).toHaveFocus();

    await input.contextClickByTestId("file-budget.xlsx");
    await waitFor(() => expect(canvas.getByRole("menu", { name: "Actions for budget.xlsx" })).toHaveFocus());
    await input.pressKey("ArrowDown");
    await input.pressKey("Enter");
    await waitFor(() => expect(menu).not.toBeVisible());
    await expect(canvas.getByText("Last action: Rename budget.xlsx")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "budget.xlsx" })).toHaveFocus();

    await input.contextClickByTestId("file-notes.txt");
    await waitFor(() => expect(menu).toHaveFocus());
    await input.clickPageCorner();
    await waitFor(() => expect(menu).not.toBeVisible());
    await expect(canvas.getByRole("button", { name: "notes.txt" })).not.toHaveFocus();
  },
};

/**
 * Holding a finger on a row for half a second opens the menu at the touch, with focus on the menu. Lifting the finger
 * leaves it open, and the tap that ends the press doesn't open the row.
 */
export const LongPress: Story = {
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    await input.longPressByTestId("file-notes.txt");

    const menu = await canvas.findByRole("menu", { name: "Actions for notes.txt" });
    await waitFor(() => expect(menu).toHaveFocus());
    await expect(canvas.getByText("Last action: none")).toBeInTheDocument();

    await input.pressKey("Escape");
    await waitFor(() => expect(menu).not.toBeVisible());
    await input.clickByTestId("file-notes.txt");
    await expect(canvas.getByText("Last action: Open notes.txt")).toBeInTheDocument();
  },
};

/**
 * A text field inside the region keeps the browser's own menu, with cut, copy, paste and spelling, while the rows
 * around it open the region's
 */
export const TextField: Story = {
  render: () => <FilteredFileList />,
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const menu = canvas.getByRole("menu", { hidden: true });
    let fieldMenuPrevented: boolean | null = null;
    const noteField = (event: Event): void => {
      if (event.target === canvas.getByRole("textbox", { name: "Filter files" })) {
        fieldMenuPrevented = event.defaultPrevented;
      }
    };
    window.addEventListener("contextmenu", noteField);

    try {
      await input.contextClickByTestId("filter");
      await waitFor(() => expect(fieldMenuPrevented).toBe(false));
      await expect(menu).not.toBeVisible();
    } finally {
      window.removeEventListener("contextmenu", noteField);
    }

    await input.pressKey("Escape");
    await input.contextClickByTestId("file-notes.txt");
    await waitFor(() => expect(canvas.getByRole("menu", { name: "Actions for notes.txt" })).toHaveFocus());
  },
};

/**
 * The menu acts on the shape it opened for, and offers the canvas's own actions on empty space
 */
export const Canvas: Story = {
  render: () => <ShapeCanvas />,
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    await input.contextClickByTestId("canvas", { x: 12, y: 12 });
    const canvasMenu = await canvas.findByRole("menu", { name: "Canvas actions" });
    await waitFor(() => expect(canvasMenu).toHaveFocus());
    await waitFor(() => expect(canvas.getByRole("menuitem", { name: "Add a shape" })).toBeVisible());
    await input.pressKey("Escape");
    await waitFor(() => expect(canvasMenu).not.toBeVisible());

    await input.contextClickByTestId("shape-square");
    await waitFor(() => expect(canvas.getByRole("menu", { name: "Actions for square" })).toHaveFocus());
    await input.pressKey("ArrowDown");
    await input.pressKey("ArrowDown");
    await input.pressKey("Enter");
    await expect(canvas.getByText("Last action: Duplicate square")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Square" })).toHaveFocus();
  },
};

/**
 * The menu's start corner sits on the pointer, and against the window's edges it ends on the pointer on that axis
 * instead
 */
export const Placement: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <FullFrameRegion />,
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    await expectPlacedAtEachCorner(
      input,
      canvas.getByTestId("frame-region"),
      canvas.getByRole("menu", { hidden: true }),
      "left"
    );
  },
};

/**
 * In right-to-left text the menu's start corner is its top right, so it opens towards the left of the pointer, and
 * against the window's left edge it flips to the right
 */
export const PlacementRightToLeft: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <Box dir="rtl">
      <FullFrameRegion />
    </Box>
  ),
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    await expectPlacedAtEachCorner(
      input,
      canvas.getByTestId("frame-region"),
      canvas.getByRole("menu", { hidden: true }),
      "right"
    );
  },
};

/**
 * In right-to-left text Shift+F10 opens the menu below the focused row's start edge, its right
 */
export const RightToLeft: Story = {
  render: () => (
    <Box dir="rtl">
      <FileList />
    </Box>
  ),
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const row = canvas.getByRole("button", { name: "notes.txt" });
    const menu = canvas.getByRole("menu", { hidden: true });

    await input.pressKey("Shift");
    await userEvent.tab();
    await userEvent.tab();
    await expect(row).toHaveFocus();
    await input.pressKey("Shift+F10");

    await waitFor(() => expect(canvas.getByRole("menuitem", { name: "Rename…" })).toHaveFocus());
    await expect(Math.abs(menu.getBoundingClientRect().right - row.getBoundingClientRect().right)).toBeLessThanOrEqual(
      1
    );
  },
};
