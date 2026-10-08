interface Rgba {
  alpha: number;
  blue: number;
  green: number;
  red: number;
}

const opaqueWhite: Rgba = { alpha: 1, blue: 255, green: 255, red: 255 };

/**
 * Measures the WCAG contrast ratio between an element's focus outline and the colours beside it. WCAG 1.4.11 requires
 * at least 3:1 for a focus indicator.
 *
 * Needs a real browser; throws under jsdom. Throws if the element has no drawn outline, if it shows the browser's
 * default ring (`outline-style: auto`), whose colours cannot be read, or if the outline straddles the element's edge.
 * A ring clear of the element (a positive `outline-offset`) is measured against the background behind the element. A
 * ring touching its edge (an offset of 0) or wholly inside it (an offset of at most minus the outline width) is
 * measured against both the element's own background and the background behind it, and the lower ratio is returned;
 * nothing inside the element may cover an inset ring.
 *
 * @param element the focused element
 * @returns the contrast ratio, from 1 to 21
 */
export function focusRingContrast(element: HTMLElement): number {
  const style = getComputedStyle(element);

  if (style.outlineStyle === "none" || parseFloat(style.outlineWidth) === 0) {
    throw new Error("focusRingContrast requires a drawn outline; this element has no outline");
  }

  if (style.outlineStyle === "auto") {
    throw new Error("focusRingContrast cannot measure the browser's default ring; give the element an outline style");
  }

  const ring = toRgba(style.outlineColor);
  const ratios = backgroundsBesideRing(element, style).map((background) =>
    contrastRatio(composite(ring, background), background)
  );

  return Math.min(...ratios);
}

/**
 * Measures the WCAG contrast ratio between an element's border and the background behind the
 * element. WCAG 1.4.11 requires at least 3:1 for the boundary of a form control.
 *
 * Needs a real browser; throws under jsdom. Throws if the element has no drawn border. The top
 * border is measured, so give the element a border on every side.
 *
 * @param element the element whose border is measured
 * @returns the contrast ratio, from 1 to 21
 */
export function borderContrast(element: HTMLElement): number {
  const style = getComputedStyle(element);

  if (style.borderTopStyle === "none" || style.borderTopStyle === "hidden" || parseFloat(style.borderTopWidth) === 0) {
    throw new Error("borderContrast requires a drawn border; this element has no border");
  }

  const background = backgroundBehind(element);

  return contrastRatio(composite(toRgba(style.borderTopColor), background), background);
}

/**
 * Measures the WCAG contrast ratio between an element's text colour and its background. WCAG 1.4.3
 * requires at least 4.5:1 for normal text and 3:1 for large text.
 *
 * Needs a real browser; throws under jsdom. Throws if `background` resolves to a fully transparent
 * colour, such as an undefined custom property.
 *
 * @param element the element whose text is measured
 * @param background a CSS colour to measure against in place of the element's own background, such
 *   as `"var(--sui-button-bg-hover)"` for a state axe can't reach; resolved in the element's scope
 * @returns the contrast ratio, from 1 to 21
 */
export function textContrast(element: HTMLElement, background?: string): number {
  const resolvedBackground =
    background === undefined ? toRgba(getComputedStyle(element).backgroundColor) : resolveIn(element, background);
  const surface = composite(resolvedBackground, backgroundBehind(element));

  return contrastRatio(composite(toRgba(getComputedStyle(element).color), surface), surface);
}

/**
 * Measures the WCAG contrast ratio between two fills an element can show, such as its resting and hovered
 * backgrounds, each painted over the background behind the element. WCAG sets no minimum for a change of state; a
 * ratio near 1 means the two cannot be told apart.
 *
 * Needs a real browser; throws under jsdom.
 *
 * @param element the element whose fills are compared
 * @param first a CSS colour, such as a computed `backgroundColor`; resolved in the element's scope
 * @param second a CSS colour, resolved the same way
 * @returns the contrast ratio, from 1 to 21
 */
export function fillContrast(element: HTMLElement, first: string, second: string): number {
  const behind = backgroundBehind(element);
  const [firstFill, secondFill] = [first, second].map((fill) =>
    composite(toRgba(computedInProbe(element, "backgroundColor", fill)), behind)
  );

  return contrastRatio(firstFill, secondFill);
}

/**
 * Resolves a CSS colour in an element's scope to the string the browser reports for a computed
 * `color`, so it can be compared with `getComputedStyle(...).color` and the like.
 *
 * Needs a real browser to resolve custom properties and `light-dark()`.
 *
 * @param element the element whose custom properties and `color-scheme` the colour is resolved
 *   against
 * @param color a CSS colour, such as `"var(--sui-color-primary)"`
 * @returns the resolved colour, such as `"rgb(37, 99, 235)"`
 */
export function resolvedColor(element: HTMLElement, color: string): string {
  return computedInProbe(element, "color", color);
}

function backgroundsBesideRing(element: HTMLElement, style: CSSStyleDeclaration): Rgba[] {
  const outlineOffset = parseFloat(style.outlineOffset);
  const behind = backgroundBehind(element);

  if (outlineOffset > 0) {
    return [behind];
  }

  if (outlineOffset < 0 && outlineOffset + parseFloat(style.outlineWidth) > 0) {
    throw new Error("focusRingContrast cannot measure a ring that straddles the element's edge");
  }

  return [composite(toRgba(style.backgroundColor), behind), behind];
}

function backgroundBehind(element: HTMLElement): Rgba {
  const layers: Rgba[] = [];

  for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
    const layer = toRgba(getComputedStyle(ancestor).backgroundColor);
    layers.push(layer);

    if (layer.alpha === 1) {
      break;
    }
  }

  // The canvas behind the root element is white unless the page paints it
  return layers.reduceRight((below, layer) => composite(layer, below), opaqueWhite);
}

// Resolved on a child so custom properties and light-dark() take the element's values
function computedInProbe(element: HTMLElement, property: "backgroundColor" | "color", color: string): string {
  const probe = document.createElement("span");
  probe.style[property] = color;
  element.append(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();

  return resolved;
}

function resolveIn(element: HTMLElement, color: string): Rgba {
  const resolved = toRgba(computedInProbe(element, "backgroundColor", color));

  if (resolved.alpha === 0 && color !== "transparent") {
    throw new Error(`textContrast background "${color}" resolved to a fully transparent colour`);
  }

  return resolved;
}

function composite(top: Rgba, bottom: Rgba): Rgba {
  const blend = (upper: number, lower: number): number => upper * top.alpha + lower * (1 - top.alpha);

  return {
    alpha: 1,
    blue: blend(top.blue, bottom.blue),
    green: blend(top.green, bottom.green),
    red: blend(top.red, bottom.red),
  };
}

function contrastRatio(first: Rgba, second: Rgba): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

let sharedCanvasContext: CanvasRenderingContext2D | null | undefined;

function canvasContext(): CanvasRenderingContext2D {
  if (sharedCanvasContext === undefined) {
    sharedCanvasContext = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  }

  if (!sharedCanvasContext) {
    throw new Error("Colour contrast needs a 2D canvas context; run it in a browser, not jsdom");
  }

  return sharedCanvasContext;
}

// A canvas resolves any CSS colour syntax the browser supports (oklch, color(), ...) to sRGB
function toRgba(color: string): Rgba {
  const context = canvasContext();
  const sentinel = "#010203";

  context.fillStyle = sentinel;
  const normalizedSentinel = context.fillStyle;
  context.fillStyle = color;

  if (context.fillStyle === normalizedSentinel) {
    throw new Error(`Colour contrast could not resolve the colour "${color}"`);
  }

  // The canvas is reused across calls, so clear the previous pixel before a semi-transparent
  // fill blends against it instead of a transparent backdrop
  context.clearRect(0, 0, 1, 1);
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;

  return { alpha: alpha / 255, blue, green, red };
}

function relativeLuminance({ blue, green, red }: Rgba): number {
  const linear = (channel: number): number => {
    const value = channel / 255;

    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}
