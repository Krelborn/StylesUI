import type { FocusEvent, KeyboardEvent } from "react";
import { useId, useRef, useState } from "react";

import type { TypeAheadQuery } from "../../collections";
import { extendTypeAheadQuery, targetIndexForKey, typeAheadTarget } from "../../collections";

import type { ListboxContextValue } from "./ListboxContext";
import type { RenderedOption } from "./renderedOptions";
import { renderedOptions } from "./renderedOptions";

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
   * Forgets a press as focus leaves, so the next focus scrolls
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
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const selectedValue = value === undefined ? uncontrolledValue : value;
  const [previousSelectedValue, setPreviousSelectedValue] = useState(selectedValue);

  if (selectedValue !== previousSelectedValue) {
    setPreviousSelectedValue(selectedValue);

    // A cleared selection leaves the active option in place, as entering with nothing selected does
    if (activeValue !== null && selectedValue !== null) {
      setActiveValue(selectedValue);
    }
  }

  function select(nextValue: string): void {
    if (nextValue === selectedValue) {
      return;
    }

    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  function moveTo(option: RenderedOption): void {
    setActiveValue(option.value);
    option.element.scrollIntoView(scrollOptions);

    if (!option.disabled) {
      select(option.value);
    }
  }

  function handleFocus(event: FocusEvent<HTMLDivElement>): void {
    if (event.target !== event.currentTarget) {
      return;
    }

    const options = renderedOptions(event.currentTarget);
    const entry = options.find((option) => option.value === selectedValue) ?? options[0];

    setActiveValue(entry?.value ?? null);

    // A click's target is already in view, and scrolling before the click lands would move another option under it
    if (entry !== undefined && !pressInProgress.current) {
      entry.element.scrollIntoView(scrollOptions);
    }
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
    const handled =
      handleCommandKey(event, options[activeIndex]) ||
      handleMoveKey(event.key, options, activeIndex) ||
      handleTypeAhead(event.key, options, activeIndex);

    if (handled) {
      event.preventDefault();
    }
  }

  function handleCommandKey(event: KeyboardEvent<HTMLDivElement>, active: RenderedOption | undefined): boolean {
    if (event.key === "Enter") {
      if (!event.repeat && active !== undefined && !active.disabled) {
        onAction?.(active.value);
      }

      return true;
    }

    if (event.key === " ") {
      if (active !== undefined && !active.disabled) {
        select(active.value);
      }

      return true;
    }

    return false;
  }

  function handleMoveKey(key: string, options: RenderedOption[], activeIndex: number): boolean {
    const target = targetIndexForKey({
      count: options.length,
      currentIndex: activeIndex,
      key,
      orientation: "vertical",
      wraps: false,
    });

    if (target === null) {
      return false;
    }

    moveTo(options[target]);

    return true;
  }

  function handleTypeAhead(key: string, options: RenderedOption[], activeIndex: number): boolean {
    if (Array.from(key).length !== 1) {
      return false;
    }

    typeAheadQuery.current = extendTypeAheadQuery(typeAheadQuery.current, key, Date.now());
    const labels = options.map((option) => option.textValue);
    const target = typeAheadTarget(labels, activeIndex, typeAheadQuery.current.text);

    if (target !== null) {
      moveTo(options[target]);
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
    setActiveValue(optionValue);

    if (!disabled) {
      select(optionValue);
    }
  }

  return {
    act,
    activeValue,
    baseId,
    choose,
    handleBlur: endPress,
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
