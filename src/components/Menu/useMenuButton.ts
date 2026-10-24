import type { CSSProperties, FocusEvent, KeyboardEvent, MouseEvent, ToggleEvent } from "react";
import { useEffect, useId, useRef } from "react";

import type { OpeningFocus } from "../../menus";
import { closeWhenFocusLeaves, focusOnOpening, hasModifier, leaveMenuOnTab, watchRemovals } from "../../menus";
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
 * Where focus goes as a menu button's menu opens: its first or last item, the menu itself, or the trigger, which keeps
 * it
 */
export type MenuButtonOpeningFocus = OpeningFocus | "trigger";

/**
 * Options for `useMenuButton`
 */
export interface UseMenuButtonOptions extends UseMenuOptions {
  /**
   * Where focus goes when a pointer's click opens the menu
   */
  pointerOpeningFocus: MenuButtonOpeningFocus;
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
 * What `useMenuButton` returns: `useMenu`'s result and a way to open the menu with focus where its caller chooses
 */
export interface UseMenuButtonResult extends UseMenuResult {
  /**
   * Opens the menu, or moves focus in if it is already open
   *
   * @param trigger the trigger, which finds the menu in its document
   * @param openingFocus where focus goes
   */
  show: (trigger: HTMLElement, openingFocus: MenuButtonOpeningFocus) => void;
}

const triggerKeyFocus: Partial<Record<string, OpeningFocus>> = { ArrowDown: "first", ArrowUp: "last" };

/**
 * Connects a `Menu` to the button that opens it, as `useMenu` does, with where focus goes when a pointer opens the menu
 * left to the caller
 *
 * @param options open state, the change callback, placement and where a pointer's opening puts focus
 * @returns `useMenu`'s result and `show`
 */
export function useMenuButton({
  defaultOpen,
  onOpenChange,
  open,
  placement = "bottom-start",
  pointerOpeningFocus,
}: UseMenuButtonOptions): UseMenuButtonResult {
  const triggerId = useId();
  const popover = usePopover({ defaultOpen, onOpenChange, open, placement });
  const openingFocusRef = useRef<MenuButtonOpeningFocus>("first");
  const removalWatcherRef = useRef<(() => void) | null>(null);
  const menuId = popover.getTriggerProps().popoverTarget;

  useEffect(() => () => removalWatcherRef.current?.(), []);

  function handleTriggerClick(event: MouseEvent<HTMLElement>): void {
    // A pointer's click counts its presses; one from the keyboard or assistive technology has none
    openingFocusRef.current = event.detail === 0 ? "first" : pointerOpeningFocus;

    const menu = event.currentTarget.ownerDocument.getElementById(menuId);

    // A cancelled click opens nothing itself, but its handler may have opened a controlled menu
    if (event.defaultPrevented && menu !== null) {
      forgetOpeningFocusUnlessShown(menu);
    }
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLElement>): void {
    const openingFocus = triggerKeyFocus[event.key];

    if (openingFocus === undefined || event.defaultPrevented || hasModifier(event)) {
      return;
    }

    event.preventDefault();
    show(event.currentTarget, openingFocus);
  }

  function show(trigger: HTMLElement, openingFocus: MenuButtonOpeningFocus): void {
    const menu = trigger.ownerDocument.getElementById(menuId);

    if (menu === null) {
      return;
    }

    if (menu.matches(":popover-open")) {
      moveFocusIn(menu, openingFocus);
    } else {
      openingFocusRef.current = openingFocus;
      syncPopover(menu, true);
    }
  }

  function moveFocusIn(menu: HTMLElement, openingFocus: MenuButtonOpeningFocus): void {
    if (openingFocus === "trigger") {
      menu.ownerDocument.getElementById(triggerId)?.focus();
    } else {
      focusOnOpening(menu, openingFocus);
    }
  }

  function handleMenuBeforeToggle(event: ToggleEvent<HTMLElement>): void {
    const menu = event.currentTarget;

    // A controlled parent may refuse the opening, which leaves no toggle to clear its focus
    if (event.newState === "open" && event.target === menu) {
      forgetOpeningFocusUnlessShown(menu);
    }
  }

  /**
   * Resets where focus goes on the next opening unless the menu is shown by the next task, by when an accepted opening
   * has shown it
   */
  function forgetOpeningFocusUnlessShown(menu: HTMLElement): void {
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
      // Watching first, so the watcher sees the focus the opening moves in
      removalWatcherRef.current = watchRemovals(menu);
      moveFocusIn(menu, openingFocusRef.current);
    }

    openingFocusRef.current = "first";
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLElement>): void {
    leaveMenuOnTab(event, event.currentTarget.ownerDocument.getElementById(triggerId), popover.close);
  }

  function handleMenuBlur(event: FocusEvent<HTMLElement>): void {
    closeWhenFocusLeaves(event.currentTarget, event.relatedTarget, (focused) => focused.id === triggerId);
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

  return { close: popover.close, getMenuProps, getTriggerProps, open: popover.open, show };
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
