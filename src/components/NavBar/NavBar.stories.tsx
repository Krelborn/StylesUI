import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties, JSX, MouseEvent } from "react";
import { expect, userEvent, waitFor } from "storybook/test";

import { focusRingContrast, isSameColor, textContrast } from "../../test/colorContrast";
import { trustedInput } from "../../test/trustedInput";
import { Box } from "../Box";
import { Button } from "../Button";
import { Link } from "../Link";
import { Text } from "../Text";

import type { NavBarCollapse } from "./NavBar";
import { NavBar } from "./NavBar";
import { NavBarItem } from "./NavBarItem";
import { NavBarMenu } from "./NavBarMenu";
import { NavBarMenuGroup } from "./NavBarMenuGroup";
import { NavBarMenuItem } from "./NavBarMenuItem";

interface BlogHeaderProps {
  /**
   * The bar's collapse width
   */
  collapse?: NavBarCollapse;

  /**
   * The current page's address
   */
  currentPage?: string;

  /**
   * Styles for the `header`, such as its width, which decides whether the bar collapses
   */
  style?: CSSProperties;
}

/**
 * The blog header from the design mockups, followed by a paragraph that an open navigation pushes down
 */
function BlogHeader({ collapse, currentPage = "#articles", style }: BlogHeaderProps): JSX.Element {
  const current = (href: string): "page" | undefined => (href === currentPage ? "page" : undefined);

  return (
    <Box>
      <Box as="header" style={style}>
        <NavBar
          aria-label="Main"
          collapse={collapse}
          end={
            <Button size="sm" variant="secondary">
              Subscribe
            </Button>
          }
          start={
            <Link href="#home" underline="hover">
              The Long Read
            </Link>
          }
        >
          <NavBarItem href="#articles" aria-current={current("#articles")} data-testid="articles">
            Articles
          </NavBarItem>
          <NavBarMenu columns={2} label="Topics">
            <NavBarMenuItem
              description="Typography, colour, systems"
              href="#design"
              onClick={stayOnPage}
              aria-current={current("#design")}
              data-testid="design"
            >
              Design
            </NavBarMenuItem>
            <NavBarMenuItem description="Front-end, performance, tooling" href="#engineering" onClick={stayOnPage}>
              Engineering
            </NavBarMenuItem>
            <NavBarMenuItem description="Teams, hiring, process" href="#management">
              Management
            </NavBarMenuItem>
            <NavBarMenuItem description="Interviews and long reads" href="#culture">
              Culture
            </NavBarMenuItem>
          </NavBarMenu>
          <NavBarMenu label="Series">
            <NavBarMenuItem href="#first-principles">First principles</NavBarMenuItem>
            <NavBarMenuItem href="#field-notes">Field notes</NavBarMenuItem>
          </NavBarMenu>
          <NavBarItem href="#about" aria-current={current("#about")}>
            About
          </NavBarItem>
        </NavBar>
      </Box>
      <Text as="p" data-testid="after">
        The latest essays, every Thursday.
      </Text>
    </Box>
  );
}

/**
 * A docs site's header whose section lays its links out in headed columns
 */
function DocsHeader(): JSX.Element {
  return (
    <Box style={{ minBlockSize: "20rem" }}>
      <NavBar aria-label="Docs" collapse="never">
        <NavBarItem href="#guides">Guides</NavBarItem>
        <NavBarMenu columns={2} label="Reference">
          <NavBarMenuGroup headingLevel={2} title="Components">
            <NavBarMenuItem href="#button">Button</NavBarMenuItem>
            <NavBarMenuItem href="#menu">Menu</NavBarMenuItem>
          </NavBarMenuGroup>
          <NavBarMenuGroup headingLevel={2} title="Tokens">
            <NavBarMenuItem href="#colour">Colour</NavBarMenuItem>
            <NavBarMenuItem href="#space">Space</NavBarMenuItem>
          </NavBarMenuGroup>
        </NavBarMenu>
      </NavBar>
    </Box>
  );
}

/**
 * A wide bar whose last section sits at the end of the window, where its panel has no room to open start-aligned
 */
function EdgeHeader(): JSX.Element {
  return (
    <Box style={{ minBlockSize: "12rem" }}>
      <NavBar aria-label="Main" collapse="never">
        <NavBarItem href="#articles">Articles</NavBarItem>
        <NavBarMenu label="More" style={{ marginInlineStart: "auto" }}>
          <NavBarMenuItem description="What the site is and who writes it" href="#about">
            About the site
          </NavBarMenuItem>
          <NavBarMenuItem description="Get in touch with the editors" href="#contact">
            Contact
          </NavBarMenuItem>
        </NavBarMenu>
      </NavBar>
    </Box>
  );
}

/**
 * A wide bar whose section sits partway along it, with room for its panel only before its end edge
 */
function MidBarHeader(): JSX.Element {
  return (
    <Box style={{ minBlockSize: "12rem" }}>
      <NavBar aria-label="Site" collapse="never" start={<Box style={{ inlineSize: "calc(100vw - 12rem)" }} />}>
        <NavBarMenu label="Sections">
          <NavBarMenuItem description="Typography, colour, layout and systems" href="#design">
            Design
          </NavBarMenuItem>
          <NavBarMenuItem description="Front-end, performance, accessibility and tooling" href="#engineering">
            Engineering
          </NavBarMenuItem>
        </NavBarMenu>
      </NavBar>
    </Box>
  );
}

/**
 * A sticky header above a long page, whose open panel hangs over the page below it
 */
function StickyHeader(): JSX.Element {
  return (
    <Box style={{ blockSize: "16rem", overflowY: "auto" }} tabIndex={0} aria-label="Page">
      <Box
        as="header"
        style={{
          backgroundColor: "var(--sui-color-surface, #fff)",
          insetBlockStart: 0,
          position: "sticky",
          zIndex: 1,
        }}
        data-testid="header"
      >
        <NavBar aria-label="Main" collapse="never">
          <NavBarMenu label="Topics">
            <NavBarMenuItem description="Typography, colour, systems" href="#design">
              Design
            </NavBarMenuItem>
            <NavBarMenuItem description="Front-end, performance, tooling" href="#engineering">
              Engineering
            </NavBarMenuItem>
          </NavBarMenu>
        </NavBar>
      </Box>
      <Text as="p" style={{ minBlockSize: "40rem" }}>
        The latest essays, every Thursday.
      </Text>
    </Box>
  );
}

/**
 * Keeps a story on its page when one of its links is clicked, as a router's link does
 *
 * @param event the click
 */
function stayOnPage(event: MouseEvent): void {
  event.preventDefault();
}

const wide: CSSProperties = { inlineSize: "60rem", minBlockSize: "14rem" };

const narrow: CSSProperties = { inlineSize: "20rem" };

const meta = {
  title: "Navigation/NavBar",
  component: NavBar,
  subcomponents: { NavBarItem, NavBarMenu, NavBarMenuGroup, NavBarMenuItem },
  args: {
    "aria-label": "Main",
    children: null,
  },
  argTypes: {
    children: { control: false },
    end: { control: false },
    start: { control: false },
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: () => <BlogHeader style={wide} />,
} satisfies Meta<typeof NavBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A section's button opens its panel of links below it. The links keep their link role, and choosing one closes the
 * panel.
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const topics = canvas.getByRole("button", { name: "Topics" });
    const design = canvas.getByRole("link", { hidden: true, name: "Design" });

    await expect(canvas.queryByRole("menu")).toBeNull();
    await expect(design).not.toBeVisible();

    await userEvent.click(topics);

    await expect(topics).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(design).toBeVisible());
    await expect(design).toHaveAccessibleDescription("Typography, colour, systems");

    await userEvent.click(design);

    await expect(topics).toHaveAttribute("aria-expanded", "false");
    await expect(design).not.toBeVisible();
  },
};

/**
 * Tab walks the entries and an open panel's links. Enter and Space open and close a section, Escape closes it and
 * returns focus to its button, and Tab out of the panel closes it. Every ring keeps 3:1.
 */
export const KeyboardInteraction: Story = {
  play: async ({ canvas }) => {
    await trustedInput()?.pressKey("Shift");
    const articles = canvas.getByRole("link", { name: "Articles" });
    const topics = canvas.getByRole("button", { name: "Topics" });
    const design = canvas.getByRole("link", { hidden: true, name: "Design" });

    await userEvent.tab();
    await userEvent.tab();
    await expect(articles).toHaveFocus();
    await expect(focusRingContrast(articles)).toBeGreaterThanOrEqual(3);
    await userEvent.tab();
    await expect(topics).toHaveFocus();
    await expect(focusRingContrast(topics)).toBeGreaterThanOrEqual(3);

    await userEvent.keyboard("{Enter}");
    await expect(topics).toHaveAttribute("aria-expanded", "true");
    await userEvent.tab();
    await expect(design).toHaveFocus();
    await expect(focusRingContrast(design)).toBeGreaterThanOrEqual(3);

    const input = trustedInput();

    if (input === null) {
      return;
    }

    await input.pressKey("Escape");
    await expect(topics).toHaveFocus();
    await expect(topics).toHaveAttribute("aria-expanded", "false");
    await expect(design).not.toBeVisible();

    await input.pressKey(" ");
    await expect(topics).toHaveAttribute("aria-expanded", "true");
    await input.pressKey(" ");
    await expect(topics).toHaveAttribute("aria-expanded", "false");
    await input.pressKey("Enter");

    for (let i = 0; i < 4; i++) {
      await input.pressKey("Tab");
    }

    await expect(canvas.getByRole("link", { name: "Culture" })).toHaveFocus();
    await input.pressKey("Tab");
    await expect(canvas.getByRole("button", { name: "Series" })).toHaveFocus();
    await expect(topics).toHaveAttribute("aria-expanded", "false");
  },
};

/**
 * Below its collapse width, the navigation hides behind a "Menu" toggle. Opening it shows the entries in a column
 * below the bar's first row. Sections expand in place, Escape closes the innermost open section and then the
 * navigation, returning focus to the button that opened it, and Tab leaving a section leaves it open.
 */
export const CollapsedKeyboardInteraction: Story = {
  render: () => <BlogHeader style={narrow} />,
  play: async ({ canvas }) => {
    await trustedInput()?.pressKey("Shift");
    const toggle = canvas.getByRole("button", { name: "Menu" });
    const topics = canvas.getByRole("button", { hidden: true, name: "Topics" });

    await expect(canvas.queryByRole("navigation")).toBeNull();

    await userEvent.tab();
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    await expect(focusRingContrast(toggle)).toBeGreaterThanOrEqual(3);

    await userEvent.keyboard("{Enter}");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByRole("navigation", { name: "Main" })).toBeVisible();

    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Articles" })).toHaveFocus();
    await userEvent.tab();
    await expect(topics).toHaveFocus();
    await expect(focusRingContrast(topics)).toBeGreaterThanOrEqual(3);
    await userEvent.keyboard("{Enter}");
    await userEvent.tab();

    const design = canvas.getByRole("link", { name: "Design" });
    await expect(design).toHaveFocus();
    await expect(focusRingContrast(design)).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < 4; i++) {
      await userEvent.tab();
    }

    await expect(canvas.getByRole("button", { name: "Series" })).toHaveFocus();
    await expect(topics).toHaveAttribute("aria-expanded", "true");

    design.focus();

    const input = trustedInput();

    if (input === null) {
      return;
    }

    await input.pressKey("Escape");
    await expect(topics).toHaveFocus();
    await expect(topics).toHaveAttribute("aria-expanded", "false");

    await input.pressKey("Escape");
    await expect(toggle).toHaveFocus();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByRole("navigation")).toBeNull();
  },
};

/**
 * A panel opens below its button with their start edges aligned, and flips to end-aligned where the window has no
 * room for it, keeping its width rather than narrowing to the room after its button
 */
export const PanelPlacement: Story = {
  render: () => (
    <>
      <BlogHeader style={wide} />
      <EdgeHeader />
      <MidBarHeader />
    </>
  ),
  play: async ({ canvas }) => {
    const topics = canvas.getByRole("button", { name: "Topics" });

    await userEvent.click(topics);

    const panel = panelOf(topics);
    await waitForTransitions(panel);
    await expect(Math.abs(panel.getBoundingClientRect().left - topics.getBoundingClientRect().left)).toBeLessThan(1);
    await expect(panel.getBoundingClientRect().top).toBeGreaterThanOrEqual(topics.getBoundingClientRect().bottom);

    const more = canvas.getByRole("button", { name: "More" });

    await userEvent.click(more);

    const edgePanel = panelOf(more);
    await waitForTransitions(edgePanel);
    await expect(Math.abs(edgePanel.getBoundingClientRect().right - more.getBoundingClientRect().right)).toBeLessThan(
      1
    );

    const sections = canvas.getByRole("button", { name: "Sections" });

    await userEvent.click(sections);

    const midPanel = panelOf(sections);
    await waitForTransitions(midPanel);
    await expect(
      Math.abs(midPanel.getBoundingClientRect().right - sections.getBoundingClientRect().right)
    ).toBeLessThan(1);
  },
};

/**
 * In right-to-left text a panel's start edge is its right edge, so it lines up with its button's right edge
 */
export const RightToLeft: Story = {
  render: () => (
    <Box dir="rtl">
      <BlogHeader style={wide} />
    </Box>
  ),
  play: async ({ canvas }) => {
    const topics = canvas.getByRole("button", { name: "Topics" });

    await userEvent.click(topics);

    const panel = panelOf(topics);
    await waitForTransitions(panel);
    await expect(Math.abs(panel.getBoundingClientRect().right - topics.getBoundingClientRect().right)).toBeLessThan(1);
  },
};

/**
 * `NavBarMenuGroup` gathers links under a heading that names their list, and `columns` lays the groups out side by
 * side
 */
export const GroupsInColumns: Story = {
  render: () => <DocsHeader />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Reference" }));

    const components = canvas.getByRole("list", { name: "Components" });
    const tokens = canvas.getByRole("list", { name: "Tokens" });

    await waitFor(() => expect(canvas.getByRole("heading", { level: 2, name: "Components" })).toBeVisible());
    await expect(tokens.getBoundingClientRect().left).toBeGreaterThan(components.getBoundingClientRect().right);
    await expect(tokens.getBoundingClientRect().top).toBe(components.getBoundingClientRect().top);
  },
};

/**
 * Opened on a collapsed bar, the navigation pushes the content after the header down, and choosing a link closes it
 */
export const CollapsedPushesPageDown: Story = {
  render: () => <BlogHeader style={narrow} />,
  play: async ({ canvas }) => {
    const after = canvas.getByTestId("after");
    const top = after.getBoundingClientRect().top;

    await userEvent.click(canvas.getByRole("button", { name: "Menu" }));
    await expect(after.getBoundingClientRect().top).toBeGreaterThan(top + 100);

    await userEvent.click(canvas.getByRole("button", { name: "Topics" }));
    await userEvent.click(canvas.getByRole("link", { name: "Engineering" }));

    await expect(canvas.queryByRole("navigation")).toBeNull();
    await expect(after.getBoundingClientRect().top).toBe(top);
  },
};

/**
 * A panel in a sticky header hangs over the page below the header, uncovered
 */
export const InStickyHeader: Story = {
  render: () => <StickyHeader />,
  play: async ({ canvas }) => {
    const topics = canvas.getByRole("button", { name: "Topics" });

    await userEvent.click(topics);

    const engineering = canvas.getByRole("link", { name: "Engineering" });
    await waitForTransitions(panelOf(topics));
    const box = engineering.getBoundingClientRect();

    await expect(box.top).toBeGreaterThan(canvas.getByTestId("header").getBoundingClientRect().bottom);
    await expect(engineering.contains(document.elementFromPoint(box.left + 4, box.top + box.height / 2))).toBe(true);
  },
};

/**
 * In a flex row beside the site's name, the bar takes the room left over
 */
export const InFlexRow: Story = {
  render: () => (
    <Box as="header" style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
      <Text weight="bold">The Long Read</Text>
      <NavBar aria-label="Main" collapse="never" data-testid="bar">
        <NavBarItem href="#articles">Articles</NavBarItem>
        <NavBarItem href="#about">About</NavBarItem>
      </NavBar>
    </Box>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("bar").getBoundingClientRect().width).toBeGreaterThan(100);
    await expect(canvas.getByRole("link", { name: "About" })).toBeVisible();
  },
};

/**
 * Switching between the wide and collapsed layouts closes every section and the navigation
 */
export const SwitchingLayout: Story = {
  play: async ({ canvas }) => {
    const header = canvas.getByRole("banner");
    const topics = canvas.getByRole("button", { name: "Topics" });

    await userEvent.click(topics);
    await expect(topics).toHaveAttribute("aria-expanded", "true");

    header.style.inlineSize = narrow.inlineSize as string;

    await waitFor(() => expect(topics).toHaveAttribute("aria-expanded", "false"));
    const toggle = canvas.getByRole("button", { name: "Menu" });

    await userEvent.click(toggle);
    await userEvent.click(topics);

    header.style.inlineSize = wide.inlineSize as string;

    await waitFor(() => expect(topics).toHaveAttribute("aria-expanded", "false"));
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  },
};

/**
 * The current page is underlined on a wide bar, as is the section holding it
 */
export const CurrentPage: Story = {
  render: () => <BlogHeader currentPage="#design" style={wide} />,
  play: async ({ canvas }) => {
    const topics = canvas.getByRole("button", { name: "Topics" });

    await expect(getComputedStyle(topics, "::after").display).toBe("block");
    await expect(getComputedStyle(canvas.getByRole("link", { name: "Articles" }), "::after").display).toBe("none");

    await userEvent.click(topics);

    const title = canvas.getByRole("link", { name: "Design" }).firstElementChild as HTMLElement;
    await expect(getComputedStyle(title).textDecorationLine).toBe("underline");
  },
};

/**
 * On a collapsed bar the current page takes NavList's current look: primary text on the primary tint, bold, with a bar
 * at its start, in a section's links too
 */
export const CollapsedCurrentPage: Story = {
  render: () => (
    <>
      <BlogHeader style={narrow} />
      <BlogHeader currentPage="#design" style={narrow} />
    </>
  ),
  play: async ({ canvas }) => {
    const [first, second] = canvas.getAllByRole("button", { name: "Menu" });

    await userEvent.click(first);

    const articles = canvas.getByRole("link", { name: "Articles" });
    const style = getComputedStyle(articles);

    await expect(isSameColor(articles, style.backgroundColor, "var(--sui-color-primary-subtle)")).toBe(true);
    await expect(Number(style.fontWeight)).toBeGreaterThanOrEqual(700);
    await expect(getComputedStyle(articles, "::before").display).toBe("block");
    await expect(getComputedStyle(articles, "::after").display).toBe("none");
    await expect(textContrast(articles)).toBeGreaterThanOrEqual(4.5);
    await expect(articles.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);

    await userEvent.click(second);
    await userEvent.click(canvas.getAllByRole("button", { name: "Topics" })[1]);

    const design = canvas.getByRole("link", { name: "Design" });
    const bar = getComputedStyle(design, "::before");

    await expect(bar.display).toBe("block");
    await expect(parseFloat(bar.height)).toBeLessThan(design.getBoundingClientRect().height);
  },
};

/**
 * Text and descriptions keep 4.5:1 on the hover tint
 */
export const HoverContrast: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Topics" }));

    const design = canvas.getByRole("link", { name: "Design" });
    const parts = [canvas.getByRole("link", { name: "Articles" }), ...Array.from(design.children)] as HTMLElement[];

    for (const part of parts) {
      await expect(
        textContrast(part, "var(--sui-color-secondary-subtle)"),
        part.textContent ?? ""
      ).toBeGreaterThanOrEqual(4.5);
    }
  },
};

/**
 * Under forced colours, as Windows High Contrast applies them, the current page's underline is `Highlight`
 */
export const ForcedColors: Story = {
  render: () => <BlogHeader currentPage="#design" style={wide} />,
  play: async ({ canvas }) => {
    const input = trustedInput();

    if (input === null) {
      return;
    }

    const topics = canvas.getByRole("button", { name: "Topics" });

    await input.emulateForcedColors(true);

    try {
      await expect(isSameColor(topics, getComputedStyle(topics, "::after").backgroundColor, "Highlight")).toBe(true);
    } finally {
      await input.emulateForcedColors(false);
    }
  },
};

/**
 * Finds the panel a section's button opens
 *
 * @param button the section's button
 * @returns the panel
 */
function panelOf(button: HTMLElement): HTMLElement {
  return button.ownerDocument.getElementById(button.getAttribute("aria-controls") ?? "") as HTMLElement;
}

/**
 * Waits for an element's transitions to finish, so its box is where it comes to rest
 *
 * @param element the element
 */
async function waitForTransitions(element: HTMLElement): Promise<void> {
  await Promise.all(element.getAnimations().map((animation) => animation.finished));
}
