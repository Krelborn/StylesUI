/**
 * Delays before an overlay shows and hides, in milliseconds
 */
export interface OverlayDelay {
  /**
   * Time between the pointer leaving the trigger and overlay, and the overlay hiding
   */
  hide?: number;

  /**
   * Time between the pointer entering the trigger and the overlay showing
   */
  show?: number;
}
