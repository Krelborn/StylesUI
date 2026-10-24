import type { ReactNode, RefObject } from "react";
import { useLayoutEffect } from "react";

import { optionTextValue } from "../../collections";

import { isOptionShown } from "./isOptionShown";
import { useComboboxContext } from "./useComboboxContext";

interface UseComboboxOptionOptions {
  /**
   * The option's label
   */
  children: ReactNode;

  /**
   * The option's leading content
   */
  leading: ReactNode;

  /**
   * The option element
   */
  optionRef: RefObject<HTMLDivElement | null>;

  /**
   * Whether the option is selected
   */
  selected: boolean;

  /**
   * The text the consumer gave the option, if any
   */
  textValue: string | undefined;

  /**
   * The option's value
   */
  value: string;
}

/**
 * Keeps an option in step with its combobox: shown or hidden for the filter, showing itself in the field while
 * selected, and no longer active once it unmounts
 *
 * @param options the option's state, content and element
 */
export function useComboboxOption({
  children,
  leading,
  optionRef,
  selected,
  textValue,
  value,
}: UseComboboxOptionOptions): void {
  const { filter, query, setActive, setSelectedContent } = useComboboxContext("ComboboxOption");

  // Set on the element rather than rendered, so the list reads the filter's result in the same commit
  useLayoutEffect(() => {
    const option = optionRef.current;

    if (option !== null) {
      option.hidden = !isOptionShown(filter, query, optionTextValue(option));
    }
  }, [children, filter, optionRef, query, textValue]);

  // Kept after the option unmounts, as a list filtered on a server drops it, until another value is selected
  useLayoutEffect(() => {
    const option = optionRef.current;

    if (selected && option !== null) {
      setSelectedContent({ label: children, leading, text: optionTextValue(option), value });
    }
  }, [children, leading, optionRef, selected, setSelectedContent, textValue, value]);

  // The control's aria-activedescendant may name this option, so it lets go as the option unmounts; only then, since a
  // change of what made it active is not one
  useLayoutEffect(
    () => () => {
      setActive((current) => (current?.value === value ? null : current));
    },
    [setActive, value]
  );
}
