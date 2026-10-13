/**
 * Where a choice control's box sits beside its label, in pixels, in a left-to-right layout
 */
export interface ChoiceControlLayout {
  /**
   * Height of the box
   */
  boxHeight: number;

  /**
   * How far the centre of the box is from the centre of the label's first line; 0 when it is centred on it
   */
  boxOffsetFromFirstLine: number;

  /**
   * Width of the box
   */
  boxWidth: number;

  /**
   * Distance from the box's start edge to where the label text starts
   */
  textInset: number;
}

/**
 * Measures where a choice control's box sits beside its label text
 *
 * Needs a real browser, because jsdom lays nothing out.
 *
 * @param input the control's input, which draws the box
 * @param text the element holding the label text, beside the input
 * @returns the measurements
 */
export function choiceControlLayout(input: HTMLInputElement, text: HTMLElement): ChoiceControlLayout {
  const box = input.getBoundingClientRect();
  const firstLineCentre = text.getBoundingClientRect().top + parseFloat(getComputedStyle(text).lineHeight) / 2;

  return {
    boxHeight: box.height,
    boxOffsetFromFirstLine: box.top + box.height / 2 - firstLineCentre,
    boxWidth: box.width,
    textInset: textStart(text) - box.left,
  };
}

/**
 * Resolves a CSS length, such as a space token, to pixels in an element's scope
 *
 * Needs a real browser to resolve custom properties.
 *
 * @param element an element that can hold children, whose custom properties and font size the length is resolved
 *   against
 * @param length a CSS length, such as `"var(--sui-space-6)"`
 * @returns the length in pixels
 */
export function resolvedLength(element: HTMLElement, length: string): number {
  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.inlineSize = length;
  element.append(probe);
  const { width } = probe.getBoundingClientRect();
  probe.remove();

  return width;
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
