/// <reference types="vitest/config" />
import path from "node:path";

import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vite";
import { libInjectCss } from "vite-plugin-lib-inject-css";
import type { BrowserCommand } from "vitest/node";

const storybookModes = ["light", "dark"];
const storybookThemes = ["default", "playful"];

/**
 * Thrown when a browser command cannot find what it acts on in the story's frame
 */
class StoryFrameError extends Error {
  public override readonly name = "StoryFrameError";
}

/**
 * Turns the browser's emulation of forced colours, as Windows High Contrast applies them, on or off
 *
 * @param context the command context, holding the page the story runs in
 * @param active whether forced colours are active
 */
const emulateForcedColors: BrowserCommand<[active: boolean]> = async ({ page }, active) => {
  await page.emulateMedia({ forcedColors: active ? "active" : "none" });
};

/**
 * Moves the real pointer off the page, so the story about to render is not under it
 *
 * @param context the command context, holding the page the story runs in
 */
const movePointerOffPage: BrowserCommand = async ({ page }) => {
  await page.mouse.move(-1000, -1000);
};

/**
 * Presses a key with the real keyboard, which the browser trusts for its own behaviour, such as closing a popover on
 * Escape
 *
 * @param context the command context, holding the page the story runs in
 * @param key the key, as Playwright names it, such as "Escape"
 */
const pressKey: BrowserCommand<[key: string]> = async ({ page }, key) => {
  await page.keyboard.press(key);
};

/**
 * Clicks an element in the story's frame with the real pointer
 *
 * @param context the command context, holding the frame the story runs in
 * @param testId the element's `data-testid`
 */
const clickByTestId: BrowserCommand<[testId: string]> = async ({ iframe }, testId) => {
  await iframe.getByTestId(testId).click();
};

/**
 * Right-clicks an element in the story's frame with the real pointer, which opens a context menu
 *
 * @param context the command context, holding the frame the story runs in
 * @param testId the element's `data-testid`
 * @param position where to click, in pixels from the element's top-left corner; its middle when omitted
 */
const contextClickByTestId: BrowserCommand<[testId: string, position?: { x: number; y: number }]> = async (
  { iframe },
  testId,
  position
) => {
  await iframe.getByTestId(testId).click({ button: "right", position });
};

/**
 * Clicks the bottom-right corner of the story's frame with the real pointer, away from the top-left where stories
 * render
 *
 * @param context the command context, holding the frame the story runs in
 */
const clickPageCorner: BrowserCommand = async ({ iframe }) => {
  const body = iframe.locator("body");
  const box = await body.boundingBox();

  if (box === null) {
    throw new StoryFrameError("The story's frame has no body to click");
  }

  await body.click({ position: { x: box.width - 1, y: box.height - 1 } });
};

/**
 * Holds the real primary pointer button down over an element in the story's frame, so the element matches `:active`
 * until `releasePointer` runs
 *
 * @param context the command context, holding the page and the frame the story runs in
 * @param testId the element's `data-testid`
 */
const holdPointerByTestId: BrowserCommand<[testId: string]> = async ({ iframe, page }, testId) => {
  await iframe.getByTestId(testId).hover();
  await page.mouse.down();
};

/**
 * Moves the real pointer over an element in the story's frame, so the element matches `:hover`
 *
 * @param context the command context, holding the frame the story runs in
 * @param testId the element's `data-testid`
 */
const hoverByTestId: BrowserCommand<[testId: string]> = async ({ iframe }, testId) => {
  await iframe.getByTestId(testId).hover();
};

/**
 * Slides the real pointer slowly from the middle of one element to the near edge of another in the story's frame, so
 * it crosses whatever lies between, as a person moving diagonally into a submenu does
 *
 * @param context the command context, holding the page and the frame the story runs in
 * @param role the ARIA role both elements have
 * @param fromName the accessible name of the element the slide starts on
 * @param toName the accessible name of the element it ends on
 */
const slidePointerByRole: BrowserCommand<[role: string, fromName: string, toName: string]> = async (
  { iframe, page },
  role,
  fromName,
  toName
) => {
  // Playwright types the role as its own union of ARIA roles, which a command's arguments cannot carry
  const ariaRole = role as Parameters<typeof iframe.getByRole>[0];
  const from = await iframe.getByRole(ariaRole, { exact: true, name: fromName }).boundingBox();
  const to = await iframe.getByRole(ariaRole, { exact: true, name: toName }).boundingBox();

  if (from === null || to === null) {
    throw new StoryFrameError(`The story's frame does not show both ${fromName} and ${toName}`);
  }

  const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const end = { x: to.x + 6, y: to.y + to.height / 2 };

  await page.mouse.move(start.x, start.y);

  for (let step = 1; step <= slideSteps; step += 1) {
    await page.mouse.move(
      start.x + ((end.x - start.x) * step) / slideSteps,
      start.y + ((end.y - start.y) * step) / slideSteps
    );
    await page.waitForTimeout(slideStepPause);
  }
};

// Forty 20ms steps: slow enough that the pointer stays over what lies between for longer than a menu's 100ms delay
const slideSteps = 40;
const slideStepPause = 20;

/**
 * Releases the real primary pointer button where the pointer is
 *
 * @param context the command context, holding the page the story runs in
 */
const releasePointer: BrowserCommand = async ({ page }) => {
  await page.mouse.up();
};

// Matches the light-dark() support floor; a lower target makes lightningcss rewrite light-dark() into fallback variables that break theme nesting
// Imported by .storybook/main.ts, which fallow's ignorePatterns excludes from analysis
// fallow-ignore-next-line unused-export
export const lightDarkCssTarget = ["chrome123", "edge123", "firefox120", "safari17.5"];

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    // Injects each chunk's CSS import so consumers only pull in styles for components they use
    libInjectCss(),
  ],
  css: {
    modules: {
      generateScopedName: "sui-[local]-[hash:base64:5]",
    },
  },
  build: {
    lib: {
      entry: { index: "src/index.ts", styles: "src/styles/index.css" },
      formats: ["es"],
    },
    cssTarget: lightDarkCssTarget,
    cssCodeSplit: true,
    copyPublicDir: false,
    rolldownOptions: {
      external: /^(react(-dom)?|clsx)($|\/)/,
      output: {
        // One output file per source module keeps the library tree-shakable
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
        // Drop ".module" from emitted CSS so consumer bundlers treat it as plain global CSS
        // instead of re-processing it as a side-effect-free CSS module and tree-shaking it away
        assetFileNames: ({ names }) => names[0].replace(/\.module\.css$/, ".css"),
      },
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          environment: "jsdom",
          setupFiles: ["src/test/setup.ts"],
          // Vitest otherwise stubs ?raw CSS imports to an empty string, since it assumes
          // CSS content isn't needed unless it's a CSS module
          css: {
            include: [/\.css\?raw$/],
          },
        },
      },
      // Every story runs once per mode and theme, so axe checks colour contrast in each.
      // The addon reads the script from an env var each storybookTest() call writes, and
      // starts Storybook from each project given a script, so exactly one project, the
      // last one created, gets it.
      ...storybookModes.flatMap((mode, modeIndex) =>
        storybookThemes.map((theme, themeIndex) => {
          const isLastProject = modeIndex === storybookModes.length - 1 && themeIndex === storybookThemes.length - 1;

          return {
            extends: true,
            plugins: [
              storybookTest({
                configDir: path.join(import.meta.dirname, ".storybook"),
                initialGlobals: { mode, theme },
                ...(isLastProject ? { storybookScript: "pnpm storybook --no-open" } : {}),
              }),
            ],
            test: {
              name: `storybook-${mode}-${theme}`,
              // A page per file, in each of four browsers, slows Chromium's replies to the trusted input commands past
              // the test timeout, and running one file at a time per project takes no longer
              fileParallelism: false,
              setupFiles: ["src/test/storybookSetup.ts"],
              browser: {
                enabled: true,
                headless: true,
                // Below the test timeout, so an input command that stalls fails with Playwright's call log
                provider: playwright({ actionTimeout: 10_000 }),
                instances: [{ browser: "chromium" as const }],
                commands: {
                  clickByTestId,
                  clickPageCorner,
                  contextClickByTestId,
                  emulateForcedColors,
                  holdPointerByTestId,
                  hoverByTestId,
                  movePointerOffPage,
                  pressKey,
                  releasePointer,
                  slidePointerByRole,
                },
              },
            },
          };
        })
      ),
    ],
  },
});
