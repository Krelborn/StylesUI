import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { hasContent } from "./hasContent";

describe("hasContent", () => {
  it.each([
    { description: "undefined", node: undefined },
    { description: "null", node: null },
    { description: "false", node: false },
    { description: "an empty string", node: "" },
  ])("must return false when the node is $description", ({ node }) => {
    expect(hasContent(node)).toBe(false);
  });

  it.each([
    { description: "text", node: "Enter your name" },
    { description: "zero", node: 0 },
    { description: "an element", node: createElement("span") },
  ])("must return true when the node is $description", ({ node }) => {
    expect(hasContent(node)).toBe(true);
  });
});
