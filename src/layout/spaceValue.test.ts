import { describe, expect, it } from "vitest";

import { spaceValue } from "./spaceValue";

describe("spaceValue", () => {
  it("must return 0 when the step is 0", () => {
    expect(spaceValue(0)).toBe("0");
  });

  it.each([
    { space: 1, expected: "var(--sui-space-1, 0.25rem)" },
    { space: 4, expected: "var(--sui-space-4, 1rem)" },
    { space: 8, expected: "var(--sui-space-8, 2rem)" },
  ] as const)("must return $expected when the step is $space", ({ expected, space }) => {
    expect(spaceValue(space)).toBe(expected);
  });
});
