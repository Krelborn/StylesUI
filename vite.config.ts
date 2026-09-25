/// <reference types="vitest/config" />
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import { libInjectCss } from "vite-plugin-lib-inject-css";

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
    // Matches the light-dark() support floor; a lower target makes lightningcss rewrite light-dark() into fallback variables that break theme nesting
    cssTarget: ["chrome123", "edge123", "firefox120", "safari17.5"],
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
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    // Vitest otherwise stubs ?raw CSS imports to an empty string, since it assumes
    // CSS content isn't needed unless it's a CSS module
    css: {
      include: [/\.css\?raw$/],
    },
  },
});
