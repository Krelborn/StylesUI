import { clsx } from "clsx";
import type { FocusEvent, JSX, KeyboardEvent, MouseEvent } from "react";

import { targetIndexForKey } from "../../collections";
import type { BoxProps } from "../Box";
import { Box } from "../Box";

import { panelId, tabId } from "./tabIds";
import styles from "./Tabs.module.css";
import { useTabsContext } from "./useTabsContext";

/**
 * Props for `Tab`: its own props plus every native button prop except those the tab pattern sets
 */
export interface TabProps extends Omit<
  BoxProps<"button">,
  | "aria-controls"
  | "aria-disabled"
  | "aria-selected"
  | "as"
  | "disabled"
  | "id"
  | "role"
  | "tabIndex"
  | "type"
  | "value"
> {
  /**
   * Whether the tab cannot be selected. A disabled tab stays reachable with the arrow keys, so its label is read, but
   * focus and clicks never select it. Defaults to `false`.
   */
  disabled?: boolean;

  /**
   * The value this tab stands for, matching one `TabPanel`'s `value`
   */
  value: string;
}

/**
 * One tab in a `TabList`. The arrow keys move between tabs, wrapping at both ends, and Home and End go to the first
 * and last. Your `onClick`, `onFocus` and `onKeyDown` run first; preventing a click's or key's default stops the tab
 * handling it. A disabled tab ignores clicks, so your `onClick` does not run for it.
 *
 * @example
 * <Tab value="issues">Issues</Tab>
 */
export function Tab({
  className,
  disabled = false,
  onClick,
  onFocus,
  onKeyDown,
  value,
  ...rest
}: TabProps): JSX.Element {
  const tabs = useTabsContext("Tab");
  const selected = tabs.selectedValue === value;

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    if (disabled) {
      return;
    }

    onClick?.(event);

    if (!event.defaultPrevented) {
      tabs.select(value);
    }
  }

  function handleFocus(event: FocusEvent<HTMLButtonElement>): void {
    onFocus?.(event);

    if (tabs.activation === "automatic" && !disabled) {
      tabs.select(value);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    onKeyDown?.(event);

    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const tabElements = Array.from(
      event.currentTarget.closest('[role="tablist"]')?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []
    );
    const target = targetIndexForKey({
      count: tabElements.length,
      currentIndex: tabElements.indexOf(event.currentTarget),
      direction: event.currentTarget.matches(":dir(rtl)") ? "rtl" : "ltr",
      key: event.key,
      orientation: tabs.orientation,
      wraps: true,
    });

    if (target !== null) {
      event.preventDefault();
      tabElements[target].focus();
    }
  }

  return (
    <Box
      {...rest}
      as="button"
      className={clsx(styles.tab, className)}
      id={tabId(tabs.baseId, value)}
      onClick={handleClick}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      role="tab"
      tabIndex={selected ? 0 : -1}
      type="button"
      aria-controls={panelId(tabs.baseId, value)}
      aria-disabled={disabled ? true : undefined}
      aria-selected={selected}
      data-size={tabs.size}
      data-variant={tabs.variant}
    />
  );
}
