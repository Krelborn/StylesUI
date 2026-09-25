import type { Preview } from "@storybook/react-vite";

import type { ThemeMode, ThemeName } from "../src/components/Theme";
import { Theme } from "../src/components/Theme";

import "../src/styles/index.css";

interface ThemeGlobals {
  mode: ThemeMode;
  theme: ThemeName;
}

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const { mode, theme } = context.globals as ThemeGlobals;

      return (
        <Theme mode={mode} name={theme} style={{ minHeight: "100vh", padding: "1rem" }}>
          <Story />
        </Theme>
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
};

export default preview;
