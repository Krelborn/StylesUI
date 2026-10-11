/**
 * Side of the trigger an overlay opens on. `top` and `bottom` centre it on the trigger, and `top-start`, `top-end`,
 * `bottom-start` and `bottom-end` line its start or end edge up with the trigger's instead, so it grows away from that
 * edge. `start` and `end` follow the writing direction.
 */
export type OverlayPlacement =
  | "bottom"
  | "bottom-end"
  | "bottom-start"
  | "end"
  | "start"
  | "top"
  | "top-end"
  | "top-start";
