import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { CloseIcon } from "./CloseIcon";
import { RefreshIcon } from "./RefreshIcon";

const icons = [
  { Component: CloseIcon, name: "CloseIcon" },
  { Component: RefreshIcon, name: "RefreshIcon" },
];

describe("icons", () => {
  it.each(icons)("must be an image named by the label when $name has a label", ({ Component }) => {
    render(<Component label="Meaning" />);

    expect(screen.getByRole("img", { name: "Meaning" })).toBeInTheDocument();
  });

  it.each(icons)("must be hidden from assistive technology when $name has no label", ({ Component }) => {
    render(<Component data-testid="icon" />);

    expect(screen.getByTestId("icon")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("icon")).not.toHaveAttribute("role");
  });

  it.each(icons)("must be hidden from assistive technology when $name has an empty label", ({ Component }) => {
    render(<Component label="" data-testid="icon" />);

    expect(screen.getByTestId("icon")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("icon")).not.toHaveAttribute("role");
  });

  it.each(icons)("must forward native props when $name is given them", ({ Component }) => {
    render(<Component id="icon-id" label="Meaning" />);

    expect(screen.getByRole("img", { name: "Meaning" })).toHaveAttribute("id", "icon-id");
  });

  it.each(icons)("must merge className when $name is given one", ({ Component }) => {
    render(<Component className="custom" label="Meaning" />);

    expect(screen.getByRole("img", { name: "Meaning" })).toHaveClass("custom");
  });

  it.each(icons)("must forward ref to the svg element when $name is given one", ({ Component }) => {
    const ref = createRef<SVGSVGElement>();

    render(<Component label="Meaning" ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("img", { name: "Meaning" }));
  });

  it.each(icons)("must reject role when $name is given one", ({ Component }) => {
    render(
      // @ts-expect-error the label decides the role
      <Component label="Meaning" role="note" />
    );

    expect(screen.getByRole("img", { name: "Meaning" })).toBeInTheDocument();
  });

  it.each(icons)("must reject aria-label when $name is given one", ({ Component }) => {
    render(
      // @ts-expect-error the label names the icon
      <Component label="Meaning" aria-label="Other" />
    );

    expect(screen.getByRole("img", { name: "Meaning" })).toBeInTheDocument();
  });

  it.each(icons)("must reject aria-labelledby when $name is given one", ({ Component }) => {
    render(
      // @ts-expect-error the label names the icon
      <Component label="Meaning" aria-labelledby="missing" />
    );

    expect(screen.getByRole("img", { name: "Meaning" })).toBeInTheDocument();
  });

  it.each(icons)("must reject aria-hidden when $name is given one", ({ Component }) => {
    render(
      // @ts-expect-error the label decides whether the icon is hidden
      <Component label="Meaning" aria-hidden={true} />
    );

    expect(screen.getByRole("img", { name: "Meaning" })).toBeInTheDocument();
  });

  it.each(icons)("must reject children when $name is given them", ({ Component }) => {
    render(
      // @ts-expect-error the icon draws its own artwork
      <Component label="Meaning">Text</Component>
    );

    expect(screen.getByRole("img", { name: "Meaning" })).toBeInTheDocument();
    expect(screen.queryByText("Text")).toBeNull();
  });

  it.each(icons)("must reject strokeWidth when $name is given one", ({ Component }) => {
    render(
      // @ts-expect-error --sui-icon-stroke-width sets the weight
      <Component label="Meaning" strokeWidth={4} />
    );

    expect(screen.getByRole("img", { name: "Meaning" })).toBeInTheDocument();
  });

  it.each(icons)("must reject width when $name is given one", ({ Component }) => {
    render(
      // @ts-expect-error font-size sizes the icon
      <Component label="Meaning" width={48} />
    );

    expect(screen.getByRole("img", { name: "Meaning" })).toBeInTheDocument();
  });

  it.each(icons)("must reject height when $name is given one", ({ Component }) => {
    render(
      // @ts-expect-error font-size sizes the icon
      <Component height={48} label="Meaning" />
    );

    expect(screen.getByRole("img", { name: "Meaning" })).toBeInTheDocument();
  });
});
