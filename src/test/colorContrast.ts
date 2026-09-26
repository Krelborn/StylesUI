interface Rgba {
  alpha: number;
  blue: number;
  green: number;
  red: number;
}

const opaqueWhite: Rgba = { alpha: 1, blue: 255, green: 255, red: 255 };

/**
 * Measures the WCAG contrast ratio between an element's focus outline and the background behind the
 * element. WCAG 1.4.11 requires at least 3:1 for a focus indicator.
 *
 * Needs a real browser; throws under jsdom. Assumes the outline sits clear of the element (a
 * positive `outline-offset`), so the element's own background isn't adjacent to it.
 *
 * @param element the focused element
 * @returns the contrast ratio, from 1 to 21
 */
export function focusRingContrast(element: HTMLElement): number {
  const background = backgroundBehind(element);

  return contrastRatio(composite(toRgba(getComputedStyle(element).outlineColor), background), background);
}

/**
 * Measures the WCAG contrast ratio between an element's text colour and its background. WCAG 1.4.3
 * requires at least 4.5:1 for normal text and 3:1 for large text.
 *
 * Needs a real browser; throws under jsdom.
 *
 * @param element the element whose text is measured
 * @param background a CSS colour to measure against in place of the element's own background, such
 *   as `"var(--sui-button-bg-hover)"` for a state axe can't reach; resolved in the element's scope
 * @returns the contrast ratio, from 1 to 21
 */
export function textContrast(element: HTMLElement, background?: string): number {
  const surface = composite(
    toRgba(background === undefined ? getComputedStyle(element).backgroundColor : resolveIn(element, background)),
    backgroundBehind(element)
  );

  return contrastRatio(composite(toRgba(getComputedStyle(element).color), surface), surface);
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
function resolveIn(element: HTMLElement, color: string): string {
  const probe = document.createElement("span");
  probe.style.backgroundColor = color;
  element.append(probe);
  const resolved = getComputedStyle(probe).backgroundColor;
  probe.remove();

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
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));

  return (lighter + 0.05) / (darker + 0.05);
}

// A canvas resolves any CSS colour syntax the browser supports (oklch, color(), ...) to sRGB
function toRgba(color: string): Rgba {
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Colour contrast needs a 2D canvas context; run it in a browser, not jsdom");
  }

  context.fillStyle = color;
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
