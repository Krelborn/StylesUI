import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import proseCss from "../Prose/Prose.module.css?raw";

import { Kbd } from "./Kbd";
import kbdCss from "./Kbd.module.css?raw";

describe("Kbd", () => {
  it("must render a kbd element when it is given a key", () => {
    render(<Kbd>K</Kbd>);

    expect(screen.getByText("K").tagName).toBe("KBD");
  });

  it("must forward native props when they are given", () => {
    render(<Kbd title="Command">⌘</Kbd>);

    expect(screen.getByText("⌘")).toHaveAttribute("title", "Command");
  });

  it("must merge className when one is given", () => {
    render(<Kbd className="custom">K</Kbd>);

    expect(screen.getByText("K")).toHaveClass("custom");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLElement>();

    render(<Kbd ref={ref}>K</Kbd>);

    expect(ref.current).toBe(screen.getByText("K"));
  });

  it("must style a raw kbd in prose as Kbd when either stylesheet changes", () => {
    const kbdDeclarations = kbdCss.match(/\.kbd \{(.*?)\}/s)?.[1].trim();
    const proseKbdDeclarations = proseCss.match(/:where\(\.prose\) kbd \{(.*?)\}/s)?.[1].trim();

    expect(kbdDeclarations).toContain("border-block-end-width");
    expect(proseKbdDeclarations).toBe(kbdDeclarations);
  });

  it("must reject as when it is given", () => {
    // @ts-expect-error Kbd always renders a kbd element
    render(<Kbd as="span">K</Kbd>);
  });
});
