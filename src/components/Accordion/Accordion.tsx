import { clsx } from "clsx";
import type { JSX, KeyboardEvent, ReactNode } from "react";
import { useId, useState } from "react";

import { targetIndexForKey } from "../../collections";
import type { ControlSize } from "../../forms";
import type { BoxProps } from "../Box";
import { Box } from "../Box";
import type { HeadingLevel } from "../Heading";

import styles from "./Accordion.module.css";
import { AccordionContext } from "./AccordionContext";

/**
 * Shape of the indicator that shows whether an item is open: a `chevron` that turns, or a `plusMinus` that turns from
 * a plus into a minus
 */
export type AccordionIndicator = "chevron" | "plusMinus";

/**
 * Accordion looks: `flush` rows split by dividers, for inspectors and sidebars; `joined` items in one bordered box;
 * `separated` items each drawn as a card
 */
export type AccordionVariant = "flush" | "joined" | "separated";

interface AccordionOwnProps {
  /**
   * The `AccordionItem`s
   */
  children?: ReactNode;

  /**
   * Whether at most one item is open, so opening one closes the others. Defaults to `false`.
   */
  exclusive?: boolean;

  /**
   * Level of every item's heading, which the page outline decides
   */
  headingLevel: HeadingLevel;

  /**
   * Shape of the indicator that shows whether an item is open. Defaults to `chevron`.
   */
  indicator?: AccordionIndicator;

  /**
   * Called with the values of the open items when the user opens or closes one
   */
  onValueChange?: (value: string[]) => void;

  /**
   * Whether each open panel is a landmark region named by its title. Defaults to `true` for `joined` and `separated` and
   * `false` for `flush`, whose many open sections would crowd the page's landmarks.
   */
  regions?: boolean;

  /**
   * Header size, matching the `Button` sizes. Defaults to `md`.
   */
  size?: ControlSize;

  /**
   * Look of the accordion. Defaults to `flush`.
   */
  variant?: AccordionVariant;
}

type AccordionOpenItems =
  | {
      /**
       * Values of the items open at first. It leaves `Accordion` uncontrolled. Defaults to none.
       */
      defaultValue?: string[];

      /**
       * Not accepted with `defaultValue`
       */
      value?: never;
    }
  | {
      /**
       * Not accepted with `value`
       */
      defaultValue?: never;

      /**
       * Values of the open items, which makes `Accordion` controlled: update it from `onValueChange`
       */
      value: string[];
    };

/**
 * Props for `Accordion`: its own props, `value` or `defaultValue`, and every other `div` prop
 */
export type AccordionProps = AccordionOwnProps &
  AccordionOpenItems &
  Omit<BoxProps<"div">, "as" | "defaultValue" | keyof AccordionOwnProps>;

/**
 * Sections of content that each open and close under a heading, following the WAI-ARIA accordion pattern. Give it an
 * `AccordionItem` for each section. Any number of items can be open, or one with `exclusive`.
 *
 * @example
 * <Accordion defaultValue={["layout"]} headingLevel={3} size="sm">
 *   <AccordionItem title="Layout" value="layout">…</AccordionItem>
 *   <AccordionItem title="Fill" value="fill">…</AccordionItem>
 * </Accordion>
 *
 * @example
 * <Accordion exclusive={true} headingLevel={2} indicator="plusMinus" size="lg" variant="separated">
 *   <AccordionItem title="Can I return a kit?" value="returns">…</AccordionItem>
 * </Accordion>
 */
export function Accordion({
  className,
  defaultValue = [],
  exclusive = false,
  headingLevel,
  indicator = "chevron",
  onKeyDown,
  onValueChange,
  regions,
  size = "md",
  value,
  variant = "flush",
  ...rest
}: AccordionProps): JSX.Element {
  const baseId = useId();
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const openValues = value ?? uncontrolledValue;

  function toggle(itemValue: string): void {
    let nextValue: string[];

    if (openValues.includes(itemValue)) {
      nextValue = openValues.filter((openValue) => openValue !== itemValue);
    } else if (exclusive) {
      nextValue = [itemValue];
    } else {
      nextValue = [...openValues, itemValue];
    }

    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    onKeyDown?.(event);

    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }

    const accordion = event.currentTarget;
    const toggles = Array.from(accordion.querySelectorAll<HTMLElement>(`.${styles.toggle}`)).filter(
      (toggle) => toggle.closest(`.${styles.accordion}`) === accordion && toggle.closest("[hidden], [inert]") === null
    );
    const currentIndex = toggles.findIndex((toggle) => toggle === event.target);

    if (currentIndex === -1) {
      return;
    }

    const target = targetIndexForKey({
      count: toggles.length,
      currentIndex,
      key: event.key,
      orientation: "vertical",
      wraps: false,
    });

    if (target !== null) {
      event.preventDefault();
      toggles[target].focus();
    }
  }

  return (
    <AccordionContext.Provider
      value={{
        baseId,
        headingLevel,
        indicator,
        openValues,
        regions: regions ?? variant !== "flush",
        toggle,
        variant,
      }}
    >
      <Box
        {...rest}
        className={clsx(styles.accordion, className)}
        onKeyDown={handleKeyDown}
        data-size={size}
        data-variant={variant}
      />
    </AccordionContext.Provider>
  );
}
