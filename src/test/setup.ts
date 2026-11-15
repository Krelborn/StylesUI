import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Testing Library's asyncWrapper waits on a setTimeout it only advances through Jest's global, so under Vitest's fake
// timers every user-event call hangs without this.
vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) });

// jsdom has no Popover API and its default stylesheet hides every popover, because none ever matches :popover-open.
// showPopover() marks a popover open instead, and this sheet undoes the hiding for it. A shadow tree takes no styles
// from the document, so every shadow root adopts the sheet too.
const popoverSheet = new CSSStyleSheet();
popoverSheet.replaceSync("[popover][data-popover-open] { display: block !important; }");
document.adoptedStyleSheets = [...document.adoptedStyleSheets, popoverSheet];

const attachShadow = Element.prototype.attachShadow;

Element.prototype.attachShadow = function attachShadowWithPopoverSheet(
  this: Element,
  init: ShadowRootInit
): ShadowRoot {
  const shadowRoot = attachShadow.call(this, init);
  shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, popoverSheet];

  return shadowRoot;
};

HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement): void {
  this.setAttribute("data-popover-open", "");
};

HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement): void {
  this.removeAttribute("data-popover-open");
};

// jsdom matches :focus-visible wherever :focus matches. A browser matches it after a pointer press only on a control
// that takes typed text, so matches(":focus-visible") follows the test's last input here; other selectors and
// stylesheets still see jsdom's own.
let lastInput: "keyboard" | "pointer" | undefined;

document.addEventListener(
  "keydown",
  () => {
    lastInput = "keyboard";
  },
  { capture: true }
);

for (const type of ["mousedown", "pointerdown", "touchstart"]) {
  document.addEventListener(
    type,
    () => {
      lastInput = "pointer";
    },
    { capture: true }
  );
}

// jsdom parses :popover-open but never matches it, so it is read as the attribute the stubs above set
const matches = Element.prototype.matches;

Element.prototype.matches = function matchesAsBrowser(this: Element, selectors: string): boolean {
  if (selectors === ":focus-visible") {
    return matches.call(this, lastInput === "pointer" ? ":focus:read-write" : ":focus");
  }

  return matches.call(this, selectors.replaceAll(":popover-open", "[data-popover-open]"));
} as typeof matches;

// jsdom has no scrollIntoView; tests that care spy on this stub
Element.prototype.scrollIntoView = function scrollIntoView(): void {};

afterEach(() => {
  // Testing Library only auto-cleans when test globals are enabled
  cleanup();
  lastInput = undefined;
});
