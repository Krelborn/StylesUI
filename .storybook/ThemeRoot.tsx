import type { JSX, ReactNode } from "react";
import { useEffect } from "react";

import type { ThemeMode, ThemeName } from "../src/components/Theme";

interface ThemeRootProps {
  children: ReactNode;
  mode: ThemeMode;
  theme: ThemeName;
}

/**
 * Sets `data-sui-mode`/`data-sui-theme` on `document.documentElement` from the toolbar globals,
 * so `styles.css` paints the whole Storybook canvas rather than a wrapper element.
 */
export function ThemeRoot({ children, mode, theme }: ThemeRootProps): JSX.Element {
  useEffect(() => {
    document.documentElement.setAttribute("data-sui-mode", mode);
    document.documentElement.setAttribute("data-sui-theme", theme);
  }, [mode, theme]);

  return <>{children}</>;
}
