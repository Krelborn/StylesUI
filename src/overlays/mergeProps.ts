import type { CSSProperties } from "react";

const joinedIdProps = new Set(["aria-describedby", "aria-labelledby"]);

const dashedIdent = /^--[-\w\u{80}-\u{10FFFF}]+$/u;

/**
 * Combines a consumer's own props with the props an overlay hook sets on the same element
 *
 * @param own the consumer's props, if any
 * @param hook the props the hook sets
 * @returns the consumer's props with the hook's added. Where both set a prop, both functions run, the consumer's
 *   first; `aria-describedby` and `aria-labelledby` list the hook's ids before the consumer's; `style` objects merge,
 *   the hook's properties winning except `anchorName`, which lists the hook's name before the consumer's when the
 *   consumer's is a list of dashed idents, so one trigger can anchor two overlays, and otherwise takes the hook's name,
 *   in place of a keyword such as `none` or `inherit`; and any other prop takes the hook's value. A hook value of
 *   `undefined` keeps the consumer's.
 */
export function mergeProps<Own extends object, Hook extends object>(
  own: (Own & Partial<Hook>) | undefined,
  hook: Hook
): Omit<Own, keyof Hook> & Hook {
  const merged: Record<string, unknown> = { ...own };

  for (const [key, hookValue] of Object.entries(hook)) {
    merged[key] = mergeProp(key, merged[key], hookValue);
  }

  // Every key the hook sets now holds a value of the hook's type, and every other key keeps the consumer's
  return merged as Omit<Own, keyof Hook> & Hook;
}

function mergeProp(key: string, ownValue: unknown, hookValue: unknown): unknown {
  if (ownValue === undefined) {
    return hookValue;
  }

  if (hookValue === undefined) {
    return ownValue;
  }

  if (isFunction(ownValue) && isFunction(hookValue)) {
    return (event: unknown) => {
      ownValue(event);
      hookValue(event);
    };
  }

  if (joinedIdProps.has(key)) {
    return `${String(hookValue)} ${String(ownValue)}`;
  }

  if (key === "style" && isStyle(ownValue) && isStyle(hookValue)) {
    return mergeStyles(ownValue, hookValue);
  }

  return hookValue;
}

function mergeStyles(own: CSSProperties, hook: CSSProperties): CSSProperties {
  const merged = { ...own, ...hook };

  if (hook.anchorName !== undefined && isDashedIdentList(own.anchorName)) {
    merged.anchorName = `${hook.anchorName}, ${own.anchorName}`;
  }

  return merged;
}

// anchor-name takes either one keyword or a list of dashed idents, and the browser drops a declaration that mixes them
function isDashedIdentList(value: string | undefined): value is string {
  return value !== undefined && value.split(",").every((name) => dashedIdent.test(name.trim()));
}

function isFunction(value: unknown): value is (event: unknown) => void {
  return typeof value === "function";
}

function isStyle(value: unknown): value is CSSProperties {
  return typeof value === "object" && value !== null;
}
