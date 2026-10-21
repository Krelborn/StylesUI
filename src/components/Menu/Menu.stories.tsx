import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { useState } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import { focusRingContrast, textContrast } from "../../test/colorContrast";
import { trustedInput } from "../../test/trustedInput";
import { Box } from "../Box";
import { Button } from "../Button";
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
 * Enter opens the menu with focus on its first item, which shows the inset focus ring over the highlight. Escape
 * closes it and returns focus to the button. The rings keep 3:1 and the highlighted label keeps 4.5:1.
 */
export const KeyboardInteraction: Story = {
  play: async ({ canvas }) => {
    // After a trusted click in an earlier story, focus from userEvent.tab() only matches :focus-visible once a trusted
    // key has been pressed
    await trustedInput()?.pressKey("Shift");
    const trigger = canvas.getByRole("button", { name: "Actions" });

    await userEvent.tab();
    await expect(trigger).toHaveFocus();

    await userEvent.keyboard("{Enter}");

    const edit = await canvas.findByRole("menuitem", { name: "Edit" });
    await waitFor(() => expect(edit).toHaveFocus());
    await expect(edit.matches(":focus-visible")).toBe(true);
    await expect(focusRingContrast(edit)).toBeGreaterThanOrEqual(3);
    await expect(textContrast(edit)).toBeGreaterThanOrEqual(4.5);

    const input = trustedInput();

    if (input === null) {
      return;
    }

    await input.pressKey("Escape");

    await waitFor(() => expect(edit).not.toBeVisible());
    await expect(trigger).toHaveFocus();
    await expect(focusRingContrast(trigger)).toBeGreaterThanOrEqual(3);
  },
};
