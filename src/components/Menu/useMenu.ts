import type { CSSProperties, FocusEvent, KeyboardEvent, MouseEvent, ToggleEvent } from "react";
import { useEffect, useId, useRef } from "react";

import { hasModifier, renderedItems } from "../../menus";
import type { OverlayPlacement } from "../../overlays";
import { mergeProps, syncPopover } from "../../overlays";
// The Popover barrel would also bring Popover's stylesheet into every bundle that uses a menu
import { usePopover } from "../Popover/usePopover";

import type { MenuOverlayProps } from "./Menu";

/**
 * Options for `useMenu`
 */
export interface UseMenuOptions {
  /**
   * Whether the menu starts open when uncontrolled. Defaults to `false`.
   */
  defaultOpen?: boolean;

  /**
   * Called with the new open state when the menu opens or closes; when controlled, also with `true` when the user
   * asks to open it
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Controls whether the menu is open. The hook then cancels openings and reports them through `onOpenChange`; a close
   * the browser makes is reported after it happens, and the menu shows again if `open` stays true.
   */
  open?: boolean;

  /**
   * Side of the trigger the menu opens on. It flips to the opposite side when there is no room. Defaults to
   * `bottom-start`.
   */
  placement?: OverlayPlacement;
}

/**
 * Props `getTriggerProps` sets on the trigger
 */
interface MenuTriggerProps {
  /**
   * The menu's id
   */
  "aria-controls": string;

  /**
   * Whether the menu is open
   */
  "aria-expanded": boolean;

  /**
   * Says the trigger opens a menu
   */
  "aria-haspopup": "menu";

  /**
   * The trigger's id, which names the menu
   */
  id: string;

  /**
   * Notes whether a pointer or the keyboard is opening the menu
   */
  onClick: (event: MouseEvent<HTMLElement>) => void;

  /**
   * Opens the menu on its first item with Down, or its last with Up
   */
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;

  /**
   * The menu's id, which makes the button open and close it without script
   */
  popoverTarget: string;

  /**
   * Names the trigger as the menu's anchor
   */
  style: CSSProperties;
}

/**
 * Prop getters for a menu's trigger and the `Menu`, whether it is open, and a way to close it
 */
export interface UseMenuResult {
  /**
   * Closes the menu, returning focus to the trigger as choosing an item does, and reports `false` through
   * `onOpenChange`
   */
  close: () => void;

  /**
   * Returns the props to spread on the `Menu`, merged with any given. The menu is named by its trigger unless an
   * `aria-label` is given, which an `IconButton` trigger needs.
   */
  getMenuProps: <Props extends object>(
    props?: Props & Partial<MenuOverlayProps>
  ) => Omit<Props, keyof MenuOverlayProps> & MenuOverlayProps;

  /**
   * Returns the props to spread on the trigger, which must be a button, merged with any given: where both set a
   * handler, both run, the given one first, and `style` objects merge
   */
  getTriggerProps: <Props extends object>(
    props?: Props & Partial<MenuTriggerProps>
  ) => Omit<Props, keyof MenuTriggerProps> & MenuTriggerProps;

  /**
   * Whether the menu is open
   */
  open: boolean;
}

/**
 * Where focus goes as a menu opens: its first or last item, or the menu itself
 */
type OpeningFocus = "first" | "last" | "menu";

const triggerKeyFocus: Partial<Record<string, OpeningFocus>> = { ArrowDown: "first", ArrowUp: "last" };

/**
 * Connects a `Menu` to the button that opens it. Clicking the button toggles the menu, and Escape or a click outside
 * closes it, all handled by the browser. Opened from the keyboard, or by a controlled `open`, focus moves to the first
 * item; opened with a pointer, to the menu itself, so no item is highlighted under a pointer still on the button.
 * Closing the menu with focus inside returns focus to the button.
 *
 * @param options open state, the change callback and placement
 * @returns prop getters for the trigger and the `Menu`, whether it is open, and `close`
 *
 * @example
 * const menu = useMenu({ placement: "bottom-end" });
 *
 * <IconButton {...menu.getTriggerProps()} label="Row actions"><MoreHorizontalIcon /></IconButton>
 * <Menu {...menu.getMenuProps({ "aria-label": "Row actions" })}>…</Menu>
 */
export function useMenu({
  defaultOpen,
  onOpenChange,
  open,
  placement = "bottom-start",
}: UseMenuOptions = {}): UseMenuResult {
  const triggerId = useId();
  const popover = usePopover({ defaultOpen, onOpenChange, open, placement });
  const openingFocusRef = useRef<OpeningFocus>("first");
  const removalWatcherRef = useRef<(() => void) | null>(null);
  const menuId = popover.getTriggerProps().popoverTarget;

  useEffect(() => () => removalWatcherRef.current?.(), []);

  function handleTriggerClick(event: MouseEvent<HTMLElement>): void {
    // A pointer's click counts its presses; one from the keyboard or assistive technology has none
    openingFocusRef.current = event.detail === 0 ? "first" : "menu";
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLElement>): void {
    const openingFocus = triggerKeyFocus[event.key];
    const menu = event.currentTarget.ownerDocument.getElementById(menuId);

    if (openingFocus === undefined || menu === null || event.defaultPrevented || hasModifier(event)) {
      return;
    }

    event.preventDefault();

    if (menu.matches(":popover-open")) {
      focusOnOpening(menu, openingFocus);
    } else {
      openingFocusRef.current = openingFocus;
      syncPopover(menu, true);
    }
  }

  function handleMenuBeforeToggle(event: ToggleEvent<HTMLElement>): void {
    const menu = event.currentTarget;

    if (event.newState !== "open" || event.target !== menu) {
      return;
    }

    // A controlled parent may refuse the opening, which leaves no toggle to clear its focus; it has answered by the
    // next task, when an accepted opening has shown the menu
    setTimeout(() => {
      if (!menu.matches(":popover-open")) {
        openingFocusRef.current = "first";
      }
    }, 0);
  }

  function handleMenuToggle(event: ToggleEvent<HTMLElement>): void {
    const menu = event.currentTarget;

    if (event.target !== menu) {
      return;
    }

    removalWatcherRef.current?.();
    removalWatcherRef.current = null;

    if (event.newState === "open") {
      focusOnOpening(menu, openingFocusRef.current);
      removalWatcherRef.current = watchRemovals(menu);
    }

    openingFocusRef.current = "first";
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLElement>): void {
    const trigger = event.currentTarget.ownerDocument.getElementById(triggerId);

    if (event.key !== "Tab" || trigger === null || event.defaultPrevented || hasModifier(event)) {
      return;
    }

    // Tab then moves on from the trigger, as though the menu were not there; Shift+Tab stops on the trigger itself
    if (event.shiftKey) {
      event.preventDefault();
    }

    trigger.focus();
    popover.close();
  }

  function handleMenuBlur(event: FocusEvent<HTMLElement>): void {
    const menu = event.currentTarget;

    if (!menu.matches(":popover-open")) {
      return;
    }

    if (event.relatedTarget === null) {
      // Focus is between elements, or lost with an item that was removed, so wait to see where it lands
      setTimeout(() => {
        closeUnlessFocusStays(menu, menu.ownerDocument.activeElement);
      }, 0);
    } else {
      closeUnlessFocusStays(menu, event.relatedTarget);
    }
  }

  function closeUnlessFocusStays(menu: HTMLElement, focused: Element | null): void {
    const stays = focused !== null && (menu.contains(focused) || focused.id === triggerId);

    // Hidden as a light dismiss would, not through close(), which takes focus lost to the page for a press inside the
    // menu and returns it to the trigger
    if (!stays && menu.matches(":popover-open")) {
      syncPopover(menu, false);
    }
  }

  function getMenuProps<Props extends object>(
    props?: Props & Partial<MenuOverlayProps>
  ): Omit<Props, keyof MenuOverlayProps> & MenuOverlayProps {
    const menuProps = mergeProps(props, {
      "aria-labelledby": hasOwnName(props) ? undefined : triggerId,
      close: popover.close,
      onBeforeToggle: handleMenuBeforeToggle,
      onBlur: handleMenuBlur,
      onKeyDown: handleMenuKeyDown,
      onToggle: handleMenuToggle,
    });

    return popover.getOverlayProps(menuProps) as Omit<Props, keyof MenuOverlayProps> & MenuOverlayProps;
  }

  function getTriggerProps<Props extends object>(
    props?: Props & Partial<MenuTriggerProps>
  ): Omit<Props, keyof MenuTriggerProps> & MenuTriggerProps {
    const triggerProps = mergeProps(props, {
      "aria-haspopup": "menu" as const,
      id: triggerId,
      onClick: handleTriggerClick,
      onKeyDown: handleTriggerKeyDown,
    });

    return popover.getTriggerProps(triggerProps) as Omit<Props, keyof MenuTriggerProps> & MenuTriggerProps;
  }

  return { close: popover.close, getMenuProps, getTriggerProps, open: popover.open };
}

/**
 * Moves focus into a menu that has just opened
 *
 * @param menu the menu element
 * @param openingFocus where focus goes; a menu with no items takes it itself
 */
function focusOnOpening(menu: HTMLElement, openingFocus: OpeningFocus): void {
  const items = renderedItems(menu);
  const targets: Record<OpeningFocus, HTMLElement | undefined> = { first: items.at(0), last: items.at(-1), menu };

  (targets[openingFocus] ?? menu).focus();
}

/**
 * Keeps focus inside a menu when the focused item is removed from it or from one of its submenus, by moving focus to
 * the innermost menu that held the item and is still open
 *
 * @param menu the open menu
 * @returns a function that stops watching, to call when the menu closes
 */
function watchRemovals(menu: HTMLElement): () => void {
  let focusedMenus: HTMLElement[] = [];

  function noteFocusedMenus(event: Event): void {
    focusedMenus = event.target instanceof Element ? menusAround(event.target, menu) : [];
  }

  const watcher = new MutationObserver(() => {
    const focused = menu.ownerDocument.activeElement;

    if ((focused === null || focused === menu.ownerDocument.body) && menu.matches(":popover-open")) {
      const stillOpen = focusedMenus.find((candidate) => candidate.isConnected && candidate.matches(":popover-open"));

      (stillOpen ?? menu).focus();
    }
  });

  menu.addEventListener("focusin", noteFocusedMenus);
  watcher.observe(menu, { childList: true, subtree: true });

  return () => {
    menu.removeEventListener("focusin", noteFocusedMenus);
    watcher.disconnect();
  };
}

/**
 * Lists the menus around an element, innermost first
 *
 * @param element the element to start from, which may be a menu itself
 * @param root the outermost menu, the last listed
 * @returns the menus from the element's own out to `root`
 */
function menusAround(element: Element, root: HTMLElement): HTMLElement[] {
  const menus: HTMLElement[] = [];
  let candidate = element.closest<HTMLElement>('[role="menu"]');

  while (candidate !== null && root.contains(candidate)) {
    menus.push(candidate);
    candidate = candidate.parentElement?.closest<HTMLElement>('[role="menu"]') ?? null;
  }

  return menus;
}

/**
 * Whether the consumer names the menu themselves
 *
 * @param props the consumer's props for the menu
 * @returns true when they give a non-empty `aria-label`
 */
function hasOwnName(props: object | undefined): boolean {
  return (
    props !== undefined &&
    "aria-label" in props &&
    typeof props["aria-label"] === "string" &&
    props["aria-label"] !== ""
  );
}
