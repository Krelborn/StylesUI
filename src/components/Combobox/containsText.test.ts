import { describe, expect, it } from "vitest";

import { containsText } from "./containsText";

describe("containsText", () => {
  it.each([
    { inputValue: "fra", textValue: "France" },
    { inputValue: "ANCE", textValue: "France" },
    { inputValue: "cote", textValue: "Côte d’Ivoire" },
    { inputValue: "Curaçao", textValue: "Curacao" },
    { inputValue: "  zeal ", textValue: "New Zealand" },
    { inputValue: "", textValue: "Japan" },
  ])("must match $textValue when '$inputValue' is typed", ({ inputValue, textValue }) => {
    expect(containsText(textValue, inputValue)).toBe(true);
  });

  it.each([
    { inputValue: "fra nce", textValue: "France" },
    { inputValue: "japan", textValue: "Jamaica" },
  ])("must not match $textValue when '$inputValue' is typed", ({ inputValue, textValue }) => {
    expect(containsText(textValue, inputValue)).toBe(false);
  });
});
