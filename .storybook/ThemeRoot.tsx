import type { JSX, ReactNode } from "react";
import { useLayoutEffect } from "react";

import type { PaletteName, ThemeMode, ThemeName } from "../src/components/Theme";
import { Theme } from "../src/components/Theme";

interface ThemeRootProps {
  children: ReactNode;

  /**
   * Whether the story renders on a docs page rather than on its own canvas
   */
  isDocs: boolean;

  mode: ThemeMode;

  /**
   * Palette to apply, or undefined for the theme's companion palette
   */
  palette: PaletteName | undefined;

  theme: ThemeName;
}

/**
 * Applies the toolbar's theme, palette and mode to a story. On its own canvas they go on
 * `document.documentElement`, so `styles.css` paints the whole canvas. On a docs page, where
 * `ThemeDocsContainer` owns the document, each story renders in a `Theme` island instead.
 */
export function ThemeRoot({ children, isDocs, mode, palette, theme }: ThemeRootProps): JSX.Element {
  useLayoutEffect(() => {
    if (isDocs) {
      return;
    }

    const root = document.documentElement;
    root.setAttribute("data-sui-mode", mode);
    root.setAttribute("data-sui-theme", theme);

    if (palette === undefined) {
      root.removeAttribute("data-sui-palette");
    } else {
      root.setAttribute("data-sui-palette", palette);
    }
  }, [isDocs, mode, palette, theme]);

  if (isDocs) {
    return (
      <Theme mode={mode} palette={palette} style={{ padding: "1rem" }} theme={theme}>
        {children}
      </Theme>
    );
  }

  return <>{children}</>;
}
