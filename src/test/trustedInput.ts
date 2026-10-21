/**
 * Real keyboard and pointer input, which the browser trusts for its own behaviour, such as a popover's light dismiss
 */
export interface TrustedInput {
  /**
   * Clicks the element with the given `data-testid` in the story's frame
   */
  clickByTestId: (testId: string) => Promise<void>;

  /**
   * Clicks the bottom-right corner of the story's frame. The story must render nothing there, so the click lands
   * outside it.
   */
  clickPageCorner: () => Promise<void>;

  /**
   * Holds the primary pointer button down over the element with the given `data-testid` in the story's frame, so it
   * matches `:active` until `releasePointer` runs
   */
  holdPointerByTestId: (testId: string) => Promise<void>;

  /**
   * Moves the pointer over the element with the given `data-testid` in the story's frame, so it matches `:hover`
   */
  hoverByTestId: (testId: string) => Promise<void>;

  /**
   * Presses a key, named as Playwright names it, such as "Escape". The key goes to whatever has focus in the story's
   * frame.
   */
  pressKey: (key: string) => Promise<void>;

  /**
   * Releases the primary pointer button that `holdPointerByTestId` holds down
   */
  releasePointer: () => Promise<void>;

  /**
   * Slides the pointer slowly from the middle of one element to the near edge of another, both with the given role
   * and found by their accessible names, over 800ms, crossing whatever lies between
   */
  slidePointerByRole: (role: string, fromName: string, toName: string) => Promise<void>;
}

let registeredInput: TrustedInput | null = null;

/**
 * Makes trusted input available to stories. The storybook test projects' setup file calls it.
 *
 * @param input the real input the test runner provides
 */
export function registerTrustedInput(input: TrustedInput): void {
  registeredInput = input;
}

/**
 * The trusted input the storybook test projects provide
 *
 * @returns the input, or null in Storybook's own UI, which has none; a story then stops before the steps that need it
 */
export function trustedInput(): TrustedInput | null {
  return registeredInput;
}
