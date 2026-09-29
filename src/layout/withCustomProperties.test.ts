import type { CSSProperties } from "react";
import { describe, expect, it } from "vitest";

import { withCustomProperties } from "./withCustomProperties";

describe("withCustomProperties", () => {
  it("must return the custom properties when no style is given", () => {
    expect(withCustomProperties({ "--sui-test-gap": "1rem" }, undefined)).toEqual({ "--sui-test-gap": "1rem" });
  });

  it("must keep the consumer style alongside the custom properties when both are given", () => {
    expect(withCustomProperties({ "--sui-test-gap": "1rem" }, { color: "red" })).toEqual({
      "--sui-test-gap": "1rem",
      color: "red",
    });
  });

  it("must let the consumer style win when it sets the same custom property", () => {
    const style = { "--sui-test-gap": "3px" } as CSSProperties;

    expect(withCustomProperties({ "--sui-test-gap": "1rem" }, style)).toEqual({ "--sui-test-gap": "3px" });
  });
});
