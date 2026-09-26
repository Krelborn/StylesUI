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
