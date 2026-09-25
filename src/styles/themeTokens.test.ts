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

function splitTopLevelCommaSeparatedValues(value: string): string[] {
  const values: string[] = [];
  let depth = 0;
  let current = "";
  for (const character of value) {
    if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
    }

    if (character === "," && depth === 0) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  values.push(current.trim());
  return values;
}

function lightDarkValues(value: string): [light: string, dark: string] {
  const match = value.match(/^light-dark\((.+)\)$/);
  if (!match) {
    throw new Error(`Expected a light-dark() value, got "${value}"`);
  }

  const [light, dark] = splitTopLevelCommaSeparatedValues(match[1]);
  return [light, dark];
}

// Deliberate per the design spec: these tokens keep the same value in both colour schemes.
const sameInBothModes: Record<string, readonly string[]> = {
  default: ["--sui-color-on-warning"],
  playful: ["--sui-color-secondary", "--sui-color-on-secondary", "--sui-color-on-warning"],
};

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

  it.each([
    { css: defaultThemeCss, name: "default" },
    { css: playfulThemeCss, name: "playful" },
  ])("must use different light and dark values when the theme is $name", ({ css, name }) => {
    const exceptions = sameInBothModes[name];
    const colourTokens = [...declaredTokens(css)].filter(([tokenName]) => tokenName.startsWith("--sui-color-"));

    for (const [tokenName, value] of colourTokens) {
      if (exceptions.includes(tokenName)) {
        continue;
      }

      const [light, dark] = lightDarkValues(value);
      expect(light, tokenName).not.toBe(dark);
    }
  });

  it.each([
    { css: defaultThemeCss, name: "default" },
    { css: playfulThemeCss, name: "playful" },
  ])("must keep the same-in-both-modes exceptions identical when the theme is $name", ({ css, name }) => {
    const exceptions = sameInBothModes[name];
    const tokens = declaredTokens(css);
    const exceptionEntries = [...tokens].filter(([tokenName]) => exceptions.includes(tokenName));

    expect(exceptionEntries.map(([tokenName]) => tokenName).sort()).toEqual([...exceptions].sort());
    for (const [tokenName, value] of exceptionEntries) {
      const [light, dark] = lightDarkValues(value);
      expect(light, tokenName).toBe(dark);
    }
  });
});
