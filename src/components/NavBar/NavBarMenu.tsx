import { clsx } from "clsx";
import type { FocusEvent, JSX, KeyboardEvent, ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

import { anchorNameFor } from "../../overlays";
import type { BoxProps } from "../Box";
import { Box } from "../Box";
import { ChevronDownIcon } from "../Icon";

import { isNavBarCollapsed } from "./isNavBarCollapsed";
import styles from "./NavBar.module.css";
import { useNavBarContext } from "./useNavBarContext";

/**
 * Props for `NavBarMenu`: its own props plus every `li` prop except `dangerouslySetInnerHTML`
 */
export interface NavBarMenuProps extends Omit<BoxProps<"li">, "as" | "children" | "dangerouslySetInnerHTML"> {
  /**
   * The panel's links: `NavBarMenuItem`s, or `NavBarMenuGroup`s holding them
   */
  children: ReactNode;

  /**
   * How many columns the panel lays its links or groups out in on a wide bar. Defaults to 1.
   */
  columns?: 1 | 2 | 3;

  /**
   * The text of the button that opens the panel
   */
  label: ReactNode;
}

/**
 * A section of a `NavBar`: a button that opens a panel of links below it. A click, Enter or Space opens and closes
 * it. On a wide bar one section is open at a time, and Escape, a click outside or focus leaving closes it. On a
 * collapsed bar the panel opens in place, pushing what follows down, and Escape closes it. Choosing a link closes it.
 * Escape returns focus to the button.
 *
 * @example
 * <NavBarMenu columns={2} label="Topics">
 *   <NavBarMenuItem description="Typography, colour, systems" href="/topics/design">Design</NavBarMenuItem>
 *   <NavBarMenuItem description="Front-end, performance, tooling" href="/topics/engineering">Engineering</NavBarMenuItem>
 * </NavBarMenu>
 */
export function NavBarMenu({
  children,
  className,
  columns = 1,
  label,
  onBlur,
  onKeyDown,
  ...rest
}: NavBarMenuProps): JSX.Element {
  const { closeSection, openSections, toggleSection } = useNavBarContext("NavBarMenu");
  const panelId = useId();
  const anchorName = anchorNameFor(panelId);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const open = openSections.includes(panelId);

  useEffect(() => {
    const section = buttonRef.current?.parentElement;

    if (!open || section === null || section === undefined) {
      return;
    }

    const handlePointerDown = (event: PointerEvent): void => {
      const pressed = event.target;

      if (!(pressed instanceof Node && section.contains(pressed)) && !isNavBarCollapsed(section)) {
        closeSection(panelId);
      }
    };

    const page = section.ownerDocument;

    page.addEventListener("pointerdown", handlePointerDown, true);

    return () => page.removeEventListener("pointerdown", handlePointerDown, true);
  }, [closeSection, open, panelId]);

  function handleBlur(event: FocusEvent<HTMLLIElement>): void {
    onBlur?.(event);

    const next = event.relatedTarget;

    // Nothing can cover the focused element on a collapsed bar, where the panel pushes the page down
    if (open && next !== null && !event.currentTarget.contains(next) && !isNavBarCollapsed(event.currentTarget)) {
      closeSection(panelId);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLLIElement>): void {
    onKeyDown?.(event);

    if (event.key !== "Escape" || !open || event.defaultPrevented) {
      return;
    }

    // Also keeps a surrounding dialog, and a collapsed bar's navigation, open
    event.preventDefault();
    closeSection(panelId);
    buttonRef.current?.focus();
  }

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- only notices Escape and focus leaving the section
    <Box {...rest} as="li" className={clsx(styles.section, className)} onBlur={handleBlur} onKeyDown={handleKeyDown}>
      <Box
        as="button"
        className={styles.control}
        onClick={(event) => toggleSection(panelId, event.currentTarget)}
        ref={buttonRef}
        style={{ anchorName }}
        type="button"
        aria-controls={panelId}
        aria-expanded={open}
      >
        {label}
        <ChevronDownIcon className={styles.chevron} />
      </Box>
      <Box
        className={styles.panel}
        hidden={!open}
        id={panelId}
        style={{ positionAnchor: anchorName }}
        data-columns={columns}
      >
        <Box
          as="ul"
          className={styles.panelList}
          // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit drops the list role of a ul without markers
          role="list"
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
