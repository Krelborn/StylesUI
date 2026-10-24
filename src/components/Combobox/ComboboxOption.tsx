import { clsx } from "clsx";
import type { JSX, MouseEvent, PointerEvent, ReactNode } from "react";
import { useId, useRef } from "react";

import { optionId } from "../../collections";
import { hasContent } from "../../forms";
import type { BoxProps } from "../Box";
import { Box } from "../Box";
import surfaceStyles from "../MenuSurface/MenuSurface.module.css";

import styles from "./Combobox.module.css";
import { ComboboxOptionContent } from "./ComboboxOptionContent";
import { useComboboxContext } from "./useComboboxContext";
import { useComboboxOption } from "./useComboboxOption";

/**
 * Props for `ComboboxOption`: its own props plus every `div` prop except those the combobox pattern sets and the name
 * its label gives it
 */
export interface ComboboxOptionProps extends Omit<
  BoxProps<"div">,
  | "aria-disabled"
  | "aria-label"
  | "aria-labelledby"
  | "aria-selected"
  | "as"
  | "children"
  | "dangerouslySetInnerHTML"
  | "hidden"
  | "id"
  | "role"
  | "tabIndex"
> {
  /**
   * Not accepted: the label names the option
   */
  "aria-label"?: never;

  /**
   * Not accepted: the label names the option
   */
  "aria-labelledby"?: never;

  /**
   * The label, which names the option
   */
  children: ReactNode;

  /**
   * A line of muted text below the label, which describes the option
   */
  description?: ReactNode;

  /**
   * Whether the option can be reached with the keys but not chosen. Defaults to `false`.
   */
  disabled?: boolean;

  /**
   * Content before the label, such as an `Avatar` or an icon, which a `Combobox` shows in its field too while the
   * option is selected
   */
  leading?: ReactNode;

  /**
   * The text filtering, type-ahead and an `Autocomplete`'s input use. Defaults to the label's text.
   */
  textValue?: string;

  /**
   * The value this option stands for
   */
  value: string;
}

/**
 * One option in a `Combobox` or `Autocomplete`. The selected option shows a check. To leave an option out, do not
 * render it; an `Autocomplete` hides the options its filter rejects itself.
 *
 * @example
 * <ComboboxOption description="Design" leading={<Avatar name="Pat Lee" size="xs" />} value="pat">
 *   Pat Lee
 * </ComboboxOption>
 */
export function ComboboxOption({
  "aria-describedby": describedBy,
  children,
  className,
  description,
  disabled = false,
  leading,
  onClick,
  onPointerMove,
  textValue,
  value,
  ...rest
}: ComboboxOptionProps): JSX.Element {
  const combobox = useComboboxContext("ComboboxOption");
  const optionRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const descriptionId = useId();
  const active = combobox.active?.value === value ? combobox.active.source : undefined;
  const selected = combobox.selectedValue === value;
  const describedByIds = joinIds(hasContent(description) ? descriptionId : undefined, describedBy);

  useComboboxOption({ active, children, labelId, leading, optionRef, selected, textValue, value });

  function handleClick(event: MouseEvent<HTMLDivElement>): void {
    onClick?.(event);

    if (!event.defaultPrevented && !disabled) {
      combobox.commit(value);
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>): void {
    onPointerMove?.(event);

    if (event.pointerType !== "touch" && combobox.active?.value !== value) {
      combobox.activateFromPointer(value);
    }
  }

  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events -- the control's keys act on the active option
    <Box
      {...rest}
      className={clsx(surfaceStyles.item, styles.option, className)}
      id={optionId(combobox.baseId, value)}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      ref={optionRef}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- an option element cannot hold rich content
      role="option"
      aria-describedby={describedByIds}
      aria-disabled={disabled ? true : undefined}
      aria-labelledby={labelId}
      aria-selected={selected}
      data-active={active}
      data-text-value={textValue}
      data-value={value}
    >
      <ComboboxOptionContent
        description={description}
        descriptionId={descriptionId}
        labelId={labelId}
        leading={leading}
        selected={selected}
      >
        {children}
      </ComboboxOptionContent>
    </Box>
  );
}

/**
 * Joins the ids that describe an option
 *
 * @param ids the ids, any of which may be missing or empty
 * @returns them separated by spaces; undefined for none
 */
function joinIds(...ids: (string | undefined)[]): string | undefined {
  const joined = ids.filter(Boolean).join(" ");

  return joined === "" ? undefined : joined;
}
