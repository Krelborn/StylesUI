import { describe, expect, it } from "vitest";

import { initialsOf } from "./initialsOf";

describe("initialsOf", () => {
  it.each([
    { initials: "PL", name: "Pat Lee" },
    { initials: "MA", name: "Mary Ann Lee" },
    { initials: "PL", name: "plee" },
    { initials: "P", name: "p" },
    { initials: "PL", name: "@plee" },
    { initials: "AW", name: "acme/web-team" },
    { initials: "ÆØ", name: "ægir ødegård" },
    { initials: "李小", name: "李 小龙" },
    { initials: "नद", name: "नमस्ते दुनिया" },
    { initials: "𝒜B", name: "𝒜lice Bob" },
    { initials: "𝒜B", name: "𝒜Bc" },
    { initials: "R1", name: "Room 101" },
    { initials: "AL", name: "Ali 🎉" },
    { initials: "", name: "🎉" },
    { initials: "", name: "" },
  ])("must return '$initials' when the name is '$name'", ({ initials, name }) => {
    expect(initialsOf(name)).toBe(initials);
  });
});
