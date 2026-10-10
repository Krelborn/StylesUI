import type { ComponentProps, JSX } from "react";
import { useLayoutEffect } from "react";
import { DocsContainer } from "@storybook/addon-docs/blocks";

/**
 * Docs page container that keeps the document light, default and Bright to match Storybook's docs
 * UI, whatever theme, palette and mode the last story canvas applied
 */
export function ThemeDocsContainer(props: ComponentProps<typeof DocsContainer>): JSX.Element {
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-sui-mode", "light");
    document.documentElement.setAttribute("data-sui-theme", "default");
    document.documentElement.removeAttribute("data-sui-palette");
  }, []);

  return <DocsContainer {...props} />;
}
