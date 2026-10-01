import { beforeEach } from "vitest";
import { commands } from "vitest/browser";

declare module "vitest/browser" {
  interface BrowserCommands {
    /**
     * Moves the real pointer off the page
     */
    movePointerOffPage: () => Promise<void>;
  }
}

// Chromium on Linux can apply :hover to whatever a story renders under the pointer, without the pointer moving
beforeEach(async () => {
  await commands.movePointerOffPage();
});
