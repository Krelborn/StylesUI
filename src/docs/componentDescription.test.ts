import { describe, expect, it } from "vitest";

import { componentDescription } from "./componentDescription";

describe("componentDescription", () => {
  it("must render an @example tag as a TSX code block", () => {
    const component = withDocgen("Themed button\n\n@example\n<Button onClick={save}>Save</Button>");

    const description = componentDescription(component);

    expect(description).toBe("Themed button\n\n```tsx\n<Button onClick={save}>Save</Button>\n```");
  });

  it("must keep every line of every example when there are several", () => {
    const component = withDocgen('Card\n\n@example\n<Card>\n  ...\n</Card>\n@example\n<Card as="article" />');

    const description = componentDescription(component);

    expect(description).toBe('Card\n\n```tsx\n<Card>\n  ...\n</Card>\n```\n\n```tsx\n<Card as="article" />\n```');
  });

  it("must end an example at the next tag when another tag follows it", () => {
    const component = withDocgen("Card\n\n@example\n<Card />\n@see Box");

    const description = componentDescription(component);

    expect(description).toBe("Card\n\n```tsx\n<Card />\n```\n\n@see Box");
  });

  it("must return the description unchanged when it has no tags", () => {
    const component = withDocgen("Raised surface");

    const description = componentDescription(component);

    expect(description).toBe("Raised surface");
  });

  it("must read the description when the component is an object, as memo returns", () => {
    const component = { $$typeof: Symbol.for("react.memo"), __docgenInfo: { description: "Raised surface" } };

    const description = componentDescription(component);

    expect(description).toBe("Raised surface");
  });

  it.each([
    { component: () => null },
    { component: undefined },
    { component: null },
    { component: Object.assign(() => null, { __docgenInfo: undefined }) },
  ])("must return an empty string when the component has no docgen info", ({ component }) => {
    expect(componentDescription(component)).toBe("");
  });
});

function withDocgen(description: string): () => null {
  return Object.assign(() => null, { __docgenInfo: { description } });
}
