import type { JSX, ReactNode } from "react";
import { useId } from "react";

import { hasContent } from "../../forms";
import { Box } from "../Box";
import styles from "../MenuSurface/MenuSurface.module.css";

/**
 * What a menu item shows
 */
interface MenuItemContentOptions {
  /**
   * The consumer's own `aria-describedby`, listed after the description
   */
  describedBy: string | undefined;

  /**
   * A line of muted text below the label
   */
  description: ReactNode;

  /**
   * The label
   */
  label: ReactNode;

  /**
   * What sits in the leading slot, such as an icon or a check; nothing leaves the item without one
   */
  leading: ReactNode;

  /**
   * What sits after the label, such as a shortcut or a submenu's chevron
   */
  trailing: ReactNode;
}

/**
 * A menu item's content and the ids that name and describe it
 */
interface MenuItemContent {
  /**
   * The leading slot, label, description and trailing slot, in that order
   */
  content: JSX.Element;

  /**
   * The ids for the item's `aria-describedby`: the description's, then the consumer's; undefined for neither
   */
  describedBy: string | undefined;

  /**
   * Whether the item has a leading slot, for its `data-leading`, which gives its menu an icon column
   */
  hasLeading: boolean;

  /**
   * The id for the item's `aria-labelledby`, which names it by its label alone
   */
  labelId: string;
}

/**
 * Lays out the content every kind of menu item shares
 *
 * @param options the label, description, leading and trailing slots and the consumer's `aria-describedby`
 * @returns the content and the ids to name and describe the item by
 */
export function useMenuItemContent({
  describedBy,
  description,
  label,
  leading,
  trailing,
}: MenuItemContentOptions): MenuItemContent {
  const labelId = useId();
  const descriptionId = useId();
  const hasDescription = hasContent(description);
  const hasLeading = hasContent(leading);
  const describedByIds = [hasDescription ? descriptionId : undefined, describedBy]
    .filter((id) => id !== undefined && id !== "")
    .join(" ");

  const content = (
    <>
      {hasLeading && (
        <Box as="span" className={styles.leading} aria-hidden={true}>
          {leading}
        </Box>
      )}
      <Box as="span" className={styles.text}>
        <Box as="span" className={styles.label} id={labelId}>
          {label}
        </Box>
        {hasDescription && (
          <Box as="span" className={styles.description} id={descriptionId}>
            {description}
          </Box>
        )}
      </Box>
      {hasContent(trailing) && (
        <Box as="span" className={styles.trailing} aria-hidden={true}>
          {trailing}
        </Box>
      )}
    </>
  );

  return { content, describedBy: describedByIds === "" ? undefined : describedByIds, hasLeading, labelId };
}
