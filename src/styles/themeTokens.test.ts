import { describe, expect, it } from "vitest";

import paletteCss from "./palette.css?raw";
import defaultThemeCss from "./themes/default.css?raw";
import playfulThemeCss from "./themes/playful.css?raw";

const hues = ["gray", "red", "orange", "yellow", "green", "blue", "indigo", "violet"] as const;
const steps = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

function declaredTokens(css: string): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const match of css.matchAll(/(--sui-[\w-]+):\s*([^;]+);/g)) {
    tokens.set(match[1], match[2].trim());
  }
  return tokens;
}

describe("theme tokens", () => {
  it("must define every hue step when the palette is loaded", () => {
    const palette = declaredTokens(paletteCss);

    const missing = hues
      .flatMap((hue) => steps.map((step) => `--sui-${hue}-${step}`))
      .filter((name) => !palette.has(name));

    expect(missing).toEqual([]);
    expect(palette.get("--sui-black")).toBe("#000");
    expect(palette.get("--sui-white")).toBe("#fff");
  });

  it("must declare the same tokens when playful is compared with default", () => {
    const defaultNames = [...declaredTokens(defaultThemeCss).keys()].sort();
    const playfulNames = [...declaredTokens(playfulThemeCss).keys()].sort();

    expect(playfulNames).toEqual(defaultNames);
  });

  it.each([
    { css: defaultThemeCss, name: "default" },
    { css: playfulThemeCss, name: "playful" },
  ])("must define every colour token with light-dark() when the theme is $name", ({ css }) => {
    const colourTokens = [...declaredTokens(css)].filter(([name]) => name.startsWith("--sui-color-"));

    expect(colourTokens.length).toBeGreaterThan(0);
    for (const [name, value] of colourTokens) {
      expect(value, name).toMatch(/^light-dark\(/);
    }
  });
});
