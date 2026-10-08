import { clsx } from "clsx";
import type { JSX, MouseEvent } from "react";
import { useEffectEvent, useLayoutEffect } from "react";

import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Listbox.module.css";
import { optionId } from "./optionId";
import { useListboxContext } from "./useListboxContext";

/**
 * Props for `ListboxOption`: its own props plus every `div` prop except those the listbox pattern sets
 */
export interface ListboxOptionProps extends Omit<
  BoxProps<"div">,
  "aria-disabled" | "aria-selected" | "as" | "id" | "role"
> {
  /**
   * Whether the option cannot be selected. A disabled option is still reached with the arrow keys, so it is read.
   * Defaults to `false`.
   */
  disabled?: boolean;

  /**
   * The text type-ahead matches. Defaults to the text of the elements the option's `aria-labelledby` names, or to the
   * option's own text when it has none.
   */
  textValue?: string;

  /**
   * The value this option stands for
   */
  value: string;
}

/**
 * One option in a `Listbox`. For a rich option, name it with `aria-labelledby` pointing at its title and describe it
 * with `aria-describedby`. Your `onClick` and `onDoubleClick` run first; preventing their default stops the option
 * handling them.
 *
 * @example
 * <ListboxOption aria-describedby={metaId} aria-labelledby={titleId} value={pullRequest.id}>…</ListboxOption>
 */
export function ListboxOption({
  className,
  disabled = false,
  onClick,
  onDoubleClick,
  textValue,
  value,
  ...rest
}: ListboxOptionProps): JSX.Element {
  const listbox = useListboxContext("ListboxOption");
  const { setActiveValue } = listbox;
  const active = listbox.activeValue === value;
  const selected = listbox.selectedValue === value;
  const claim = useEffectEvent(listbox.claim);

  // The listbox's aria-activedescendant names this option while it is active, so it lets go as the option unmounts
  useLayoutEffect(() => {
    if (!active) {
      return undefined;
    }

    return () => {
      setActiveValue((current) => (current === value ? null : current));
    };
  }, [active, setActiveValue, value]);

  // A new selection, such as a controlled value set outside, or this option remounting selected, moves the active
  // option here while the listbox has focus, so only a rendered option ever becomes active
  useLayoutEffect(() => {
    if (selected) {
      claim(value);
    }
  }, [selected, value]);

  function handleClick(event: MouseEvent<HTMLDivElement>): void {
    onClick?.(event);

    if (!event.defaultPrevented) {
      listbox.choose(event.currentTarget, value, disabled);
    }
  }

  function handleDoubleClick(event: MouseEvent<HTMLDivElement>): void {
    onDoubleClick?.(event);

    if (!event.defaultPrevented && !disabled) {
      listbox.act(value);
    }
  }

  return (
    <Box
      {...rest}
      className={clsx(styles.option, className)}
      id={optionId(listbox.baseId, value)}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- an option element cannot hold rich content
      role="option"
      aria-disabled={disabled ? true : undefined}
      aria-selected={selected}
      data-active={active ? "" : undefined}
      data-text-value={textValue}
      data-value={value}
    />
  );
}
