import { describe, expect, it } from "vitest";

import type { CollectionOrientation, WritingDirection } from "./targetIndexForKey";
import { targetIndexForKey } from "./targetIndexForKey";

interface KeyCase {
  currentIndex: number;
  direction?: WritingDirection;
  expected: number | null;
  key: string;
  orientation?: CollectionOrientation;
  wraps?: boolean;
}

describe("targetIndexForKey", () => {
  it.each<KeyCase>([
    { currentIndex: 0, expected: 1, key: "ArrowRight" },
    { currentIndex: 1, expected: 0, key: "ArrowLeft" },
    { currentIndex: 2, expected: 0, key: "ArrowRight", wraps: true },
    { currentIndex: 2, expected: 2, key: "ArrowRight", wraps: false },
    { currentIndex: 0, expected: 2, key: "ArrowLeft", wraps: true },
    { currentIndex: 0, expected: 0, key: "ArrowLeft", wraps: false },
    { currentIndex: 1, expected: 0, key: "Home" },
    { currentIndex: 1, expected: 2, key: "End" },
  ])("must return $expected when $key is pressed at $currentIndex in a horizontal list", (keyCase) => {
    expect(targetIndexFor(keyCase)).toBe(keyCase.expected);
  });

  it.each<KeyCase>([
    { currentIndex: 0, expected: 1, key: "ArrowDown", orientation: "vertical" },
    { currentIndex: 0, expected: 2, key: "ArrowUp", orientation: "vertical", wraps: true },
    { currentIndex: 0, expected: 0, key: "ArrowUp", orientation: "vertical", wraps: false },
    { currentIndex: 0, expected: null, key: "ArrowRight", orientation: "vertical" },
    { currentIndex: 0, expected: null, key: "ArrowDown", orientation: "horizontal" },
  ])("must return $expected when $key is pressed in a $orientation list", (keyCase) => {
    expect(targetIndexFor(keyCase)).toBe(keyCase.expected);
  });

  it.each<KeyCase>([
    { currentIndex: 0, direction: "rtl", expected: 1, key: "ArrowLeft" },
    { currentIndex: 1, direction: "rtl", expected: 0, key: "ArrowRight" },
  ])("must swap Left and Right when $key is pressed right to left", (keyCase) => {
    expect(targetIndexFor(keyCase)).toBe(keyCase.expected);
  });

  it.each(["a", "Enter", " ", "Tab", "PageDown"])("must return null when the key is '%s'", (key) => {
    expect(targetIndexFor({ currentIndex: 0, expected: null, key })).toBeNull();
  });

  it("must return null when the collection is empty", () => {
    expect(
      targetIndexForKey({
        count: 0,
        currentIndex: -1,
        direction: "ltr",
        key: "Home",
        orientation: "horizontal",
        wraps: true,
      })
    ).toBeNull();
  });

  it.each<KeyCase>([
    { currentIndex: -1, expected: 0, key: "ArrowDown", orientation: "vertical", wraps: false },
    { currentIndex: -1, expected: 0, key: "ArrowUp", orientation: "vertical", wraps: false },
    { currentIndex: -1, expected: 2, key: "ArrowUp", orientation: "vertical", wraps: true },
  ])("must return $expected when $key is pressed with nothing focused", (keyCase) => {
    expect(targetIndexFor(keyCase)).toBe(keyCase.expected);
  });
});

function targetIndexFor({
  currentIndex,
  direction = "ltr",
  key,
  orientation = "horizontal",
  wraps = true,
}: KeyCase): number | null {
  return targetIndexForKey({ count: 3, currentIndex, direction, key, orientation, wraps });
}
