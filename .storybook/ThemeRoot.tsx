import type { JSX, ReactNode } from "react";
import { useLayoutEffect } from "react";

import type { ThemeMode, ThemeName } from "../src/components/Theme";
import { Theme } from "../src/components/Theme";

interface ThemeRootProps {
  children: ReactNode;

  /**
   * Whether the story renders on a docs page rather than on its own canvas
   */
  isDocs: boolean;

  mode: ThemeMode;
  theme: ThemeName;
}

/**
 * Applies the toolbar's theme and mode to a story. On its own canvas they go on
 * `document.documentElement`, so `styles.css` paints the whole canvas. On a docs page, where
 * `ThemeDocsContainer` owns the document, each story renders in a `Theme` island instead.
 */
export function ThemeRoot({ children, isDocs, mode, theme }: ThemeRootProps): JSX.Element {
  useLayoutEffect(() => {
    if (isDocs) {
      return;
    }

    document.documentElement.setAttribute("data-sui-mode", mode);
    document.documentElement.setAttribute("data-sui-theme", theme);
  }, [isDocs, mode, theme]);

  if (isDocs) {
    return (
      <Theme mode={mode} style={{ padding: "1rem" }} theme={theme}>
        {children}
      </Theme>
    );
  }

  return <>{children}</>;
}
