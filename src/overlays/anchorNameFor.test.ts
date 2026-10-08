import { describe, expect, it } from "vitest";

import { anchorNameFor } from "./anchorNameFor";

describe("anchorNameFor", () => {
  it.each([
    { anchorName: "--sui-overlay-r1", id: ":r1:" },
    { anchorName: "--sui-overlay-r1", id: "«r1»" },
    { anchorName: "--sui-overlay-_r_1_", id: "_r_1_" },
  ])("must return $anchorName when the id is '$id'", ({ anchorName, id }) => {
    expect(anchorNameFor(id)).toBe(anchorName);
  });
});
