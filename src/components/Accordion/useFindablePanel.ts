import type { RefObject } from "react";
import { useLayoutEffect, useRef, useState } from "react";

interface FindablePanelOptions {
  /**
   * Whether the item is disabled, so its closed panel is skipped by find-in-page
   */
  disabled: boolean;

  /**
   * Called when find-in-page or a fragment link matches inside the closed panel
   */
  onMatch: () => void;

  /**
   * Whether the item is open
   */
  open: boolean;
}

/**
 * Keeps a closed panel hidden until find-in-page or a fragment link matches inside it. Render the panel with `hidden`
 * set to whether it is closed, and give it the returned ref.
 *
 * @param options the item's state and what to do on a match
 * @returns the ref for the panel element
 */
export function useFindablePanel({ disabled, onMatch, open }: FindablePanelOptions): RefObject<HTMLDivElement | null> {
  const panelRef = useRef<HTMLDivElement>(null);
  // Changes on every match the browser reveals, so a match a controlled parent refuses is hidden again
  const [revealCount, setRevealCount] = useState(0);
  const findable = !open && !disabled;

  // React renders hidden as a boolean, so a closed panel is hidden on the first render and upgraded before paint
  useLayoutEffect(() => {
    if (!open) {
      panelRef.current?.setAttribute("hidden", disabled ? "" : "until-found");
    }
  }, [disabled, open, revealCount]);

  useLayoutEffect(() => {
    const panel = panelRef.current;

    if (panel === null || !findable) {
      return undefined;
    }

    function handleBeforeMatch(): void {
      setRevealCount((count) => count + 1);
      onMatch();
    }

    panel.addEventListener("beforematch", handleBeforeMatch);

    return () => panel.removeEventListener("beforematch", handleBeforeMatch);
  }, [findable, onMatch]);

  return panelRef;
}
