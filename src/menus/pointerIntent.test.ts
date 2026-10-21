import { describe, expect, it } from "vitest";

import { graceTriangle, isInsideTriangle } from "./pointerIntent";

const submenuAfter = new DOMRect(200, 40, 150, 160);
const submenuBefore = new DOMRect(0, 40, 150, 160);

describe("pointerIntent", () => {
  it("must run from just behind the exit point to the submenu's near corners when the submenu is after it", () => {
    expect(graceTriangle({ x: 190, y: 60 }, submenuAfter)).toEqual([
      { x: 185, y: 60 },
      { x: 200, y: 40 },
      { x: 200, y: 200 },
    ]);
  });

  it("must run to the submenu's right-hand corners when the submenu is before the exit point", () => {
    expect(graceTriangle({ x: 160, y: 60 }, submenuBefore)).toEqual([
      { x: 165, y: 60 },
      { x: 150, y: 40 },
      { x: 150, y: 200 },
    ]);
  });

  it.each([
    { point: { x: 195, y: 100 }, inside: true },
    { point: { x: 188, y: 61 }, inside: true },
    { point: { x: 195, y: 20 }, inside: false },
    { point: { x: 150, y: 100 }, inside: false },
    { point: { x: 210, y: 100 }, inside: false },
  ])("must say whether $point is inside the triangle", ({ inside, point }) => {
    expect(isInsideTriangle(point, graceTriangle({ x: 190, y: 60 }, submenuAfter))).toBe(inside);
  });

  it("must contain nothing when the submenu has no size", () => {
    expect(isInsideTriangle({ x: 0, y: 0 }, graceTriangle({ x: 0, y: 0 }, new DOMRect()))).toBe(false);
  });
});
