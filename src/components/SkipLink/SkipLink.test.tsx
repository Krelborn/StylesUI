import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { transitionedProperties } from "../../test/transitionedProperties";

import { SkipLink } from "./SkipLink";
import styles from "./SkipLink.module.css";
import skipLinkCss from "./SkipLink.module.css?raw";

describe("SkipLink", () => {
  it("must render a link to the given fragment when href is set", () => {
    render(<SkipLink href="#main">Skip to main content</SkipLink>);

    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#main");
  });

  it("must forward native props when they are given", () => {
    render(
      <SkipLink href="#main" id="skip-link">
        Skip to main content
      </SkipLink>
    );

    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("id", "skip-link");
  });

  it("must merge className when one is given", () => {
    render(
      <SkipLink className="custom" href="#main">
        Skip to main content
      </SkipLink>
    );

    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveClass(styles.skipLink, "custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLAnchorElement>();

    render(
      <SkipLink href="#main" ref={ref}>
        Skip to main content
      </SkipLink>
    );

    expect(ref.current).toBe(screen.getByRole("link", { name: "Skip to main content" }));
  });

  it("must reject an href when it is not a fragment", () => {
    render(
      // @ts-expect-error "/main" is a path, not a fragment
      <SkipLink href="/main">Skip to main content</SkipLink>
    );
  });

  it("must reject a missing href when none is given", () => {
    // @ts-expect-error href is required
    // oxlint-disable-next-line jsx-a11y/anchor-is-valid -- the missing href is what the type check rejects
    render(<SkipLink>Skip to main content</SkipLink>);
  });

  it("must reject as when it is given", () => {
    render(
      // @ts-expect-error SkipLink always renders an anchor
      <SkipLink as="button" href="#main">
        Skip to main content
      </SkipLink>
    );
  });

  it("must reject a ref when it is for another element", () => {
    const ref = createRef<HTMLButtonElement>();

    render(
      // @ts-expect-error the ref must be for an anchor
      <SkipLink href="#main" ref={ref}>
        Skip to main content
      </SkipLink>
    );
  });

  it("must transition only colour properties when the stylesheet transitions anything", () => {
    const nonColourProperties = transitionedProperties(skipLinkCss).filter((property) => !property.endsWith("color"));

    expect(nonColourProperties).toEqual([]);
  });

  it("must never transition the outline or all properties when focus moves to the link", () => {
    const properties = transitionedProperties(skipLinkCss);

    expect(properties).not.toContain("all");
    expect(properties).not.toContain("outline");
  });
});
