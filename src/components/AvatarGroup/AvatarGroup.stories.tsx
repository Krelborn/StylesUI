import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { accessibleNameArgTypes } from "../../docs/argTypes";
import { withCustomProperties } from "../../layout";
import { Avatar } from "../Avatar";
import { Card } from "../Card";

import { AvatarGroup } from "./AvatarGroup";

const reviewers = ["Pat Lee", "Sam Okafor", "Ines Duarte", "Kai Moreau"];

function isShown(avatar: HTMLElement): boolean {
  const { height, left, top, width } = avatar.getBoundingClientRect();
  const hitElement = document.elementFromPoint(left + width / 2, top + height / 2);

  // Hidden avatars keep their own layout size and are only clipped, so only a hit test tells shown from hidden
  return hitElement !== null && avatar.contains(hitElement);
}

const meta = {
  title: "Data display/AvatarGroup",
  component: AvatarGroup,
  args: {
    "aria-label": "Reviewers",
    children: reviewers.map((name) => <Avatar key={name} name={name} size="sm" />),
  },
  argTypes: {
    ...accessibleNameArgTypes,
    children: {
      control: false,
      description: "The `Avatar`s",
      table: { type: { summary: "ReactNode" } },
    },
    max: {
      control: "number",
      description: "How many avatars show, at least 1; the rest are hidden behind a `+n` count",
      table: { type: { summary: "number" } },
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof AvatarGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Every avatar, overlapping by a quarter of its size, each ringed in the page colour
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const avatars = canvas.getAllByRole("img");
    const [first, second] = avatars.map((avatar) => avatar.getBoundingClientRect());

    await expect(canvas.getByRole("group", { name: "Reviewers" })).toBeInTheDocument();
    await expect(avatars).toHaveLength(4);
    await expect(avatars.filter(isShown)).toHaveLength(4);
    await expect(second.left).toBeCloseTo(first.right - first.width / 4, 1);
  },
};

/**
 * `max` shows the first avatars and a "+n" for the rest. Screen readers still read all four names.
 */
export const WithMax: Story = {
  args: {
    max: 3,
  },
  play: async ({ canvas }) => {
    const avatars = canvas.getAllByRole("img");
    const shownNames = avatars.filter(isShown).map((avatar) => avatar.getAttribute("aria-label"));

    await expect(avatars).toHaveLength(4);
    await expect(shownNames).toEqual(["Pat Lee", "Sam Okafor", "Ines Duarte"]);
    await expect(canvas.getByText("+1")).toBeVisible();
  },
};

/**
 * On a card, set `--sui-avatar-group-ring` on the card, or any ancestor, to the surface colour so the rings match what
 * is behind them
 */
export const OnSurface: Story = {
  render: (args) => (
    <Card
      padding="sm"
      style={withCustomProperties({ "--sui-avatar-group-ring": "var(--sui-color-surface)" }, undefined)}
    >
      <AvatarGroup {...args} />
    </Card>
  ),
  play: async ({ canvas }) => {
    const card = canvas.getByRole("group", { name: "Reviewers" }).parentElement;
    const avatar = canvas.getByRole("img", { name: "Pat Lee" });

    await expect(card).not.toBeNull();
    await expect(getComputedStyle(avatar).boxShadow).toContain(getComputedStyle(card as HTMLElement).backgroundColor);
  },
};
