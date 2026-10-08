import { clsx } from "clsx";
import type { FocusEvent, JSX, KeyboardEvent, PointerEvent, ReactNode } from "react";

import type { RequiredAccessibleName } from "../../accessibility";
import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Listbox.module.css";
import { ListboxContext } from "./ListboxContext";
import { optionId } from "./optionId";
import { useListbox } from "./useListbox";

interface ListboxOwnProps {
  /**
   * The `ListboxOption`s
   */
  children?: ReactNode;

  /**
   * The option selected at first, which leaves the listbox uncontrolled. Defaults to none.
   */
  defaultValue?: string | null;

  /**
   * Called with an option's value when Enter or a double-click acts on it, such as to open it
   */
  onAction?: (value: string) => void;

  /**
   * Called with the value of the option the user selects
   */
  onValueChange?: (value: string) => void;

  /**
   * The selected option, or null for none, which makes the listbox controlled: update it from `onValueChange`
   */
  value?: string | null;
}

/**
 * Props for `Listbox`: its own props, a required `aria-label` or `aria-labelledby`, and every other `div` prop except
 * those the listbox pattern sets
 */
export type ListboxProps = ListboxOwnProps &
  RequiredAccessibleName &
  Omit<
    BoxProps<"div">,
    | "aria-activedescendant"
    | "aria-label"
    | "aria-labelledby"
    | "as"
    | "defaultValue"
    | "role"
    | "tabIndex"
    | keyof ListboxOwnProps
  >;

/**
 * A list of options with one selected, following the WAI-ARIA listbox pattern, for a list whose selection shows
 * details. It is one tab stop. The arrow keys, Home, End and type-ahead move the selection; Space selects the active
 * option; Enter or a double-click calls `onAction`. Name it with `aria-label` or `aria-labelledby`. Options hold no
 * interactive content. Your `onKeyDown` runs first; preventing its default stops the listbox handling the key.
 *
 * @example
 * <Listbox aria-label="Needs you" onAction={open} onValueChange={select} value={selectedId}>
 *   {pullRequests.map((pullRequest) => (
 *     <ListboxOption key={pullRequest.id} value={pullRequest.id}>{pullRequest.title}</ListboxOption>
 *   ))}
 * </Listbox>
 */
export function Listbox({
  className,
  defaultValue = null,
  onAction,
  onBlur,
  onFocus,
  onKeyDown,
  onPointerCancel,
  onPointerDown,
  onValueChange,
  value,
  ...rest
}: ListboxProps): JSX.Element {
  const listbox = useListbox({ defaultValue, onAction, onValueChange, value });
  const { act, activeValue, baseId, choose, selectedValue, setActiveValue } = listbox;

  function handleBlur(event: FocusEvent<HTMLDivElement>): void {
    onBlur?.(event);
    listbox.handleBlur();
  }

  function handleFocus(event: FocusEvent<HTMLDivElement>): void {
    onFocus?.(event);
    listbox.handleFocus(event);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    onKeyDown?.(event);

    if (!event.defaultPrevented) {
      listbox.handleKeyDown(event);
    }
  }

  function handlePointerCancel(event: PointerEvent<HTMLDivElement>): void {
    onPointerCancel?.(event);
    listbox.handlePointerCancel();
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>): void {
    onPointerDown?.(event);
    listbox.handlePointerDown();
  }

  return (
    <ListboxContext.Provider value={{ act, activeValue, baseId, choose, selectedValue, setActiveValue }}>
      <Box
        {...rest}
        className={clsx(styles.listbox, className)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a native select cannot hold rich options
        role="listbox"
        tabIndex={0}
        aria-activedescendant={activeValue === null ? undefined : optionId(baseId, activeValue)}
      />
    </ListboxContext.Provider>
  );
}
