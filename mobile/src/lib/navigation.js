/**
 * Navigation helpers on top of Expo Router.
 *
 * The app is one root stack: the bottom tabs sit at the bottom of it and every other screen
 * (events, cart, login, the admin and investor portals…) is pushed on top. `router.navigate()`
 * from a pushed screen to a tab route would push a SECOND copy of the whole tab navigator, so
 * those jumps go through `openTab()`, which closes the pushed screens and switches tab instead.
 */
import { useCallback } from 'react';
import { usePathname, useRouter } from 'expo-router';

export const TAB_ROUTES = ['/', '/results', '/booking', '/shop', '/me'];

export const isTabRoute = (pathname) => TAB_ROUTES.includes(pathname || '/');

/**
 * Returns `openTab(href)`: go to a bottom tab from anywhere.
 *   const openTab = useOpenTab();   openTab('/booking');
 */
export function useOpenTab() {
    const router = useRouter();
    const pathname = usePathname();
    return useCallback((href) => {
        if (isTabRoute(pathname)) router.navigate(href); // already on the tabs: just switch
        else router.dismissTo(href); // pop the pushed screens, then switch
    }, [router, pathname]);
}

/**
 * Returns `openSection(href)` for the admin / investor menus: move between sections of a portal
 * without piling screens up (the portal's home stays underneath, one section on top).
 *   home: the portal's index route, e.g. '/admin'
 */
export function usePortalNav(home) {
    const router = useRouter();
    const pathname = usePathname();
    return useCallback((href) => {
        if (href === pathname) return;
        if (isTabRoute(href) || href === home || !href.startsWith(`${home}/`)) router.dismissTo(href); // leave the portal / back to its home
        else if (pathname === home) router.push(href);
        else router.replace(href);
    }, [router, pathname, home]);
}
