import type { FocusEvent, KeyboardEvent } from "react";
import { useId, useRef, useState } from "react";

import type { RenderedOption, TypeAheadQuery } from "../../collections";
import {
  extendTypeAheadQuery,
  isTypeAheadQueryLive,
  renderedOptions,
  targetIndexForKey,
  typeAheadTarget,
} from "../../collections";

import type { ListboxContextValue } from "./ListboxContext";

interface UseListboxOptions {
  /**
   * The value selected at first when uncontrolled
   */
  defaultValue: string | null;

  /**
   * Called with an option's value when Enter or a double-click acts on it
   */
  onAction: ((value: string) => void) | undefined;

  /**
   * Called with the value of the option the user selects
   */
  onValueChange: ((value: string) => void) | undefined;

  /**
   * The selected value when controlled, or undefined when uncontrolled
   */
  value: string | null | undefined;
}

/**
 * A listbox's state for its options, and the handlers for the listbox element
 */
export interface ListboxState extends ListboxContextValue {
  /**
   * Notes that focus has left, and forgets a press, so the next focus scrolls
   */
  handleBlur: () => void;

  /**
   * Makes the selected option, or the first, active as focus enters, and scrolls it into view unless a press or a
   * click caused the focus
   */
  handleFocus: (event: FocusEvent<HTMLDivElement>) => void;

  /**
   * Handles the arrow keys, Home, End, Space, Enter and type-ahead
   */
  handleKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;

  /**
   * Forgets a press the browser cancelled, so the next focus scrolls
   */
  handlePointerCancel: () => void;

  /**
   * Notes that a press has started, so the focus it causes does not scroll
   */
  handlePointerDown: () => void;
}

// `container` is missing from lib.dom's ScrollIntoViewOptions; browsers without it ignore it
interface NearestContainerScrollOptions extends ScrollIntoViewOptions {
  container?: "all" | "nearest";
}

const scrollOptions: NearestContainerScrollOptions = { block: "nearest", container: "nearest" };

/**
 * Holds a listbox's selection, controlled or uncontrolled, and its active option, and handles its keyboard
 *
 * @param options the selection props and callbacks
 * @returns the state options read and the listbox element's handlers
 */
export function useListbox({ defaultValue, onAction, onValueChange, value }: UseListboxOptions): ListboxState {
  const baseId = useId();
  const typeAheadQuery = useRef<TypeAheadQuery | null>(null);
  const pressInProgress = useRef(false);
  const focusedListbox = useRef<HTMLElement | null>(null);
  const lastActiveIndex = useRef<number | null>(null);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const selectedValue = value === undefined ? uncontrolledValue : value;

  function select(nextValue: string): void {
    if (nextValue === selectedValue) {
      return;
    }

    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  function activate(options: RenderedOption[], index: number): void {
    setActiveValue(options[index].value);
    lastActiveIndex.current = index;
  }

  function moveTo(options: RenderedOption[], index: number): void {
    const option = options[index];

    activate(options, index);
    option.element.scrollIntoView(scrollOptions);

    if (!option.disabled) {
      select(option.value);
    }
  }

  function claim(optionValue: string): void {
    const listbox = focusedListbox.current;

    if (listbox === null) {
      return;
    }

    const options = renderedOptions(listbox);
    const index = options.findIndex((option) => option.value === optionValue);

    if (index !== -1) {
      activate(options, index);
    }
  }

  function handleFocus(event: FocusEvent<HTMLDivElement>): void {
    if (event.target !== event.currentTarget) {
      return;
    }

    focusedListbox.current = event.currentTarget;
    const options = renderedOptions(event.currentTarget);

    if (options.length === 0) {
      setActiveValue(null);
      lastActiveIndex.current = null;

      return;
    }

    const entryIndex = Math.max(
      options.findIndex((option) => option.value === selectedValue),
      0
    );

    activate(options, entryIndex);

    // A click's target is already in view, and scrolling before the click lands would move another option under it
    if (!pressInProgress.current) {
      options[entryIndex].element.scrollIntoView(scrollOptions);
    }
  }

  function handleBlur(): void {
    focusedListbox.current = null;
    endPress();
  }

  function handlePointerDown(): void {
    pressInProgress.current = true;
  }

  function endPress(): void {
    pressInProgress.current = false;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const options = renderedOptions(event.currentTarget);
    const activeIndex = startIndex(options, activeValue, selectedValue);
    const time = Date.now();
    const handled =
      handleEnter(event, options[activeIndex]) ||
      handleSpace(event.key, options[activeIndex], time) ||
      handleMoveKey(event.key, options, activeIndex) ||
      handleTypeAhead(event.key, options, activeIndex, time);

    if (handled) {
      event.preventDefault();
    }
  }

  function handleEnter(event: KeyboardEvent<HTMLDivElement>, active: RenderedOption | undefined): boolean {
    if (event.key !== "Enter") {
      return false;
    }

    if (!event.repeat && active !== undefined && !active.disabled) {
      onAction?.(active.value);
    }

    return true;
  }

  function handleSpace(key: string, active: RenderedOption | undefined, time: number): boolean {
    if (key !== " " || isTypeAheadQueryLive(typeAheadQuery.current, time)) {
      return false;
    }

    if (active !== undefined && !active.disabled) {
      select(active.value);
    }

    return true;
  }

  function handleMoveKey(key: string, options: RenderedOption[], activeIndex: number): boolean {
    const resumedIndex = activeIndex === -1 ? resumeIndex(key, options.length, lastActiveIndex.current) : null;
    const target =
      resumedIndex ??
      targetIndexForKey({
        count: options.length,
        currentIndex: activeIndex,
        key,
        orientation: "vertical",
        wraps: false,
      });

    if (target === null) {
      return false;
    }

    moveTo(options, target);

    return true;
  }

  function handleTypeAhead(key: string, options: RenderedOption[], activeIndex: number, time: number): boolean {
    if (Array.from(key).length !== 1) {
      return false;
    }

    typeAheadQuery.current = extendTypeAheadQuery(typeAheadQuery.current, key, time);
    const labels = options.map((option) => option.textValue);
    const target = typeAheadTarget(labels, activeIndex, typeAheadQuery.current.text);

    if (target !== null) {
      moveTo(options, target);
    }

    return true;
  }

  function act(optionValue: string): void {
    onAction?.(optionValue);
  }

  function choose(option: HTMLElement, optionValue: string, disabled: boolean): void {
    // Marked as a press for the focus too, since a scripted click has no pointerdown before it
    pressInProgress.current = true;
    option.closest<HTMLElement>('[role="listbox"]')?.focus();
    pressInProgress.current = false;
    claim(optionValue);

    if (!disabled) {
      select(optionValue);
    }
  }

  return {
    act,
    activeValue,
    baseId,
    choose,
    claim,
    handleBlur,
    handleFocus,
    handleKeyDown,
    handlePointerCancel: endPress,
    handlePointerDown,
    selectedValue,
    setActiveValue,
  };
}

/**
 * Finds the option the keys move from
 *
 * @param options the rendered options
 * @param activeValue the active option's value, or null for none
 * @param selectedValue the selected option's value, or null for none
 * @returns the active option's index, or the selected option's when the active one is not rendered; -1 for neither
 */
function startIndex(options: RenderedOption[], activeValue: string | null, selectedValue: string | null): number {
  const activeIndex = options.findIndex((option) => option.value === activeValue);

  return activeIndex === -1 ? options.findIndex((option) => option.value === selectedValue) : activeIndex;
}

/**
 * Finds where Down or Up goes when neither the active nor the selected option is rendered, such as after a refresh
 * dropped them, so the keys carry on from where the active option was
 *
 * @param key the pressed key
 * @param count how many options are rendered
 * @param lastActiveIndex the index the active option had when it was last set, or null when none has been
 * @returns for Down, the option now at that index; for Up, the one before it; each clamped to the list. Null for any
 *   other key, for an empty list, or when no option has been active.
 */
function resumeIndex(key: string, count: number, lastActiveIndex: number | null): number | null {
  if (lastActiveIndex === null || count === 0) {
    return null;
  }

  if (key === "ArrowDown") {
    return Math.min(lastActiveIndex, count - 1);
  }

  if (key === "ArrowUp") {
    return Math.min(Math.max(lastActiveIndex - 1, 0), count - 1);
  }

  return null;
}
