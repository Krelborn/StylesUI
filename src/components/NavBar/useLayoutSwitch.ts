import type { RefObject } from "react";
import { useEffect, useEffectEvent, useRef } from "react";

import { isNavBarCollapsed } from "./isNavBarCollapsed";

interface UseLayoutSwitchOptions {
  /**
   * The bar's collapse width, a change of which can switch the layout with no resize
   */
  collapse: string;

  /**
   * The bar's layout, whose resizes are watched
   */
  layoutRef: RefObject<HTMLElement | null>;

  /**
   * The bar's navigation, whose layout is read
   */
  navigationRef: RefObject<HTMLElement | null>;

  /**
   * Called each time the bar switches between its wide and collapsed layouts
   */
  onSwitch: () => void;
}

/**
 * Reports a `NavBar` switching between its wide and collapsed layouts, from a resize or a new collapse width
 *
 * @param options the bar's collapse width, its layout and navigation, and what to call on a switch
 */
export function useLayoutSwitch({ collapse, layoutRef, navigationRef, onSwitch }: UseLayoutSwitchOptions): void {
  // Kept across the effect's runs, so a new collapse width is compared with the layout before it
  const collapsedRef = useRef<boolean | null>(null);
  const reportSwitch = useEffectEvent(onSwitch);

  useEffect(() => {
    const layout = layoutRef.current;
    const navigation = navigationRef.current;

    if (layout === null || navigation === null) {
      return;
    }

    const checkLayout = (): void => {
      const collapsed = isNavBarCollapsed(navigation);

      if (collapsedRef.current !== null && collapsedRef.current !== collapsed) {
        reportSwitch();
      }

      collapsedRef.current = collapsed;
    };

    checkLayout();

    // Missing where nothing is laid out, such as jsdom
    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(checkLayout);

    observer.observe(layout);

    return () => observer.disconnect();
  }, [collapse, layoutRef, navigationRef]);
}
