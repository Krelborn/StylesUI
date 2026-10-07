import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Avatar } from "../Avatar";

import { AvatarGroup } from "./AvatarGroup";

const reviewers = ["Pat Lee", "Sam Okafor", "Ines Duarte", "Kai Moreau"];

describe("AvatarGroup", () => {
  it("must be a group named by aria-label when it is rendered", () => {
    renderGroup();

    expect(screen.getByRole("group", { name: "Reviewers" })).toBeInTheDocument();
  });

  it("must be a group named by the element aria-labelledby points to when it is given", () => {
    render(
      <>
        <span id="reviewers-heading">Reviewers</span>
        <AvatarGroup aria-labelledby="reviewers-heading">
          <Avatar name="Pat Lee" />
        </AvatarGroup>
      </>
    );

    expect(screen.getByRole("group", { name: "Reviewers" })).toBeInTheDocument();
  });

  it("must show every avatar and no count when max is omitted", () => {
    renderGroup();

    expect(screen.getAllByRole("img")).toHaveLength(4);
    expect(elements.group.textContent).not.toContain("+");
  });

  it("must show the number of hidden avatars when there are more than max", () => {
    renderGroup({ max: 2 });

    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("must hide the count from assistive technology when it is shown", () => {
    renderGroup({ max: 2 });

    expect(screen.getByText("+2")).toHaveAttribute("aria-hidden", "true");
  });

  it("must keep every name in the accessibility tree when avatars are hidden", () => {
    renderGroup({ max: 2 });

    for (const name of reviewers) {
      expect(screen.getByRole("img", { name })).toBeInTheDocument();
    }
  });

  it("must show no count when every avatar fits within max", () => {
    renderGroup({ max: 4 });

    expect(elements.group.textContent).not.toContain("+");
  });

  it("must show one avatar when max is below 1", () => {
    renderGroup({ max: 0 });

    expect(screen.getByText("+3")).toBeInTheDocument();
  });

  it("must reject a group when it has no name", () => {
    render(
      // @ts-expect-error a group needs aria-label or aria-labelledby
      <AvatarGroup>
        <Avatar name="Pat Lee" />
      </AvatarGroup>
    );
  });
});

function renderGroup({ max }: { max?: number } = {}): void {
  render(
    <AvatarGroup max={max} aria-label="Reviewers">
      {reviewers.map((name) => (
        <Avatar key={name} name={name} />
      ))}
    </AvatarGroup>
  );
}

const elements = {
  get group() {
    return screen.getByRole("group", { name: "Reviewers" });
  },
};
