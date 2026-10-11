/**
 * Thrown when the browser refuses to show or hide a popover, even once it has finished showing or hiding another
 */
export class PopoverRefusedError extends Error {
  public override readonly name = "PopoverRefusedError";

  /**
   * @param popover the popover the browser refused
   * @param open whether the browser was asked to show the popover rather than hide it
   * @param cause the browser's refusal
   */
  public constructor(popover: HTMLElement, open: boolean, cause: DOMException) {
    super(`The browser refused to ${open ? "show" : "hide"} the popover with id "${popover.id}"`, { cause });
  }
}
