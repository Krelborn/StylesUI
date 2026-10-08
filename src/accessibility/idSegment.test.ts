import { describe, expect, it } from "vitest";

import { idSegment } from "./idSegment";

describe("idSegment", () => {
  it("must keep letters, digits and hyphens when the value holds only those", () => {
    expect(idSegment("pull-requests-2")).toBe("pull-requests-2");
  });

  it("must escape every other character when the value holds one", () => {
    expect(idSegment("a b_ü")).toBe("a_0020b_005f_00fc");
  });

  it("must not throw when the value holds an unpaired surrogate", () => {
    expect(idSegment("😀".slice(0, 1))).toBe("_d83d");
  });

  it.each([
    ["a b", "a_0020b"],
    ["😀".slice(0, 1), "😀".slice(1)],
    ["a_", "a "],
  ])("must give '%s' and '%s' different segments when they differ", (first, second) => {
    expect(idSegment(first)).not.toBe(idSegment(second));
  });
});
