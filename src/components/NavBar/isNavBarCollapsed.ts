/**
 * Tells whether the `NavBar` around an element shows its collapsed layout, behind its "Menu" toggle
 *
 * @param element the bar's navigation or an element inside it
 * @returns true while the bar is narrower than its collapse width, or always collapses, and the browser lays it out
 *   collapsed
 */
export function isNavBarCollapsed(element: Element): boolean {
  const view = element.ownerDocument.defaultView;

  // Set by the stylesheet's rules for the collapsed layout, so it follows the layout the bar shows
  return view?.getComputedStyle(element).getPropertyValue("--_sui-nav-bar-collapsed").trim() === "1";
}
