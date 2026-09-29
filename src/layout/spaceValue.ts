import type { Space } from "./Space";

/**
 * Resolves a spacing step to a CSS value
 *
 * @param space the spacing step
 * @returns `0px` (a length, so it stays valid inside `calc()`), or the matching `--sui-space-*` token with the default theme's value as fallback
 */
export function spaceValue(space: Space): string {
  if (space === 0) {
    return "0px";
  }

  return `var(--sui-space-${space}, ${space * 0.25}rem)`;
}
