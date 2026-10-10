import type { Preview } from "@storybook/react-vite";

import type { PaletteName, ThemeMode, ThemeName } from "../src/components/Theme";
import { componentDescription } from "../src/docs/componentDescription";
import { paletteNames } from "../src/styles/tokenSource";

import "../fonts/playful.css";
import "../src/styles/index.css";

import { ThemeDocsContainer } from "./ThemeDocsContainer";
import { ThemeRoot } from "./ThemeRoot";

interface ThemeGlobals {
  mode: ThemeMode;
  palette: PaletteName | "theme";
  theme: ThemeName;
}

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const { mode, palette, theme } = context.globals as ThemeGlobals;

      return (
        <ThemeRoot
          isDocs={context.viewMode === "docs"}
          mode={mode}
          palette={palette === "theme" ? undefined : palette}
          theme={theme}
        >
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
    palette: {
      description: "Palette; theme uses the theme's companion palette",
      toolbar: {
        dynamicTitle: true,
        icon: "contrast",
        items: ["theme", ...paletteNames],
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
    palette: "theme",
    theme: "default",
  },
  tags: ["autodocs"],
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
    docs: {
      container: ThemeDocsContainer,
      extractComponentDescription: componentDescription,
    },
    options: {
      storySort: {
        order: ["Introduction", "Guides", ["Theming", "Composition", "Forms"], "Foundations", "*"],
      },
    },
  },
};

export default preview;
