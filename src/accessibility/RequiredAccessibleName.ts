/**
 * Requires an accessible name for a landmark or widget, given as `aria-label` or `aria-labelledby`
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
