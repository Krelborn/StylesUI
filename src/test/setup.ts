import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

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

// Testing Library only auto-cleans when test globals are enabled
afterEach(() => {
  cleanup();
});
