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
     * Right-clicks the element with the given `data-testid` in the story's frame with the real pointer, at a point from
     * its top-left corner or in its middle
     */
    contextClickByTestId: (testId: string, position?: { x: number; y: number }) => Promise<void>;

    /**
     * Turns the browser's emulation of forced colours on or off
     */
    emulateForcedColors: (active: boolean) => Promise<void>;

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

    /**
     * Slides the real pointer slowly from one element with the given role and name to another
     */
    slidePointerByRole: (role: string, fromName: string, toName: string) => Promise<void>;
  }
}

registerTrustedInput({
  clickByTestId: (testId) => commands.clickByTestId(testId),
  clickPageCorner: () => commands.clickPageCorner(),
  contextClickByTestId: (testId, position) => commands.contextClickByTestId(testId, position),
  emulateForcedColors: (active) => commands.emulateForcedColors(active),
  holdPointerByTestId: (testId) => commands.holdPointerByTestId(testId),
  hoverByTestId: (testId) => commands.hoverByTestId(testId),
  pressKey: (key) => commands.pressKey(key),
  releasePointer: () => commands.releasePointer(),
  slidePointerByRole: (role, fromName, toName) => commands.slidePointerByRole(role, fromName, toName),
});

// Chromium on Linux can apply :hover to whatever a story renders under the pointer, without the pointer moving
beforeEach(async () => {
  await commands.movePointerOffPage();
  // A story that emulates forced colours and fails before turning them off leaves them on for the next
  await commands.emulateForcedColors(false);
});
