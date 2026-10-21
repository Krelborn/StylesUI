import type { RefObject } from "react";
import { useEffect, useLayoutEffect, useRef } from "react";

interface FragmentTargetRevealOptions {
  /**
   * Whether the panel is closed and can be found, so the fragment's target may open it
   */
  findable: boolean;

  /**
   * Called when the page's URL fragment points inside the panel as it mounts
   */
  onMatch: () => void;

  /**
   * Whether the item is open
   */
  open: boolean;

  /**
   * The panel element
   */
  panelRef: RefObject<HTMLElement | null>;
}

/**
 * Opens a closed panel when, as it mounts, the page's URL fragment points at an element inside it, and scrolls that
 * element into view once the panel has opened
 *
 * @param options the panel, its state and what to do on a match
 */
export function useFragmentTargetReveal({ findable, onMatch, open, panelRef }: FragmentTargetRevealOptions): void {
  const checked = useRef(false);
  const pendingTarget = useRef<Element | null>(null);

  // The browser's own fragment navigation ran before the panel was hidden until found, so it could not open it
  useLayoutEffect(() => {
    if (checked.current) {
      return;
    }

    checked.current = true;
    const target = fragmentTarget();

    if (findable && target !== null && panelRef.current?.contains(target) === true) {
      pendingTarget.current = target;
      onMatch();
    }
  }, [findable, onMatch, panelRef]);

  useEffect(() => {
    if (open && pendingTarget.current !== null) {
      pendingTarget.current.scrollIntoView();
      pendingTarget.current = null;
    }
  }, [open]);
}

/**
 * Finds the element the page's URL fragment points at
 *
 * @returns the element whose id is the fragment, as written or percent-decoded, or null when there is none
 */
function fragmentTarget(): Element | null {
  const fragment = window.location.hash.slice(1);

  if (fragment === "") {
    return null;
  }

  return document.getElementById(fragment) ?? document.getElementById(decodedFragment(fragment));
}

/**
 * Percent-decodes a URL fragment
 *
 * @param fragment the fragment without its `#`
 * @returns the decoded fragment, or the fragment as written when it holds a malformed escape
 */
function decodedFragment(fragment: string): string {
  try {
    return decodeURIComponent(fragment);
  } catch {
    return fragment;
  }
}
