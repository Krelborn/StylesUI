import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { useState } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import { focusRingContrast, textContrast } from "../../test/colorContrast";
import { trustedInput } from "../../test/trustedInput";
import { Box } from "../Box";
import { Button } from "../Button";
import { Cluster } from "../Cluster";
import { MoreHorizontalIcon } from "../Icon";
import { IconButton } from "../IconButton";
import { Stack } from "../Stack";
import { Text } from "../Text";

import { Menu } from "./Menu";
import { MenuItem } from "./MenuItem";
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
      </Menu>
      <Button variant="ghost">Share</Button>
    </Cluster>
  );
}

const meta = {
  title: "Overlays/Menu",
  component: Menu,
  subcomponents: { MenuItem },
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
 * at both ends, and Home and End go to the first and last. The focused item shows the inset focus ring over the
 * highlight. Escape closes the menu and returns focus to the button; Tab closes it and moves on past the button, and
 * Shift+Tab closes it and returns to the button. The rings keep 3:1 and the highlighted label keeps 4.5:1.
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
    await expect(item("Archive")).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect(item("Edit")).toHaveFocus();
    await userEvent.keyboard("{End}");
    await expect(item("Archive")).toHaveFocus();

    const input = trustedInput();

    if (input === null) {
      return;
    }

    await input.pressKey("Escape");
    await waitFor(() => expect(item("Archive")).not.toBeVisible());
    await expect(trigger).toHaveFocus();
    await expect(focusRingContrast(trigger)).toBeGreaterThanOrEqual(3);

    await input.pressKey("ArrowUp");
    await waitFor(() => expect(item("Archive")).toHaveFocus());

    await input.pressKey("Tab");
    await waitFor(() => expect(item("Archive")).not.toBeVisible());
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
