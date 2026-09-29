import { describe, expect, it } from "vitest";

import { listRole } from "./listRole";

describe("listRole", () => {
  it.each(["ul", "ol"] as const)("must return list when the element is %s and no role is given", (element) => {
    expect(listRole(element, undefined)).toBe("list");
  });

  it("must keep the given role when the element is a list", () => {
    expect(listRole("ul", "menu")).toBe("menu");
  });

  it("must return the given role when the element is not a list", () => {
    expect(listRole("div", undefined)).toBeUndefined();
  });
});
