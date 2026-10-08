import { clsx } from "clsx";
import type { JSX, ReactNode } from "react";
import { useId } from "react";

import type { OverlayPlacement } from "../../overlays";
import { Box } from "../Box";
import type { ButtonProps } from "../Button";
import { Button } from "../Button";
import { Kbd } from "../Kbd";
import { Tooltip, useTooltip } from "../Tooltip";

import styles from "./IconButton.module.css";

/**
 * Props for `IconButton`: its own props plus `Button`'s, except the name and children a label replaces
 */
export interface IconButtonProps extends Omit<ButtonProps, "aria-label" | "aria-labelledby" | "children"> {
  /**
   * Not accepted: `label` names the button
   */
  "aria-label"?: never;

  /**
   * Not accepted: the tooltip names the button
   */
  "aria-labelledby"?: never;

  /**
   * The icon, hidden from assistive technology and sized to 1.25em
   */
  children: ReactNode;

  /**
   * What the button does. It is the tooltip's text and the button's accessible name.
   */
  label: string;

  /**
   * Side of the button the tooltip opens on. Defaults to `top`.
   */
  placement?: OverlayPlacement;

  /**
   * Keyboard shortcut shown after the label in the tooltip, such as "⌘R". It is not part of the name: add
   * `aria-keyshortcuts` (for example `"Meta+R"`) so screen readers announce it.
   */
  shortcut?: string;
}

/**
 * A square button showing only an icon, named by a tooltip that shows on hover and keyboard focus. Use a `Button` with
 * text when the label fits. A native `disabled` button cannot take focus, so keyboard users never see its tooltip:
 * prefer `aria-disabled` when they need it. With `aria-disabled` the button still calls `onClick`, so ignore presses
 * there and show the state yourself.
 *
 * @example
 * <IconButton busy={isSyncing} label="Refresh" onClick={refresh} shortcut="⌘R" aria-keyshortcuts="Meta+R">
 *   <RefreshIcon />
 * </IconButton>
 */
export function IconButton({
  children,
  className,
  label,
  placement = "top",
  shortcut,
  variant = "ghost",
  ...rest
}: IconButtonProps): JSX.Element {
  const tooltip = useTooltip({ placement, relationship: "label" });
  // Chromium reads the aria-hidden shortcut of a closed tooltip into the name of a button that points at the whole
  // tooltip, so the name points at the label alone
  const labelId = useId();
  const hasShortcut = shortcut !== undefined && shortcut !== "";

  return (
    <>
      <Button
        {...tooltip.getTriggerProps(rest)}
        className={clsx(styles.iconButton, className)}
        variant={variant}
        aria-labelledby={labelId}
      >
        <Box as="span" className={styles.icon} aria-hidden={true}>
          {children}
        </Box>
      </Button>
      <Tooltip {...tooltip.getOverlayProps()}>
        <Box as="span" id={labelId}>
          {label}
        </Box>
        {hasShortcut && (
          <Kbd className={styles.shortcut} aria-hidden={true}>
            {shortcut}
          </Kbd>
        )}
      </Tooltip>
    </>
  );
}
