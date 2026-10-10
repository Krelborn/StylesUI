import { clsx } from "clsx";
import type { JSX } from "react";

import type { BoxElement, BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Prose.module.css";

/**
 * Body text sizes of prose, mapped to the `--sui-font-size-*` tokens
 */
export type ProseSize = "sm" | "md" | "lg";

/**
 * What a code block in prose does with a line wider than the column
 */
export type ProseCodeOverflow = "wrap" | "scroll";

interface ProseOwnProps {
  /**
   * What a code block does with a line wider than the column: `wrap` breaks it onto the next line,
   * and `scroll` keeps it whole and scrolls the block sideways, so wrapping cannot break indentation
   * or a diagram drawn in text. Defaults to `wrap`.
   */
  codeOverflow?: ProseCodeOverflow;

  /**
   * Body text size. Defaults to `md`.
   */
  size?: ProseSize;
}

/**
 * Props for `Prose`: its own props plus every prop supported by the element given in `as`
 */
// Spelled out rather than PolymorphicProps<E, ProseOwnProps>, whose own props react-docgen cannot read for the docs
export type ProseProps<E extends BoxElement = "div"> = ProseOwnProps & Omit<BoxProps<E>, keyof ProseOwnProps>;

/**
 * Styles the raw HTML inside it: headings, paragraphs, links, lists, quotes, code, images, figures
 * and tables. It is for content that cannot be written one component per element, such as rendered
 * markdown or CMS output.
 *
 * A StylesUI component inside prose keeps its own styles. Two things are still styled as prose: a
 * raw element inside that component, and, for the properties it does not set itself, a component
 * rendered through `as` as an element prose styles, such as `<Text as="code">`.
 *
 * A table wider than the column scrolls sideways inside its own box, as does a code block when
 * `codeOverflow` is `scroll`; give each one that scrolls `tabIndex={0}` so a keyboard can scroll it.
 * Set `--sui-prose-line-height` on the prose or an ancestor to space out long lines of text. Code
 * keeps `--sui-line-height-normal`.
 *
 * @example
 * <Prose as="article" size="lg">
 *   <h2>Release notes</h2>
 *   <p>
 *     Read the <a href="#changelog">changelog</a> before you upgrade.
 *   </p>
 * </Prose>
 */
export function Prose<E extends BoxElement = "div">({
  as,
  className,
  codeOverflow = "wrap",
  size = "md",
  ...rest
}: ProseProps<E>): JSX.Element {
  // Widened as in Box: ProseProps<E> already guarantees the props match `as`
  const boxProps = rest as BoxProps<"div">;

  return (
    <Box
      {...boxProps}
      as={as as "div"}
      className={clsx(styles.prose, className)}
      data-code-overflow={codeOverflow}
      data-size={size}
    />
  );
}
