/**
 * Lists the properties a stylesheet transitions, from its `transition` and `transition-property`
 * declarations
 *
 * @param css the stylesheet source
 * @returns the transitioned property names in source order, repeated when declared more than once
 */
export function transitionedProperties(css: string): string[] {
  return [...css.matchAll(/transition(?:-property)?:\s*([^;]+);/g)].flatMap(([, value]) =>
    value.split(",").map((transition) => transition.trim().split(/\s+/)[0])
  );
}
