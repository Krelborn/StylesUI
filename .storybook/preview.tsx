import type { Preview } from "@storybook/react-vite";

import type { ThemeMode, ThemeName } from "../src/components/Theme";

import "../src/styles/index.css";

import { ThemeRoot } from "./ThemeRoot";

interface ThemeGlobals {
  mode: ThemeMode;
  theme: ThemeName;
}

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const { mode, theme } = context.globals as ThemeGlobals;

      return (
        <ThemeRoot mode={mode} theme={theme}>
          <Story />
        </ThemeRoot>
      );
    },
  ],
  globalTypes: {
    mode: {
      description: "Colour mode",
      toolbar: {
        dynamicTitle: true,
        icon: "mirror",
        items: ["system", "light", "dark"],
      },
    },
    theme: {
      description: "Theme",
      toolbar: {
        dynamicTitle: true,
        icon: "paintbrush",
        items: ["default", "playful"],
      },
    },
  },
  initialGlobals: {
    mode: "system",
    theme: "default",
  },
  parameters: {
    a11y: {
      options: {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"],
        },
      },
      test: "todo",
    },
  },
};

export default preview;
