import { expect } from "storybook/test";

/**
 * Checks that a choice control's box is `--sui-space-4` square and centred on the lowercase letters of the first line
 * of its label, half an `ex` above the baseline, and that the label text starts `--sui-space-6` from the box, each to
 * within half a pixel in the control's own theme, in a left-to-right layout
 *
 * Needs a real browser, because jsdom lays nothing out.
 *
 * @param input the control's input, which draws the box
 * @param text the element holding the label text, beside the input
 */
export async function expectOnSpaceScale(input: HTMLInputElement, text: HTMLElement): Promise<void> {
  const box = input.getBoundingClientRect();
  const boxSize = resolvedLength(text, "var(--sui-space-4)");
  const lowercaseMiddle = firstBaseline(text) - resolvedLength(text, "1ex") / 2;
  const name = text.textContent;

  await expect(box.width, `${name} box width`).toBeCloseTo(boxSize, 0);
  await expect(box.height, `${name} box height`).toBeCloseTo(boxSize, 0);
  await expect(box.top + box.height / 2, `${name} box centre`).toBeCloseTo(lowercaseMiddle, 0);
  await expect(textStart(text) - box.left, `${name} text start`).toBeCloseTo(
    resolvedLength(text, "var(--sui-space-6)"),
    0
  );
}

/**
 * Finds where an element's text starts, in a left-to-right layout
 *
 * Needs a real browser, because jsdom lays nothing out.
 *
 * @param element the element holding the text
 * @returns the left edge of its text, in viewport pixels
 */
export function textStart(element: HTMLElement): number {
  const range = document.createRange();
  range.selectNodeContents(element);

  return range.getBoundingClientRect().left;
}

// An empty inline-block is zero high and sits with its bottom edge on the baseline
function firstBaseline(element: HTMLElement): number {
  const marker = document.createElement("span");
  marker.style.display = "inline-block";
  element.prepend(marker);
  const { bottom } = marker.getBoundingClientRect();
  marker.remove();

  return bottom;
}

// Measured on a child so custom properties take the element's values
function resolvedLength(element: HTMLElement, length: string): number {
  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.inlineSize = length;
  element.append(probe);
  const { width } = probe.getBoundingClientRect();
  probe.remove();

  return width;
}
