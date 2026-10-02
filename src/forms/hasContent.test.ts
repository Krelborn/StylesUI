import { createElement, Fragment } from "react";
import { describe, expect, it } from "vitest";

import { hasContent } from "./hasContent";

describe("hasContent", () => {
  it.each([
    { description: "undefined", node: undefined },
    { description: "null", node: null },
    { description: "false", node: false },
    { description: "true", node: true },
    { description: "an empty string", node: "" },
    { description: "an empty array", node: [] },
    { description: "an array of empty nodes", node: [null, false, ""] },
    { description: "a nested empty array", node: [[], [undefined]] },
    { description: "an empty fragment", node: createElement(Fragment) },
    { description: "a fragment of an empty array", node: createElement(Fragment, null, []) },
  ])("must return false when the node is $description", ({ node }) => {
    expect(hasContent(node)).toBe(false);
  });

  it.each([
    { description: "text", node: "Enter your name" },
    { description: "zero", node: 0 },
    { description: "an element", node: createElement("span") },
    { description: "an array holding text", node: [null, "Enter your name"] },
    { description: "a fragment holding an element", node: createElement(Fragment, null, createElement("span")) },
  ])("must return true when the node is $description", ({ node }) => {
    expect(hasContent(node)).toBe(true);
  });

  it("must not consume an iterable when it is not an array", () => {
    const iterable = new Set(["Enter your name"]).values();

    const result = hasContent(iterable);

    expect(result).toBe(true);
    expect([...iterable]).toEqual(["Enter your name"]);
  });
});
