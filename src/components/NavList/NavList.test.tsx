import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentPropsWithRef, JSX } from "react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { Box } from "../Box";
import { Counter } from "../Counter";

import { NavList } from "./NavList";
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
});
