import type { PointerEvent } from "react";
import { useEffect, useRef } from "react";

import type { Point, Triangle } from "../../menus";
import { graceTriangle, isInsideTriangle, renderedItems } from "../../menus";

// How long the pointer must rest on another item before it takes focus from an open submenu
const switchDelay = 100;

// How long the pointer may rest on the way to a submenu before the item under it takes focus
const graceDelay = 400;

/**
 * A menu's pointer handling
 */
interface MenuPointer {
  /**
   * Focuses the item under the pointer, after a short delay when that would close an open submenu, and not at all while
   * the pointer is heading into one
   */
  handlePointerMove: (event: PointerEvent<HTMLDivElement>) => void;

  /**
   * Cancels a focus the pointer was waiting to move once it moves onto the page outside the menu and its submenus
   */
  handlePointerOut: (event: PointerEvent<HTMLDivElement>) => void;

  /**
   * Lets the pointer cross the menu's other items on its way into a submenu that is open, without closing it
   */
  startPointerGrace: (exit: Point, submenu: HTMLElement) => void;
}

/**
 * Moves focus in a menu with the pointer, so the pointer and the keyboard share one active item
 *
 * @returns the menu's pointer move and out handlers, and a way for a submenu to start the pointer's grace
 */
export function useMenuPointer(): MenuPointer {
  const graceRef = useRef<Triangle | null>(null);
  const hoveredItemRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const switchingToRef = useRef<HTMLElement | null>(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function focusLater(item: HTMLElement | null, delay: number, page: Document): void {
    const focused = page.activeElement;

    cancelFocus();
    timerRef.current = setTimeout(() => {
      graceRef.current = null;
      switchingToRef.current = null;

      // Focus the keyboard moved while the pointer waited stays where the keyboard put it
      if (page.activeElement === focused) {
        focusHovered(item);
      }
    }, delay);
  }

  function cancelFocus(): void {
    clearTimeout(timerRef.current);
    switchingToRef.current = null;
  }

  function startPointerGrace(exit: Point, submenu: HTMLElement): void {
    graceRef.current = graceTriangle(exit, submenu.getBoundingClientRect());
    focusLater(hoveredItemRef.current, graceDelay, submenu.ownerDocument);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>): void {
    const menu = event.currentTarget;
    const target = event.target as Element;

    if (event.pointerType === "touch") {
      return;
    }

    // Inside a submenu, which handles its own items: the pointer has arrived
    if (target.closest('[role="menu"]') !== menu) {
      graceRef.current = null;
      cancelFocus();

      return;
    }

    const item = renderedItems(menu).find((candidate) => candidate.contains(target)) ?? null;
    hoveredItemRef.current = item;

    if (isHeadingIntoSubmenu({ x: event.clientX, y: event.clientY })) {
      focusLater(item, graceDelay, menu.ownerDocument);
    } else {
      graceRef.current = null;
      moveFocusTowards(menu, item);
    }
  }

  function handlePointerOut(event: PointerEvent<HTMLDivElement>): void {
    const next = event.relatedTarget;

    if (next instanceof Node && !event.currentTarget.contains(next)) {
      graceRef.current = null;
      cancelFocus();
    }
  }

  function isHeadingIntoSubmenu(point: Point): boolean {
    return graceRef.current !== null && isInsideTriangle(point, graceRef.current);
  }

  function moveFocusTowards(menu: HTMLElement, item: HTMLElement | null): void {
    // The delay runs from when the pointer reached this item, not from its latest move over it
    if (item !== null && item === switchingToRef.current) {
      return;
    }

    cancelFocus();

    if (item === null || item === menu.ownerDocument.activeElement) {
      return;
    }

    if (hasOpenSubmenu(menu) && item.getAttribute("aria-expanded") !== "true") {
      focusLater(item, switchDelay, menu.ownerDocument);
      switchingToRef.current = item;
    } else {
      focusHovered(item);
    }
  }

  return { handlePointerMove, handlePointerOut, startPointerGrace };
}

/**
 * Focuses the item under the pointer without scrolling, which would move another item under it
 *
 * @param item the item, or null when the pointer is over none
 */
function focusHovered(item: HTMLElement | null): void {
  item?.focus({ preventScroll: true });
}

/**
 * Whether one of a menu's own items has its submenu open
 *
 * @param menu the menu element
 * @returns true when an item of the menu is expanded
 */
function hasOpenSubmenu(menu: HTMLElement): boolean {
  return renderedItems(menu).some((item) => item.getAttribute("aria-expanded") === "true");
}
