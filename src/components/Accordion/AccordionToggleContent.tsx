import type { JSX, ReactNode } from "react";

import { hasContent } from "../../forms";
import { Box } from "../Box";
import { ChevronDownIcon } from "../Icon";

import styles from "./Accordion.module.css";

interface AccordionToggleContentProps {
  /**
   * Muted text under the title
   */
  description: ReactNode;

  /**
   * The header's text
   */
  title: ReactNode;

  /**
   * Shown at the end of the toggle
   */
  trailing: ReactNode;
}

/**
 * What an `AccordionItem`'s toggle shows: the indicator, which the stylesheet places for the look, then its title, and
 * its description and trailing content, each after a space, so the toggle's name reads them in that order
 */
export function AccordionToggleContent({ description, title, trailing }: AccordionToggleContentProps): JSX.Element {
  return (
    <>
      <ChevronDownIcon className={styles.indicator} />
      <Box as="span" className={styles.label}>
        <Box as="span" className={styles.title}>
          {title}
        </Box>
        {hasContent(description) && (
          <>
            {" "}
            <Box as="span" className={styles.description}>
              {description}
            </Box>
          </>
        )}
      </Box>
      {hasContent(trailing) && (
        <>
          {" "}
          <Box as="span" className={styles.trailing}>
            {trailing}
          </Box>
        </>
      )}
    </>
  );
}
