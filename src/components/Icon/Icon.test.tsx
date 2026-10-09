import { render, screen } from "@testing-library/react";
import chevronDownArtwork from "lucide-static/icons/chevron-down.svg?raw";
import ellipsisArtwork from "lucide-static/icons/ellipsis.svg?raw";
import ellipsisVerticalArtwork from "lucide-static/icons/ellipsis-vertical.svg?raw";
import minusArtwork from "lucide-static/icons/minus.svg?raw";
import plusArtwork from "lucide-static/icons/plus.svg?raw";
import refreshArtwork from "lucide-static/icons/refresh-cw.svg?raw";
import sendHorizontalArtwork from "lucide-static/icons/send-horizontal.svg?raw";
import trashArtwork from "lucide-static/icons/trash-2.svg?raw";
import xArtwork from "lucide-static/icons/x.svg?raw";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { AddIcon } from "./AddIcon";
import { ChevronDownIcon } from "./ChevronDownIcon";
import { CloseIcon } from "./CloseIcon";
import { DeleteIcon } from "./DeleteIcon";
import { MoreHorizontalIcon } from "./MoreHorizontalIcon";
import { MoreVerticalIcon } from "./MoreVerticalIcon";
import { RefreshIcon } from "./RefreshIcon";
import { RemoveIcon } from "./RemoveIcon";
import { SendIcon } from "./SendIcon";

const icons = [
  { Component: AddIcon, artwork: plusArtwork, name: "AddIcon" },
  { Component: ChevronDownIcon, artwork: chevronDownArtwork, name: "ChevronDownIcon" },
  { Component: CloseIcon, artwork: xArtwork, name: "CloseIcon" },
  { Component: DeleteIcon, artwork: trashArtwork, name: "DeleteIcon" },
  { Component: MoreHorizontalIcon, artwork: ellipsisArtwork, name: "MoreHorizontalIcon" },
  { Component: MoreVerticalIcon, artwork: ellipsisVerticalArtwork, name: "MoreVerticalIcon" },
  { Component: RefreshIcon, artwork: refreshArtwork, name: "RefreshIcon" },
  { Component: RemoveIcon, artwork: minusArtwork, name: "RemoveIcon" },
  { Component: SendIcon, artwork: sendHorizontalArtwork, name: "SendIcon" },
];

describe("icons", () => {
  it.each(icons)("must draw Lucide's shapes when $name renders", ({ Component, artwork }) => {
    const lucideSvg = new DOMParser().parseFromString(artwork, "image/svg+xml").documentElement;

    render(<Component label="Meaning" />);

    expect(shapesOf(screen.getByRole("img", { name: "Meaning" }))).toEqual(shapesOf(lucideSvg));
  });

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

function shapesOf(svg: Element): string[] {
  return Array.from(svg.querySelectorAll(":not(g)"), (shape) => {
    const attributes = Array.from(shape.attributes)
      .filter(({ name }) => name !== "class")
      .map(({ name, value }) => `${name}="${value}"`)
      .toSorted();

    return [shape.tagName, ...attributes].join(" ");
  });
}
