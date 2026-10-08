import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { IconButton } from "./IconButton";

describe("IconButton", () => {
  it("must be named by its label when it renders", () => {
    render(<IconButton label="Refresh">↻</IconButton>);

    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });

  it("must hide the icon from assistive technology when it renders", () => {
    render(<IconButton label="Refresh">↻</IconButton>);

    expect(screen.getByText("↻")).toHaveAttribute("aria-hidden", "true");
  });

  it("must show the label and the shortcut in a tooltip when it takes keyboard focus", async () => {
    const user = userEvent.setup();
    render(
      <IconButton label="Refresh" shortcut="⌘R">
        ↻
      </IconButton>
    );

    await user.tab();

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Refresh");
    expect(tooltip).toHaveTextContent("⌘R");
  });

  it("must name the button by the label alone when a shortcut is given", () => {
    render(
      <IconButton label="Refresh" shortcut="⌘R">
        ↻
      </IconButton>
    );

    const nameElement = document.getElementById(
      screen.getByRole("button", { name: "Refresh" }).getAttribute("aria-labelledby") ?? ""
    );
    expect(nameElement?.textContent).toBe("Refresh");
  });

  it("must show no shortcut when the shortcut is an empty string", async () => {
    const user = userEvent.setup();
    render(
      <IconButton label="Refresh" shortcut="">
        ↻
      </IconButton>
    );

    await user.tab();

    expect((await screen.findByRole("tooltip")).querySelector("kbd")).toBeNull();
  });

  it("must pass aria-keyshortcuts to the button when it is given", () => {
    render(
      <IconButton label="Refresh" shortcut="⌘R" aria-keyshortcuts="Meta+R">
        ↻
      </IconButton>
    );

    expect(screen.getByRole("button", { name: "Refresh" })).toHaveAttribute("aria-keyshortcuts", "Meta+R");
  });

  it("must not call onClick when it is busy", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <IconButton busy={true} label="Refresh" onClick={handleClick}>
        ↻
      </IconButton>
    );

    await user.click(screen.getByRole("button", { name: "Refresh" }));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("must still show its tooltip on keyboard focus when it is busy", async () => {
    const user = userEvent.setup();
    render(
      <IconButton busy={true} label="Refresh">
        ↻
      </IconButton>
    );

    await user.tab();

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Refresh");
  });

  it("must use the ghost variant when variant is omitted", () => {
    render(<IconButton label="Refresh">↻</IconButton>);

    expect(screen.getByRole("button", { name: "Refresh" })).toHaveAttribute("data-variant", "ghost");
  });

  it("must forward ref to the button when one is given", () => {
    const ref = createRef<HTMLButtonElement>();

    render(
      <IconButton label="Refresh" ref={ref}>
        ↻
      </IconButton>
    );

    expect(ref.current).toBe(screen.getByRole("button", { name: "Refresh" }));
  });

  it("must run the consumer's onFocus as well as the tooltip's when one is given", async () => {
    const user = userEvent.setup();
    const handleFocus = vi.fn();
    render(
      <IconButton label="Refresh" onFocus={handleFocus}>
        ↻
      </IconButton>
    );

    await user.tab();

    expect(handleFocus).toHaveBeenCalledOnce();
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();
  });

  it("must reject aria-label when it is given", () => {
    render(
      // @ts-expect-error label names the button
      <IconButton label="Refresh" aria-label="Reload">
        ↻
      </IconButton>
    );
  });

  it("must reject aria-labelledby when it is given", () => {
    render(
      // @ts-expect-error the tooltip names the button
      <IconButton label="Refresh" aria-labelledby="heading">
        ↻
      </IconButton>
    );
  });

  it("must reject an icon button when it has no label", () => {
    // @ts-expect-error label is required, because it is the button's only name
    render(<IconButton>↻</IconButton>);
  });
});
