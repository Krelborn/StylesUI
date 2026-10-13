import { expect } from "storybook/test";

/**
 * Checks that a choice control's box is `--sui-space-4` square and centred on the first line of its label, and that
 * the label text starts `--sui-space-6` from the box, each to within half a pixel of the tokens in the control's own
 * theme, in a left-to-right layout
 *
 * Needs a real browser, because jsdom lays nothing out.
 *
 * @param input the control's input, which draws the box
 * @param text the element holding the label text, beside the input
 */
export async function expectOnSpaceScale(input: HTMLInputElement, text: HTMLElement): Promise<void> {
  const box = input.getBoundingClientRect();
  const boxSize = resolvedLength(text, "var(--sui-space-4)");
  const firstLineCentre = text.getBoundingClientRect().top + parseFloat(getComputedStyle(text).lineHeight) / 2;
  const name = text.textContent;

  await expect(box.width, `${name} box width`).toBeCloseTo(boxSize, 0);
  await expect(box.height, `${name} box height`).toBeCloseTo(boxSize, 0);
  await expect(box.top + box.height / 2, `${name} box centre`).toBeCloseTo(firstLineCentre, 0);
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
