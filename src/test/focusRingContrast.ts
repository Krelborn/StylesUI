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
  const ring = composite(toRgba(getComputedStyle(element).outlineColor), background);

  const lighter = Math.max(relativeLuminance(ring), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(ring), relativeLuminance(background));

  return (lighter + 0.05) / (darker + 0.05);
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

function composite(top: Rgba, bottom: Rgba): Rgba {
  const blend = (upper: number, lower: number): number => upper * top.alpha + lower * (1 - top.alpha);

  return {
    alpha: 1,
    blue: blend(top.blue, bottom.blue),
    green: blend(top.green, bottom.green),
    red: blend(top.red, bottom.red),
  };
}

// A canvas resolves any CSS colour syntax the browser supports (oklch, color(), ...) to sRGB
function toRgba(color: string): Rgba {
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("focusRingContrast needs a 2D canvas context; run it in a browser, not jsdom");
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
