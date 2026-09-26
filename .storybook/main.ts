import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

import { lightDarkCssTarget } from "../vite.config.ts";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.mdx", "../src/**/*.stories.tsx"],
  viteFinal: (config) => mergeConfig(config, { build: { cssTarget: lightDarkCssTarget } }),
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
  // The TypeScript-based extractors need the TypeScript JS API, which TypeScript 7 no longer exposes
  typescript: {
    reactDocgen: "react-docgen",
  },
};

export default config;
