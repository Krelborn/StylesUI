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
  it("must paint background, text colour and font when an element has the theme, mode or palette attribute", () => {
    const declarations = declarationsForSelector(
      modesCss,
      ":where([data-sui-theme], [data-sui-mode], [data-sui-palette])"
    );

    expect(declarations.get("background-color")).toBe("var(--sui-color-background)");
    expect(declarations.get("color")).toBe("var(--sui-color-text)");
    expect(declarations.get("font-family")).toBe("var(--sui-font-body)");
  });

  it("must wrap the theme, mode and palette attribute selector in :where when painting so component and consumer classes win", () => {
    expect(modesCss).toMatch(
      /:where\(\s*\[data-sui-theme\]\s*,\s*\[data-sui-mode\]\s*,\s*\[data-sui-palette\]\s*\)\s*\{/
    );
  });
});
