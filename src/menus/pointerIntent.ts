/**
 * A point in viewport coordinates, as a pointer event's `clientX` and `clientY` give it
 */
export interface Point {
  /**
   * Distance from the viewport's left edge
   */
  x: number;

  /**
   * Distance from the viewport's top edge
   */
  y: number;
}

/**
 * Three corners of a triangle
 */
export type Triangle = readonly [Point, Point, Point];

// How far behind the point where the pointer left the item the triangle starts, so that point is well inside it
const exitAllowance = 5;

/**
 * The triangle a pointer crosses on its way from a submenu's item into the submenu, so moving diagonally over the
 * items between does not close it
 *
 * @param exit where the pointer left the submenu's item
 * @param submenu the submenu's bounds
 * @returns the triangle from just behind the exit point to the two corners of the submenu's side facing it: its
 *   nearer side when the submenu sits beside the exit point, else its top or bottom
 */
export function graceTriangle(exit: Point, { bottom, left, right, top }: DOMRectReadOnly): Triangle {
  if (exit.x <= left) {
    return [
      { x: exit.x - exitAllowance, y: exit.y },
      { x: left, y: top },
      { x: left, y: bottom },
    ];
  }

  if (exit.x >= right) {
    return [
      { x: exit.x + exitAllowance, y: exit.y },
      { x: right, y: top },
      { x: right, y: bottom },
    ];
  }

  if (exit.y <= top) {
    return [
      { x: exit.x, y: exit.y - exitAllowance },
      { x: left, y: top },
      { x: right, y: top },
    ];
  }

  return [
    { x: exit.x, y: exit.y + exitAllowance },
    { x: left, y: bottom },
    { x: right, y: bottom },
  ];
}

/**
 * Whether a point is inside a triangle or on its edge
 *
 * @param point the point
 * @param triangle the triangle
 * @returns true when the point is inside or on an edge; false for a flat triangle, such as one to a submenu that has no
 *   size
 */
export function isInsideTriangle(point: Point, [first, second, third]: Triangle): boolean {
  if (cross(first, second, third) === 0) {
    return false;
  }

  const sides = [cross(first, second, point), cross(second, third, point), cross(third, first, point)];

  return sides.every((side) => side >= 0) || sides.every((side) => side <= 0);
}

/**
 * Which side of the line from one point to another a third point is on
 *
 * @returns positive on one side, negative on the other, zero on the line
 */
function cross(from: Point, to: Point, point: Point): number {
  return (to.x - from.x) * (point.y - from.y) - (to.y - from.y) * (point.x - from.x);
}
