import type { JSX, ReactNode } from "react";

import { hasContent } from "../../forms";
import { Box } from "../Box";
import { CheckIcon } from "../Icon";
import surfaceStyles from "../MenuSurface/MenuSurface.module.css";

import styles from "./Combobox.module.css";

interface ComboboxOptionContentProps {
  /**
   * The label
   */
  children: ReactNode;

  /**
   * A line of muted text below the label
   */
  description: ReactNode;

  /**
   * The id of the description, which describes the option
   */
  descriptionId: string;

  /**
   * The id of the label, which names the option
   */
  labelId: string;

  /**
   * Content before the label
   */
  leading: ReactNode;

  /**
   * Whether the option is selected, which shows a check
   */
  selected: boolean;
}

/**
 * A combobox option's row: the check of a selected option, then its leading content, label and description
 */
export function ComboboxOptionContent({
  children,
  description,
  descriptionId,
  labelId,
  leading,
  selected,
}: ComboboxOptionContentProps): JSX.Element {
  return (
    <>
      {selected && (
        <Box as="span" className={`${surfaceStyles.leading} ${styles.check}`} aria-hidden={true}>
          <CheckIcon />
        </Box>
      )}
      {hasContent(leading) && (
        <Box as="span" className={styles.optionLeading} aria-hidden={true}>
          {leading}
        </Box>
      )}
      <Box as="span" className={surfaceStyles.text}>
        <Box as="span" className={surfaceStyles.label} id={labelId}>
          {children}
        </Box>
        {hasContent(description) && (
          <Box as="span" className={surfaceStyles.description} id={descriptionId}>
            {description}
          </Box>
        )}
      </Box>
    </>
  );
}
