import type { CSSProperties, FocusEvent, MouseEvent, PointerEvent, ToggleEvent } from "react";
import { useId, useRef } from "react";

import { renderedItems } from "../../menus";
import type { OverlayPlacement } from "../../overlays";
import { mergeProps } from "../../overlays";
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
   * Forgets a pointer press that never became a click
   */
  onBlur: (event: FocusEvent<HTMLElement>) => void;

  /**
   * Notes whether a pointer or the keyboard is opening the menu
   */
  onClick: (event: MouseEvent<HTMLElement>) => void;

  /**
   * Forgets a pointer press the browser cancelled
   */
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;

  /**
   * Notes a pointer press, so the click that follows opens the menu without highlighting an item
   */
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;

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
  const pressedByPointerRef = useRef(false);
  const openingFocusRef = useRef<OpeningFocus>("first");

  function forgetPress(): void {
    pressedByPointerRef.current = false;
  }

  function handleTriggerClick(): void {
    openingFocusRef.current = pressedByPointerRef.current ? "menu" : "first";
    pressedByPointerRef.current = false;
  }

  function handleTriggerPointerDown(): void {
    pressedByPointerRef.current = true;
  }

  function handleMenuToggle(event: ToggleEvent<HTMLElement>): void {
    if (event.newState === "open") {
      focusOnOpening(event.currentTarget, openingFocusRef.current);
    }

    openingFocusRef.current = "first";
  }

  function getMenuProps<Props extends object>(
    props?: Props & Partial<MenuOverlayProps>
  ): Omit<Props, keyof MenuOverlayProps> & MenuOverlayProps {
    const menuProps = mergeProps(props, {
      "aria-labelledby": hasOwnName(props) ? undefined : triggerId,
      close: popover.close,
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
      onBlur: forgetPress,
      onClick: handleTriggerClick,
      onPointerCancel: forgetPress,
      onPointerDown: handleTriggerPointerDown,
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
