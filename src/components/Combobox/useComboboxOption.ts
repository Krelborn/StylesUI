import type { ReactNode, RefObject } from "react";
import { useLayoutEffect } from "react";

import type { ActiveSource } from "./ComboboxContext";
import { isOptionShown } from "./isOptionShown";
import { useComboboxContext } from "./useComboboxContext";

interface UseComboboxOptionOptions {
  /**
   * What made the option active, or undefined while it is not
   */
  active: ActiveSource | undefined;

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
  active,
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
  });

  useLayoutEffect(() => {
    const option = optionRef.current;

    if (!selected || option === null) {
      return undefined;
    }

    setSelectedContent({ label: children, leading, text: optionText(option, labelId, textValue), value });

    return () => {
      setSelectedContent((current) => (current?.value === value ? null : current));
    };
  }, [children, labelId, leading, optionRef, selected, setSelectedContent, textValue, value]);

  // The control's aria-activedescendant names this option while it is active, so it lets go as the option unmounts
  useLayoutEffect(() => {
    if (active === undefined) {
      return undefined;
    }

    return () => {
      setActive((current) => (current?.value === value ? null : current));
    };
  }, [active, setActive, value]);
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
