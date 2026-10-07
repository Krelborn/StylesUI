/**
 * Direction a collection's items run in
 */
export type CollectionOrientation = "horizontal" | "vertical";

/**
 * Writing direction around a collection, which decides whether Left or Right moves forward in a horizontal one
 */
export type WritingDirection = "ltr" | "rtl";

interface TargetIndexOptions {
  /**
   * How many items the collection has
   */
  count: number;

  /**
   * Index of the focused item, or -1 when none is
   */
  currentIndex: number;

  /**
   * Writing direction around the collection. It only matters for a horizontal collection. Defaults to `ltr`.
   */
  direction?: WritingDirection;

  /**
   * The pressed key, as `KeyboardEvent.key` gives it
   */
  key: string;

  /**
   * Direction the items run in
   */
  orientation: CollectionOrientation;

  /**
   * Whether moving past either end goes round to the other end
   */
  wraps: boolean;
}

/**
 * Finds the item an arrow key, Home or End moves focus to in a collection such as a tab list or a listbox
 *
 * @param options the key, the focused item, the size, orientation and wrapping of the collection, and its writing
 *   direction if it is horizontal and may run right to left
 * @returns the index to move to, which is the current index at an end that does not wrap; null for a key the
 *   collection does not handle, or when it is empty. With nothing focused, forward goes to the first item and back goes
 *   to the last when wrapping, or to the first when not.
 */
export function targetIndexForKey({
  count,
  currentIndex,
  direction = "ltr",
  key,
  orientation,
  wraps,
}: TargetIndexOptions): number | null {
  const lastIndex = count - 1;

  if (count === 0) {
    return null;
  }

  if (key === "Home") {
    return 0;
  }

  if (key === "End") {
    return lastIndex;
  }

  const step = stepFor(key, orientation, direction);

  if (step === 0) {
    return null;
  }

  if (currentIndex < 0) {
    return step > 0 || !wraps ? 0 : lastIndex;
  }

  const target = currentIndex + step;

  if (target < 0) {
    return wraps ? lastIndex : 0;
  }

  if (target > lastIndex) {
    return wraps ? 0 : lastIndex;
  }

  return target;
}

function stepFor(key: string, orientation: CollectionOrientation, direction: WritingDirection): -1 | 0 | 1 {
  const forwardKey = orientation === "vertical" ? "ArrowDown" : direction === "rtl" ? "ArrowLeft" : "ArrowRight";
  const backwardKey = orientation === "vertical" ? "ArrowUp" : direction === "rtl" ? "ArrowRight" : "ArrowLeft";

  if (key === forwardKey) {
    return 1;
  }

  if (key === backwardKey) {
    return -1;
  }

  return 0;
}
