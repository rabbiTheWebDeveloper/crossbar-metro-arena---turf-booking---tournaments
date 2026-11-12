/**
 * Interaction crawl: on every screen, tap every tappable element and type into every text field
 * (against the mock API, so nothing real is changed). This opens the sheets, switches the tabs and
 * runs the handlers behind each button; the test fails when any of that throws or logs an error.
 *
 *   npx jest interactions            # all roles
 *   npx jest interactions -t admin   # one role
 */
const { fireEvent, act } = require('@testing-library/react-native');
const { ROUTES, bootApp, goTo, settle } = require('./helpers/harness');

jest.setTimeout(900000);

const MAX_TAPS_PER_SCREEN = 70;

// Set CRAWL_LOG=<file> to record every action (handy when a tap hangs or exhausts memory)
const trace = (line) => { if (process.env.CRAWL_LOG) require('fs').appendFileSync(process.env.CRAWL_LOG, `${line}\n`); };

const isTappable = (node) => {
    const p = node.props || {};
    if (p.disabled || p['aria-disabled'] || (p.accessibilityState && p.accessibilityState.disabled)) return false;
    return typeof p.onPress === 'function' || typeof p.onClick === 'function';
};
const isTextField = (node) => node.type === 'TextInput' && node.props && node.props.editable !== false;

/** Visible text inside a node (to name the element in failure messages). */
function textOf(node, out = []) {
    for (const child of node.children || []) {
        if (typeof child === 'string') out.push(child);
        else if (out.length < 8) textOf(child, out);
    }
    return out;
}
const describeNode = (node) => (node.props.accessibilityLabel || node.props['aria-label'] || textOf(node).join(' ').slice(0, 60) || node.type);

/** Stable identity of a rendered element across re-renders (its host instance). */
const identityOf = (node) => (node.unstable_fiber && node.unstable_fiber.stateNode) || node;

/**
 * `ignore` holds the identities of elements that belong to the screens underneath (the Home tab
 * the app boots on), so the crawl spends its taps on the screen under test.
 */
/** Navigation chrome: tapping it only leaves the screen under test. */
const isChrome = (label) => label === 'Go back' || /, tab, \d+ of \d+$/.test(label);
/** Controls that dismiss a sheet: tapped last, so the sheet's content is exercised first. */
const isDismiss = (label) => /^(close|cancel|go back|not now|keep|done|dismiss)\b/i.test(label);

async function crawl(url, app, ignore) {
    const problems = [];
    const note = (what, label, detail) => problems.push(`[${url}] ${what} "${label}": ${String(detail).slice(0, 600)}`);
    const mine = (node) => !ignore.has(identityOf(node));

    const typed = new Set();
    const tapped = new Set();
    const labelCount = new Map();
    const discovered = new Map(); // identity -> round in which the element first appeared

    /** Fill in every text field not typed into yet (including those inside a sheet that just opened). */
    const typeIntoNewFields = async () => {
        const fields = app.view.container.queryAll(isTextField).filter(f => mine(f) && !typed.has(identityOf(f)));
        for (const field of fields) {
            typed.add(identityOf(field));
            const before = app.errors.length;
            trace(`[${url}] type ${describeNode(field)}`);
            try {
                await fireEvent.changeText(field, field.props.keyboardType === 'numeric' || field.props.keyboardType === 'phone-pad' ? '01711223344' : 'Test value');
            } catch (e) { note('typing into', describeNode(field), e && e.stack ? e.stack : e); }
            if (app.errors.length > before) note('typing into', describeNode(field), app.errors.slice(before).join(' | '));
        }
    };

    // Tap everything once. Elements revealed by the latest tap (a sheet, an expanded row) go first.
    for (let taps = 0; taps < MAX_TAPS_PER_SCREEN; taps++) {
        await typeIntoNewFields();
        let best = null;
        let bestScore = -1;
        for (const n of app.view.container.queryAll(isTappable)) {
            const id = identityOf(n);
            if (!mine(n)) continue;
            if (!discovered.has(id)) discovered.set(id, taps);
            if (tapped.has(id)) continue;
            const label = describeNode(n);
            if (isChrome(label) || (labelCount.get(label) || 0) >= 2) { tapped.add(id); continue; }
            const score = discovered.get(id) * 2 + (isDismiss(label) ? 0 : 1); // newest first, dismiss buttons last
            if (score > bestScore) { best = n; bestScore = score; }
        }
        if (!best) break;
        const label = describeNode(best);
        tapped.add(identityOf(best));
        labelCount.set(label, (labelCount.get(label) || 0) + 1);
        const before = app.errors.length;
        trace(`[${url}] tap #${taps} (heap ${Math.round(process.memoryUsage().heapUsed / 1048576)}MB) ${label}`);
        try {
            await fireEvent.press(best);
            await settle(10, 1);
        } catch (e) { note('tapping', label, e && e.stack ? e.stack : e); }
        if (app.errors.length > before) note('tapping', label, app.errors.slice(before).join(' | '));
        // The bottom tabs must exist exactly once, whatever was tapped
        const tabStacks = (app.view.getRouterState().routes || []).filter(r => r.name === '(tabs)').length;
        if (tabStacks > 1) note('tapping', label, `navigation stacked ${tabStacks} copies of the tab navigator`);
        // A tap that navigated away: come back and carry on with the next element
        if (app.view.getPathname() !== url) {
            try { await goTo(url); } catch (e) { note('returning after', label, e); }
            if (app.view.getPathname() !== url) break; // e.g. signed out / redirected for good
        }
    }
    return problems;
}

describe.each(Object.keys(ROUTES))('interaction crawl as %s', (role) => {
    test.each(ROUTES[role])('taps through %s', async (url) => {
        const app = await bootApp(role);
        try {
            // Everything tappable before navigating belongs to the Home tab / tab bar underneath
            const ignore = new Set(url === '/' ? [] : [...app.view.container.queryAll(isTappable), ...app.view.container.queryAll(isTextField)].map(identityOf));
            if (url !== '/') await goTo(url);
            expect(app.view).toHavePathname(url);
            const problems = await crawl(url, app, ignore);
            await act(async () => { await Promise.resolve(); });
            expect(problems).toEqual([]);
        } finally {
            app.restore();
        }
    });
});
