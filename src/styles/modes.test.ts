import { describe, expect, it } from "vitest";

import modesCss from "./modes.css?raw";

function declarationsForSelector(css: string, selector: string): Map<string, string> {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  if (!match) {
    throw new Error(`Expected to find a "${selector}" rule`);
  }

  const declarations = new Map<string, string>();
  for (const declarationMatch of match[1].matchAll(/([\w-]+):\s*([^;]+);/g)) {
    declarations.set(declarationMatch[1], declarationMatch[2].trim());
  }
  return declarations;
}

describe("modes", () => {
  it("must paint background, text colour and font when an element has the theme or mode attribute", () => {
    const declarations = declarationsForSelector(modesCss, "[data-sui-theme], [data-sui-mode]");

    expect(declarations.get("background-color")).toBe("var(--sui-color-background)");
    expect(declarations.get("color")).toBe("var(--sui-color-text)");
    expect(declarations.get("font-family")).toBe("var(--sui-font-body)");
  });
});
