/**
 * Requires an accessible name for a landmark or widget, given as `aria-label` or `aria-labelledby`
 *
 * Compose it into a props type as
 * `OwnProps & RequiredAccessibleName & Omit<BoxProps<E>, "aria-label" | "aria-labelledby" | …>`. `Omit` over a props
 * type that already contains it makes the name optional, because `Omit` flattens the union into one object type.
 */
export type RequiredAccessibleName =
  | {
      /**
       * The name, when no visible text names the element
       */
      "aria-label": string;

      /**
       * Ids of the visible elements that name the element
       */
      "aria-labelledby"?: string;
    }
  | {
      /**
       * The name, when no visible text names the element
       */
      "aria-label"?: string;

      /**
       * Ids of the visible elements that name the element
       */
      "aria-labelledby": string;
    };
