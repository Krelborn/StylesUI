import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { useState } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import { focusRingContrast, textContrast } from "../../test/colorContrast";
import type { TrustedInput } from "../../test/trustedInput";
import { trustedInput } from "../../test/trustedInput";
import { Avatar } from "../Avatar";
import { Box } from "../Box";
import { Button } from "../Button";
import { Cluster } from "../Cluster";
import { AddIcon, ColorModeIcon, DeleteIcon, MoreHorizontalIcon, RefreshIcon, SendIcon } from "../Icon";
import { IconButton } from "../IconButton";
import { Stack } from "../Stack";
import { Text } from "../Text";

import { Menu } from "./Menu";
import { MenuGroup } from "./MenuGroup";
import { MenuItem } from "./MenuItem";
import { MenuItemCheckbox } from "./MenuItemCheckbox";
import { MenuItemRadio } from "./MenuItemRadio";
import { MenuRadioGroup } from "./MenuRadioGroup";
import { MenuSeparator } from "./MenuSeparator";
import { Submenu } from "./Submenu";
import { useMenu } from "./useMenu";

/**
 * Actions on a document, from a labelled button, reporting the last one chosen
 */
function RowActionsMenu(): JSX.Element {
  const [lastAction, setLastAction] = useState("none");
  const menu = useMenu();

  return (
    <Stack align="start" gap={3}>
      <Box>
        <Button {...menu.getTriggerProps()} variant="secondary">
          Actions
        </Button>
        <Menu {...menu.getMenuProps()}>
          <MenuItem onClick={() => setLastAction("Edit")}>Edit</MenuItem>
          <MenuItem onClick={() => setLastAction("Duplicate")}>Duplicate</MenuItem>
          <MenuItem onClick={() => setLastAction("Archive")}>Archive</MenuItem>
        </Menu>
      </Box>
      <Text>{`Last action: ${lastAction}`}</Text>
    </Stack>
  );
}

/**
 * Actions on a row, from an icon-only button at the end of it
 */
function IconTriggerMenu(): JSX.Element {
  const menu = useMenu({ placement: "bottom-end" });

  return (
    <Box style={{ display: "flex", justifyContent: "end", maxInlineSize: "24rem" }}>
      {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- label names the IconButton */}
      <IconButton {...menu.getTriggerProps()} label="Row actions">
        <MoreHorizontalIcon />
      </IconButton>
      <Menu {...menu.getMenuProps({ "aria-label": "Row actions" })}>
        <MenuItem>Edit</MenuItem>
        <MenuItem>Duplicate</MenuItem>
        <MenuItem>Archive</MenuItem>
      </Menu>
    </Box>
  );
}

/**
 * A menu between other buttons, so Tab has somewhere to go on either side of it
 */
function ToolbarMenu(): JSX.Element {
  const menu = useMenu();

  return (
    <Cluster gap={2}>
      <Button variant="ghost">Back</Button>
      <Button {...menu.getTriggerProps()} variant="secondary">
        Actions
      </Button>
      <Menu {...menu.getMenuProps()}>
        <MenuItem>Edit</MenuItem>
        <MenuItem>Duplicate</MenuItem>
        <MenuItem>Archive</MenuItem>
        <MenuItem tone="danger">Delete…</MenuItem>
      </Menu>
      <Button variant="ghost">Share</Button>
    </Cluster>
  );
}

/**
 * Rows with icons, descriptions and shortcuts, a disabled item and a destructive one
 */
function DocumentMenu(): JSX.Element {
  const menu = useMenu({ defaultOpen: true });

  return (
    <Box style={{ minBlockSize: "18rem" }}>
      <Button {...menu.getTriggerProps()} variant="secondary">
        Document
      </Button>
      <Menu {...menu.getMenuProps()}>
        <MenuItem description="Keep this one as it is" icon={<AddIcon />}>
          New version
        </MenuItem>
        <MenuItem shortcut="⌘D" aria-keyshortcuts="Meta+D">
          Duplicate
        </MenuItem>
        <MenuItem description="Ask an admin to turn on exports" disabled={true} icon={<SendIcon />}>
          Export
        </MenuItem>
        <MenuItem icon={<DeleteIcon />} shortcut="⌘⌫" tone="danger" aria-keyshortcuts="Meta+Backspace">
          Delete…
        </MenuItem>
      </Menu>
    </Box>
  );
}

/**
 * The left edge of an item's label
 *
 * @param item the item element
 * @returns the left edge in pixels
 */
function labelStart(item: HTMLElement): number {
  const label = item.ownerDocument.getElementById(item.getAttribute("aria-labelledby") ?? "");

  return label?.getBoundingClientRect().left ?? Number.NaN;
}

/**
 * View options in two groups, the second named by its label, with a rule between them
 */
function ViewMenu(): JSX.Element {
  const menu = useMenu({ defaultOpen: true });

  return (
    <Box style={{ minBlockSize: "16rem" }}>
      <Button {...menu.getTriggerProps()} variant="secondary">
        View
      </Button>
      <Menu {...menu.getMenuProps()}>
        <MenuGroup>
          <MenuItem icon={<RefreshIcon />}>Refresh</MenuItem>
          <MenuItem>Open in new window</MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup label="Sort by">
          <MenuItem>Name</MenuItem>
          <MenuItem>Date modified</MenuItem>
          <MenuItem>Size</MenuItem>
        </MenuGroup>
      </Menu>
    </Box>
  );
}

/**
 * An account menu whose items are links, with one action at the end
 */
function AccountMenu(): JSX.Element {
  const menu = useMenu({ defaultOpen: true });

  return (
    <Box style={{ minBlockSize: "12rem" }}>
      <Button {...menu.getTriggerProps()} variant="secondary">
        Account
      </Button>
      <Menu {...menu.getMenuProps()}>
        <MenuItem as="a" href="#profile">
          Your profile
        </MenuItem>
        <MenuItem as="a" href="#settings">
          Settings
        </MenuItem>
        <MenuSeparator />
        <MenuItem>Sign out</MenuItem>
      </Menu>
    </Box>
  );
}

/**
 * Display options that are each on or off
 */
function DisplayOptionsMenu(): JSX.Element {
  const [showArchived, setShowArchived] = useState(true);
  const menu = useMenu();

  return (
    <Stack align="start" gap={3}>
      <Box>
        <Button {...menu.getTriggerProps()} variant="secondary">
          Display
        </Button>
        <Menu {...menu.getMenuProps()}>
          <MenuItemCheckbox>Compact rows</MenuItemCheckbox>
          <MenuItemCheckbox checked={showArchived} onCheckedChange={setShowArchived}>
            Show archived
          </MenuItemCheckbox>
          <MenuItemCheckbox description="Turned off by your admin" disabled={true}>
            Sync across devices
          </MenuItemCheckbox>
        </Menu>
      </Box>
      <Text>{`Showing archived: ${showArchived ? "yes" : "no"}`}</Text>
    </Stack>
  );
}

/**
 * A sort order, one of which is checked, beside the display options
 */
function SortOrderMenu(): JSX.Element {
  const [sortOrder, setSortOrder] = useState("name");
  const menu = useMenu();

  return (
    <Stack align="start" gap={3}>
      <Box>
        <Button {...menu.getTriggerProps()} variant="secondary">
          Sort
        </Button>
        <Menu {...menu.getMenuProps()}>
          <MenuRadioGroup label="Sort by" onValueChange={setSortOrder} value={sortOrder}>
            <MenuItemRadio value="name">Name</MenuItemRadio>
            <MenuItemRadio value="modified">Date modified</MenuItemRadio>
            <MenuItemRadio value="size">Size</MenuItemRadio>
          </MenuRadioGroup>
          <MenuSeparator />
          <MenuItemCheckbox defaultChecked={true}>Folders first</MenuItemCheckbox>
        </Menu>
      </Box>
      <Text>{`Sorted by: ${sortOrder}`}</Text>
    </Stack>
  );
}

/**
 * File actions whose Move to item opens a submenu of folders, one of which opens a submenu of its own
 */
function FileMenu(): JSX.Element {
  const [lastAction, setLastAction] = useState("none");
  const menu = useMenu();

  return (
    <Stack align="start" gap={3}>
      <Box>
        <Button {...menu.getTriggerProps()} variant="secondary" data-testid="file-trigger">
          File
        </Button>
        <Menu {...menu.getMenuProps()}>
          <MenuItem>Rename…</MenuItem>
          <Submenu label="Move to">
            <MenuItem onClick={() => setLastAction("Moved to Inbox")}>Inbox</MenuItem>
            <MenuItem>Projects</MenuItem>
            <Submenu label="Archive">
              <MenuItem onClick={() => setLastAction("Moved to 2025")}>2025</MenuItem>
              <MenuItem>2024</MenuItem>
            </Submenu>
          </Submenu>
          <MenuItem tone="danger">Delete…</MenuItem>
        </Menu>
      </Box>
      <Text>{`Last action: ${lastAction}`}</Text>
    </Stack>
  );
}

interface PlacedMenuProps {
  /**
   * Where the button sits in its row
   */
  align: "end" | "start";

  /**
   * Writing direction around the menu
   */
  dir?: "ltr" | "rtl";

  /**
   * The button's label, which also names the menu
   */
  label: string;

  /**
   * Whether the menu is nearly as wide as the window, which leaves its submenu no room on either side
   */
  wide?: boolean;
}

/**
 * A menu with a Move to submenu, placed so the submenu has room on one side, the other, or neither
 */
function PlacedMenu({ align, dir, label, wide = false }: PlacedMenuProps): JSX.Element {
  const menu = useMenu();

  return (
    <Box dir={dir} style={{ display: "flex", justifyContent: align }}>
      <Button {...menu.getTriggerProps()} variant="secondary">
        {label}
      </Button>
      <Menu
        {...menu.getMenuProps({
          style: wide ? { maxInlineSize: "none", minInlineSize: "calc(100vw - 4rem)" } : undefined,
        })}
      >
        <MenuItem>Rename…</MenuItem>
        <Submenu label="Move to">
          <MenuItem>Inbox</MenuItem>
          <MenuItem>Projects</MenuItem>
        </Submenu>
      </Menu>
    </Box>
  );
}

/**
 * Opens a menu and its Move to submenu from the keyboard
 *
 * @param input the trusted input
 * @param trigger the menu's button
 * @param openingKey the arrow key that opens a submenu in the menu's writing direction
 * @returns the Move to item and its submenu, once the submenu has settled where it opened
 */
async function openMoveTo(
  input: TrustedInput,
  trigger: HTMLElement,
  openingKey: "ArrowLeft" | "ArrowRight"
): Promise<{ item: HTMLElement; submenu: HTMLElement }> {
  const page = trigger.ownerDocument;

  trigger.focus();
  await input.pressKey("Enter");
  await waitFor(() => expect(page.activeElement?.textContent).toBe("Rename…"));
  await input.pressKey("ArrowDown");
  await input.pressKey(openingKey);
  await waitFor(() => expect(page.activeElement?.textContent).toBe("Inbox"));

  const submenu = page.activeElement?.closest<HTMLElement>('[role="menu"]');
  const item = page.querySelector<HTMLElement>(`[aria-controls="${submenu?.id}"]`);

  if (submenu == null || item === null) {
    throw new Error("Move to opened no submenu");
  }

  await Promise.all(submenu.getAnimations().map((animation) => animation.finished));

  return { item, submenu };
}

/**
 * Closes a submenu and then its menu with Escape
 *
 * @param input the trusted input
 * @param trigger the menu's button, which takes focus back
 */
async function closeBoth(input: TrustedInput, trigger: HTMLElement): Promise<void> {
  await input.pressKey("Escape");
  await waitFor(() => expect(trigger.ownerDocument.activeElement?.textContent).toBe("Move to"));
  await input.pressKey("Escape");
  await waitFor(() => expect(trigger).toHaveFocus());
}

/**
 * An app's account menu from an avatar at the end of its header: links, an appearance submenu of radio items, and
 * signing out
 */
function UserMenu(): JSX.Element {
  const [mode, setMode] = useState("system");
  const menu = useMenu({ placement: "bottom-end" });

  return (
    <Box style={{ display: "flex", justifyContent: "end", minBlockSize: "16rem" }}>
      {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- label names the IconButton */}
      <IconButton {...menu.getTriggerProps()} label="Account" data-testid="account-trigger">
        <Avatar name="Matt Styles" size="sm" aria-hidden={true} />
      </IconButton>
      <Menu {...menu.getMenuProps({ "aria-label": "Account" })}>
        <MenuItem as="a" href="#profile">
          Your profile
        </MenuItem>
        <MenuItem as="a" href="#settings" shortcut="⌘," aria-keyshortcuts="Meta+Comma">
          Settings
        </MenuItem>
        <Submenu icon={<ColorModeIcon />} label="Appearance">
          <MenuRadioGroup label="Appearance" onValueChange={setMode} value={mode}>
            <MenuItemRadio value="light">Light</MenuItemRadio>
            <MenuItemRadio value="dark">Dark</MenuItemRadio>
            <MenuItemRadio value="system">System</MenuItemRadio>
          </MenuRadioGroup>
        </Submenu>
        <MenuSeparator />
        <MenuItem>Sign out</MenuItem>
      </Menu>
    </Box>
  );
}

const meta = {
  title: "Overlays/Menu",
  component: Menu,
  subcomponents: { MenuGroup, MenuItem, MenuItemCheckbox, MenuItemRadio, MenuRadioGroup, MenuSeparator, Submenu },
  args: {
    anchorName: "--sui-overlay-story",
    close: fn(),
    id: "story-menu",
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
  },
  render: () => <RowActionsMenu />,
} satisfies Meta<typeof Menu>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Clicking the button opens the menu below it with focus on the menu itself, so no item is highlighted under the
 * pointer. Choosing an item runs it, closes the menu and returns focus to the button.
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Actions" });

    await userEvent.click(trigger);

    const menu = await canvas.findByRole("menu", { name: "Actions" });
    await waitFor(() => expect(menu).toBeVisible());
    await expect(menu).toHaveFocus();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(canvas.getByRole("menuitem", { name: "Duplicate" }));

    await waitFor(() => expect(menu).not.toBeVisible());
    await expect(canvas.getByText("Last action: Duplicate")).toBeInTheDocument();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toHaveFocus();
  },
};

/**
 * An `IconButton` takes its name from its tooltip, which the menu cannot reach, so the menu is given the same name
 * with `getMenuProps({ "aria-label": … })`
 */
export const IconButtonTrigger: Story = {
  render: () => <IconTriggerMenu />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Row actions" }));

    const menu = await canvas.findByRole("menu", { name: "Row actions" });
    await waitFor(() => expect(menu).toBeVisible());
  },
};

/**
 * Enter or Down opens the menu on its first item, and Up on its last. The arrow keys move through the items, wrapping
 * at both ends, Home and End go to the first and last, and typing moves to the item whose label starts with the typed
 * text. The focused item shows the inset focus ring over the highlight. Escape closes the menu and returns focus to
 * the button; Tab closes it and moves on past the button, and Shift+Tab closes it and returns to the button. The rings
 * keep 3:1 and the highlighted label keeps 4.5:1, on a destructive item's danger highlight too.
 */
export const KeyboardInteraction: Story = {
  render: () => <ToolbarMenu />,
  play: async ({ canvas }) => {
    // After a trusted click in an earlier story, focus from userEvent.tab() only matches :focus-visible once a trusted
    // key has been pressed
    await trustedInput()?.pressKey("Shift");
    const trigger = canvas.getByRole("button", { name: "Actions" });
    const item = (name: string): HTMLElement => canvas.getByRole("menuitem", { hidden: true, name });

    await userEvent.tab();
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await expect(focusRingContrast(trigger)).toBeGreaterThanOrEqual(3);

    await userEvent.keyboard("{Enter}");

    await waitFor(() => expect(item("Edit")).toHaveFocus());
    await expect(item("Edit").matches(":focus-visible")).toBe(true);
    await expect(focusRingContrast(item("Edit"))).toBeGreaterThanOrEqual(3);
    await expect(textContrast(item("Edit"))).toBeGreaterThanOrEqual(4.5);

    await userEvent.keyboard("{ArrowDown}");
    await expect(item("Duplicate")).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    await expect(item("Delete…")).toHaveFocus();
    await expect(focusRingContrast(item("Delete…"))).toBeGreaterThanOrEqual(3);
    await expect(textContrast(item("Delete…"))).toBeGreaterThanOrEqual(4.5);
    await userEvent.keyboard("{Home}");
    await expect(item("Edit")).toHaveFocus();
    await userEvent.keyboard("{End}");
    await expect(item("Delete…")).toHaveFocus();
    await userEvent.keyboard("d");
    await expect(item("Duplicate")).toHaveFocus();
    await userEvent.keyboard("{End}");

    const input = trustedInput();

    if (input === null) {
      return;
    }

    await input.pressKey("Escape");
    await waitFor(() => expect(item("Delete…")).not.toBeVisible());
    await expect(trigger).toHaveFocus();
    await expect(focusRingContrast(trigger)).toBeGreaterThanOrEqual(3);

    await input.pressKey("ArrowUp");
    await waitFor(() => expect(item("Delete…")).toHaveFocus());

    await input.pressKey("Tab");
    await waitFor(() => expect(item("Delete…")).not.toBeVisible());
    await expect(canvas.getByRole("button", { name: "Share" })).toHaveFocus();

    await input.pressKey("Shift+Tab");
    await input.pressKey("ArrowDown");
    await waitFor(() => expect(item("Edit")).toHaveFocus());

    await input.pressKey("Shift+Tab");
    await waitFor(() => expect(item("Edit")).not.toBeVisible());
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};

/**
 * An item can have an icon, a description below its label and a shortcut after it. Once any item has an icon, every
 * label lines up after the icons; a menu with none has no icon column. A disabled item is dimmed and a destructive one
 * is drawn in the danger colour. Shortcuts are hidden from assistive technology and announced with
 * `aria-keyshortcuts`.
 */
export const ItemContent: Story = {
  render: () => <DocumentMenu />,
  play: async ({ canvas }) => {
    const items = await canvas.findAllByRole("menuitem");
    const starts = items.map(labelStart);

    await waitFor(() => expect(items[0]).toBeVisible());
    await expect(new Set(starts.map(Math.round)).size).toBe(1);
    await expect(canvas.getByRole("menuitem", { name: "Export" })).toHaveAttribute("aria-disabled", "true");
    await expect(canvas.getByRole("menuitem", { name: "New version" })).toHaveAccessibleDescription(
      "Keep this one as it is"
    );
  },
};

/**
 * Without icons, labels start at the item's own padding, with no empty column before them
 */
export const NoIconColumn: Story = {
  render: () => <ToolbarMenu />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Actions" }));

    const edit = await canvas.findByRole("menuitem", { name: "Edit" });
    await waitFor(() => expect(edit).toBeVisible());
    const padding = parseFloat(getComputedStyle(edit).paddingInlineStart);

    await expect(labelStart(edit) - edit.getBoundingClientRect().left).toBeCloseTo(padding, 0);
  },
};

/**
 * On the highlight, every enabled item's label, description and shortcut keep 4.5:1, and a destructive item's on its
 * danger highlight
 */
export const HighlightContrast: Story = {
  render: () => <DocumentMenu />,
  play: async ({ canvas }) => {
    const enabled = (await canvas.findAllByRole("menuitem")).filter(
      (item) => item.getAttribute("aria-disabled") !== "true"
    );

    for (const item of enabled) {
      const textParts = Array.from(item.querySelectorAll("span")).filter(
        (span) => span.children.length === 0 && span.textContent !== ""
      );
      item.focus();

      await expect(textParts.length).toBeGreaterThan(0);

      for (const part of textParts) {
        await expect(textContrast(part), `${item.textContent}: ${part.textContent}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  },
};

/**
 * `MenuGroup` gathers related items, named by its label when it has one, and `MenuSeparator` rules groups apart. The
 * group label lines up with the item labels, and the arrow keys move across groups as through one list.
 */
export const GroupsAndSeparators: Story = {
  render: () => <ViewMenu />,
  play: async ({ canvas }) => {
    const sortBy = await canvas.findByRole("group", { name: "Sort by" });
    const name = canvas.getByRole("menuitem", { name: "Name" });
    const label = canvas.getByText("Sort by");

    await waitFor(() => expect(sortBy).toBeVisible());
    await expect(sortBy).toContainElement(name);
    await expect(canvas.getByRole("separator")).toBeVisible();
    await expect(
      label.getBoundingClientRect().left + parseFloat(getComputedStyle(label).paddingInlineStart)
    ).toBeCloseTo(labelStart(name), 0);

    canvas.getByRole("menuitem", { name: "Open in new window" }).focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(name).toHaveFocus();
  },
};

/**
 * With `as="a"`, or a router's link component, an item is a link with the `menuitem` role, followed with a click,
 * Enter or Space
 */
export const Links: Story = {
  render: () => <AccountMenu />,
  play: async ({ canvas }) => {
    const profile = await canvas.findByRole("menuitem", { name: "Your profile" });

    await waitFor(() => expect(profile).toBeVisible());
    await expect(profile.tagName).toBe("A");
    await expect(getComputedStyle(profile).textDecorationLine).toBe("none");
    await expect(profile).toHaveAttribute("href", "#profile");
  },
};

/**
 * A checkbox item shows a check before its label when it is on. Space toggles it and leaves the menu open, so several
 * can be set at once; Enter or a click toggles it and closes the menu. The check takes the place of an icon, so the
 * labels line up whether an item is checked or not, and a disabled item cannot be toggled.
 */
export const CheckboxItems: Story = {
  render: () => <DisplayOptionsMenu />,
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const trigger = canvas.getByRole("button", { name: "Display" });
    const item = (name: string): HTMLElement => canvas.getByRole("menuitemcheckbox", { hidden: true, name });

    trigger.focus();
    await input.pressKey("Enter");
    await waitFor(() => expect(item("Compact rows")).toHaveFocus());
    await expect(labelStart(item("Compact rows"))).toBeCloseTo(labelStart(item("Show archived")), 0);

    await input.pressKey("Space");
    await expect(item("Compact rows")).toHaveAttribute("aria-checked", "true");
    await expect(item("Compact rows")).toBeVisible();

    await input.pressKey("ArrowDown");
    await input.pressKey("Enter");
    await waitFor(() => expect(item("Show archived")).not.toBeVisible());
    await expect(canvas.getByText("Showing archived: no")).toBeInTheDocument();
    await expect(trigger).toHaveFocus();
  },
};

/**
 * `MenuRadioGroup` holds a choice of one, named by its label, and each `MenuItemRadio` shows a dot when it is the one
 * checked. Space checks an item and leaves the menu open; Enter or a click checks it and closes the menu.
 */
export const RadioItems: Story = {
  render: () => <SortOrderMenu />,
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const trigger = canvas.getByRole("button", { name: "Sort" });
    const radio = (name: string): HTMLElement => canvas.getByRole("menuitemradio", { hidden: true, name });

    trigger.focus();
    await input.pressKey("Enter");
    await waitFor(() => expect(radio("Name")).toHaveFocus());
    await expect(radio("Name")).toHaveAttribute("aria-checked", "true");
    await expect(canvas.getByRole("group", { name: "Sort by" })).toContainElement(radio("Size"));

    await input.pressKey("ArrowDown");
    await input.pressKey("Space");
    await expect(radio("Date modified")).toHaveAttribute("aria-checked", "true");
    await expect(radio("Name")).toHaveAttribute("aria-checked", "false");
    await expect(radio("Date modified")).toBeVisible();

    await input.pressKey("ArrowDown");
    await input.pressKey("Enter");
    await waitFor(() => expect(radio("Size")).not.toBeVisible());
    await expect(canvas.getByText("Sorted by: size")).toBeInTheDocument();
  },
};

/**
 * A `Submenu` opens beside its item. Right Arrow, Enter or Space opens it on its first item, and its item keeps the
 * highlight while it is open. Left Arrow or Escape closes one level and returns focus to the item that opened it.
 * Choosing an item in any submenu closes every menu and returns focus to the button.
 */
export const Submenus: Story = {
  render: () => <FileMenu />,
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const trigger = canvas.getByRole("button", { name: "File" });
    const item = (name: string): HTMLElement => canvas.getByRole("menuitem", { hidden: true, name });

    trigger.focus();
    await input.pressKey("Enter");
    await waitFor(() => expect(item("Rename…")).toHaveFocus());
    await input.pressKey("ArrowDown");
    await input.pressKey("ArrowRight");

    await waitFor(() => expect(item("Inbox")).toHaveFocus());
    await expect(item("Move to")).toHaveAttribute("aria-expanded", "true");
    await expect(focusRingContrast(item("Inbox"))).toBeGreaterThanOrEqual(3);
    await waitFor(() => expect(canvas.getByRole("menu", { name: "Move to" })).toBeVisible());

    await input.pressKey("Escape");
    await waitFor(() => expect(item("Move to")).toHaveFocus());
    await waitFor(() => expect(item("Inbox")).not.toBeVisible());
    await expect(item("Rename…")).toBeVisible();

    await input.pressKey("Enter");
    await waitFor(() => expect(item("Inbox")).toHaveFocus());
    await input.pressKey("ArrowLeft");
    await waitFor(() => expect(item("Move to")).toHaveFocus());

    await input.pressKey("ArrowRight");
    await waitFor(() => expect(item("Inbox")).toHaveFocus());
    await input.pressKey("End");
    await input.pressKey("ArrowRight");
    await waitFor(() => expect(item("2025")).toHaveFocus());
    await waitFor(() => expect(item("Inbox")).toBeVisible());

    await input.pressKey("Escape");
    await waitFor(() => expect(item("Archive")).toHaveFocus());
    await waitFor(() => expect(item("Inbox")).toBeVisible());

    await input.pressKey("ArrowRight");
    await waitFor(() => expect(item("2025")).toHaveFocus());
    await input.pressKey("Enter");

    await waitFor(() => expect(item("Rename…")).not.toBeVisible());
    await expect(item("2025")).not.toBeVisible();
    await expect(canvas.getByText("Last action: Moved to 2025")).toBeInTheDocument();
    await expect(trigger).toHaveFocus();
  },
};

/**
 * A submenu opens beside its item on the side the text runs towards, with its first item level with the item. Against
 * the window's edge it opens on the other side, and with no room on either side it opens below its item, over the
 * menu, so it fits a narrow window.
 */
export const SubmenuPlacement: Story = {
  render: () => (
    <Stack gap={4}>
      <PlacedMenu align="start" label="Room after" />
      <PlacedMenu align="end" label="Room before" />
      <PlacedMenu align="start" dir="rtl" label="Right to left" />
      <PlacedMenu align="start" label="No room" wide={true} />
    </Stack>
  ),
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const open = (
      label: string,
      openingKey: "ArrowLeft" | "ArrowRight" = "ArrowRight"
    ): Promise<{ item: HTMLElement; submenu: HTMLElement }> =>
      openMoveTo(input, canvas.getByRole("button", { name: label }), openingKey);

    const after = await open("Room after");
    const afterItem = after.item.getBoundingClientRect();
    const afterSubmenu = after.submenu.getBoundingClientRect();
    await expect(afterSubmenu.left).toBeGreaterThanOrEqual(afterItem.right);
    await expect(after.submenu.querySelector('[role="menuitem"]')?.getBoundingClientRect().top).toBeCloseTo(
      afterItem.top,
      0
    );
    await closeBoth(input, canvas.getByRole("button", { name: "Room after" }));

    const before = await open("Room before");
    await expect(before.submenu.getBoundingClientRect().right).toBeLessThanOrEqual(
      before.item.getBoundingClientRect().left
    );
    await closeBoth(input, canvas.getByRole("button", { name: "Room before" }));

    const rightToLeft = await open("Right to left", "ArrowLeft");
    await expect(rightToLeft.submenu.getBoundingClientRect().right).toBeLessThanOrEqual(
      rightToLeft.item.getBoundingClientRect().left
    );
    await closeBoth(input, canvas.getByRole("button", { name: "Right to left" }));

    const noRoom = await open("No room");
    const noRoomSubmenu = noRoom.submenu.getBoundingClientRect();
    await expect(noRoomSubmenu.top).toBeGreaterThanOrEqual(noRoom.item.getBoundingClientRect().bottom);
    await expect(noRoomSubmenu.right).toBeLessThanOrEqual(window.innerWidth);
  },
};

/**
 * The pointer and the keyboard share one active item: moving the pointer onto an item focuses it. Resting on a
 * submenu's item for 100ms opens the submenu, with focus left on the item. Moving diagonally into the submenu crosses
 * the items below without closing it, and a click outside closes every menu, leaving focus where the click put it.
 */
export const PointerInteraction: Story = {
  render: () => <FileMenu />,
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const item = (name: string): HTMLElement => canvas.getByRole("menuitem", { hidden: true, name });
    let deleteTookFocus = false;
    item("Delete…").addEventListener("focus", () => {
      deleteTookFocus = true;
    });

    await input.clickByTestId("file-trigger");
    const menu = await canvas.findByRole("menu", { name: "File" });
    await waitFor(() => expect(menu).toHaveFocus());

    await input.slidePointerByRole("menuitem", "Rename…", "Move to");
    await waitFor(() => expect(item("Move to")).toHaveAttribute("aria-expanded", "true"));
    await expect(item("Move to")).toHaveFocus();
    await waitFor(() => expect(item("Archive")).toBeVisible());

    await input.slidePointerByRole("menuitem", "Move to", "Archive");
    await waitFor(() => expect(item("Archive")).toHaveFocus());
    await expect(deleteTookFocus).toBe(false);
    await expect(item("Move to")).toHaveAttribute("aria-expanded", "true");

    await input.clickPageCorner();
    await waitFor(() => expect(menu).not.toBeVisible());
    await expect(canvas.getByRole("button", { name: "File" })).not.toHaveFocus();
  },
};

/**
 * An account menu from an avatar `IconButton`, named with `getMenuProps({ "aria-label": … })`. Its Appearance
 * submenu opens towards the start side, because the menu sits against the window's end edge, and Space picks a mode
 * without closing it.
 */
export const UserAccountMenu: Story = {
  render: () => <UserMenu />,
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const trigger = canvas.getByRole("button", { name: "Account" });

    trigger.focus();
    await input.pressKey("ArrowUp");
    const signOut = canvas.getByRole("menuitem", { hidden: true, name: "Sign out" });
    await waitFor(() => expect(signOut).toHaveFocus());
    await waitFor(() => expect(canvas.getByRole("menu", { name: "Account" })).toBeVisible());

    await input.pressKey("ArrowUp");
    await input.pressKey("ArrowRight");
    const dark = canvas.getByRole("menuitemradio", { hidden: true, name: "Dark" });
    await waitFor(() => expect(canvas.getByRole("menuitemradio", { name: "Light" })).toHaveFocus());
    await input.pressKey("ArrowDown");
    await input.pressKey("Space");
    await expect(dark).toHaveAttribute("aria-checked", "true");

    const appearance = canvas.getByRole("menu", { name: "Appearance" });
    const appearanceItem = canvas.getByRole("menuitem", { name: "Appearance" });
    await Promise.all(appearance.getAnimations().map((animation) => animation.finished));
    await expect(appearance.getBoundingClientRect().right).toBeLessThanOrEqual(
      appearanceItem.getBoundingClientRect().left
    );
  },
};
