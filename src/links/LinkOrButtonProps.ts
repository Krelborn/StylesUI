import type { ComponentPropsWithRef, JSXElementConstructor } from "react";

/**
 * What a link-or-button component can render: a link, a button, or a component that renders an anchor, such as a
 * router's link
 */
// `never` props accept a component whatever props it requires
export type LinkOrButtonElement = "a" | "button" | JSXElementConstructor<never>;

// The props one native element has and the other lacks, typed never so an `as` that may be either rejects them
type PropsOnlyOn<Element extends "a" | "button", Other extends "a" | "button"> = {
  [Name in Exclude<keyof ComponentPropsWithRef<Element>, keyof ComponentPropsWithRef<Other>>]?: never;
};

// ComponentPropsWithRef<E> cannot be used: it requires an ElementType, which a component with `never` props is not
type ElementProps<E extends LinkOrButtonElement> =
  E extends JSXElementConstructor<infer Props>
    ? Props
    : E extends "button"
      ? ComponentPropsWithRef<"button"> & PropsOnlyOn<"a", "button">
      : ComponentPropsWithRef<"a"> & PropsOnlyOn<"button", "a">;

// Omit on its own keeps only the props every member of a union has, which loses a component's union props
type OmitFromEach<Props, Name extends PropertyKey> = Props extends unknown ? Omit<Props, Name> : never;

/**
 * The props of the link, button or component given in `as`, less the names a component sets itself. When `as` may be
 * either a link or a button, only props both accept are allowed.
 */
export type LinkOrButtonProps<E extends LinkOrButtonElement, Omitted extends PropertyKey> = OmitFromEach<
  ElementProps<E>,
  Omitted
>;
