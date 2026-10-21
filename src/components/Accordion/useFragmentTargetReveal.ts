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
 * Finds the element the page's URL fragment points at, as the browser's fragment navigation does
 *
 * @returns the element whose id, or the `a` element whose name, is the fragment as written or else percent-decoded,
 *   or null when there is none
 */
function fragmentTarget(): Element | null {
  const fragment = window.location.hash.slice(1);

  if (fragment === "") {
    return null;
  }

  return potentialIndicatedElement(fragment) ?? potentialIndicatedElement(decodedFragment(fragment));
}

/**
 * Finds the element a fragment names
 *
 * @param fragment the fragment without its `#`
 * @returns the first element with the fragment as its id, else the first `a` element with it as its name, or null
 */
function potentialIndicatedElement(fragment: string): Element | null {
  return (
    document.getElementById(fragment) ??
    Array.from(document.getElementsByName(fragment)).find((element) => element instanceof HTMLAnchorElement) ??
    null
  );
}

/**
 * Percent-decodes a URL fragment as the browser does
 *
 * @param fragment the fragment without its `#`
 * @returns the decoded fragment, with a malformed escape left as written and bytes that are not UTF-8 replaced by
 *   U+FFFD
 */
function decodedFragment(fragment: string): string {
  const input = new TextEncoder().encode(fragment);
  const bytes: number[] = [];

  for (let i = 0; i < input.length; i++) {
    const hex = String.fromCharCode(input[i + 1] ?? 0, input[i + 2] ?? 0);

    if (input[i] === 0x25 && /^[\da-f]{2}$/i.test(hex)) {
      bytes.push(Number.parseInt(hex, 16));
      i += 2;
    } else {
      bytes.push(input[i]);
    }
  }

  return new TextDecoder("utf-8", { ignoreBOM: true }).decode(new Uint8Array(bytes));
}
