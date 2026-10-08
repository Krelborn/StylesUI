import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentPropsWithRef, JSX, ReactNode } from "react";
import { isValidElement, useState } from "react";
import { describe, expect, it } from "vitest";

import { transitionedProperties } from "../../test/transitionedProperties";
import { Box } from "../Box";
import { Counter } from "../Counter";

import { NavList } from "./NavList";
import navListCss from "./NavList.module.css?raw";
import { NavListGroup } from "./NavListGroup";
import { NavListItem } from "./NavListItem";

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

interface RenderPropLinkProps {
  /**
   * Called with whether the route is current, to render the link's content
   */
  children: (isCurrent: boolean) => ReactNode;

  /**
   * Route to navigate to
   */
  to: string;
}

/**
 * Stand-in for a router's link whose content is a render function
 */
function RenderPropLink({ children, to }: RenderPropLinkProps): JSX.Element {
  return (
    <Box as="a" href={`#${to}`}>
      {children(false)}
    </Box>
  );
}

/**
 * Chooses an item's element at runtime, as a wrapper component might
 *
 * @param isLink whether the item links somewhere
 * @returns `a` for a link, otherwise `button`
 */
function itemElement(isLink: boolean): "a" | "button" {
  return isLink ? "a" : "button";
}

/**
 * A button item that shows how many times it was clicked
 */
function ClickCounter(): JSX.Element {
  const [clicks, setClicks] = useState(0);

  return (
    <>
      <NavList aria-label="Lists">
        <NavListItem as="button" onClick={() => setClicks((previous) => previous + 1)}>
          Needs you
        </NavListItem>
      </NavList>
      <p>{`Clicks: ${clicks}`}</p>
    </>
  );
}

/**
 * A button item inside a form that shows how many times the form was submitted
 */
function SubmissionCounter(): JSX.Element {
  const [submissions, setSubmissions] = useState(0);

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmissions((previous) => previous + 1);
        }}
      >
        <NavList aria-label="Lists">
          <NavListItem as="button">Needs you</NavListItem>
        </NavList>
      </form>
      <p>{`Submissions: ${submissions}`}</p>
    </>
  );
}

describe("NavList", () => {
  it("must be a navigation landmark named by aria-label when it renders", () => {
    render(
      <NavList aria-label="Lists">
        <NavListItem href="#inbox">Inbox</NavListItem>
      </NavList>
    );

    expect(screen.getByRole("navigation", { name: "Lists" })).toBeInTheDocument();
  });

  it("must render a heading at the given level and a list it names when a group renders", () => {
    render(
      <NavList aria-label="Lists">
        <NavListGroup headingLevel={2} title="For review">
          <NavListItem href="#needs-you">Needs you</NavListItem>
        </NavListGroup>
      </NavList>
    );

    expect(screen.getByRole("heading", { level: 2, name: "For review" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "For review" })).toContainElement(
      screen.getByRole("link", { name: "Needs you" })
    );
  });

  it("must render a link with its href when as is omitted", () => {
    render(
      <NavList aria-label="Lists">
        <NavListItem href="#other-open">Other open</NavListItem>
      </NavList>
    );

    expect(screen.getByRole("link", { name: "Other open" })).toHaveAttribute("href", "#other-open");
  });

  it("must render a button that never submits and calls onClick when as is button", async () => {
    const user = userEvent.setup();
    render(<ClickCounter />);

    await user.click(screen.getByRole("button", { name: "Needs you" }));

    expect(screen.getByText("Clicks: 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Needs you" })).toHaveAttribute("type", "button");
  });

  it("must not submit a surrounding form when as is button", async () => {
    const user = userEvent.setup();
    render(<SubmissionCounter />);

    await user.click(screen.getByRole("button", { name: "Needs you" }));

    expect(screen.getByText("Submissions: 0")).toBeInTheDocument();
  });

  it("must pass className to a component given in as when it renders", () => {
    render(
      <NavList aria-label="Lists">
        {/* oxlint-disable-next-line jsx-a11y/anchor-is-valid -- to is the destination, in place of href */}
        <NavListItem as={RouterLink} className="custom" to="/settings">
          Settings
        </NavListItem>
      </NavList>
    );

    const link = screen.getByRole("link", { name: "Settings" });
    expect(link).toHaveAttribute("href", "#/settings");
    expect(link).toHaveClass("custom");
  });

  it("must render a node as the label when the item is a router link", () => {
    render(
      <NavList aria-label="Lists">
        {/* oxlint-disable-next-line jsx-a11y/anchor-is-valid -- to is the destination, in place of href */}
        <NavListItem as={RouterLink} to="/settings">
          <em>Account</em> settings
        </NavListItem>
      </NavList>
    );

    expect(screen.getByRole("link", { name: "Account settings" })).toHaveAttribute("href", "#/settings");
  });

  it.each(["page", "true", "false"] as const)("must pass aria-current='%s' to the link when it is given", (current) => {
    render(
      <NavList aria-label="Lists">
        <NavListItem href="#inbox" aria-current={current}>
          Inbox
        </NavListItem>
      </NavList>
    );

    expect(screen.getByRole("link", { name: "Inbox" })).toHaveAttribute("aria-current", current);
  });

  it("must read the trailing content after the label when trailing is given", () => {
    render(
      <NavList aria-label="Lists">
        <NavListItem as="button" trailing={<Counter count={3} />}>
          Needs you
        </NavListItem>
      </NavList>
    );

    expect(screen.getByRole("button", { name: "Needs you 3" })).toBeInTheDocument();
  });

  it("must add nothing to the name when trailing renders nothing", () => {
    render(
      <NavList aria-label="Lists">
        <NavListItem as="button" trailing={<Counter count={0} />}>
          Needs you
        </NavListItem>
      </NavList>
    );

    expect(screen.getByRole("button", { name: "Needs you" })).toBeInTheDocument();
  });

  it.each([null, false])("must add nothing after the label when trailing is %s", (trailing) => {
    render(
      <NavList aria-label="Lists">
        <NavListItem as="button" trailing={trailing}>
          Needs you
        </NavListItem>
      </NavList>
    );

    expect(screen.getByRole("button", { name: "Needs you" }).textContent).toBe("Needs you");
  });

  it("must reject href when as is button", () => {
    render(
      <NavList aria-label="Lists">
        {/* @ts-expect-error a button has no href */}
        <NavListItem as="button" href="#inbox">
          Inbox
        </NavListItem>
      </NavList>
    );

    expect(screen.getByRole("button", { name: "Inbox" })).toBeInTheDocument();
  });

  it("must reject as when it is an element other than a or button", () => {
    render(
      <NavList aria-label="Lists">
        {/* @ts-expect-error NavListItem renders a link, a button or a component, never another element */}
        <NavListItem as="div">Settings</NavListItem>
      </NavList>
    );

    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("must reject a component when a prop it requires is missing", () => {
    render(
      <NavList aria-label="Lists">
        {
          // @ts-expect-error RouterLink requires to
          // oxlint-disable-next-line jsx-a11y/anchor-is-valid -- the missing destination is what the type check rejects
          <NavListItem as={RouterLink}>Settings</NavListItem>
        }
      </NavList>
    );

    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
  });

  it("must reject a render function as the label when the component given in as takes one", () => {
    // Built without rendering, since the item would render the function in its label rather than call it
    const element = (
      // oxlint-disable-next-line jsx-a11y/anchor-is-valid -- to is the destination, in place of href
      <NavListItem as={RenderPropLink} to="/settings">
        {/* @ts-expect-error the item renders its children as a label, so a render function is never called */}
        {() => "Settings"}
      </NavListItem>
    );

    expect(isValidElement(element)).toBe(true);
  });

  it("must accept an element chosen at runtime when as may be a link or a button", () => {
    render(
      <NavList aria-label="Lists">
        {/* oxlint-disable-next-line jsx-a11y/anchor-is-valid -- as is chosen at runtime, and here it is a button */}
        <NavListItem as={itemElement(false)}>Inbox</NavListItem>
      </NavList>
    );

    expect(screen.getByRole("button", { name: "Inbox" })).toBeInTheDocument();
  });

  it("must reject a link's props when as may be a button", () => {
    const element = (
      // @ts-expect-error href belongs to a link, and as may be a button
      <NavListItem as={itemElement(false)} href="#inbox">
        Inbox
      </NavListItem>
    );

    expect(isValidElement(element)).toBe(true);
  });

  it("must reject dangerouslySetInnerHTML on an item when it is given", () => {
    // Built without rendering, since React throws when an element is given inner HTML and children
    const elements = [
      // @ts-expect-error the item renders its own label inside the link
      <NavListItem dangerouslySetInnerHTML={{ __html: "Inbox" }} href="#inbox" key="link" aria-label="Inbox" />,
      // @ts-expect-error the item renders its own label inside the button
      <NavListItem as="button" dangerouslySetInnerHTML={{ __html: "Inbox" }} key="button" aria-label="Inbox" />,
      // @ts-expect-error the item renders its own label inside the component
      // oxlint-disable-next-line jsx-a11y/anchor-is-valid -- to is the destination, in place of href
      <NavListItem as={RouterLink} dangerouslySetInnerHTML={{ __html: "Inbox" }} key="component" to="/inbox" />,
    ];

    expect(elements.every(isValidElement)).toBe(true);
  });

  it("must reject dangerouslySetInnerHTML on a group when it is given", () => {
    // Built without rendering, since React throws when an li is given inner HTML and children
    // @ts-expect-error the group renders its own heading and list inside the li
    const element = <NavListGroup dangerouslySetInnerHTML={{ __html: "Inbox" }} headingLevel={2} title="For review" />;

    expect(isValidElement(element)).toBe(true);
  });

  it("must reject dangerouslySetInnerHTML on a navigation list when it is given", () => {
    // Built without rendering, since React throws when a nav is given inner HTML and children
    // @ts-expect-error the navigation list renders its own list inside the nav
    const element = <NavList dangerouslySetInnerHTML={{ __html: "Inbox" }} aria-label="Lists" />;

    expect(isValidElement(element)).toBe(true);
  });

  it("must reject a navigation list when it has no name", () => {
    render(
      // @ts-expect-error a navigation landmark needs aria-label or aria-labelledby
      <NavList>
        <NavListItem href="#inbox">Inbox</NavListItem>
      </NavList>
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("must reject a group when it has no heading level", () => {
    render(
      <NavList aria-label="Lists">
        {/* @ts-expect-error the heading level depends on the page outline, so it is required */}
        <NavListGroup title="For review">
          <NavListItem href="#needs-you">Needs you</NavListItem>
        </NavListGroup>
      </NavList>
    );

    expect(screen.getByRole("list", { name: "For review" })).toBeInTheDocument();
  });

  it("must not move the current bar when reduced motion is requested", () => {
    const reducedMotionBlock = navListCss.match(/@media \(prefers-reduced-motion: reduce\) \{(.*?)\n\}/s)?.[1] ?? "";

    expect(transitionedProperties(reducedMotionBlock)).toEqual(["none"]);
    expect(reducedMotionBlock).toContain(".item::before");
    expect(reducedMotionBlock).toContain('.item[aria-current]:not([aria-current="false"])::before');
  });

  it("must draw the current bar in Highlight when forced colours are active", () => {
    const forcedColorsBlock = navListCss.match(/@media \(forced-colors: active\) \{(.*?)\n\}/s)?.[1] ?? "";
    const barRule = forcedColorsBlock.match(/::before \{(.*?)\}/s)?.[1] ?? "";
    const declarations = barRule.split(";").map((declaration) => declaration.trim());

    expect(declarations).toContain("background-color: Highlight");
    expect(declarations).toContain("forced-color-adjust: none");
  });
});
