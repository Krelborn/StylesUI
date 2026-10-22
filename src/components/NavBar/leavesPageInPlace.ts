type ModifierKeys = Pick<MouseEvent, "altKey" | "ctrlKey" | "metaKey" | "shiftKey">;

/**
 * Tells whether a click on a link leaves this page where it was, opening the link in another tab or window or
 * downloading it
 *
 * @param event the click, for the modifier keys held
 * @param link the link clicked
 * @returns true for a click with Alt, Ctrl, Meta or Shift held, on a link that opens in another browsing context, or
 *   on one that downloads its URL; false whenever that can't be established
 */
export function leavesPageInPlace(event: ModifierKeys, link: HTMLAnchorElement): boolean {
  return (
    event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || opensInAnotherContext(link) || downloads(link)
  );
}

/**
 * Tells whether a link opens in a browsing context other than this page's or a frame's around it
 *
 * @param link the link
 * @returns true for `_blank` and for a named target that names neither this window nor a frame around it; false for no
 *   target, `_self`, `_top` and `_parent`, and for a name a cross-origin frame around this page hides. A link without a
 *   `target` of its own takes the page's `base` element's.
 */
function opensInAnotherContext(link: HTMLAnchorElement): boolean {
  const target = link.hasAttribute("target")
    ? link.target
    : (link.ownerDocument.querySelector("base[target]")?.getAttribute("target") ?? "");
  // Keywords match without regard to case, and names exactly
  const keyword = target.toLowerCase();
  const view = link.ownerDocument.defaultView;

  if (view === null || ["", "_parent", "_self", "_top"].includes(keyword)) {
    return false;
  }

  let context: Window = view;

  for (;;) {
    try {
      if (context.name === target) {
        return false;
      }
    } catch {
      // A cross-origin frame's name can't be read, so it may be the target
      return false;
    }

    if (context.parent === context) {
      return true;
    }

    context = context.parent;
  }
}

/**
 * Tells whether a link downloads its URL, which browsers do only for one of this page's origin, a `blob:` or a `data:`
 * URL, and otherwise navigate to it
 *
 * @param link the link
 * @returns true when the link has a `download` attribute and a URL the browser downloads
 */
function downloads(link: HTMLAnchorElement): boolean {
  if (!link.hasAttribute("download") || !URL.canParse(link.href)) {
    return false;
  }

  const url = new URL(link.href);

  return url.protocol === "blob:" || url.protocol === "data:" || url.origin === link.ownerDocument.location.origin;
}
