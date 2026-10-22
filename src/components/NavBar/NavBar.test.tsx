import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentPropsWithRef, JSX, MouseEvent, ReactNode } from "react";
import { isValidElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MissingContextError } from "../../errors";
import { Box } from "../Box";

import { isNavBarCollapsed } from "./isNavBarCollapsed";
import type { NavBarCollapse } from "./NavBar";
import { NavBar } from "./NavBar";
import { NavBarItem } from "./NavBarItem";
import { NavBarMenu } from "./NavBarMenu";
import { NavBarMenuGroup } from "./NavBarMenuGroup";
import { NavBarMenuItem } from "./NavBarMenuItem";

// jsdom applies no container queries, so each test says which layout the bar shows
vi.mock("./isNavBarCollapsed", () => ({ isNavBarCollapsed: vi.fn(() => false) }));

interface RouterLinkProps extends Omit<ComponentPropsWithRef<"a">, "href"> {
  /**
   * Route to navigate to, in place of `href`
   */
  to: string;
}

/**
 * Stand-in for a router's link, which navigates by itself and so prevents the browser's navigation
 */
function RouterLink({ children, onClick, to, ...rest }: RouterLinkProps): JSX.Element {
  function handleClick(event: MouseEvent<HTMLAnchorElement>): void {
    onClick?.(event);
    event.preventDefault();
  }

  return (
    <Box {...rest} as="a" href={`#${to}`} onClick={handleClick}>
      {children}
    </Box>
  );
}

/**
 * Keeps a test on its page when a link is clicked
 *
 * @param event the click
 */
function stayOnPage(event: MouseEvent): void {
  event.preventDefault();
}

/**
 * Waits for the next task, where a section decides whether focus lost to the page has left it
 */
async function waitATask(): Promise<void> {
  await act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
}

describe("NavBar", () => {
  beforeEach(() => {
    vi.mocked(isNavBarCollapsed).mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("must render a navigation landmark named by aria-label holding a list of links when it renders", () => {
    render(
      <NavBar aria-label="Main">
        <NavBarItem href="/articles">Articles</NavBarItem>
      </NavBar>
    );

    const navigation = screen.getByRole("navigation", { name: "Main" });

    expect(navigation.firstElementChild).toBe(screen.getByRole("list"));
    expect(screen.getByRole("link", { name: "Articles" })).toHaveAttribute("href", "/articles");
  });

  it("must give its own props to the bar and its name to the navigation when it renders", () => {
    render(
      <NavBar aria-labelledby="site-name" className="custom" data-testid="bar" start={<span id="site-name">Site</span>}>
        <NavBarItem href="/articles">Articles</NavBarItem>
      </NavBar>
    );

    expect(screen.getByTestId("bar")).toHaveClass("custom");
    expect(screen.getByTestId("bar")).not.toHaveAttribute("aria-labelledby");
    expect(screen.getByRole("navigation", { name: "Site" })).toBeInTheDocument();
  });

  it("must render start and end around the navigation when they are given", () => {
    render(
      <NavBar aria-label="Main" end={<button type="button">Search</button>} start={<a href="/">Home</a>}>
        <NavBarItem href="/articles">Articles</NavBarItem>
      </NavBar>
    );

    const order = screen.getAllByRole("link").concat(screen.getAllByRole("button", { name: "Search" }));

    expect(order.map((element) => element.textContent)).toEqual(["Home", "Articles", "Search"]);
  });

  it.each(["menu", "menubar", "menuitem", "menuitemcheckbox", "menuitemradio"] as const)(
    "must render no %s role when it has sections and links",
    async (role) => {
      const user = userEvent.setup();
      render(<BlogNavBar />);

      await user.click(elements.topics);

      expect(screen.queryAllByRole(role, { hidden: true })).toHaveLength(0);
    }
  );

  it("must point the toggle at the navigation with aria-controls when it renders", () => {
    render(<BlogNavBar />);

    expect(elements.toggle).toHaveAttribute("aria-controls", screen.getByRole("navigation").id);
    expect(elements.toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("must label the toggle with menuLabel when it is given", () => {
    render(
      <NavBar aria-label="Main" menuLabel="Navigation">
        <NavBarItem href="/articles">Articles</NavBarItem>
      </NavBar>
    );

    expect(screen.getByRole("button", { name: "Navigation" })).toBeInTheDocument();
  });

  it("must render a section's button pointing at its hidden panel when it is closed", () => {
    render(<BlogNavBar />);

    const panel = document.getElementById(elements.topics.getAttribute("aria-controls") ?? "");

    expect(elements.topics).toHaveAttribute("aria-expanded", "false");
    expect(panel).not.toBeVisible();
    expect(panel?.firstElementChild).toHaveAttribute("role", "list");
  });

  it("must open a section's panel when its button is clicked", async () => {
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.topics);

    expect(elements.topics).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Design" })).toBeVisible();
  });

  it("must close a section's panel when its button is clicked again", async () => {
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.topics);
    await user.click(elements.topics);

    expect(elements.topics).toHaveAttribute("aria-expanded", "false");
  });

  it.each(["{Enter}", " "])("must toggle a section when %s is pressed on its button", async (key) => {
    const user = userEvent.setup();
    render(<BlogNavBar />);

    elements.topics.focus();
    await user.keyboard(key);

    expect(elements.topics).toHaveAttribute("aria-expanded", "true");
  });

  it("must close the open section when another opens on a wide bar", async () => {
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.topics);
    await user.click(elements.series);

    expect(elements.topics).toHaveAttribute("aria-expanded", "false");
    expect(elements.series).toHaveAttribute("aria-expanded", "true");
  });

  it("must close the open section when assistive technology clicks another without a press or focus moving", async () => {
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.topics);
    fireEvent.click(elements.series);

    expect(elements.topics).toHaveAttribute("aria-expanded", "false");
    expect(elements.series).toHaveAttribute("aria-expanded", "true");
  });

  it("must close a section and focus its button when Escape is pressed in its panel", async () => {
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.topics);
    screen.getByRole("link", { name: "Design" }).focus();
    await user.keyboard("{Escape}");

    expect(elements.topics).toHaveAttribute("aria-expanded", "false");
    expect(elements.topics).toHaveFocus();
  });

  it("must prevent Escape's default when it closes a section", async () => {
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.topics);

    expect(fireEvent.keyDown(elements.topics, { key: "Escape" })).toBe(false);
  });

  it("must leave Escape alone when no section is open", () => {
    render(<BlogNavBar />);

    expect(fireEvent.keyDown(elements.topics, { key: "Escape" })).toBe(true);
  });

  it("must close a section when a click lands outside it on a wide bar", async () => {
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.topics);
    await user.click(screen.getByText("After"));

    expect(elements.topics).toHaveAttribute("aria-expanded", "false");
  });

  it("must keep a section open when a click lands in its panel on a wide bar", async () => {
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.topics);
    await user.click(document.getElementById(elements.topics.getAttribute("aria-controls") ?? "") as HTMLElement);

    expect(elements.topics).toHaveAttribute("aria-expanded", "true");
  });

  it("must close a section and leave focus where it went when focus leaves it on a wide bar", async () => {
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.topics);
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();

    expect(elements.series).toHaveFocus();
    expect(elements.topics).toHaveAttribute("aria-expanded", "false");
  });

  it("must close a section when a key moves focus from it to a focusable element around the bar", async () => {
    const user = userEvent.setup();
    render(
      <Box tabIndex={0} aria-label="Page">
        <NavBar aria-label="Main">
          <NavBarMenu label="Topics">
            <NavBarMenuItem href="/design">Design</NavBarMenuItem>
          </NavBarMenu>
        </NavBar>
      </Box>
    );

    await user.click(elements.topics);
    // jsdom shows the toggle, which Shift+Tab would reach first, so focus moves straight to the wrapper after a key
    await user.keyboard("{Shift}");
    act(() => screen.getByLabelText("Page").focus());

    expect(screen.getByLabelText("Page")).toHaveFocus();
    expect(elements.topics).toHaveAttribute("aria-expanded", "false");
  });

  it("must keep a section open when focus moves from its button into its panel", async () => {
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.topics);
    await user.tab();

    expect(screen.getByRole("link", { name: "Design" })).toHaveFocus();
    expect(elements.topics).toHaveAttribute("aria-expanded", "true");
  });

  it("must keep a section open when a press on its panel focuses a focusable element around the bar", async () => {
    const user = userEvent.setup();
    render(
      <Box tabIndex={-1}>
        <NavBar aria-label="Docs">
          <NavBarMenu label="Reference">
            <NavBarMenuGroup headingLevel={2} title="Components">
              <NavBarMenuItem href="/button">Button</NavBarMenuItem>
            </NavBarMenuGroup>
          </NavBarMenu>
        </NavBar>
      </Box>
    );

    await user.click(screen.getByRole("button", { name: "Reference" }));
    await user.click(screen.getByRole("heading", { name: "Components" }));

    expect(screen.getByRole("button", { name: "Reference" })).toHaveAttribute("aria-expanded", "true");
  });

  it("must keep a section open when a press on its panel's text loses focus to the page", async () => {
    const user = userEvent.setup();
    render(
      <NavBar aria-label="Docs">
        <NavBarMenu label="Reference">
          <NavBarMenuGroup headingLevel={2} title="Components">
            <NavBarMenuItem href="/button">Button</NavBarMenuItem>
          </NavBarMenuGroup>
        </NavBarMenu>
      </NavBar>
    );

    await user.click(screen.getByRole("button", { name: "Reference" }));
    await user.click(screen.getByRole("heading", { name: "Components" }));
    await waitATask();

    expect(document.body).toHaveFocus();
    expect(screen.getByRole("button", { name: "Reference" })).toHaveAttribute("aria-expanded", "true");
  });

  it("must close a section when focus in its panel is lost to the page without a press on a wide bar", async () => {
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.topics);
    await user.tab();
    act(() => screen.getByRole("link", { name: "Design" }).blur());
    await waitATask();

    expect(elements.topics).toHaveAttribute("aria-expanded", "false");
  });

  it("must keep a section open when focus leaves with the window", async () => {
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.topics);
    await user.tab();
    fireEvent.focusOut(screen.getByRole("link", { name: "Design" }));
    await waitATask();

    expect(screen.getByRole("link", { name: "Design" })).toHaveFocus();
    expect(elements.topics).toHaveAttribute("aria-expanded", "true");
  });

  it.each(["{Control>}", "{Meta>}", "{Shift>}"])(
    "must keep a section open when a link in its panel is clicked with %s held",
    async (modifier) => {
      const user = userEvent.setup();
      render(<BlogNavBar />);

      await user.click(elements.topics);
      await user.keyboard(modifier);
      await user.click(screen.getByRole("link", { name: "Design" }));

      expect(elements.topics).toHaveAttribute("aria-expanded", "true");
    }
  );

  it("must close a section when a link in its panel is clicked", async () => {
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.topics);
    await user.click(screen.getByRole("link", { name: "Design" }));

    expect(elements.topics).toHaveAttribute("aria-expanded", "false");
  });

  it.each([{ target: "_blank" }, { target: "_BLANK" }, { target: "docs" }, { download: "guide.pdf" }])(
    "must keep a section open when a link in its panel with %o is clicked",
    async (linkProps) => {
      const user = userEvent.setup();
      render(
        <NavBar aria-label="Main">
          <NavBarMenu label="Topics">
            <NavBarMenuItem {...linkProps} href="/design" onClick={stayOnPage}>
              Design
            </NavBarMenuItem>
          </NavBarMenu>
        </NavBar>
      );

      await user.click(elements.topics);
      await user.click(screen.getByRole("link", { name: "Design" }));

      expect(elements.topics).toHaveAttribute("aria-expanded", "true");
    }
  );

  it.each(["_self", "_top", "_parent", "_SELF", "main-window"])(
    "must close a section when a link in its panel targeting %s, which replaces this page, is clicked",
    async (target) => {
      vi.spyOn(window, "name", "get").mockReturnValue("main-window");
      const user = userEvent.setup();
      render(
        <NavBar aria-label="Main">
          <NavBarMenu label="Topics">
            <NavBarMenuItem href="/design" onClick={stayOnPage} target={target}>
              Design
            </NavBarMenuItem>
          </NavBarMenu>
        </NavBar>
      );

      await user.click(elements.topics);
      await user.click(screen.getByRole("link", { name: "Design" }));

      expect(elements.topics).toHaveAttribute("aria-expanded", "false");
    }
  );

  it.each(["shell", "frame-locked"])(
    "must close a section when a link in its panel targets a frame around the page, %s",
    async (target) => {
      setUpTestWithFrames();
      const user = userEvent.setup();
      render(<SectionWithLink href="/design" target={target} />);

      await user.click(elements.topics);
      await user.click(screen.getByRole("link", { name: "Design" }));

      expect(elements.topics).toHaveAttribute("aria-expanded", "false");
    }
  );

  it("must keep a section open when a link in its panel targets a window that is not a frame around the page", async () => {
    setUpTestWithFrames({ crossOrigin: false });
    const user = userEvent.setup();
    render(<SectionWithLink href="/design" target="docs" />);

    await user.click(elements.topics);
    await user.click(screen.getByRole("link", { name: "Design" }));

    expect(elements.topics).toHaveAttribute("aria-expanded", "true");
  });

  it("must keep a section open when a download link in its panel holds its file in a data URL", async () => {
    const user = userEvent.setup();
    render(<SectionWithLink download="notes.txt" href="data:text/plain,Notes" />);

    await user.click(elements.topics);
    await user.click(screen.getByRole("link", { name: "Design" }));

    expect(elements.topics).toHaveAttribute("aria-expanded", "true");
  });

  it("must close a section when a download link in its panel points at another origin, which the browser navigates to", async () => {
    const user = userEvent.setup();
    render(<SectionWithLink download="guide.pdf" href="https://example.com/guide.pdf" />);

    await user.click(elements.topics);
    await user.click(screen.getByRole("link", { name: "Design" }));

    expect(elements.topics).toHaveAttribute("aria-expanded", "false");
  });

  it("must close a section when a link in its panel with no target is clicked", async () => {
    const user = userEvent.setup();
    render(
      <NavBar aria-label="Main">
        <NavBarMenu label="Topics">
          <NavBarMenuItem href="/design" onClick={stayOnPage}>
            Design
          </NavBarMenuItem>
        </NavBarMenu>
      </NavBar>
    );

    await user.click(elements.topics);
    await user.click(screen.getByRole("link", { name: "Design" }));

    expect(elements.topics).toHaveAttribute("aria-expanded", "false");
  });

  it("must close a section when a router link in its panel navigates by itself", async () => {
    const user = userEvent.setup();
    render(
      <NavBar aria-label="Main">
        <NavBarMenu label="Topics">
          {/* oxlint-disable-next-line jsx-a11y/anchor-is-valid -- to is the destination, in place of href */}
          <NavBarMenuItem as={RouterLink} to="/design">
            Design
          </NavBarMenuItem>
        </NavBarMenu>
      </NavBar>
    );

    await user.click(elements.topics);
    await user.click(screen.getByRole("link", { name: "Design" }));

    expect(elements.topics).toHaveAttribute("aria-expanded", "false");
  });

  it("must open the navigation when the toggle is clicked on a collapsed bar", async () => {
    vi.mocked(isNavBarCollapsed).mockReturnValue(true);
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.toggle);

    expect(elements.toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation")).toHaveAttribute("data-open", "true");
  });

  it("must close the navigation and its sections when the toggle is clicked again", async () => {
    vi.mocked(isNavBarCollapsed).mockReturnValue(true);
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.toggle);
    await user.click(elements.topics);
    await user.click(elements.toggle);

    expect(elements.toggle).toHaveAttribute("aria-expanded", "false");
    expect(elements.topics).toHaveAttribute("aria-expanded", "false");
  });

  it("must keep every section it opens open on a collapsed bar", async () => {
    vi.mocked(isNavBarCollapsed).mockReturnValue(true);
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.toggle);
    await user.click(elements.topics);
    await user.click(elements.series);

    expect(elements.topics).toHaveAttribute("aria-expanded", "true");
    expect(elements.series).toHaveAttribute("aria-expanded", "true");
  });

  it("must keep a section open when a click lands outside it or focus leaves it on a collapsed bar", async () => {
    vi.mocked(isNavBarCollapsed).mockReturnValue(true);
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.toggle);
    await user.click(elements.topics);
    await user.click(screen.getByText("After"));
    elements.series.focus();

    expect(elements.topics).toHaveAttribute("aria-expanded", "true");
  });

  it("must close the innermost section and then the navigation when Escape is pressed on a collapsed bar", async () => {
    vi.mocked(isNavBarCollapsed).mockReturnValue(true);
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.toggle);
    await user.click(elements.topics);
    screen.getByRole("link", { name: "Design" }).focus();
    await user.keyboard("{Escape}");

    expect(elements.topics).toHaveAttribute("aria-expanded", "false");
    expect(elements.topics).toHaveFocus();
    expect(elements.toggle).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");

    expect(elements.toggle).toHaveAttribute("aria-expanded", "false");
    expect(elements.toggle).toHaveFocus();
  });

  it("must close the navigation when Escape is pressed on its toggle on a collapsed bar", async () => {
    vi.mocked(isNavBarCollapsed).mockReturnValue(true);
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.toggle);
    await user.keyboard("{Escape}");

    expect(elements.toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("must leave Escape alone when it is pressed outside the navigation on a collapsed bar", async () => {
    vi.mocked(isNavBarCollapsed).mockReturnValue(true);
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.toggle);

    expect(fireEvent.keyDown(screen.getByRole("button", { name: "Subscribe" }), { key: "Escape" })).toBe(true);
    expect(elements.toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("must close the navigation when a link in it is clicked on a collapsed bar", async () => {
    vi.mocked(isNavBarCollapsed).mockReturnValue(true);
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.toggle);
    await user.click(screen.getByRole("link", { name: "Articles" }));

    expect(elements.toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("must close the navigation when the site's name in start is clicked on a collapsed bar", async () => {
    vi.mocked(isNavBarCollapsed).mockReturnValue(true);
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.toggle);
    await user.click(screen.getByRole("link", { name: "The Long Read" }));

    expect(elements.toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("must close every section and the navigation when the bar switches layout", async () => {
    const { resize } = setUpTestWithResizeObserver();
    vi.mocked(isNavBarCollapsed).mockReturnValue(true);
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.toggle);
    await user.click(elements.topics);
    vi.mocked(isNavBarCollapsed).mockReturnValue(false);
    resize();

    expect(elements.toggle).toHaveAttribute("aria-expanded", "false");
    expect(elements.topics).toHaveAttribute("aria-expanded", "false");
  });

  it("must close every section when a new collapse width switches the layout", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<BlogNavBar />);

    await user.click(elements.topics);
    vi.mocked(isNavBarCollapsed).mockReturnValue(true);
    rerender(<BlogNavBar collapse="always" />);

    expect(elements.topics).toHaveAttribute("aria-expanded", "false");
  });

  it("must keep its sections open when a new collapse width leaves the layout as it was", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<BlogNavBar />);

    await user.click(elements.topics);
    rerender(<BlogNavBar collapse="lg" />);

    expect(elements.topics).toHaveAttribute("aria-expanded", "true");
  });

  it("must keep the navigation open when the bar resizes after its collapse width changed", async () => {
    const { resize } = setUpTestWithResizeObserver();
    const user = userEvent.setup();
    const { rerender } = render(<BlogNavBar />);

    vi.mocked(isNavBarCollapsed).mockReturnValue(true);
    rerender(<BlogNavBar collapse="always" />);
    await user.click(elements.toggle);
    resize();

    expect(elements.toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("must keep its sections open when the bar resizes without switching layout", async () => {
    const { resize } = setUpTestWithResizeObserver();
    const user = userEvent.setup();
    render(<BlogNavBar />);

    await user.click(elements.topics);
    resize();

    expect(elements.topics).toHaveAttribute("aria-expanded", "true");
  });

  it("must name a panel link by its title and describe it by its description when it has one", () => {
    render(<BlogNavBar />);

    const design = screen.getByRole("link", { hidden: true, name: "Design" });

    expect(design).toHaveAccessibleDescription("Typography, colour, systems");
  });

  it("must name a panel link by its own aria-label when it is given one with a description", () => {
    render(
      <NavBar aria-label="Main">
        <NavBarMenu label="Topics">
          <NavBarMenuItem description="Typography" href="/design" aria-label="Design topics">
            Design
          </NavBarMenuItem>
        </NavBarMenu>
      </NavBar>
    );

    expect(screen.getByRole("link", { hidden: true, name: "Design topics" })).toHaveAccessibleDescription("Typography");
  });

  it("must keep a panel link's own description after its description when it is given", () => {
    render(
      <NavBar aria-label="Main">
        <NavBarMenu label="Topics">
          <NavBarMenuItem description="Typography" href="/design" aria-describedby="note">
            Design
          </NavBarMenuItem>
        </NavBarMenu>
        <li id="note">New</li>
      </NavBar>
    );

    expect(screen.getByRole("link", { hidden: true, name: "Design" })).toHaveAccessibleDescription("Typography New");
  });

  it("must name a group's list by its heading at the given level when a group renders", () => {
    render(
      <NavBar aria-label="Docs">
        <NavBarMenu label="Reference">
          <NavBarMenuGroup headingLevel={2} title="Components">
            <NavBarMenuItem href="/button">Button</NavBarMenuItem>
          </NavBarMenuGroup>
        </NavBarMenu>
      </NavBar>
    );

    expect(screen.getByRole("heading", { hidden: true, level: 2, name: "Components" })).toBeInTheDocument();
    expect(screen.getByRole("list", { hidden: true, name: "Components" })).toBeInTheDocument();
  });

  it("must pass its props and className to a component given in as when an item renders", () => {
    render(
      <NavBar aria-label="Main">
        {/* oxlint-disable-next-line jsx-a11y/anchor-is-valid -- to is the destination, in place of href */}
        <NavBarItem as={RouterLink} className="custom" to="/articles" aria-current="page">
          Articles
        </NavBarItem>
      </NavBar>
    );

    const articles = screen.getByRole("link", { name: "Articles" });

    expect(articles).toHaveAttribute("href", "#/articles");
    expect(articles).toHaveAttribute("aria-current", "page");
    expect(articles).toHaveClass("custom");
  });

  it("must give a section its li props when it renders", () => {
    render(
      <NavBar aria-label="Main">
        <NavBarMenu className="custom" label="Topics" data-testid="section">
          <NavBarMenuItem href="/design">Design</NavBarMenuItem>
        </NavBarMenu>
      </NavBar>
    );

    expect(screen.getByTestId("section").tagName).toBe("LI");
    expect(screen.getByTestId("section")).toHaveClass("custom");
  });

  it.each([
    [
      "NavBarItem",
      <NavBarItem href="/articles" key="item">
        Articles
      </NavBarItem>,
    ],
    [
      "NavBarMenu",
      <NavBarMenu key="menu" label="Topics">
        <li>Design</li>
      </NavBarMenu>,
    ],
    [
      "NavBarMenuItem",
      <NavBarMenuItem href="/design" key="menu-item">
        Design
      </NavBarMenuItem>,
    ],
    ["NavBarMenuGroup", <NavBarMenuGroup headingLevel={2} key="group" title="Components" />],
  ])("must throw MissingContextError when %s renders outside a NavBar", (_part, ui: ReactNode) => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(ui)).toThrow(MissingContextError);
  });

  it("must reject a bar without a name and a group without a heading level", () => {
    render(
      // @ts-expect-error the navigation needs a name
      <NavBar>
        <NavBarMenu label="Reference">
          {/* @ts-expect-error only the page's outline knows the heading level */}
          <NavBarMenuGroup title="Components">
            <NavBarMenuItem href="/button">Button</NavBarMenuItem>
          </NavBarMenuGroup>
        </NavBarMenu>
      </NavBar>
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("must reject dangerouslySetInnerHTML on a panel link and a button given in as", () => {
    // Built without rendering, since React throws when an element is given inner HTML and children
    const elements = [
      // @ts-expect-error the item renders its own title and description inside the link
      <NavBarMenuItem dangerouslySetInnerHTML={{ __html: "Button" }} href="/button" key="markup" aria-label="Button" />,
      // @ts-expect-error a NavBarItem renders a link, never a button
      <NavBarItem as="button" key="button">
        Articles
      </NavBarItem>,
    ];

    expect(elements.every(isValidElement)).toBe(true);
  });
});

/**
 * The blog header from the design mockups, with a paragraph after it to click outside the bar
 */
function BlogNavBar({ collapse }: { collapse?: NavBarCollapse }): JSX.Element {
  return (
    <>
      <NavBar
        aria-label="Main"
        collapse={collapse}
        end={<button type="button">Subscribe</button>}
        start={
          <a href="/" onClick={stayOnPage}>
            The Long Read
          </a>
        }
      >
        <NavBarItem href="/articles" onClick={stayOnPage} aria-current="page">
          Articles
        </NavBarItem>
        <NavBarMenu columns={2} label="Topics">
          <NavBarMenuItem description="Typography, colour, systems" href="/design" onClick={stayOnPage}>
            Design
          </NavBarMenuItem>
          <NavBarMenuItem href="/engineering">Engineering</NavBarMenuItem>
          <NavBarMenuItem href="/culture">Culture</NavBarMenuItem>
        </NavBarMenu>
        <NavBarMenu label="Series">
          <NavBarMenuItem href="/first-principles">First principles</NavBarMenuItem>
        </NavBarMenu>
      </NavBar>
      <p>After</p>
    </>
  );
}

interface SectionWithLinkProps {
  /**
   * The link's download attribute
   */
  download?: string;

  /**
   * The link's address
   */
  href: string;

  /**
   * The browsing context the link opens in
   */
  target?: string;
}

/**
 * A bar with one section holding one link, "Design", that stays on the page when clicked
 */
function SectionWithLink({ download, href, target }: SectionWithLinkProps): JSX.Element {
  return (
    <NavBar aria-label="Main">
      <NavBarMenu label="Topics">
        <NavBarMenuItem download={download} href={href} onClick={stayOnPage} target={target}>
          Design
        </NavBarMenuItem>
      </NavBarMenu>
    </NavBar>
  );
}

/**
 * Places the page in a frame named "frame" inside one named "shell", inside a cross-origin one whose name can't be
 * read, as the topmost window
 *
 * @param options crossOrigin false to make the topmost window "shell" itself, with no cross-origin frame
 */
function setUpTestWithFrames({ crossOrigin = true } = {}): void {
  const top = { name: "top" } as Window & { parent: Window };
  const shell = { name: "shell", parent: top } as Window & { parent: Window };

  top.parent = top;

  if (crossOrigin) {
    Object.defineProperty(top, "name", {
      get(): string {
        throw new DOMException("Blocked a frame from accessing a cross-origin frame", "SecurityError");
      },
    });
  } else {
    shell.parent = shell;
  }

  vi.spyOn(window, "name", "get").mockReturnValue("frame");
  vi.spyOn(window, "parent", "get").mockReturnValue(shell);
}

/**
 * Stands in a ResizeObserver, which jsdom lacks, so a test can report the bar resizing
 *
 * @returns `resize`, which reports a resize to every observer
 */
function setUpTestWithResizeObserver(): { resize: () => void } {
  const callbacks = new Set<ResizeObserverCallback>();

  vi.stubGlobal(
    "ResizeObserver",
    class {
      private readonly callback: ResizeObserverCallback;

      public constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
      }

      public disconnect(): void {
        callbacks.delete(this.callback);
      }

      public observe(): void {
        callbacks.add(this.callback);
      }
    }
  );

  const resize = (): void => {
    act(() => {
      for (const callback of callbacks) {
        callback([], {} as ResizeObserver);
      }
    });
  };

  return { resize };
}

const elements = {
  get series() {
    return screen.getByRole("button", { name: "Series" });
  },

  get toggle() {
    return screen.getByRole("button", { name: "Menu" });
  },

  get topics() {
    return screen.getByRole("button", { name: "Topics" });
  },
};
