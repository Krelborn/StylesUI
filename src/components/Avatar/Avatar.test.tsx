import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { Avatar } from "./Avatar";

const patSource = "https://example.com/pat.png";
const patNewSource = "https://example.com/pat-new.png";

describe("Avatar", () => {
  it("must be an image named by name when it is rendered", () => {
    render(<Avatar name="Pat Lee" />);

    expect(screen.getByRole("img", { name: "Pat Lee" })).toBeInTheDocument();
  });

  it("must show the image when src is set", () => {
    render(<Avatar name="Pat Lee" src={patSource} />);

    expect(screen.getByRole("presentation")).toHaveAttribute("src", patSource);
    expect(screen.getByRole("img", { name: "Pat Lee" }).textContent).toBe("");
  });

  it("must show the initials when src is omitted", () => {
    render(<Avatar name="Pat Lee" />);

    expect(screen.getByRole("img", { name: "Pat Lee" }).textContent).toBe("PL");
  });

  it("must show the initials when the image fails to load", () => {
    render(<Avatar name="Pat Lee" src={patSource} />);

    fireEvent.error(screen.getByRole("presentation"));

    expect(screen.queryByRole("presentation")).toBeNull();
    expect(screen.getByRole("img", { name: "Pat Lee" }).textContent).toBe("PL");
  });

  it("must try the image again when src changes after a failure", () => {
    const { rerender } = render(<Avatar name="Pat Lee" src={patSource} />);
    fireEvent.error(screen.getByRole("presentation"));

    rerender(<Avatar name="Pat Lee" src={patNewSource} />);

    expect(screen.getByRole("presentation")).toHaveAttribute("src", patNewSource);
  });

  it("must keep the initials when src changes back to one that failed", () => {
    const { rerender } = render(<Avatar name="Pat Lee" src={patSource} />);
    fireEvent.error(screen.getByRole("presentation"));
    rerender(<Avatar name="Pat Lee" src={patNewSource} />);

    rerender(<Avatar name="Pat Lee" src={patSource} />);

    expect(screen.queryByRole("presentation")).toBeNull();
  });

  it("must show one letter when the size is xs", () => {
    render(<Avatar name="Pat Lee" size="xs" />);

    expect(screen.getByRole("img", { name: "Pat Lee" }).textContent).toBe("P");
  });

  it("must take its name from aria-label when one is given", () => {
    render(<Avatar aria-label="Pat Lee, reviewer" name="Pat Lee" />);

    expect(screen.getByRole("img", { name: "Pat Lee, reviewer" })).toBeInTheDocument();
  });

  it("must be hidden from assistive technology when aria-hidden is set", () => {
    render(<Avatar aria-hidden={true} name="Pat Lee" />);

    expect(screen.queryByRole("img")).toBeNull();
  });

  it("must apply the medium size when size is omitted", () => {
    render(<Avatar name="Pat Lee" />);

    expect(screen.getByRole("img", { name: "Pat Lee" })).toHaveAttribute("data-size", "md");
  });

  it("must forward native props when they are given", () => {
    render(<Avatar id="pat-avatar" name="Pat Lee" />);

    expect(screen.getByRole("img", { name: "Pat Lee" })).toHaveAttribute("id", "pat-avatar");
  });

  it("must forward ref when one is given", () => {
    const ref = createRef<HTMLSpanElement>();

    render(<Avatar name="Pat Lee" ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("img", { name: "Pat Lee" }));
  });

  it("must reject role when it is given", () => {
    render(
      // @ts-expect-error an avatar is always an image
      <Avatar name="Pat Lee" role="presentation" />
    );
  });
});
