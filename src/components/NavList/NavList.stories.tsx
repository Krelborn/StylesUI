import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentPropsWithRef, JSX, MouseEvent } from "react";
import { useState } from "react";
import { expect, userEvent } from "storybook/test";

import { accessibleNameArgTypes, childrenArgType } from "../../docs/argTypes";
import { focusRingContrast, textContrast } from "../../test/colorContrast";
import { Box } from "../Box";
import { Counter } from "../Counter";
import { Text } from "../Text";

import { NavList } from "./NavList";
import { NavListGroup } from "./NavListGroup";
import { NavListItem } from "./NavListItem";

type View = "mine" | "needs-you" | "other";

interface RouterLinkProps extends Omit<ComponentPropsWithRef<"a">, "href"> {
  /**
   * Route to navigate to, in place of `href`
   */
  to: string;
}

/**
 * Stand-in for a hash router's link
 */
function RouterLink({ children, to, ...rest }: RouterLinkProps): JSX.Element {
  return (
    <Box {...rest} as="a" href={`#${to}`}>
      {children}
    </Box>
  );
}

/**
 * Two documentation links that report the one activated instead of navigating, so the story stays on its page
 */
function ActivatableLinks(): JSX.Element {
  const [activated, setActivated] = useState("none");

  function activate(event: MouseEvent<HTMLAnchorElement>): void {
    event.preventDefault();
    setActivated(event.currentTarget.textContent ?? "");
  }

  return (
    <Box style={{ inlineSize: "14rem", overflow: "auto" }}>
      <NavList aria-label="Documentation">
        <NavListItem href="#getting-started" onClick={activate} aria-current="page">
          Getting started
        </NavListItem>
        <NavListItem href="#theming" onClick={activate} aria-current="false">
          Theming
        </NavListItem>
      </NavList>
      <Text as="p">{`Activated: ${activated}`}</Text>
    </Box>
  );
}

/**
 * The app's sidebar: buttons that switch the list shown beside it
 */
function ViewSwitcher(): JSX.Element {
  const [view, setView] = useState<View>("needs-you");

  return (
    <Box style={{ display: "grid", gap: "1rem", gridTemplateColumns: "14rem 1fr" }}>
      <NavList aria-label="Lists">
        <NavListGroup headingLevel={2} title="For review">
          <NavListItem
            as="button"
            onClick={() => setView("needs-you")}
            trailing={<Counter count={3} tone="primary" variant="solid" />}
            aria-current={view === "needs-you"}
          >
            Needs you
          </NavListItem>
          <NavListItem as="button" onClick={() => setView("other")} aria-current={view === "other"}>
            Other open
          </NavListItem>
        </NavListGroup>
        <NavListGroup headingLevel={2} title="Yours">
          <NavListItem as="button" onClick={() => setView("mine")} aria-current={view === "mine"}>
            Mine
          </NavListItem>
        </NavListGroup>
      </NavList>
      <Text as="p">{`Showing: ${view}`}</Text>
    </Box>
  );
}

const meta = {
  title: "Navigation/NavList",
  component: NavList,
  subcomponents: { NavListGroup, NavListItem },
  args: {
    "aria-label": "Documentation",
  },
  argTypes: {
    ...accessibleNameArgTypes,
    children: childrenArgType,
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: (args) => (
    <Box style={{ inlineSize: "14rem" }}>
      <NavList {...args}>
        <NavListItem href="#getting-started" aria-current="page">
          Getting started
        </NavListItem>
        <NavListItem href="#theming">Theming</NavListItem>
        <NavListItem href="#forms">Forms</NavListItem>
      </NavList>
    </Box>
  ),
} satisfies Meta<typeof NavList>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Links in a named landmark. The current page is tinted, bold and marked with a primary bar.
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const current = canvas.getByRole("link", { name: "Getting started" });

    await expect(textContrast(current)).toBeGreaterThanOrEqual(4.5);
    await expect(Number(getComputedStyle(current).fontWeight)).toBeGreaterThanOrEqual(700);
    await expect(textContrast(canvas.getByRole("link", { name: "Theming" }))).toBeGreaterThanOrEqual(4.5);
  },
};

/**
 * Groups under muted headings, each naming its list, with counts after the labels. A long label wraps inside its item
 * and leaves the count in view.
 */
export const Grouped: Story = {
  render: () => (
    <Box style={{ inlineSize: "12rem" }}>
      <NavList aria-label="Lists">
        <NavListGroup headingLevel={2} title="For review">
          <NavListItem href="#needs-you" trailing={<Counter count={3} tone="primary" variant="solid" />}>
            Needs you
          </NavListItem>
          <NavListItem href="#other-open" trailing={<Counter count={12} />}>
            Other open pull requests in every repository
          </NavListItem>
        </NavListGroup>
        <NavListGroup headingLevel={2} title="Yours">
          <NavListItem href="#mine" trailing={<Counter count={1} />}>
            Mine
          </NavListItem>
        </NavListGroup>
      </NavList>
    </Box>
  ),
  play: async ({ canvas }) => {
    const nav = canvas.getByRole("navigation", { name: "Lists" }).getBoundingClientRect();
    const count = canvas.getByText("12").getBoundingClientRect();

    await expect(canvas.getByRole("list", { name: "For review" })).toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: "Needs you 3" })).toBeInTheDocument();
    await expect(textContrast(canvas.getByRole("heading", { name: "Yours" }))).toBeGreaterThanOrEqual(4.5);
    await expect(count.right).toBeLessThanOrEqual(nav.right);
  },
};

/**
 * `as="button"` switches views inside one window. `aria-current` marks the view shown.
 */
export const AsButtons: Story = {
  render: () => <ViewSwitcher />,
  play: async ({ canvas }) => {
    const mine = canvas.getByRole("button", { name: "Mine" });

    await userEvent.click(mine);
    await expect(mine).toHaveAttribute("aria-current", "true");
    await expect(canvas.getByText("Showing: mine")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Needs you 3" })).toHaveAttribute("aria-current", "false");
  },
};

/**
 * `as` takes a router's link component, which receives `className` and renders the anchor itself
 */
export const AsComponent: Story = {
  render: () => (
    <NavList aria-label="Settings">
      {/* oxlint-disable-next-line jsx-a11y/anchor-is-valid -- to is the destination, in place of href */}
      <NavListItem as={RouterLink} to="/settings/account" aria-current="page">
        Account
      </NavListItem>
      {/* oxlint-disable-next-line jsx-a11y/anchor-is-valid -- to is the destination, in place of href */}
      <NavListItem as={RouterLink} to="/settings/notifications">
        Notifications
      </NavListItem>
    </NavList>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Account" })).toHaveAttribute("href", "#/settings/account");
  },
};

/**
 * Tab moves through the items in order, each showing a focus ring that the list's padding keeps clear of the nav's
 * edges. Enter activates the focused item. An item with `aria-current="false"` is not marked current.
 */
export const KeyboardInteraction: Story = {
  render: () => <ActivatableLinks />,
  play: async ({ canvas }) => {
    const nav = canvas.getByRole("navigation", { name: "Documentation" }).getBoundingClientRect();
    const first = canvas.getByRole("link", { name: "Getting started" });
    const second = canvas.getByRole("link", { name: "Theming" });

    await userEvent.tab();
    await expect(first).toHaveFocus();
    await expect(first.matches(":focus-visible")).toBe(true);
    await expect(focusRingContrast(first)).toBeGreaterThanOrEqual(3);

    const firstStyle = getComputedStyle(first);
    const ringReach = parseFloat(firstStyle.outlineWidth) + parseFloat(firstStyle.outlineOffset);
    const firstBox = first.getBoundingClientRect();

    await expect(firstBox.left - ringReach).toBeGreaterThanOrEqual(nav.left);
    await expect(firstBox.top - ringReach).toBeGreaterThanOrEqual(nav.top);

    await userEvent.tab();
    await expect(second).toHaveFocus();
    await expect(getComputedStyle(second, "::before").transform).toBe("matrix(1, 0, 0, 0, 0, 0)");
    await expect(Number(getComputedStyle(second).fontWeight)).toBeLessThan(700);

    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("Activated: Theming")).toBeInTheDocument();
  },
};
