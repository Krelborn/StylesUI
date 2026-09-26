/// <reference types="vitest/config" />
import path from "node:path";

import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vite";
import { libInjectCss } from "vite-plugin-lib-inject-css";

const storybookModes = ["light", "dark"];
const storybookThemes = ["default", "playful"];

// Matches the light-dark() support floor; a lower target makes lightningcss rewrite light-dark() into fallback variables that break theme nesting
// Imported by .storybook/main.ts, which fallow's ignorePatterns excludes from analysis
// fallow-ignore-next-line unused-export
export const lightDarkCssTarget = ["chrome123", "edge123", "firefox120", "safari17.5"];

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    // Injects each chunk's CSS import so consumers only pull in styles for components they use
    libInjectCss(),
  ],
  css: {
    modules: {
      generateScopedName: "sui-[local]-[hash:base64:5]",
    },
  },
  build: {
    lib: {
      entry: { index: "src/index.ts", styles: "src/styles/index.css" },
      formats: ["es"],
    },
    cssTarget: lightDarkCssTarget,
    cssCodeSplit: true,
    copyPublicDir: false,
    rolldownOptions: {
      external: /^(react(-dom)?|clsx)($|\/)/,
      output: {
        // One output file per source module keeps the library tree-shakable
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
        // Drop ".module" from emitted CSS so consumer bundlers treat it as plain global CSS
        // instead of re-processing it as a side-effect-free CSS module and tree-shaking it away
        assetFileNames: ({ names }) => names[0].replace(/\.module\.css$/, ".css"),
      },
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          environment: "jsdom",
          setupFiles: ["src/test/setup.ts"],
          // Vitest otherwise stubs ?raw CSS imports to an empty string, since it assumes
          // CSS content isn't needed unless it's a CSS module
          css: {
            include: [/\.css\?raw$/],
          },
        },
      },
      // Every story runs once per mode and theme, so axe checks colour contrast in each.
      // The addon reads the script from an env var each storybookTest() call writes, and
      // starts Storybook from each project given a script, so exactly one project, the
      // last one created, gets it.
      ...storybookModes.flatMap((mode, modeIndex) =>
        storybookThemes.map((theme, themeIndex) => {
          const isLastProject = modeIndex === storybookModes.length - 1 && themeIndex === storybookThemes.length - 1;

          return {
            extends: true,
            plugins: [
              storybookTest({
                configDir: path.join(import.meta.dirname, ".storybook"),
                initialGlobals: { mode, theme },
                ...(isLastProject ? { storybookScript: "pnpm storybook --no-open" } : {}),
              }),
            ],
            test: {
              name: `storybook-${mode}-${theme}`,
              browser: {
                enabled: true,
                headless: true,
                provider: playwright(),
                instances: [{ browser: "chromium" as const }],
              },
            },
          };
        })
      ),
    ],
  },
});
