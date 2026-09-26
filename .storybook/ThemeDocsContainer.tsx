import type { ComponentProps, JSX } from "react";
import { useLayoutEffect } from "react";
import { DocsContainer } from "@storybook/addon-docs/blocks";

/**
 * Docs page container that keeps the document light and default to match Storybook's docs UI,
 * whatever theme and mode the last story canvas applied
 */
export function ThemeDocsContainer(props: ComponentProps<typeof DocsContainer>): JSX.Element {
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-sui-mode", "light");
    document.documentElement.setAttribute("data-sui-theme", "default");
  }, []);

  return <DocsContainer {...props} />;
}
