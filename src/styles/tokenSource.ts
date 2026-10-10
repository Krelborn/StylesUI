import type { PaletteName } from "../components/Theme";

export const hues = ["gray", "red", "orange", "yellow", "green", "blue", "indigo", "violet", "pink"] as const;
export const steps = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
export const paletteNames = ["bright", "pop", "mist", "paper"] as const satisfies readonly PaletteName[];

export function declaredTokens(css: string): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const match of css.matchAll(/(--sui-[\w-]+):\s*([^;]+);/g)) {
    tokens.set(match[1], match[2].trim());
  }
  return tokens;
}
