/**
 * Shared helpers for the smoke tests: boot the whole app (real routes, real context, mock API)
 * as a given role, collect anything that looks like a runtime error, and move between routes.
 */
const { renderRouter, screen } = require('expo-router/testing-library');
const { router } = require('expo-router');
const { act } = require('@testing-library/react-native');
const { installMockServer } = require('./mockServer');

/** console.error noise that is not an app defect. */
const IGNORED = [
    /not wrapped in act\(/i,
    /inside a test was not wrapped/i,
    /An update to .* inside a test/i,
    /react-test-renderer is deprecated/i,
    /Animated: `useNativeDriver`/i
];

/** Routes each role should be able to open. */
const ROUTES = {
    visitor: ['/', '/results', '/booking', '/shop', '/me', '/events', '/matches', '/gallery', '/squad-builder', '/venue', '/about', '/cart', '/passes', '/login', '/register'],
    player: ['/', '/me', '/passes', '/booking', '/results', '/matches', '/events', '/shop', '/cart', '/squad-builder'],
    investor: ['/me', '/investor', '/investor/bookings', '/investor/expenses', '/investor/payouts'],
    admin: [
        '/me', '/admin', '/admin/schedule', '/admin/all-bookings', '/admin/recurring', '/admin/financial-report', '/admin/investors',
        '/admin/slot-pricing', '/admin/refunds', '/admin/shop-orders', '/admin/products', '/admin/registrations', '/admin/players',
        '/admin/events', '/admin/match-results', '/admin/gallery', '/investor', '/investor/bookings', '/investor/expenses', '/investor/payouts',
        '/results', '/matches', '/events'
    ]
};

/**
 * Let pending promises, timers and re-renders settle.
 * renderRouter() switches Jest to fake timers, so time is advanced by hand.
 */
async function settle(ms = 40, rounds = 3) {
    for (let i = 0; i < rounds; i++) {
        await act(async () => { await jest.advanceTimersByTimeAsync(ms); });
    }
}

/**
 * Start the app as `role`. Resolves once the session and the first data load have finished.
 * Returns { errors, fetchMock, restore }.
 */
async function bootApp(role) {
    const errors = [];
    const fetchMock = installMockServer(role);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
        const text = args.map(a => (a instanceof Error ? `${a.message}\n${a.stack}` : String(a))).join(' ');
        if (!IGNORED.some(re => re.test(text))) errors.push(text.slice(0, 1500));
    });
    const onRejection = (reason) => { errors.push(`UnhandledRejection: ${reason && reason.stack ? reason.stack : String(reason)}`.slice(0, 1500)); };
    process.on('unhandledRejection', onRejection);

    const view = await renderRouter('./src/app', { initialUrl: '/' });
    currentView = view;
    // 1 call for the session + 8 public collections (+ role collections)
    for (let i = 0; i < 40 && fetchMock.mock.calls.length < 9; i++) await settle(25, 1);
    await settle();

    return {
        view, // render result: queries, toJSON(), container, getPathname()
        errors,
        fetchMock,
        restore: () => { errorSpy.mockRestore(); process.off('unhandledRejection', onRejection); }
    };
}

const TAB_ROUTES = ['/', '/results', '/booking', '/shop', '/me'];
let currentView = null;

/**
 * Navigate to a route and wait for it to render. From a pushed screen this dismisses back to the
 * target (as the app's own navigation helpers do) rather than stacking another copy of it.
 */
async function goTo(url) {
    const onTabs = !currentView || TAB_ROUTES.includes(currentView.getPathname());
    await act(async () => { if (onTabs) router.navigate(url); else router.dismissTo(url); });
    await settle();
}

/** All text currently rendered, joined with spaces. */
function visibleText(view) {
    const out = [];
    const walk = (node) => {
        for (const child of node.children || []) {
            if (typeof child === 'string') out.push(child);
            else walk(child);
        }
    };
    walk(view.container);
    return out.join(' ');
}

module.exports = { ROUTES, bootApp, goTo, settle, screen, visibleText };
