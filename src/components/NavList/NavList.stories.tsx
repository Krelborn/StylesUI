import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentPropsWithRef, JSX, MouseEvent } from "react";
import { useState } from "react";
import { expect, userEvent } from "storybook/test";

import { accessibleNameArgTypes, childrenArgType } from "../../docs/argTypes";
import { focusRingContrast, resolvedColor, textContrast } from "../../test/colorContrast";
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

/**
 * Measures how far a focus ring reaches beyond the focused element's box
 *
 * @param element the focused element
 * @returns the ring's width plus its offset, in pixels
 */
function ringReach(element: HTMLElement): number {
  const style = getComputedStyle(element);

  return parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
}

/**
 * Asserts that a focused item and its focus ring lie inside the scrolling element around it
 *
 * @param item the focused item
 * @param scroller the scrolling element that holds the item
 */
async function expectRingInside(item: HTMLElement, scroller: HTMLElement): Promise<void> {
  const itemBox = item.getBoundingClientRect();
  const scrollerBox = scroller.getBoundingClientRect();
  const reach = ringReach(item);

  await expect(itemBox.top - reach).toBeGreaterThanOrEqual(scrollerBox.top);
  await expect(itemBox.bottom + reach).toBeLessThanOrEqual(scrollerBox.bottom);
}

const sidebarPages = ["Overview", "Getting started", "Theming", "Forms", "Layout", "Navigation", "Overlays", "Testing"];

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
    const bar = getComputedStyle(current, "::before");

    await expect(textContrast(current)).toBeGreaterThanOrEqual(4.5);
    await expect(Number(getComputedStyle(current).fontWeight)).toBeGreaterThanOrEqual(700);
    await expect(bar.transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
    await expect(bar.backgroundColor).toBe(resolvedColor(current, "var(--sui-color-primary)"));
    await expect(textContrast(canvas.getByRole("link", { name: "Theming" }))).toBeGreaterThanOrEqual(4.5);
  },
};

/**
 * Groups under muted headings, each naming its list, with counts after the labels. A long label wraps inside its item,
 * even where it has no break to wrap at, and leaves the count in view. A count of zero shows nothing and takes no room.
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
            Other open in krelborn_stylesui_components_navlist_navlistitem
          </NavListItem>
        </NavListGroup>
        <NavListGroup headingLevel={2} title="Yours">
          <NavListItem href="#mine" trailing={<Counter count={1} />}>
            Mine
          </NavListItem>
          <NavListItem href="#archived" trailing={<Counter count={0} />}>
            Archived
          </NavListItem>
        </NavListGroup>
      </NavList>
    </Box>
  ),
  play: async ({ canvas }) => {
    const navBox = canvas.getByRole("navigation", { name: "Lists" }).getBoundingClientRect();
    const longLabel = canvas.getByText("Other open in krelborn_stylesui_components_navlist_navlistitem");
    const countBox = canvas.getByText("12").getBoundingClientRect();
    const archived = canvas.getByRole("link", { name: "Archived" });
    const archivedContentRight =
      archived.getBoundingClientRect().right - parseFloat(getComputedStyle(archived).paddingRight);

    await expect(canvas.getByRole("list", { name: "For review" })).toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: "Needs you 3" })).toBeInTheDocument();
    await expect(textContrast(canvas.getByRole("heading", { name: "Yours" }))).toBeGreaterThanOrEqual(4.5);
    await expect(longLabel.scrollWidth).toBeLessThanOrEqual(longLabel.clientWidth);
    await expect(countBox.right).toBeLessThanOrEqual(navBox.right);
    await expect(canvas.getByText("Archived").getBoundingClientRect().right).toBeCloseTo(archivedContentRight, 1);
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
    const navBox = canvas.getByRole("navigation", { name: "Documentation" }).getBoundingClientRect();
    const first = canvas.getByRole("link", { name: "Getting started" });
    const second = canvas.getByRole("link", { name: "Theming" });

    await userEvent.tab();
    await expect(first).toHaveFocus();
    await expect(first.matches(":focus-visible")).toBe(true);
    await expect(focusRingContrast(first)).toBeGreaterThanOrEqual(3);

    const firstBox = first.getBoundingClientRect();
    const firstReach = ringReach(first);

    await expect(firstBox.left - firstReach).toBeGreaterThanOrEqual(navBox.left);
    await expect(firstBox.top - firstReach).toBeGreaterThanOrEqual(navBox.top);

    await userEvent.tab();
    await expect(second).toHaveFocus();
    await expect(getComputedStyle(second, "::before").transform).toBe("matrix(1, 0, 0, 0, 0, 0)");
    await expect(Number(getComputedStyle(second).fontWeight)).toBeLessThan(700);
    await expect(textContrast(second, "var(--sui-color-secondary-subtle)")).toBeGreaterThanOrEqual(4.5);

    const secondBox = second.getBoundingClientRect();
    const secondReach = ringReach(second);

    await expect(secondBox.right + secondReach).toBeLessThanOrEqual(navBox.right);
    await expect(secondBox.bottom + secondReach).toBeLessThanOrEqual(navBox.bottom);

    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("Activated: Theming")).toBeInTheDocument();
  },
};

/**
 * A sidebar that scrolls keeps each focused item's ring inside it, as Tab moves down to items below the fold and
 * Shift+Tab moves back up to items scrolled above it.
 */
export const ScrollingSidebar: Story = {
  render: () => (
    <Box style={{ blockSize: "8rem", inlineSize: "14rem", overflow: "auto" }} data-testid="sidebar">
      <NavList aria-label="Documentation">
        {sidebarPages.map((page) => (
          <NavListItem href={`#${page}`} key={page}>
            {page}
          </NavListItem>
        ))}
      </NavList>
    </Box>
  ),
  play: async ({ canvas }) => {
    const sidebar = canvas.getByTestId("sidebar");
    const links = canvas.getAllByRole("link");

    await expect(sidebar.scrollHeight).toBeGreaterThan(sidebar.clientHeight);

    for (const link of links) {
      await userEvent.tab();
      await expect(link).toHaveFocus();
      await expect(link.matches(":focus-visible")).toBe(true);
      await expectRingInside(link, sidebar);
    }

    await expect(sidebar.scrollTop).toBeGreaterThan(0);

    for (const link of links.slice(0, -1).reverse()) {
      await userEvent.tab({ shift: true });
      await expect(link).toHaveFocus();
      await expectRingInside(link, sidebar);
    }

    await expect(sidebar.scrollTop).toBe(0);
  },
};
