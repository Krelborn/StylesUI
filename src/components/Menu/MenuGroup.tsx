import { clsx } from "clsx";
import type { JSX, ReactNode } from "react";
import { useId } from "react";

import { hasContent } from "../../forms";
import type { BoxProps } from "../Box";
import { Box } from "../Box";
import styles from "../MenuSurface/MenuSurface.module.css";

import { useMenuContext } from "./useMenuContext";

/**
 * Props for `MenuGroup`: its label plus every `div` prop except the role the menu pattern sets
 */
export interface MenuGroupProps extends Omit<BoxProps<"div">, "as" | "role"> {
  /**
   * A heading shown above the group's items, which names the group
   */
  label?: ReactNode;
}

/**
 * Groups related items in a `Menu`, under a label that names them when it has one. The arrow keys and type-ahead move
 * across groups as though the items were in one list. Put a `MenuSeparator` between groups to rule them apart.
 *
 * @example
 * <MenuGroup label="Sort by">
 *   <MenuItem onClick={sortByName}>Name</MenuItem>
 *   <MenuItem onClick={sortBySize}>Size</MenuItem>
 * </MenuGroup>
 */
export function MenuGroup({ children, className, label, ...rest }: MenuGroupProps): JSX.Element {
  useMenuContext("MenuGroup");
  const labelId = useId();
  const hasLabel = hasContent(label);

  return (
    <Box
      {...rest}
      className={clsx(styles.group, className)}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- fieldset and the other elements with this role do not belong in a menu
      role="group"
      aria-labelledby={hasLabel ? labelId : undefined}
    >
      {hasLabel && (
        <Box className={styles.groupLabel} id={labelId}>
          {label}
        </Box>
      )}
      {children}
    </Box>
  );
}
