import { render, screen } from "@testing-library/react";
import type { ComponentPropsWithRef, JSX } from "react";
import { createRef, forwardRef } from "react";
import { describe, expect, it } from "vitest";

import { transitionedProperties } from "../../test/transitionedProperties";

import { Link } from "./Link";
import styles from "./Link.module.css";
import linkCss from "./Link.module.css?raw";

type AnchorPropsWithoutHref = Omit<ComponentPropsWithRef<"a">, "href">;

interface RouterLinkProps extends AnchorPropsWithoutHref {
  /**
   * Route to navigate to, in place of `href`
   */
  to: string;
}

type DestinationLinkProps = AnchorPropsWithoutHref & ({ href: string } | { to: string });

describe("Link", () => {
  it("must render a link with the given href when as is omitted", () => {
    render(<Link href="/docs">Documentation</Link>);

    expect(screen.getByRole("link", { name: "Documentation" })).toHaveAttribute("href", "/docs");
  });

  it("must apply the primary tone and an underline that always shows when they are omitted", () => {
    render(<Link href="/docs">Documentation</Link>);

    const link = screen.getByRole("link", { name: "Documentation" });
    expect(link).toHaveAttribute("data-tone", "primary");
    expect(link).toHaveAttribute("data-underline", "always");
  });

  it.each(["inherit", "primary"] as const)("must apply the %s tone when it is set", (tone) => {
    render(
      <Link href="/docs" tone={tone}>
        Documentation
      </Link>
    );

    expect(screen.getByRole("link", { name: "Documentation" })).toHaveAttribute("data-tone", tone);
  });

  it.each(["always", "hover"] as const)("must apply the %s underline when it is set", (underline) => {
    render(
      <Link href="/docs" underline={underline}>
        Documentation
      </Link>
    );

    expect(screen.getByRole("link", { name: "Documentation" })).toHaveAttribute("data-underline", underline);
  });

  it("must forward native props when they are given", () => {
    render(
      <Link href="https://example.com" rel="noreferrer" target="_blank">
        Documentation
      </Link>
    );

    const link = screen.getByRole("link", { name: "Documentation" });
    expect(link).toHaveAttribute("rel", "noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("must merge className when one is given", () => {
    render(
      <Link className="custom" href="/docs">
        Documentation
      </Link>
    );

    expect(screen.getByRole("link", { name: "Documentation" })).toHaveClass(styles.link, "custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLAnchorElement>();

    render(
      <Link href="/docs" ref={ref}>
        Documentation
      </Link>
    );

    expect(ref.current).toBe(screen.getByRole("link", { name: "Documentation" }));
  });

  it("must render the component and pass it className, data-tone and data-underline when as is a component", () => {
    render(
      // oxlint-disable-next-line jsx-a11y/anchor-is-valid -- to is the destination, in place of href
      <Link as={RouterLink} className="custom" to="/settings" tone="inherit" underline="hover">
        Settings
      </Link>
    );

    const link = screen.getByRole("link", { name: "Settings" });
    expect(link).toHaveAttribute("href", "/settings");
    expect(link).toHaveClass(styles.link, "custom");
    expect(link).toHaveAttribute("data-tone", "inherit");
    expect(link).toHaveAttribute("data-underline", "hover");
  });

  it("must forward ref to the anchor when the component given in as takes ref as a prop", () => {
    const ref = createRef<HTMLAnchorElement>();

    render(
      // oxlint-disable-next-line jsx-a11y/anchor-is-valid -- to is the destination, in place of href
      <Link as={RouterLink} ref={ref} to="/settings">
        Settings
      </Link>
    );

    expect(ref.current).toBe(screen.getByRole("link", { name: "Settings" }));
  });

  it("must forward ref to the anchor when the component given in as uses forwardRef", () => {
    const ref = createRef<HTMLAnchorElement>();

    render(
      // oxlint-disable-next-line jsx-a11y/anchor-is-valid -- to is the destination, in place of href
      <Link as={ForwardRefRouterLink} ref={ref} to="/settings">
        Settings
      </Link>
    );

    expect(ref.current).toBe(screen.getByRole("link", { name: "Settings" }));
  });

  it("must accept either shape when the component given in as takes a union of props", () => {
    render(
      // oxlint-disable-next-line jsx-a11y/anchor-is-valid -- to is the destination, in place of href
      <Link as={DestinationLink} to="/settings">
        Settings
      </Link>
    );
    render(
      <Link as={DestinationLink} href="https://example.com">
        Example
      </Link>
    );

    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("link", { name: "Example" })).toHaveAttribute("href", "https://example.com");
  });

  it("must reject a tone when it is not supported", () => {
    render(
      // @ts-expect-error "accent" is not a LinkTone
      <Link href="/docs" tone="accent">
        Documentation
      </Link>
    );
  });

  it("must reject an underline when it is not supported", () => {
    render(
      // @ts-expect-error "never" is not a LinkUnderline
      <Link href="/docs" underline="never">
        Documentation
      </Link>
    );
  });

  it("must reject a component when a prop it requires is missing", () => {
    // @ts-expect-error RouterLink requires to
    // oxlint-disable-next-line jsx-a11y/anchor-is-valid -- the missing destination is what the type check rejects
    render(<Link as={RouterLink}>Settings</Link>);
  });

  it("must reject href when the component given in as does not take one", () => {
    render(
      // @ts-expect-error RouterLink takes to in place of href
      <Link as={RouterLink} href="/settings" to="/settings">
        Settings
      </Link>
    );
  });

  it("must reject a prop of another component when as is omitted", () => {
    render(
      // @ts-expect-error to is a RouterLink prop, not an anchor prop
      <Link href="/settings" to="/settings">
        Settings
      </Link>
    );
  });

  it("must reject as when it is an element other than a", () => {
    // @ts-expect-error Link renders an anchor or a component, never another element
    render(<Link as="button">Settings</Link>);
  });

  it("must reject a ref when it is for another element", () => {
    const ref = createRef<HTMLButtonElement>();

    render(
      // @ts-expect-error the ref must be for an anchor
      <Link href="/docs" ref={ref}>
        Documentation
      </Link>
    );
  });

  it("must transition only colours when reduced motion is requested", () => {
    const movingProperties = transitionedProperties(linkCss).filter((property) => !property.endsWith("color"));

    expect(movingProperties).toEqual([]);
  });

  it("must never transition the outline when focus moves to the link", () => {
    const properties = transitionedProperties(linkCss);

    expect(properties).not.toContain("all");
    expect(properties).not.toContain("outline");
  });
});

function RouterLink({ children, to, ...rest }: RouterLinkProps): JSX.Element {
  return (
    <a {...rest} href={to}>
      {children}
    </a>
  );
}

const ForwardRefRouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>(function ForwardRefRouterLink(
  { children, to, ...rest },
  ref
) {
  return (
    <a {...rest} href={to} ref={ref}>
      {children}
    </a>
  );
});

function DestinationLink({ children, ...props }: DestinationLinkProps): JSX.Element {
  if ("to" in props) {
    const { to, ...rest } = props;

    return (
      <a {...rest} href={to}>
        {children}
      </a>
    );
  }

  return <a {...props}>{children}</a>;
}
