/**
 * Public routes that are built in the main site design (src/components/home). They render their
 * own header and footer (HomeHeader / HomeFooter), so the legacy Navbar and Footer step aside on them.
 * Add a route here when its page is moved to the main design.
 */
export const MAIN_DESIGN_ROUTES = ['/', '/shop'];

export const usesMainDesign = (pathname) => MAIN_DESIGN_ROUTES.includes(pathname || '/');
