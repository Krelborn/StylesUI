import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

import { lightDarkCssTarget } from "../vite.config.ts";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.stories.tsx"],
  viteFinal: (config) => mergeConfig(config, { build: { cssTarget: lightDarkCssTarget } }),
};

export default config;
