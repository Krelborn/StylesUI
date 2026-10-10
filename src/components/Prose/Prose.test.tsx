import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { Prose } from "./Prose";
import proseCss from "./Prose.module.css?raw";

describe("Prose", () => {
  it("must render a div with the medium size and wrapping code when as, size and codeOverflow are omitted", () => {
    render(<Prose>Content</Prose>);

    const prose = screen.getByText("Content");
    expect(prose.tagName).toBe("DIV");
    expect(prose).toHaveAttribute("data-size", "md");
    expect(prose).toHaveAttribute("data-code-overflow", "wrap");
  });

  it.each(["sm", "md", "lg"] as const)("must apply the %s size when it is set", (size) => {
    render(<Prose size={size}>Content</Prose>);

    expect(screen.getByText("Content")).toHaveAttribute("data-size", size);
  });

  it.each(["wrap", "scroll"] as const)("must apply the %s code overflow when it is set", (codeOverflow) => {
    render(<Prose codeOverflow={codeOverflow}>Content</Prose>);

    expect(screen.getByText("Content")).toHaveAttribute("data-code-overflow", codeOverflow);
  });

  it("must render the element given in as when as is set", () => {
    render(<Prose as="article">Content</Prose>);

    expect(screen.getByRole("article")).toHaveTextContent("Content");
  });

  it("must merge className when one is given", () => {
    render(<Prose className="custom">Content</Prose>);

    expect(screen.getByText("Content")).toHaveClass("custom");
  });

  it("must forward props such as id to the rendered element", () => {
    render(<Prose id="release-notes">Content</Prose>);

    expect(screen.getByText("Content")).toHaveAttribute("id", "release-notes");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLDivElement>();

    render(<Prose ref={ref}>Content</Prose>);

    expect(ref.current).toBe(screen.getByText("Content"));
  });

  it("must reject button props when rendered as a div", () => {
    // @ts-expect-error type is not a valid div prop
    render(<Prose type="submit">Content</Prose>);
  });

  it("must reject a size when it is not supported", () => {
    // @ts-expect-error "xl" is not a ProseSize
    render(<Prose size="xl">Content</Prose>);
  });

  it("must reject a code overflow when it is not supported", () => {
    // @ts-expect-error "hidden" is not a ProseCodeOverflow
    render(<Prose codeOverflow="hidden">Content</Prose>);
  });

  it("must start every selector with :where(.prose) or a variant of it when the rule styles a descendant", () => {
    const selectors = descendantSelectors(proseCss);

    expect(selectors).not.toEqual([]);
    expect(selectors.filter((selector) => !/^:where\(\.prose(?:\[[\w-]+="\w+"\])?\) /.test(selector))).toEqual([]);
  });

  it("must keep classes, attributes and pseudo-classes inside :where() when the rule styles a descendant", () => {
    const aboveAComponentClass = descendantSelectors(proseCss).filter((selector) =>
      /[.[]|(?<!:):(?!:)/.test(outsideWhere(selector))
    );

    expect(aboveAComponentClass).toEqual([]);
  });

  it("must include a type selector when the rule styles a descendant", () => {
    const tiedWithTheReset = descendantSelectors(proseCss).filter(
      (selector) => !/(?:^|[\s>+~])[a-z]/.test(outsideWhere(selector).replace(/::[\w-]+/g, ""))
    );

    expect(tiedWithTheReset).toEqual([]);
  });
});

const rootSelector = /^\.prose(?:\[data-size="\w+"\])?$/;

/**
 * Lists the selectors of a stylesheet's descendant rules: every selector but those of the root
 * rule and its size variants
 *
 * @param css the stylesheet source
 * @returns each selector on its own, with selector lists split up
 */
function descendantSelectors(css: string): string[] {
  const withoutComments = css.replace(/\/\*.*?\*\//gs, "");

  return [...withoutComments.matchAll(/([^{}]+)\{[^{}]*\}/g)]
    .flatMap(([, selectorList]) => selectorList.split(/,(?![^()]*\))/))
    .map((selector) => selector.trim().replace(/\s+/g, " "))
    .filter((selector) => !rootSelector.test(selector));
}

/**
 * Strips the `:where()` groups from a selector, leaving the parts that count towards specificity
 *
 * @param selector a single selector
 * @returns the selector without its `:where()` groups
 */
function outsideWhere(selector: string): string {
  return selector.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, "");
}
