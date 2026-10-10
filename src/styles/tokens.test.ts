import { describe, expect, it } from "vitest";

import brightPaletteCss from "./palettes/bright.css?raw";
import mistPaletteCss from "./palettes/mist.css?raw";
import popPaletteCss from "./palettes/pop.css?raw";
import defaultThemeCss from "./themes/default.css?raw";
import playfulThemeCss from "./themes/playful.css?raw";
import { declaredTokens } from "./tokenSource";
import tokensCss from "./tokens.css?raw";

const derivedTokens = ["--sui-color-control-border", "--sui-color-shadow", "--sui-shadow-sm"];

function selectorsDeclaring(css: string, token: string): string[] {
  const rule = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].find(([, , body]) => body.includes(`${token}:`));
  if (!rule) {
    throw new Error(`Expected a rule declaring ${token}`);
  }

  return rule[1]
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(",")
    .map((selector) => selector.trim())
    .sort();
}

describe("tokens", () => {
  it.each(derivedTokens)(
    "must declare %s on every theme and palette element when a theme or palette is set",
    (token) => {
      expect(selectorsDeclaring(tokensCss, token)).toEqual([":root", "[data-sui-palette]", "[data-sui-theme]"]);
    }
  );

  it.each([
    { css: defaultThemeCss, name: "default theme" },
    { css: playfulThemeCss, name: "playful theme" },
    { css: brightPaletteCss, name: "bright palette" },
    { css: popPaletteCss, name: "pop palette" },
    { css: mistPaletteCss, name: "mist palette" },
  ])("must leave the derived tokens to tokens.css when the source is the $name", ({ css }) => {
    const declared = [...declaredTokens(css).keys()];

    expect(declared.filter((name) => derivedTokens.includes(name))).toEqual([]);
  });

  it("must declare the spacing scale on every theme and palette element when a theme or palette is set", () => {
    expect(selectorsDeclaring(tokensCss, "--sui-space-1")).toEqual([":root", "[data-sui-palette]", "[data-sui-theme]"]);
  });
});
