import type { JSX, ReactNode } from "react";

import { hasContent } from "../../forms";
import { Box } from "../Box";
import { AddIcon, ChevronDownIcon } from "../Icon";

import type { AccordionIndicator } from "./Accordion";
import styles from "./Accordion.module.css";

interface AccordionToggleContentProps {
  /**
   * Muted text under the title
   */
  description: ReactNode;

  /**
   * Shape of the indicator
   */
  indicator: AccordionIndicator;

  /**
   * The header's text
   */
  title: ReactNode;

  /**
   * Id of the element holding the title
   */
  titleId: string;

  /**
   * Shown at the end of the toggle
   */
  trailing: ReactNode;
}

/**
 * What an `AccordionItem`'s toggle shows: the indicator, which the stylesheet places for the look, then its title, and
 * its description and trailing content, each after a space, so the toggle's name reads them in that order
 */
export function AccordionToggleContent({
  description,
  indicator,
  title,
  titleId,
  trailing,
}: AccordionToggleContentProps): JSX.Element {
  return (
    <>
      {indicator === "plusMinus" ? (
        <AddIcon className={`${styles.indicator} ${styles.plusMinus}`} />
      ) : (
        <ChevronDownIcon className={`${styles.indicator} ${styles.chevron}`} />
      )}
      <Box as="span" className={styles.label}>
        <Box as="span" className={styles.title} id={titleId}>
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
