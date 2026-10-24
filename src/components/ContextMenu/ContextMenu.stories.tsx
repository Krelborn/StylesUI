import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { useState } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import { focusRingContrast } from "../../test/colorContrast";
import { trustedInput } from "../../test/trustedInput";
import { Button } from "../Button";
import { Menu, MenuItem, MenuSeparator } from "../Menu";
import { Stack } from "../Stack";
import { Text } from "../Text";

import { useContextMenu } from "./useContextMenu";

const files = ["report.pdf", "notes.txt", "budget.xlsx"];

/**
 * A list of files whose rows share one menu of actions, which acts on the row it opened for and reports the last
 * action chosen
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
            <Button variant="ghost" data-testid={`file-${name}`}>
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
