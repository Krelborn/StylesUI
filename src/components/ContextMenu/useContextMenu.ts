import type { CSSProperties, FocusEvent, KeyboardEvent, MouseEvent, PointerEvent, ToggleEvent } from "react";
import { useEffect, useRef, useState } from "react";

import type { RequiredAccessibleName } from "../../accessibility";
import type { OpeningFocus } from "../../menus";
import { closeWhenFocusLeaves, focusOnOpening, leaveMenuOnTab, watchRemovals } from "../../menus";
import { mergeProps, syncPopover } from "../../overlays";
import type { MenuOverlayProps } from "../Menu/Menu";
// The Popover barrel would also bring Popover's stylesheet into every bundle that uses a context menu
import { usePopover } from "../Popover/usePopover";

/**
 * Options for `useContextMenu`
 */
export interface UseContextMenuOptions {
  /**
   * Called with the new open state when the menu opens or closes
   */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Props `getTargetProps` sets on the region
 */
interface ContextMenuTargetProps {
  /**
   * Opens the menu at the pointer
   */
  onContextMenu: (event: MouseEvent<HTMLElement>) => void;

  /**
   * Notes the pointer pressing in the region, which the menu holds while the press that opened it lasts
   */
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;

  /**
   * Names the region as the menu's anchor
   */
  style: CSSProperties;
}

/**
 * Props `getMenuProps` sets on the `Menu`
 */
interface ContextMenuOverlayProps extends MenuOverlayProps {
  /**
   * Places the menu at the point it opened at rather than beside the region
   */
  "data-context-menu": "";

  /**
   * Closes the menu when focus leaves it
   */
  onBlur: (event: FocusEvent<HTMLElement>) => void;

  /**
   * Closes the menu on Tab, returning focus to where it opened from
   */
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;

  /**
   * The point's distances from each edge of the region
   */
  style: CSSProperties;
}

/**
 * Prop getters for the region a context menu opens in and its `Menu`, whether it is open, what it opened for, and a
 * way to close it
 */
export interface UseContextMenuResult {
  /**
   * Closes the menu, returning focus to where it opened from as choosing an item does, and reports `false` through
   * `onOpenChange`
   */
  close: () => void;

  /**
   * Returns the props to spread on the `Menu`, merged with the given ones, which must name the menu with `aria-label`
   * or `aria-labelledby`, since no trigger names it
   */
  getMenuProps: <Props extends object>(
    props: Props & RequiredAccessibleName & Partial<ContextMenuOverlayProps>
  ) => Omit<Props, keyof ContextMenuOverlayProps> & ContextMenuOverlayProps;

  /**
   * Returns the props to spread on the region the menu opens in, merged with any given: where both set a handler, both
   * run, the given one first, and `style` objects merge
   */
  getTargetProps: <Props extends object>(
    props?: Props & Partial<ContextMenuTargetProps>
  ) => Omit<Props, keyof ContextMenuTargetProps> & ContextMenuTargetProps;

  /**
   * Whether the menu is open
   */
  open: boolean;

  /**
   * The element the menu last opened for, such as the one under the pointer; `null` until it first opens
   */
  target: Element | null;
}

/**
 * The point a menu opens at, as distances in pixels from each edge of the region
 */
interface PointOffsets {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

/**
 * One opening of the menu: where, for what and where focus goes
 */
interface Opening {
  focus: OpeningFocus;
  offsets: PointOffsets;
  page: Document;
  pressingPointer: number | null;
  target: Element;
}

/**
 * Connects a `Menu` to a region, such as a list of files or a canvas, so a right-click in the region opens the menu at
 * the pointer, with focus on the menu itself, and the next Down or Up moves to the first or last item. Choosing an
 * item, Escape, Tab or a click outside closes it, and focus goes back to the element that had it when it opened,
 * unless a click outside put it elsewhere. `target` tells which element the menu opened for, so one menu can serve
 * every row.
 *
 * @param options the change callback
 * @returns prop getters for the region and the `Menu`, whether it is open, what it opened for, and `close`
 *
 * @example
 * const contextMenu = useContextMenu();
 *
 * <ul {...contextMenu.getTargetProps()} aria-label="Files">…</ul>
 * <Menu {...contextMenu.getMenuProps({ "aria-label": "File actions" })}>…</Menu>
 */
export function useContextMenu({ onOpenChange }: UseContextMenuOptions = {}): UseContextMenuResult {
  const popover = usePopover({ onOpenChange, placement: "bottom-start" });
  const [opening, setOpening] = useState<Opening | null>(null);
  const openingFocusRef = useRef<OpeningFocus>("menu");
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const returnsFocusRef = useRef(false);
  const closeRequestedRef = useRef(false);
  const removalWatcherRef = useRef<(() => void) | null>(null);
  const lastPointerRef = useRef<number | null>(null);
  const { anchorName, id: menuId } = popover.getOverlayProps();

  useEffect(() => () => removalWatcherRef.current?.(), []);

  // Shown once the menu has rendered with the new point, so it never appears at the last one
  useEffect(() => {
    const menu = opening?.page.getElementById(menuId);

    if (opening === null || menu === null || menu === undefined) {
      return;
    }

    if (menu.matches(":popover-open")) {
      focusOnOpening(menu, opening.focus);

      return;
    }

    openingFocusRef.current = opening.focus;

    const stopSyncing = syncPopover(menu, true);

    if (opening.pressingPointer !== null) {
      holdPress(menu, opening.pressingPointer);
    }

    return stopSyncing;
  }, [menuId, opening]);

  function handleContextMenu(event: MouseEvent<HTMLElement>): void {
    event.preventDefault();

    // Where the menu opens while the button is still down, as on macOS and Linux, its release would light dismiss it
    const pressingPointer = event.buttons === 0 ? null : lastPointerRef.current;

    openAt(event.currentTarget, event.target as Element, event.clientX, event.clientY, "menu", pressingPointer);
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>): void {
    lastPointerRef.current = event.pointerId;
  }

  function openAt(
    region: HTMLElement,
    target: Element,
    x: number,
    y: number,
    focus: OpeningFocus,
    pressingPointer: number | null
  ): void {
    const page = region.ownerDocument;
    const menu = page.getElementById(menuId);
    const focused = page.activeElement;
    const bounds = region.getBoundingClientRect();

    // Reopening with focus in the menu keeps the element it first opened from
    if (focused instanceof HTMLElement && focused !== page.body && menu?.contains(focused) !== true) {
      returnFocusRef.current = focused;
    } else if (menu?.matches(":popover-open") !== true) {
      returnFocusRef.current = null;
    }

    setOpening({
      focus,
      offsets: { bottom: bounds.bottom - y, left: x - bounds.left, right: bounds.right - x, top: y - bounds.top },
      page,
      pressingPointer,
      target,
    });
  }

  function handleMenuBeforeToggle(event: ToggleEvent<HTMLElement>): void {
    const menu = event.currentTarget;

    // Only now, before the menu hides, can focus be found inside it. WebKit leaves focus on the page, not on an item
    // clicked inside the menu, so a close() made with focus lost returns it too
    if (event.target === menu && event.newState === "closed") {
      returnsFocusRef.current =
        menu.contains(menu.ownerDocument.activeElement) ||
        (closeRequestedRef.current && isFocusLost(menu.ownerDocument));
      closeRequestedRef.current = false;
    }
  }

  function handleMenuToggle(event: ToggleEvent<HTMLElement>): void {
    const menu = event.currentTarget;

    if (event.target !== menu) {
      return;
    }

    removalWatcherRef.current?.();
    removalWatcherRef.current = null;

    if (event.newState === "open") {
      // Watching first, so the watcher sees the focus the opening moves in
      removalWatcherRef.current = watchRemovals(menu);
      focusOnOpening(menu, openingFocusRef.current);
    } else if (returnsFocusRef.current) {
      returnsFocusRef.current = false;
      returnFocus(menu, returnFocusRef.current);
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLElement>): void {
    leaveMenuOnTab(event, returnFocusRef.current, close);
  }

  function handleMenuBlur(event: FocusEvent<HTMLElement>): void {
    closeWhenFocusLeaves(event.currentTarget, event.relatedTarget, () => false);
  }

  function close(): void {
    if (popover.open) {
      closeRequestedRef.current = true;
    }

    popover.close();
  }

  function getMenuProps<Props extends object>(
    props: Props & RequiredAccessibleName & Partial<ContextMenuOverlayProps>
  ): Omit<Props, keyof ContextMenuOverlayProps> & ContextMenuOverlayProps {
    // Out of the name union, which mergeProps cannot infer its types through
    const ownProps: Props & Partial<ContextMenuOverlayProps> = props;
    const menuProps = mergeProps(ownProps, {
      close,
      "data-context-menu": "" as const,
      onBeforeToggle: handleMenuBeforeToggle,
      onBlur: handleMenuBlur,
      onKeyDown: handleMenuKeyDown,
      onToggle: handleMenuToggle,
      style: pointStyle(opening?.offsets),
    });

    return popover.getOverlayProps(menuProps) as Omit<Props, keyof ContextMenuOverlayProps> & ContextMenuOverlayProps;
  }

  function getTargetProps<Props extends object>(
    props?: Props & Partial<ContextMenuTargetProps>
  ): Omit<Props, keyof ContextMenuTargetProps> & ContextMenuTargetProps {
    return mergeProps(props, {
      onContextMenu: handleContextMenu,
      onPointerDown: handlePointerDown,
      style: { anchorName },
    });
  }

  return { close, getMenuProps, getTargetProps, open: popover.open, target: opening?.target ?? null };
}

/**
 * The custom properties that place a menu at a point in its region
 *
 * @param offsets the point's distances from the region's edges, if the menu has opened
 * @returns the style to set on the menu
 */
function pointStyle(offsets: PointOffsets | undefined): CSSProperties {
  if (offsets === undefined) {
    return {};
  }

  return {
    "--_sui-context-menu-bottom": `${offsets.bottom}px`,
    "--_sui-context-menu-left": `${offsets.left}px`,
    "--_sui-context-menu-right": `${offsets.right}px`,
    "--_sui-context-menu-top": `${offsets.top}px`,
  } as CSSProperties;
}

/**
 * Holds the press that opened a menu on the menu until it ends, so its release lands on the menu and does not light
 * dismiss it
 *
 * @param menu the menu, now shown
 * @param pointerId the pressing pointer
 */
function holdPress(menu: HTMLElement, pointerId: number): void {
  try {
    menu.setPointerCapture(pointerId);
  } catch (error) {
    // A press already released has already had its release, so there is nothing to hold
    if (!(error instanceof DOMException && error.name === "NotFoundError")) {
      throw error;
    }
  }
}

/**
 * Moves focus back to the element the menu opened from, unless the browser has already returned focus somewhere,
 * which WebKit does not
 *
 * @param menu the menu, now hidden
 * @param returnTo the element that had focus when the menu opened, if any
 */
function returnFocus(menu: HTMLElement, returnTo: HTMLElement | null): void {
  if (isFocusLost(menu.ownerDocument) || menu.contains(menu.ownerDocument.activeElement)) {
    returnTo?.focus();
  }
}

/**
 * Whether nothing on the page has focus
 *
 * @param page the document
 * @returns true when focus is on the page itself
 */
function isFocusLost(page: Document): boolean {
  return page.activeElement === null || page.activeElement === page.body;
}
