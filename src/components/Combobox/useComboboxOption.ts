import type { ReactNode, RefObject } from "react";
import { useLayoutEffect } from "react";

import { isOptionShown } from "./isOptionShown";
import { useComboboxContext } from "./useComboboxContext";

interface UseComboboxOptionOptions {
  /**
   * The option's label
   */
  children: ReactNode;

  /**
   * The id of the element holding the label
   */
  labelId: string;

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
  labelId,
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
      option.hidden = !isOptionShown(filter, query, optionText(option, labelId, textValue));
    }
  }, [children, filter, labelId, optionRef, query, textValue]);

  // Kept after the option unmounts, as a list filtered on a server drops it, until another value is selected
  useLayoutEffect(() => {
    const option = optionRef.current;

    if (selected && option !== null) {
      setSelectedContent({ label: children, leading, text: optionText(option, labelId, textValue), value });
    }
  }, [children, labelId, leading, optionRef, selected, setSelectedContent, textValue, value]);

  // The control's aria-activedescendant may name this option, so it lets go as the option unmounts; only then, since a
  // change of what made it active is not one
  useLayoutEffect(
    () => () => {
      setActive((current) => (current?.value === value ? null : current));
    },
    [setActive, value]
  );
}

/**
 * Reads an option's text
 *
 * @param option the option element
 * @param labelId the id of its label
 * @param textValue the text the consumer gave, if any
 * @returns the given text, else the label's
 */
function optionText(option: HTMLElement, labelId: string, textValue: string | undefined): string {
  return textValue ?? option.ownerDocument.getElementById(labelId)?.textContent ?? "";
}
