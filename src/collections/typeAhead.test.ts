import { describe, expect, it } from "vitest";

import { extendTypeAheadQuery, typeAheadTarget } from "./typeAhead";

const fruits = ["Apple", "apricot", "Banana", "Cherry", "Blueberry"];

describe("extendTypeAheadQuery", () => {
  it("must start a query when there is none", () => {
    expect(extendTypeAheadQuery(null, "a", 1000)).toEqual({ text: "a", time: 1000 });
  });

  it("must add the character when it comes within 500ms of the last", () => {
    expect(extendTypeAheadQuery({ text: "a", time: 1000 }, "p", 1500)).toEqual({ text: "ap", time: 1500 });
  });

  it("must start again when the character comes more than 500ms after the last", () => {
    expect(extendTypeAheadQuery({ text: "a", time: 1000 }, "b", 1501)).toEqual({ text: "b", time: 1501 });
  });
});

describe("typeAheadTarget", () => {
  it("must find the next label starting with the character when one character is typed", () => {
    expect(typeAheadTarget(fruits, 0, "a")).toBe(1);
  });

  it("must ignore case when it matches", () => {
    expect(typeAheadTarget(fruits, -1, "A")).toBe(0);
    expect(typeAheadTarget(fruits, -1, "c")).toBe(3);
  });

  it("must wrap round to the start when nothing after the current label matches", () => {
    expect(typeAheadTarget(fruits, 4, "b")).toBe(2);
  });

  it("must keep the current label when longer text still matches it", () => {
    expect(typeAheadTarget(fruits, 0, "ap")).toBe(0);
  });

  it("must move on when longer text no longer matches the current label", () => {
    expect(typeAheadTarget(fruits, 0, "apr")).toBe(1);
  });

  it("must return null when no label matches", () => {
    expect(typeAheadTarget(fruits, 0, "z")).toBeNull();
  });

  it("must return null when there are no labels", () => {
    expect(typeAheadTarget([], -1, "a")).toBeNull();
  });
});
