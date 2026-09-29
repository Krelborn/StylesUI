import type { CSSProperties } from "react";

/**
 * Merges a component's custom properties with the consumer's style
 *
 * @param customProperties the component's custom properties; undefined values are not rendered
 * @param style the consumer's style, whose declarations win on conflict
 * @returns the merged style
 */
export function withCustomProperties(
  customProperties: Record<`--${string}`, string | undefined>,
  style: CSSProperties | undefined
): CSSProperties {
  return { ...customProperties, ...style };
}
