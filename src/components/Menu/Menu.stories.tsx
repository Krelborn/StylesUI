import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { useState } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import { focusRingContrast, textContrast } from "../../test/colorContrast";
import { trustedInput } from "../../test/trustedInput";
import { Box } from "../Box";
import { Button } from "../Button";
import { Cluster } from "../Cluster";
import { AddIcon, DeleteIcon, MoreHorizontalIcon, RefreshIcon, SendIcon } from "../Icon";
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

const meta = {
  title: "Overlays/Menu",
  component: Menu,
  subcomponents: { MenuGroup, MenuItem, MenuItemCheckbox, MenuItemRadio, MenuRadioGroup, MenuSeparator },
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
