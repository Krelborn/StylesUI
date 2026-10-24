import type { JSX, ReactNode } from "react";

import { hasContent } from "../../forms";
import { Box } from "../Box";

import styles from "./Combobox.module.css";
import type { SelectedContent } from "./ComboboxContext";

interface ComboboxFieldValueProps {
  /**
   * Shown while no option is selected
   */
  placeholder: ReactNode;

  /**
   * What the selected option shows, or null for none
   */
  selected: SelectedContent | null;
}

/**
 * What a `Combobox`'s field shows: the selected option's leading content and label, or the placeholder
 */
export function ComboboxFieldValue({ placeholder, selected }: ComboboxFieldValueProps): JSX.Element {
  if (selected === null) {
    return (
      <Box as="span" className={styles.placeholder}>
        {placeholder}
      </Box>
    );
  }

  return (
    <>
      {hasContent(selected.leading) && (
        <Box as="span" className={styles.fieldLeading} aria-hidden={true}>
          {selected.leading}
        </Box>
      )}
      <Box as="span" className={styles.fieldLabel}>
        {selected.label}
      </Box>
    </>
  );
}
