import { clsx } from "clsx";
import type { JSX, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

import type { RequiredAccessibleName } from "../../accessibility";
import { hasContent } from "../../forms";
import type { BoxProps } from "../Box";
import { Box } from "../Box";
import { CloseIcon, MenuIcon } from "../Icon";

import { isNavBarCollapsed } from "./isNavBarCollapsed";
import styles from "./NavBar.module.css";
import { NavBarContext } from "./NavBarContext";

/**
 * Below which width of the bar its navigation collapses behind its "Menu" toggle: `sm` 30rem, `md` 48rem and `lg`
 * 64rem, or `always` and `never`
 */
export type NavBarCollapse = "always" | "lg" | "md" | "never" | "sm";

interface NavBarOwnProps {
  /**
   * The entries: `NavBarItem`s and `NavBarMenu`s
   */
  children: ReactNode;

  /**
   * Below which width of the bar the navigation collapses behind "Menu": `sm` 30rem, `md` 48rem, `lg` 64rem. Defaults
   * to `md`.
   */
  collapse?: NavBarCollapse;

  /**
   * Content after the navigation in the bar, such as a search button. Stays in the first row when collapsed.
   */
  end?: ReactNode;

  /**
   * The toggle's visible label. Defaults to "Menu".
   */
  menuLabel?: string;

  /**
   * Content before the navigation in the bar, such as the site's name. Stays in the first row when collapsed.
   */
  start?: ReactNode;
}

/**
 * Props for `NavBar`: its own props, a required `aria-label` or `aria-labelledby` for its `nav`, and every other `div`
 * prop except `dangerouslySetInnerHTML`, which go to the bar
 */
export type NavBarProps = NavBarOwnProps &
  RequiredAccessibleName &
  Omit<BoxProps<"div">, "aria-label" | "aria-labelledby" | "as" | "children" | "dangerouslySetInnerHTML">;

/**
 * A site's header navigation, for blogs, docs and marketing sites: a row of `NavBarItem` links and `NavBarMenu`
 * sections, each opening a panel of links. Below its `collapse` width, measured on the bar, the navigation hides behind
 * a "Menu" toggle and opens below the bar's first row, pushing the page down. Choosing a link closes it. Name the
 * navigation with `aria-label` or `aria-labelledby`. For an app's sidebar, use `NavList`; for commands, `Menu`.
 *
 * @example
 * <NavBar aria-label="Main" start={<Link href="/" underline="hover">The Long Read</Link>}>
 *   <NavBarItem href="/articles" aria-current="page">Articles</NavBarItem>
 *   <NavBarMenu label="Topics">
 *     <NavBarMenuItem href="/topics/design">Design</NavBarMenuItem>
 *   </NavBarMenu>
 *   <NavBarItem href="/about">About</NavBarItem>
 * </NavBar>
 */
export function NavBar({
  "aria-label": label,
  "aria-labelledby": labelledBy,
  children,
  className,
  collapse = "md",
  end,
  menuLabel = "Menu",
  start,
  ...rest
}: NavBarProps): JSX.Element {
  const navigationId = useId();
  const toggleId = useId();
  const layoutRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [openSections, setOpenSections] = useState<readonly string[]>([]);

  useEffect(() => {
    const layout = layoutRef.current;
    const navigation = navigationRef.current;

    // Missing where nothing is laid out, such as jsdom, where the layout never changes
    if (layout === null || navigation === null || typeof ResizeObserver === "undefined") {
      return;
    }

    let collapsed = isNavBarCollapsed(navigation);
    const observer = new ResizeObserver(() => {
      if (isNavBarCollapsed(navigation) !== collapsed) {
        collapsed = !collapsed;
        setNavigationOpen(false);
        setOpenSections([]);
      }
    });

    observer.observe(layout);

    return () => observer.disconnect();
  }, [collapse]);

  function closeAll(): void {
    setNavigationOpen(false);
    setOpenSections([]);
  }

  function closeSection(id: string): void {
    setOpenSections((open) => open.filter((openId) => openId !== id));
  }

  function toggleSection(id: string, button: Element): void {
    const collapsed = isNavBarCollapsed(button);

    setOpenSections((open) => {
      if (open.includes(id)) {
        return open.filter((openId) => openId !== id);
      }

      return collapsed ? [...open, id] : [id];
    });
  }

  function handleToggleClick(): void {
    if (navigationOpen) {
      closeAll();
    } else {
      setNavigationOpen(true);
    }
  }

  function handleNavigationClick(event: MouseEvent<HTMLElement>): void {
    // Opening a link in a new tab or window leaves this page where it was
    const opensElsewhere = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;

    // A router's link prevents the default to navigate by itself, so any other click on a link closes everything
    if (!opensElsewhere && (event.target as Element).closest("a") !== null) {
      closeAll();
    }
  }

  function handleLayoutKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const page = event.currentTarget.ownerDocument;
    const toggle = page.getElementById(toggleId);
    const navigation = navigationRef.current;
    const target = event.target as Node;
    const inNavigation = target === toggle || navigation?.contains(target) === true;

    if (
      event.key !== "Escape" ||
      event.defaultPrevented ||
      !navigationOpen ||
      navigation === null ||
      !inNavigation ||
      !isNavBarCollapsed(navigation)
    ) {
      return;
    }

    event.preventDefault();
    closeAll();
    toggle?.focus();
  }

  return (
    <NavBarContext.Provider value={{ closeAll, closeSection, openSections, toggleSection }}>
      <Box {...rest} className={clsx(styles.bar, className)} data-collapse={collapse}>
        {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- only notices Escape in the navigation */}
        <Box className={styles.layout} onKeyDown={handleLayoutKeyDown} ref={layoutRef}>
          {hasContent(start) && <Box className={styles.start}>{start}</Box>}
          <Box
            as="button"
            className={clsx(styles.control, styles.toggle)}
            id={toggleId}
            onClick={handleToggleClick}
            type="button"
            aria-controls={navigationId}
            aria-expanded={navigationOpen}
          >
            {navigationOpen ? <CloseIcon /> : <MenuIcon />}
            {menuLabel}
          </Box>
          {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- only notices clicks on its links, which Enter also makes */}
          <Box
            as="nav"
            className={styles.navigation}
            id={navigationId}
            onClick={handleNavigationClick}
            ref={navigationRef}
            aria-label={label}
            aria-labelledby={labelledBy}
            data-open={navigationOpen ? true : undefined}
          >
            <Box
              as="ul"
              className={styles.list}
              // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- WebKit drops the list role of a ul without markers
              role="list"
            >
              {children}
            </Box>
          </Box>
          {hasContent(end) && <Box className={styles.end}>{end}</Box>}
        </Box>
      </Box>
    </NavBarContext.Provider>
  );
}
