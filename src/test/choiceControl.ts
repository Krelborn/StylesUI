import { expect, waitFor } from "storybook/test";

import { distinctFillContrast, fillContrast, focusRingContrast, isSameColor } from "./colorContrast";
import type { TrustedInput } from "./trustedInput";

/**
 * The halo a choice control draws around its box
 */
interface Halo {
  /**
   * Colour of the halo, as the browser reports it
   */
  color: string;

  /**
   * How far the halo spreads beyond the box, in pixels; `NaN` when the browser reports a shadow this cannot read
   */
  spread: number;
}

/**
 * Hovers and then presses a choice control's label with the real pointer, and checks that the halo spreads by
 * `--sui-space-2`, is the given tint at 8% when hovered and 16% when pressed, and that rest, hover and press can be
 * told apart
 *
 * @param input the trusted input that moves and presses the pointer
 * @param control the control's input, which draws the halo
 * @param testId the `data-testid` of an element in the control's label
 * @param tint the colour the halo is tinted with, such as `"var(--sui-color-primary)"`
 */
async function expectDistinctHaloStates(
  input: TrustedInput,
  control: HTMLInputElement,
  testId: string,
  tint: string
): Promise<void> {
  const [label] = control.labels ?? [];

  await input.hoverByTestId(testId);
  const hovered = await settledHalo(control, ":hover");

  await expect(hovered.spread, `${testId} halo spread`).toBeCloseTo(resolvedLength(label, "var(--sui-space-2)"), 0);
  await expect(
    isSameColor(label, hovered.color, `color-mix(in srgb, ${tint} 8%, transparent)`),
    `${testId} hovered tint`
  ).toBe(true);
  await expect(fillContrast(label, "transparent", hovered.color), `${testId} rest to hover`).toBeGreaterThanOrEqual(
    distinctFillContrast
  );

  await input.holdPointerByTestId(testId);

  try {
    const pressed = await settledHalo(control, ":active");

    await expect(
      isSameColor(label, pressed.color, `color-mix(in srgb, ${tint} 16%, transparent)`),
      `${testId} pressed tint`
    ).toBe(true);
    await expect(fillContrast(label, hovered.color, pressed.color), `${testId} hover to press`).toBeGreaterThanOrEqual(
      distinctFillContrast
    );
  } finally {
    await input.releasePointer();
  }
}

/**
 * The controls whose halos `expectHaloStates` checks
 */
interface HaloControls {
  /**
   * Input of a checked control, whose label holds an element with `data-testid="checked"`
   */
  checked: HTMLInputElement;

  /**
   * Input of a disabled control, whose label holds an element with `data-testid="disabled"`
   */
  disabled: HTMLInputElement;

  /**
   * Input of an unchecked control, whose label holds an element with `data-testid="unchecked"`
   */
  unchecked: HTMLInputElement;
}

/**
 * Checks a choice control's halo with the real pointer: a disabled control has none when hovered, a checked and an
 * unchecked one have a transparent halo at rest, and each passes `expectDistinctHaloStates`, tinted with
 * `--sui-color-primary` when checked and `--sui-color-text` when not
 *
 * @param input the trusted input that moves and presses the pointer
 * @param controls the checked, disabled and unchecked controls; pressing may toggle the checked and unchecked ones
 */
export async function expectHaloStates(
  input: TrustedInput,
  { checked, disabled, unchecked }: HaloControls
): Promise<void> {
  await input.hoverByTestId("disabled");
  await settledHalo(disabled, ":hover");
  await expect(getComputedStyle(disabled).boxShadow, "disabled halo").toBe("none");

  for (const control of [unchecked, checked]) {
    const [label] = control.labels ?? [];

    await expect(isSameColor(label, readHalo(control).color, "transparent"), "halo at rest").toBe(true);
  }

  // Pressing an unchecked radio checks it and unchecks the other, so the checked control is measured first
  await expectDistinctHaloStates(input, checked, "checked", "var(--sui-color-primary)");
  await expectDistinctHaloStates(input, unchecked, "unchecked", "var(--sui-color-text)");
}

/**
 * Hovers a choice control's label with the real pointer until its halo shows, then moves keyboard focus to the control
 * with Tab, and checks that the halo vanishes at once, without a `box-shadow` transition, and that the focus ring keeps
 * 3:1
 *
 * @param input the trusted input that moves the pointer and presses Tab
 * @param control the control's input, which must be the next Tab stop
 * @param testId the `data-testid` of an element in the control's label
 */
export async function expectHaloHiddenUnderFocus(
  input: TrustedInput,
  control: HTMLInputElement,
  testId: string
): Promise<void> {
  const [label] = control.labels ?? [];

  await input.hoverByTestId(testId);
  const hovered = await settledHalo(control, ":hover");

  await expect(hovered.spread, "halo spread before the focus").toBeGreaterThan(0);
  await expect(isSameColor(label, hovered.color, "transparent"), "halo before the focus").toBe(false);

  await input.pressKey("Tab");
  await expect(control).toHaveFocus();
  await expect(control.matches(":focus-visible")).toBe(true);
  await expect(getComputedStyle(control).transitionProperty, "halo transition under the focus ring").not.toContain(
    "box-shadow"
  );

  const focused = await settledHalo(control, ":hover");

  await expect(isSameColor(label, focused.color, "transparent"), "halo under the focus ring").toBe(true);
  await expect(focusRingContrast(control)).toBeGreaterThanOrEqual(3);
}

/**
 * Checks, without the pointer, that the hover and press halos a choice control declares can each be told from the step
 * before: rest from hover, and hover from press
 *
 * @param control the control's input
 * @param name what the control is, for the failure messages
 */
export async function expectDistinctDeclaredHalos(control: HTMLInputElement, name: string): Promise<void> {
  const style = getComputedStyle(control);
  const hovered = style.getPropertyValue("--_sui-choice-control-halo-hover");
  const pressed = style.getPropertyValue("--_sui-choice-control-halo-press");
  // A probe inside an input gets no style, so the colours the input declares are resolved on its label
  const [label] = control.labels ?? [];

  await expect(fillContrast(label, "transparent", hovered), `${name} rest to hover`).toBeGreaterThanOrEqual(
    distinctFillContrast
  );
  await expect(fillContrast(label, hovered, pressed), `${name} hover to press`).toBeGreaterThanOrEqual(
    distinctFillContrast
  );
}

/**
 * Reads the halo a choice control's input draws now
 *
 * @param control the control's input
 * @returns the halo; fully transparent with no spread when the input draws none
 */
function readHalo(control: HTMLInputElement): Halo {
  const shadow = getComputedStyle(control).boxShadow;

  if (shadow === "none") {
    return { color: "transparent", spread: 0 };
  }

  const lengths = shadow.match(/-?[\d.]+px/g) ?? [];

  return { color: shadow.replace(/ -?[\d.]+px/g, ""), spread: parseFloat(lengths.at(-1) ?? "NaN") };
}

/**
 * Waits until the real pointer has put a choice control's label in a state and the halo has finished changing into it
 *
 * @param control the control's input
 * @param state the pseudo-class the pointer applies to the label
 * @returns the halo in that state
 */
async function settledHalo(control: HTMLInputElement, state: ":active" | ":hover"): Promise<Halo> {
  const [label] = control.labels ?? [];

  await waitFor(() => expect(label.matches(state)).toBe(true));
  await Promise.all(control.getAnimations().map((animation) => animation.finished));

  return readHalo(control);
}

/**
 * Where a choice control's box and text sit on the space scale
 */
interface SpaceScaleLayout {
  /**
   * Width of the box, such as `"var(--sui-space-6)"` for a switch's track; defaults to `--sui-space-4`
   */
  boxWidth?: string;

  /**
   * How far every line of the text starts from the box's start edge; defaults to `--sui-space-6`
   */
  indent?: string;
}

/**
 * Checks that a choice control's box is `--sui-space-4` tall and the given width, and centred halfway between the
 * middles of the capital and lowercase letters of the first line of its label, a quarter of `1cap + 1ex` above the
 * baseline, and that every line of the label text starts the given indent from the box, each to within half a pixel in
 * the control's own theme and writing direction
 *
 * Needs a real browser, because jsdom lays nothing out.
 *
 * @param input the control's input, which draws the box
 * @param text the element holding the label text, beside the input; plain text, so each line is one fragment
 * @param layout the box's width and the text's indent, as CSS lengths resolved in the text's scope
 */
export async function expectOnSpaceScale(
  input: HTMLInputElement,
  text: HTMLElement,
  { boxWidth = "var(--sui-space-4)", indent = "var(--sui-space-6)" }: SpaceScaleLayout = {}
): Promise<void> {
  const box = input.getBoundingClientRect();
  const letterMiddle = firstBaseline(text) - (resolvedLength(text, "1cap") + resolvedLength(text, "1ex")) / 4;
  const textIndent = resolvedLength(text, indent);
  const { direction } = getComputedStyle(text);
  const name = text.textContent;

  await expect(box.width, `${name} box width`).toBeCloseTo(resolvedLength(text, boxWidth), 0);
  await expect(box.height, `${name} box height`).toBeCloseTo(resolvedLength(text, "var(--sui-space-4)"), 0);
  await expect(box.top + box.height / 2, `${name} box centre`).toBeCloseTo(letterMiddle, 0);

  for (const [index, line] of textLines(text).entries()) {
    await expect(startOffset(box, line, direction), `${name} line ${index + 1} start`).toBeCloseTo(textIndent, 0);
  }
}

/**
 * Finds where an element's text starts: its left edge in a left-to-right layout and its right edge in a right-to-left
 * one
 *
 * Needs a real browser, because jsdom lays nothing out.
 *
 * @param element the element holding the text
 * @returns the start edge of its text, in viewport pixels
 */
export function textStart(element: HTMLElement): number {
  const { left, right } = textRange(element).getBoundingClientRect();

  return getComputedStyle(element).direction === "rtl" ? right : left;
}

/**
 * Resolves a CSS length, such as a space token, to pixels in an element's scope
 *
 * Needs a real browser, because jsdom lays nothing out.
 *
 * @param element the element whose custom properties and font resolve the length; not an `input`, whose children get
 *   no style
 * @param length the length to resolve, such as `"var(--sui-space-2)"`
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

// An empty inline-block is zero high and sits with its bottom edge on the baseline
function firstBaseline(element: HTMLElement): number {
  const marker = document.createElement("span");
  marker.style.display = "inline-block";
  element.prepend(marker);
  const { bottom } = marker.getBoundingClientRect();
  marker.remove();

  return bottom;
}

// How far a line starts after the box's start edge, along the writing direction
function startOffset(box: DOMRect, line: DOMRect, direction: string): number {
  return direction === "rtl" ? box.right - line.right : line.left - box.left;
}

function textLines(element: HTMLElement): DOMRect[] {
  return [...textRange(element).getClientRects()];
}

function textRange(element: HTMLElement): Range {
  const range = document.createRange();
  range.selectNodeContents(element);

  return range;
}
