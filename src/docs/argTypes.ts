import type { ArgTypes } from "@storybook/react-vite";

import type { BoxElement } from "../components/Box";

type InputType = NonNullable<ArgTypes[string]>;

/**
 * Arg type for the `children` prop, which react-docgen cannot see on props inherited from `Box`
 */
export const childrenArgType: InputType = {
  control: "text",
  description: "Content rendered inside the element",
  table: { type: { summary: "ReactNode" } },
};

/**
 * Arg types for the `aria-label` and `aria-labelledby` props of a component that requires an accessible name, which
 * react-docgen cannot see through the `RequiredAccessibleName` union
 */
export const accessibleNameArgTypes: Record<"aria-label" | "aria-labelledby", InputType> = {
  "aria-label": {
    control: "text",
    description: "The name, when no visible text names the element. Give `aria-label` or `aria-labelledby`.",
    table: { type: { summary: "string" } },
  },
  "aria-labelledby": {
    control: "text",
    description: "Ids of the visible elements that name the element. Give `aria-label` or `aria-labelledby`.",
    table: { type: { summary: "string" } },
  },
};

/**
 * Builds the arg type for a polymorphic component's `as` prop, which react-docgen cannot see on
 * props inherited from `Box`
 *
 * @param defaultElement the element rendered when `as` is omitted
 * @param elements the elements offered by the docs control
 * @returns the arg type, typed as any intrinsic element
 */
export function asArgType(defaultElement: BoxElement, elements: readonly BoxElement[]): InputType {
  return {
    control: "select",
    description: "DOM element to render. The component accepts every prop that element supports, including `ref`.",
    options: elements,
    table: {
      defaultValue: { summary: defaultElement },
      type: { summary: "keyof JSX.IntrinsicElements" },
    },
  };
}
