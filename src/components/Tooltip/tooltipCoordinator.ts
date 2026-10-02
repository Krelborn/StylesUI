/**
 * How long after the open tooltip closes that the next one still skips its show delay, in milliseconds
 */
const warmWindow = 300;

interface Claim {
  /**
   * Hides the tooltip that made the claim
   */
  hide: () => void;

  /**
   * The id of the tooltip that made the claim
   */
  id: string;
}

let openTooltip: Claim | null = null;
let lastReleasedAt = Number.NEGATIVE_INFINITY;

/**
 * Records a tooltip as the one open tooltip, hiding the tooltip that was open before it
 *
 * @param id the claiming tooltip's id
 * @param hide hides the claiming tooltip when a later tooltip claims
 * @returns releases the claim; call it when the tooltip closes or unmounts
 */
export function claimTooltip(id: string, hide: () => void): () => void {
  if (openTooltip !== null && openTooltip.id !== id) {
    openTooltip.hide();
  }

  const claim: Claim = { hide, id };
  openTooltip = claim;

  return () => {
    if (openTooltip === claim) {
      openTooltip = null;
      lastReleasedAt = Date.now();
    }
  };
}

/**
 * Whether a tooltip opening now should skip its show delay
 *
 * @returns true while a tooltip is open, and for 300ms after the last one closes
 */
export function isTooltipWarm(): boolean {
  return openTooltip !== null || Date.now() - lastReleasedAt < warmWindow;
}
