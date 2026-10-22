/**
 * Tells whether the `NavBar` around an element is collapsed behind its "Menu" toggle
 *
 * @param element an element inside the bar's layout
 * @returns true while the bar is narrower than its collapse width, or always collapses
 */
export function isNavBarCollapsed(element: Element): boolean {
  const view = element.ownerDocument.defaultView;

  // Set by the stylesheet's container queries, so it follows the layout the bar shows
  return view?.getComputedStyle(element).getPropertyValue("--_sui-nav-bar-collapsed").trim() === "1";
}
