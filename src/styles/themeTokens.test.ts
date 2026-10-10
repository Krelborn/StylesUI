import { describe, expect, it } from "vitest";

import brightPaletteCss from "./palettes/bright.css?raw";
import popPaletteCss from "./palettes/pop.css?raw";
import rampsCss from "./ramps.css?raw";
import defaultThemeCss from "./themes/default.css?raw";
import playfulThemeCss from "./themes/playful.css?raw";
import { declaredTokens, hues, paletteNames, steps } from "./tokenSource";

type PaletteName = (typeof paletteNames)[number];

interface PaletteSource {
  /**
   * Theme whose elements take this palette when no palette is set
   */
  companion?: string;

  css: string;
  name: PaletteName;
}

const themes = [
  { css: defaultThemeCss, name: "default" },
  { css: playfulThemeCss, name: "playful" },
];

const palettes: readonly PaletteSource[] = [
  { companion: "default", css: brightPaletteCss, name: "bright" },
  { companion: "playful", css: popPaletteCss, name: "pop" },
];

// Text on a light fill stays dark in both schemes: Bright's yellow warning, and every one of
// Pop's bright fills, which carry its ink. A palette's ink, the outline a theme with outlined
// controls draws, is its light-mode text colour whatever the scheme.
const sameInBothModes: Record<PaletteName, readonly string[]> = {
  bright: ["--sui-color-on-warning", "--sui-color-ink"],
  pop: [
    "--sui-color-on-secondary",
    "--sui-color-on-success",
    "--sui-color-on-warning",
    "--sui-color-on-danger",
    "--sui-color-on-info",
    "--sui-color-ink",
  ],
};

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
  const match = value.match(/^light-dark\((.+)\)$/s);
  if (!match) {
    throw new Error(`Expected a light-dark() value, got "${value}"`);
  }

  const [light, dark] = splitTopLevelCommaSeparatedValues(match[1]);
  return [light, dark];
}

function colourTokens(css: string): Array<[name: string, value: string]> {
  return [...declaredTokens(css)].filter(([name]) => name.startsWith("--sui-color-"));
}

function ruleSelector(css: string): string {
  return css.slice(0, css.indexOf("{")).trim();
}

function zeroSpecificityGroups(selector: string): string[] {
  return [...selector.matchAll(/:where\(([^)]*)\)/g)].map((match) => match[1]);
}

function fullSpecificityPart(selector: string): string {
  return selector
    .replace(/:where\([^)]*\)/g, "")
    .replace(/^[\s,]+/, "")
    .trim();
}

describe("theme tokens", () => {
  it("must define every hue step when the ramps are loaded", () => {
    const ramps = declaredTokens(rampsCss);

    const missing = hues
      .flatMap((hue) => steps.map((step) => `--sui-${hue}-${step}`))
      .filter((name) => !ramps.has(name));

    expect(missing).toEqual([]);
    expect(ramps.get("--sui-black")).toBe("#000");
    expect(ramps.get("--sui-white")).toBe("#fff");
  });

  it("must declare the same tokens when playful is compared with default", () => {
    const defaultNames = [...declaredTokens(defaultThemeCss).keys()].sort();
    const playfulNames = [...declaredTokens(playfulThemeCss).keys()].sort();

    expect(playfulNames).toEqual(defaultNames);
  });

  it.each(themes)("must declare no colour token when the theme is $name", ({ css }) => {
    expect(colourTokens(css)).toEqual([]);
  });

  it("must test every palette when compared with the palette names", () => {
    expect(palettes.map(({ name }) => name)).toEqual([...paletteNames]);
  });

  it.each(palettes)("must declare the same tokens as bright when the palette is $name", ({ css }) => {
    const brightNames = [...declaredTokens(brightPaletteCss).keys()].sort();

    expect([...declaredTokens(css).keys()].sort()).toEqual(brightNames);
  });

  it.each(palettes)("must declare only colour tokens when the palette is $name", ({ css }) => {
    const tokens = [...declaredTokens(css).keys()];

    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.filter((name) => !name.startsWith("--sui-color-"))).toEqual([]);
  });

  it.each(palettes)("must define every colour token with light-dark() when the palette is $name", ({ css }) => {
    for (const [name, value] of colourTokens(css)) {
      expect(value, name).toMatch(/^light-dark\(/);
    }
  });

  it.each(palettes)("must use different light and dark values when the palette is $name", ({ css, name }) => {
    const exceptions = sameInBothModes[name];

    for (const [tokenName, value] of colourTokens(css)) {
      if (exceptions.includes(tokenName)) {
        continue;
      }

      const [light, dark] = lightDarkValues(value);
      expect(light, tokenName).not.toBe(dark);
    }
  });

  it.each(palettes)(
    "must keep the same-in-both-modes exceptions identical when the palette is $name",
    ({ css, name }) => {
      const exceptions = sameInBothModes[name];
      const exceptionEntries = colourTokens(css).filter(([tokenName]) => exceptions.includes(tokenName));

      expect(exceptionEntries.map(([tokenName]) => tokenName).sort()).toEqual([...exceptions].sort());
      for (const [tokenName, value] of exceptionEntries) {
        const [light, dark] = lightDarkValues(value);
        expect(light, tokenName).toBe(dark);
      }
    }
  );

  it.each(palettes)("must apply its colours to its own attribute when the palette is $name", ({ css, name }) => {
    expect(fullSpecificityPart(ruleSelector(css))).toBe(`[data-sui-palette="${name}"]`);
  });

  it.each(palettes.filter(({ companion }) => companion !== undefined))(
    "must apply its colours to its companion theme at zero specificity when the palette is $name",
    ({ companion, css }) => {
      const groups = zeroSpecificityGroups(ruleSelector(css));

      expect(groups.some((group) => group.includes(`[data-sui-theme="${companion}"]`))).toBe(true);
    }
  );

  it("must apply bright at zero specificity when the root sets no palette", () => {
    const groups = zeroSpecificityGroups(ruleSelector(brightPaletteCss));

    expect(
      groups.some((group) =>
        group
          .split(",")
          .map((part) => part.trim())
          .includes(":root")
      )
    ).toBe(true);
  });
});
