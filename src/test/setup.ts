import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Testing Library's asyncWrapper waits on a setTimeout it only advances through Jest's global, so under Vitest's fake
// timers every user-event call hangs without this.
vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) });

// jsdom has no Popover API and its default stylesheet hides every popover, because none ever matches :popover-open.
// showPopover() marks a popover open instead, and this rule undoes the hiding for it.
const popoverStyle = document.createElement("style");
popoverStyle.textContent = "[popover][data-popover-open] { display: block !important; }";
document.head.append(popoverStyle);

HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement): void {
  this.setAttribute("data-popover-open", "");
};

HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement): void {
  this.removeAttribute("data-popover-open");
};

// jsdom parses :popover-open but never matches it, so it is read as the attribute the stubs above set
const matches = Element.prototype.matches;

Element.prototype.matches = function matchesWithPopoverOpen(this: Element, selectors: string): boolean {
  return matches.call(this, selectors.replaceAll(":popover-open", "[data-popover-open]"));
} as typeof matches;

// Testing Library only auto-cleans when test globals are enabled
afterEach(() => {
  cleanup();
});
