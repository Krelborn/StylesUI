import { beforeEach } from "vitest";
import { commands } from "vitest/browser";

import { registerTrustedInput } from "./trustedInput";

declare module "vitest/browser" {
  interface BrowserCommands {
    /**
     * Clicks the bottom-right corner of the story's frame with the real pointer
     */
    clickPageCorner: () => Promise<void>;

    /**
     * Moves the real pointer off the page
     */
    movePointerOffPage: () => Promise<void>;

    /**
     * Presses a key with the real keyboard
     */
    pressKey: (key: string) => Promise<void>;
  }
}

registerTrustedInput({
  clickPageCorner: () => commands.clickPageCorner(),
  pressKey: (key) => commands.pressKey(key),
});

// Chromium on Linux can apply :hover to whatever a story renders under the pointer, without the pointer moving
beforeEach(async () => {
  await commands.movePointerOffPage();
});
