import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import type { RenderedOption, TypeAheadQuery } from "../../collections";
import {
  extendTypeAheadQuery,
  isTypeAheadQueryLive,
  optionId,
  renderedOptions,
  targetIndexForKey,
  typeAheadTarget,
} from "../../collections";

import type {
  ActiveOption,
  ActiveSource,
  ComboboxContextValue,
  ComboboxFilter,
  SelectedContent,
} from "./ComboboxContext";
import { isOptionShown } from "./isOptionShown";

/**
 * Which option is active as the list opens: the selected one (else the first), the first, the last, or none
 */
export type OpeningActive = "first" | "last" | "none" | "selected";

interface UseComboboxListOptions {
  /**
   * The control's own id, or a surrounding field's; without one, the list generates it
   */
  controlId: string | undefined;

  /**
   * The value selected at first when uncontrolled
   */
  defaultValue: string | null;

  /**
   * Whether an option shows for the typed text, or null to show every option
   */
  filter: ComboboxFilter | null;

  /**
   * Called with an option's text when the user commits it
   */
  onCommit?: (text: string) => void;

  /**
   * Called with the new selection
   */
  onValueChange: ((value: string | null) => void) | undefined;

  /**
   * The text the options are filtered by; empty shows every option
   */
  query: string;

  /**
   * The selected value when controlled, or undefined when uncontrolled
   */
  value: string | null | undefined;
}

/**
 * A combobox's list: its open state, active option and selection, and the actions its control's keys and pointer take
 */
export interface ComboboxList {
  /**
   * The id of the active option while the list is open, for the control's `aria-activedescendant`
   */
  activeDescendant: string | undefined;

  /**
   * The generated id the list's ids start with
   */
  baseId: string;

  /**
   * Closes the list without committing
   */
  close: () => void;

  /**
   * Commits the active option and closes the list, unless the option is disabled; with no active option, closes it
   */
  commitActive: () => void;

  /**
   * The state the list's options read
   */
  context: ComboboxContextValue;

  /**
   * The control's id
   */
  controlId: string;

  /**
   * Counts the options the filter shows
   */
  countShown: () => number;

  /**
   * Whether Space would join a type-ahead query now rather than act
   */
  isTypingAhead: () => boolean;

  /**
   * The list's id, for the control's `aria-controls`
   */
  listId: string;

  /**
   * Takes the `listbox` element, as its `ref`
   */
  attachList: (listbox: HTMLDivElement | null) => void;

  /**
   * Makes the first option the filter shows for the text, and that is not disabled, active; with no filter or no text,
   * makes none active
   *
   * @param text the text typed, which the options are filtered by from the next render
   */
  matchFirst: (text: string) => void;

  /**
   * Moves the active option for an arrow key, Home or End, without wrapping
   *
   * @returns whether the key was one of those
   */
  moveByKey: (key: string) => boolean;

  /**
   * Whether the list is open
   */
  open: boolean;

  /**
   * Opens the list
   *
   * @param opening which option becomes active
   * @param source what opened it, which decides whether the active option shows the focus ring
   */
  openList: (opening: OpeningActive, source: ActiveSource) => void;

  /**
   * Selects a value, or none, reporting it unless it is already selected
   */
  select: (value: string | null) => void;

  /**
   * What the selected option shows in the field, or null when it is not rendered
   */
  selectedContent: SelectedContent | null;

  /**
   * The selected value, or null for none
   */
  selectedValue: string | null;

  /**
   * Closes the open list, or opens it on the selected option
   *
   * @param source what toggled it, which decides whether the active option shows the focus ring
   */
  toggleList: (source: ActiveSource) => void;

  /**
   * Moves the active option by type-ahead for a printable character, from the active option or else the selected one
   *
   * @returns whether the key was a character type-ahead took
   */
  typeAhead: (key: string) => boolean;
}

// `container` is missing from lib.dom's ScrollIntoViewOptions; browsers without it ignore it
interface NearestContainerScrollOptions extends ScrollIntoViewOptions {
  container?: "all" | "nearest";
}

const scrollOptions: NearestContainerScrollOptions = { block: "nearest", container: "nearest" };

/**
 * Holds the state of a combobox's list, which `Combobox` and `Autocomplete` share
 *
 * @param options the selection, the filter and the callbacks
 * @returns the list's state and actions
 */
export function useComboboxList({
  controlId,
  defaultValue,
  filter,
  onCommit,
  onValueChange,
  query,
  value,
}: UseComboboxListOptions): ComboboxList {
  const baseId = useId();
  const listId = `${baseId}-list`;
  const listRef = useRef<HTMLDivElement>(null);
  const typeAheadQuery = useRef<TypeAheadQuery | null>(null);
  const scrollPending = useRef(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ActiveOption | null>(null);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [selectedContent, setSelectedContent] = useState<SelectedContent | null>(null);
  const selectedValue = value === undefined ? uncontrolledValue : value;

  // After every render, once each option has shown or hidden itself for the filter
  useLayoutEffect(() => {
    listRef.current?.toggleAttribute("data-empty", shownOptions().length === 0);
  });

  // After the list has shown, which an effect of its own does
  useEffect(() => {
    if (!open) {
      return;
    }

    // The pointer moves the active option only under itself, so only an opening scrolls to an option it made active
    const scrolls = active !== null && (active.source === "keyboard" || scrollPending.current);

    scrollPending.current = false;

    if (scrolls) {
      listRef.current?.ownerDocument.getElementById(optionId(baseId, active.value))?.scrollIntoView(scrollOptions);
    }
  }, [active, baseId, open]);

  function shownOptions(): RenderedOption[] {
    return listRef.current === null ? [] : renderedOptions(listRef.current);
  }

  function activate(options: RenderedOption[], index: number, source: ActiveSource): void {
    const option = options.at(index);

    setActive(option === undefined || index < 0 ? null : { source, value: option.value });
  }

  function startIndex(options: RenderedOption[]): number {
    const activeIndex = options.findIndex((option) => option.value === active?.value);

    return activeIndex === -1 ? options.findIndex((option) => option.value === selectedValue) : activeIndex;
  }

  function openList(opening: OpeningActive, source: ActiveSource): void {
    const options = shownOptions();
    const selectedIndex = Math.max(
      options.findIndex((option) => option.value === selectedValue),
      0
    );
    const indexes: Record<OpeningActive, number> = {
      first: 0,
      last: options.length - 1,
      none: -1,
      selected: selectedIndex,
    };

    scrollPending.current = true;
    setOpen(true);
    activate(options, indexes[opening], source);
  }

  function toggleList(source: ActiveSource): void {
    if (open) {
      close();
    } else {
      openList("selected", source);
    }
  }

  function close(): void {
    setOpen(false);
    setActive(null);
  }

  function select(nextValue: string | null): void {
    if (nextValue === selectedValue) {
      return;
    }

    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  function commit(optionValue: string): void {
    const option = shownOptions().find((shown) => shown.value === optionValue);

    select(optionValue);
    onCommit?.(option?.textValue ?? "");
    close();
  }

  function commitActive(): void {
    const option = shownOptions().find((shown) => shown.value === active?.value);

    if (option === undefined) {
      close();
    } else if (!option.disabled) {
      commit(option.value);
    }
  }

  function moveByKey(key: string): boolean {
    const options = shownOptions();
    const currentIndex = options.findIndex((option) => option.value === active?.value);
    const target =
      currentIndex === -1 && key === "ArrowUp"
        ? options.length - 1
        : targetIndexForKey({ count: options.length, currentIndex, key, orientation: "vertical", wraps: false });

    if (target === null || target === -1) {
      return ["ArrowDown", "ArrowUp", "End", "Home"].includes(key);
    }

    activate(options, target, "keyboard");

    return true;
  }

  function isTypingAhead(): boolean {
    return isTypeAheadQueryLive(typeAheadQuery.current, Date.now());
  }

  function typeAhead(key: string): boolean {
    const time = Date.now();

    if (Array.from(key).length !== 1 || (key === " " && !isTypeAheadQueryLive(typeAheadQuery.current, time))) {
      return false;
    }

    typeAheadQuery.current = extendTypeAheadQuery(typeAheadQuery.current, key, time);
    const options = shownOptions();
    const labels = options.map((option) => option.textValue);
    const target = typeAheadTarget(labels, startIndex(options), typeAheadQuery.current.text);

    if (target !== null) {
      activate(options, target, "keyboard");
    }

    return true;
  }

  function countShown(): number {
    return shownOptions().length;
  }

  function matchFirst(text: string): void {
    // Without a filter, the options for the text are still to come from the consumer
    if (text === "" || filter === null) {
      setActive(null);

      return;
    }

    const options = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    const first = options.find(
      (option) =>
        option.getAttribute("aria-disabled") !== "true" &&
        option.closest("[inert]") === null &&
        isOptionShown(filter, text, optionText(option))
    );

    setActive(first === undefined ? null : { source: "keyboard", value: first.dataset.value ?? "" });
  }

  function attachList(listbox: HTMLDivElement | null): void {
    listRef.current = listbox;
  }

  function activateFromPointer(optionValue: string): void {
    setActive({ source: "pointer", value: optionValue });
  }

  return {
    activeDescendant: open && active !== null ? optionId(baseId, active.value) : undefined,
    attachList,
    baseId,
    close,
    commitActive,
    context: {
      activateFromPointer,
      active,
      baseId,
      commit,
      filter,
      query,
      selectedValue,
      setActive,
      setSelectedContent,
    },
    controlId: controlId ?? `${baseId}-control`,
    countShown,
    isTypingAhead,
    listId,
    matchFirst,
    moveByKey,
    open,
    openList,
    select,
    selectedContent: selectedContent?.value === selectedValue ? selectedContent : null,
    selectedValue,
    toggleList,
    typeAhead,
  };
}

/**
 * Reads an option's text, whether or not the filter hides it
 *
 * @param option the option element
 * @returns its `textValue`, else its label's text
 */
function optionText(option: HTMLElement): string {
  const label = option.ownerDocument.getElementById(option.getAttribute("aria-labelledby") ?? "");

  return option.dataset.textValue ?? label?.textContent ?? "";
}
