/**
 * Smoke test: boots the real app (routes, context, UI) against the mock API as each role and
 * opens every screen that role can reach. A screen passes when it renders at the expected path
 * without logging a React/runtime error.
 *
 *   npm test                      # everything
 *   npx jest -t "admin"           # one role
 */
const { ROUTES, bootApp, goTo, visibleText } = require('./helpers/harness');

jest.setTimeout(900000);

describe.each(Object.keys(ROUTES))('as %s', (role) => {
    test.each(ROUTES[role])('opens %s', async (url) => {
        const app = await bootApp(role);
        try {
            if (url !== '/') await goTo(url);
            expect(app.view).toHavePathname(url);
            // The screen must have rendered something
            expect(app.view.toJSON()).toBeTruthy();
            expect(app.errors).toEqual([]);
        } finally {
            app.restore();
        }
    });
});

describe('access control', () => {
    test('a visitor cannot open the admin or investor portals', async () => {
        const app = await bootApp('visitor');
        try {
            await goTo('/admin');
            expect(app.view).not.toHavePathname('/admin');
            await goTo('/investor');
            expect(app.view).not.toHavePathname('/investor');
        } finally {
            app.restore();
        }
    });

    test('a player cannot open the admin or investor portals', async () => {
        const app = await bootApp('player');
        try {
            await goTo('/admin/players');
            expect(app.view).not.toHavePathname('/admin/players');
            await goTo('/investor');
            expect(app.view).not.toHavePathname('/investor');
        } finally {
            app.restore();
        }
    });

    test('an investor can open the investor portal but not the admin desk', async () => {
        const app = await bootApp('investor');
        try {
            await goTo('/investor');
            expect(app.view).toHavePathname('/investor');
            await goTo('/admin');
            expect(app.view).not.toHavePathname('/admin');
        } finally {
            app.restore();
        }
    });
});

describe('screens show the data they were given', () => {
    const CASES = [
        ['visitor', '/events', 'Friday Night Turf Blitz'],
        ['visitor', '/shop', 'Grip Socks'],
        ['visitor', '/results', 'Uttara Metro FC'],
        ['visitor', '/about', 'Crossbar Metro Arena'],
        ['player', '/me', 'Siam Chowdhury'],
        ['player', '/passes', 'CMA-TEST01'],
        ['investor', '/investor', 'Partner Karim'],
        ['investor', '/investor/payouts', 'IBBL 4411'],
        ['admin', '/admin', 'Sector 7 United'],
        ['admin', '/admin/all-bookings', 'CMA-TEST02'],
        ['admin', '/admin/refunds', 'Nayeem Islam'],
        ['admin', '/admin/players', 'Partner Karim'],
        ['admin', '/admin/investors', 'Partner Selina'],
        ['admin', '/admin/registrations', 'BK12345'],
        ['admin', '/admin/shop-orders', 'SHP-TEST1'],
        ['admin', '/admin/financial-report', 'Groundsman wages']
    ];
    test.each(CASES)('%s at %s shows "%s"', async (role, url, text) => {
        const app = await bootApp(role);
        try {
            await goTo(url);
            expect(app.view).toHavePathname(url);
            expect(visibleText(app.view)).toContain(text);
        } finally {
            app.restore();
        }
    });
});
