import { clsx } from "clsx";
import type { JSX, ReactNode } from "react";

import { hasContent } from "../../forms";
import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Accordion.module.css";
import { panelId, toggleId } from "./accordionIds";
import { useAccordionContext } from "./useAccordionContext";

/**
 * Props for `AccordionItem`: its own props plus every `div` prop except `dangerouslySetInnerHTML` and `title`
 */
export interface AccordionItemProps extends Omit<BoxProps<"div">, "as" | "dangerouslySetInnerHTML" | "title"> {
  /**
   * Controls beside the toggle, such as an `IconButton` that adds an entry to the section. They sit outside the
   * heading, so they are not part of its text or the toggle's name.
   */
  actions?: ReactNode;

  /**
   * The panel's content
   */
  children?: ReactNode;

  /**
   * Muted text under the title, inside the toggle, so it is read as part of the toggle's name
   */
  description?: ReactNode;

  /**
   * The header's text, which names the toggle and, when the accordion has regions, the panel
   */
  title: ReactNode;

  /**
   * Shown at the end of the toggle, such as a value or a `Counter`. A space separates it from the title, so it is read
   * after it.
   */
  trailing?: ReactNode;

  /**
   * Identifies the item in the `Accordion`'s `value`, `defaultValue` and `onValueChange`
   */
  value: string;
}

/**
 * One section of an `Accordion`: a heading holding the toggle that opens and closes it, and the panel it shows
 *
 * @example
 * <AccordionItem title="Effects" trailing={<Counter count={2} />} value="effects">…</AccordionItem>
 */
export function AccordionItem({
  actions,
  children,
  className,
  description,
  title,
  trailing,
  value,
  ...rest
}: AccordionItemProps): JSX.Element {
  const accordion = useAccordionContext("AccordionItem");
  const open = accordion.openValues.includes(value);
  const itemToggleId = toggleId(accordion.baseId, value);
  const itemPanelId = panelId(accordion.baseId, value);

  return (
    <Box {...rest} className={clsx(styles.item, className)} data-open={open}>
      <Box className={styles.header}>
        <Box as={`h${accordion.headingLevel}` as const} className={styles.heading}>
          <Box
            as="button"
            className={styles.toggle}
            id={itemToggleId}
            onClick={() => accordion.toggle(value)}
            type="button"
            aria-controls={itemPanelId}
            aria-expanded={open}
          >
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
          </Box>
        </Box>
        {hasContent(actions) && <Box className={styles.actions}>{actions}</Box>}
      </Box>
      <Box
        className={styles.panel}
        hidden={!open}
        id={itemPanelId}
        role={accordion.regions ? "region" : undefined}
        aria-labelledby={accordion.regions ? itemToggleId : undefined}
      >
        {children}
      </Box>
    </Box>
  );
}
