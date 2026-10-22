// `container` is missing from lib.dom's ScrollIntoViewOptions; browsers without it ignore it
interface NearestContainerScrollOptions extends ScrollIntoViewOptions {
  container?: "all" | "nearest";
}

const scrollOptions: NearestContainerScrollOptions = { block: "nearest", container: "nearest" };

/**
 * Moves focus to a menu item and scrolls it into view within the menu, as far as it needs and no further
 *
 * @param item the item to focus
 */
export function focusItem(item: HTMLElement): void {
  item.focus({ preventScroll: true });
  item.scrollIntoView(scrollOptions);
}
