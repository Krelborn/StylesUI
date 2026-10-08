import { beforeEach } from "vitest";
import { commands } from "vitest/browser";

import { registerTrustedInput } from "./trustedInput";

declare module "vitest/browser" {
  interface BrowserCommands {
    /**
     * Clicks the element with the given `data-testid` in the story's frame with the real pointer
     */
    clickByTestId: (testId: string) => Promise<void>;

    /**
     * Clicks the bottom-right corner of the story's frame with the real pointer
     */
    clickPageCorner: () => Promise<void>;

    /**
     * Holds the real primary pointer button down over the element with the given `data-testid` in the story's frame
     */
    holdPointerByTestId: (testId: string) => Promise<void>;

    /**
     * Moves the real pointer over the element with the given `data-testid` in the story's frame
     */
    hoverByTestId: (testId: string) => Promise<void>;

    /**
     * Moves the real pointer off the page
     */
    movePointerOffPage: () => Promise<void>;

    /**
     * Presses a key with the real keyboard
     */
    pressKey: (key: string) => Promise<void>;

    /**
     * Releases the real primary pointer button
     */
    releasePointer: () => Promise<void>;
  }
}

registerTrustedInput({
  clickByTestId: (testId) => commands.clickByTestId(testId),
  clickPageCorner: () => commands.clickPageCorner(),
  holdPointerByTestId: (testId) => commands.holdPointerByTestId(testId),
  hoverByTestId: (testId) => commands.hoverByTestId(testId),
  pressKey: (key) => commands.pressKey(key),
  releasePointer: () => commands.releasePointer(),
});

// Chromium on Linux can apply :hover to whatever a story renders under the pointer, without the pointer moving
beforeEach(async () => {
  await commands.movePointerOffPage();
});
