import { clsx } from "clsx";
import type { ComponentPropsWithRef, JSX, JSXElementConstructor } from "react";

import type { BoxProps } from "../Box";
import { Box } from "../Box";

import styles from "./Link.module.css";

/**
 * What `Link` can render: an anchor, or a component that renders one, such as a router's link
 */
// `never` props accept a component whatever props it requires
export type LinkElement = "a" | JSXElementConstructor<never>;

/**
 * Link colours: the theme's link colour, or `inherit` to take the surrounding text colour
 */
export type LinkTone = "inherit" | "primary";

/**
 * When a link's underline shows. `hover` also shows it on keyboard focus, and is for navigation:
 * in running text a link needs its underline to be told apart from the text around it.
 */
export type LinkUnderline = "always" | "hover";

interface LinkOwnProps {
  /**
   * Link colour. Defaults to `primary`.
   */
  tone?: LinkTone;

  /**
   * When the underline shows. Defaults to `always`.
   */
  underline?: LinkUnderline;
}

interface LinkElementOwnProps<E extends LinkElement> {
  /**
   * What to render: `a`, or a component that renders an anchor. Defaults to `a`.
   */
  as?: E;

  /**
   * Class names merged with the component's base class.
   */
  className?: string;
}

// ComponentPropsWithRef<E> cannot be used: it requires an ElementType, which a component with
// `never` props is not
type LinkElementProps<E extends LinkElement> =
  E extends JSXElementConstructor<infer Props> ? Props : ComponentPropsWithRef<"a">;

// Omit on its own keeps only the props every member of a union has, which loses a component's union props
type OmitFromEach<Props, Name extends PropertyKey> = Props extends unknown ? Omit<Props, Name> : never;

/**
 * Props for `Link`: its own props plus every prop of the anchor or component given in `as`
 */
export type LinkProps<E extends LinkElement = "a"> = LinkOwnProps &
  LinkElementOwnProps<E> &
  OmitFromEach<LinkElementProps<E>, keyof LinkOwnProps | keyof LinkElementOwnProps<E>>;

interface LinkStylingProps {
  className: string;
  "data-tone": LinkTone;
  "data-underline": LinkUnderline;
}

/**
 * Themed link. Renders an anchor, or the component given in `as`, such as a router's link. That
 * component must pass `className` and the `data-*` attributes it is given on to its anchor.
 *
 * @example
 * <Link href="/docs">Documentation</Link>
 *
 * @example
 * <Link as={RouterLink} to="/settings" underline="hover">Settings</Link>
 */
export function Link<E extends LinkElement = "a">({
  as,
  className,
  tone = "primary",
  underline = "always",
  ...rest
}: LinkProps<E>): JSX.Element {
  const stylingProps: LinkStylingProps = {
    className: clsx(styles.link, className),
    "data-tone": tone,
    "data-underline": underline,
  };

  if (as === undefined || as === "a") {
    // Widened as in Box: LinkProps<E> already guarantees the props match `as`
    const { children, ...anchorProps } = rest as BoxProps<"a">;

    return (
      <Box {...anchorProps} {...stylingProps} as="a">
        {children}
      </Box>
    );
  }

  // Narrowed to the props Link adds: LinkProps<E> already guarantees the rest match the component
  const Component = as as JSXElementConstructor<LinkStylingProps>;

  return <Component {...rest} {...stylingProps} />;
}
