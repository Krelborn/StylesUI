import { clsx } from "clsx";
import type { JSX, ReactNode } from "react";

import { hasContent } from "../../forms";
import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Accordion.module.css";
import { panelId, titleId, toggleId } from "./accordionIds";
import { AccordionToggleContent } from "./AccordionToggleContent";
import { useAccordionContext } from "./useAccordionContext";
import { useFindablePanel } from "./useFindablePanel";
import { useHasOpened } from "./useHasOpened";

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
   * Whether the item cannot be opened or closed. A disabled item stays reachable with the keyboard, so its title is
   * read, and its closed panel is skipped by find-in-page. Defaults to `false`.
   */
  disabled?: boolean;

  /**
   * Whether the panel's content renders only once the item first opens, for content that is costly to render. It stays
   * rendered after the item closes. Find-in-page and links cannot reach content that has never rendered. Defaults to
   * `false`.
   */
  lazy?: boolean;

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
  disabled = false,
  lazy = false,
  title,
  trailing,
  value,
  ...rest
}: AccordionItemProps): JSX.Element {
  const accordion = useAccordionContext("AccordionItem");
  const open = accordion.openValues.includes(value);
  const itemToggleId = toggleId(accordion.baseId, value);
  const itemPanelId = panelId(accordion.baseId, value);
  const itemTitleId = titleId(accordion.baseId, value);
  const hasOpened = useHasOpened(open);
  const panelRef = useFindablePanel({ disabled, onMatch: () => accordion.toggle(value), open });
  const regionProps = accordion.regions ? { role: "region", "aria-labelledby": itemTitleId } : {};

  function handleClick(): void {
    if (!disabled) {
      accordion.toggle(value);
    }
  }

  return (
    <Box {...rest} className={clsx(styles.item, className)} data-disabled={disabled} data-open={open}>
      <Box className={styles.header}>
        <Box as={`h${accordion.headingLevel}` as const} className={styles.heading}>
          <Box
            as="button"
            className={styles.toggle}
            id={itemToggleId}
            onClick={handleClick}
            type="button"
            aria-controls={itemPanelId}
            aria-disabled={disabled ? true : undefined}
            aria-expanded={open}
            data-variant={accordion.variant}
          >
            <AccordionToggleContent
              description={description}
              indicator={accordion.indicator}
              title={title}
              titleId={itemTitleId}
              trailing={trailing}
            />
          </Box>
        </Box>
        {hasContent(actions) && <Box className={styles.actions}>{actions}</Box>}
      </Box>
      <Box className={styles.panel} hidden={!open} id={itemPanelId} ref={panelRef} {...regionProps}>
        <Box className={styles.content}>{!lazy || hasOpened ? children : null}</Box>
      </Box>
    </Box>
  );
}
