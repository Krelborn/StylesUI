/**
 * How long a touch is held before it opens a context menu, as on Android and iOS
 */
const holdMilliseconds = 500;

/**
 * How far a held touch may move, in CSS pixels, before it counts as a scroll or a drag instead
 */
const moveTolerance = 10;

/**
 * The touch that started a press
 */
interface Press {
  clientX: number;
  clientY: number;
  pointerId: number;
}

/**
 * Callbacks for the end of a long-press
 */
interface LongPressCallbacks {
  /**
   * Called when the press ends, however it ends
   */
  onEnd: () => void;

  /**
   * Called once the touch has been held long enough
   */
  onLongPress: () => void;
}

/**
 * Watches a touch press for being held in place long enough to open a context menu. Moving further than the tolerance,
 * lifting the finger, the browser cancelling the touch, as it does when a scroll starts, and a second finger all stop
 * it opening. Until the press ends, text selection is stopped, which iOS would start on held text, and a press held
 * long enough ends without the mouse events and click browsers send after a touch, which would act on the element
 * under the finger and move focus out of the menu.
 *
 * @param press the `pointerdown` of the touch
 * @param page the document the touch is in
 * @param callbacks what to call once the touch is held long enough, and when the press ends
 * @returns a function that stops watching at once
 */
export function watchLongPress(press: Press, page: Document, { onEnd, onLongPress }: LongPressCallbacks): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined = setTimeout(() => {
    timer = undefined;
    preventTouchEnd(page);
    onLongPress();
  }, holdMilliseconds);

  function cancel(): void {
    clearTimeout(timer);
    timer = undefined;
  }

  function handlePointerDown(event: PointerEvent): void {
    if (event.pointerId !== press.pointerId) {
      cancel();
    }
  }

  function handlePointerMove(event: PointerEvent): void {
    const distance = Math.hypot(event.clientX - press.clientX, event.clientY - press.clientY);

    if (event.pointerId === press.pointerId && distance > moveTolerance) {
      cancel();
    }
  }

  function handlePointerEnd(event: PointerEvent): void {
    if (event.pointerId === press.pointerId) {
      stop();
      onEnd();
    }
  }

  function preventSelection(event: Event): void {
    event.preventDefault();
  }

  function stop(): void {
    cancel();
    page.removeEventListener("pointerdown", handlePointerDown, true);
    page.removeEventListener("pointermove", handlePointerMove, true);
    page.removeEventListener("pointerup", handlePointerEnd, true);
    page.removeEventListener("pointercancel", handlePointerEnd, true);
    page.removeEventListener("selectstart", preventSelection, true);
  }

  // Captured on the document, since the menu captures the touch once it opens
  page.addEventListener("pointerdown", handlePointerDown, true);
  page.addEventListener("pointermove", handlePointerMove, true);
  page.addEventListener("pointerup", handlePointerEnd, true);
  page.addEventListener("pointercancel", handlePointerEnd, true);
  page.addEventListener("selectstart", preventSelection, true);

  return stop;
}

/**
 * Cancels the next `touchend`, which stops the mouse events and click that follow it, unless the touch is cancelled
 * first
 *
 * @param page the document the touch is in
 */
function preventTouchEnd(page: Document): void {
  const listening = new AbortController();
  const options = { capture: true, signal: listening.signal };

  page.addEventListener(
    "touchend",
    (event) => {
      event.preventDefault();
      listening.abort();
    },
    { ...options, passive: false }
  );
  page.addEventListener("touchcancel", () => listening.abort(), options);
}
