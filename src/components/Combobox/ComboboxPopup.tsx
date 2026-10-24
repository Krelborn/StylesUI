import type { JSX, MouseEvent, ReactNode } from "react";
import { useContext } from "react";

import { FieldContext } from "../../forms";

import { anchorNameFor } from "../../overlays";
import { Box } from "../Box";
import surfaceStyles from "../MenuSurface/MenuSurface.module.css";
import { Overlay } from "../Overlay";

import styles from "./Combobox.module.css";
import { ComboboxContext } from "./ComboboxContext";
import type { ComboboxList } from "./useComboboxList";

/**
 * Where a combobox's list opens, flipping to the other side when there is no room
 */
export type ComboboxPlacement = "bottom-start" | "top-start";

interface ComboboxPopupProps {
  /**
   * The control's `aria-label`, which names the list outside a `Field`
   */
  "aria-label": string | undefined;

  /**
   * The control's `aria-labelledby`, which names the list outside a `Field`
   */
  "aria-labelledby": string | undefined;

  /**
   * The options
   */
  children: ReactNode;

  /**
   * Whether the control is disabled, which leaves its value out of the form
   */
  disabled: boolean | undefined;

  /**
   * The line shown in place of the options while none shows; without one, an empty list shows nothing
   */
  emptyMessage?: string;

  /**
   * The id of the form the value submits with, when not the one around the control
   */
  form: string | undefined;

  /**
   * The list's state
   */
  list: ComboboxList;

  /**
   * The name the selected value submits under with a form; without one, nothing is submitted
   */
  name: string | undefined;

  /**
   * Where the list opens
   */
  placement: ComboboxPlacement;
}

/**
 * A combobox's list, an overlay on the menu surface holding the `listbox` and its options named by the surrounding
 * `Field`'s label or else as the control is, followed by the hidden input that submits the value when it has a name
 */
export function ComboboxPopup({
  "aria-label": label,
  "aria-labelledby": labelledBy,
  children,
  disabled,
  emptyMessage,
  form,
  list,
  name,
  placement,
}: ComboboxPopupProps): JSX.Element {
  const { attachList, context, listId, open, selectedValue } = list;
  const fieldLabelId = useContext(FieldContext)?.labelId;

  // Keeps focus in the control, which a press in the list would otherwise move to the page
  function handleMouseDown(event: MouseEvent<HTMLElement>): void {
    event.preventDefault();
  }

  return (
    <ComboboxContext.Provider value={context}>
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- only keeps focus in the control */}
      <Overlay
        anchorName={anchorNameFor(listId)}
        as="div"
        className={`${surfaceStyles.menu} ${styles.popup}`}
        onMouseDown={handleMouseDown}
        open={open}
        placement={placement}
        popover="manual"
      >
        <Box
          className={styles.listbox}
          id={listId}
          ref={attachList}
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a native select cannot hold rich options
          role="listbox"
          aria-label={fieldLabelId === undefined ? label : undefined}
          aria-labelledby={fieldLabelId ?? labelledBy}
        >
          {children}
        </Box>
        {emptyMessage !== undefined && <Box className={styles.empty}>{emptyMessage}</Box>}
      </Overlay>
      {name !== undefined && (
        <input disabled={disabled} form={form} name={name} type="hidden" value={selectedValue ?? ""} />
      )}
    </ComboboxContext.Provider>
  );
}
