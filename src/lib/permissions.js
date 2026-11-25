/**
 * Admin-portal permissions, shared by the server guards (lib/apiAuth.js) and the client (no server-only imports).
 *
 * Account types (User.role):
 *   admin  - full access to everything, including users and roles. Cannot be restricted.
 *   staff  - can open the admin portal; what they can do comes from their staff role (models/role-model.js),
 *            which is a named list of the permission keys below.
 *   investor / player / visitor - no admin-portal access.
 *
 * Managing users, staff roles and data backups is admin-only and is deliberately not a grantable permission,
 * so a staff member can never give themselves more access.
 */

export const PERMISSIONS = [
    { key: 'bookings', group: 'Operations', label: 'Bookings & schedule', description: 'Today, schedule, all bookings, fixed weekly slots and walk-in bookings.' },
    { key: 'refunds', group: 'Operations', label: 'Refunds', description: 'Review refund requests and record refunds.' },
    { key: 'players', group: 'Operations', label: 'Customers & players', description: 'The customer list (add, edit, sync), plus player accounts: reset passwords and disable accounts.' },
    { key: 'finance', group: 'Money', label: 'Financial report', description: 'Financial report, expenses and other income.' },
    { key: 'investors', group: 'Money', label: 'Investors & payouts', description: 'Partner records, profit shares and payouts.' },
    { key: 'pricing', group: 'Money', label: 'Slot pricing & rules', description: 'Slot times, prices, advance amount and booking rules.' },
    { key: 'shop_orders', group: 'Shop', label: 'Shop orders', description: 'Pickup reservations from the shop.' },
    { key: 'products', group: 'Shop', label: 'Products', description: 'Shop products and stock.' },
    { key: 'events', group: 'Tournaments & matches', label: 'Events', description: 'Create and edit tournaments and events.' },
    { key: 'registrations', group: 'Tournaments & matches', label: 'Registrations', description: 'Approve and manage tournament registrations.' },
    { key: 'matches', group: 'Tournaments & matches', label: 'Match results & teams', description: 'Match results, team records and open challenges.' },
    { key: 'gallery', group: 'Website', label: 'Gallery', description: 'Photos shown on the website.' },
    { key: 'settings', group: 'Website', label: 'Venue settings', description: 'Business name, contact details, address and social links.' }
];

export const PERMISSION_KEYS = PERMISSIONS.map(p => p.key);
export const PERMISSION_GROUPS = [...new Set(PERMISSIONS.map(p => p.group))];
export const permissionLabel = (key) => PERMISSIONS.find(p => p.key === key)?.label || key;

/** Keep only known permission keys, without duplicates. */
export const cleanPermissions = (list) => [...new Set((Array.isArray(list) ? list : []).map(String))].filter(k => PERMISSION_KEYS.includes(k));

/** Does this user hold the permission (or any one of a list)? Admins hold all of them. */
export function hasPermission(user, permission) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role !== 'staff' || !Array.isArray(user.permissions)) return false;
    const wanted = Array.isArray(permission) ? permission : [permission];
    return wanted.some(p => user.permissions.includes(p));
}

export const canAccessAdminPortal = (user) => user?.role === 'admin' || user?.role === 'staff';

/** Only Super Admin (`role === 'admin'`) is permitted to delete records across the admin portal. */
export const canDelete = (user) => user?.role === 'admin';

/** Starting points offered when creating a staff role. */
export const ROLE_TEMPLATES = [
    { name: 'Manager', description: 'Runs the arena day to day. Everything except users and roles.', permissions: PERMISSION_KEYS },
    { name: 'Front desk', description: 'Takes bookings and handles customers at the counter.', permissions: ['bookings', 'refunds', 'players', 'shop_orders', 'registrations'] },
    { name: 'Accountant', description: 'Keeps the books and pays partners.', permissions: ['finance', 'investors', 'refunds'] },
    { name: 'Content editor', description: 'Keeps the website, events and results up to date.', permissions: ['events', 'matches', 'gallery', 'products', 'settings'] }
];

/**
 * Which permission each admin page needs. Longest prefix wins. `adminOnly` pages are for full admins;
 * `open` pages are available to anyone who can open the portal (the page itself hides what is not allowed).
 */
const ADMIN_PAGES = [
    { prefix: '/admin/users', adminOnly: true },
    { prefix: '/admin/roles', adminOnly: true },
    { prefix: '/admin/settings', open: true },
    { prefix: '/admin/schedule', permission: 'bookings' },
    { prefix: '/admin/all-bookings', permission: 'bookings' },
    { prefix: '/admin/bookings', permission: 'bookings' },
    { prefix: '/admin/payments', permission: ['bookings', 'finance'] },
    { prefix: '/admin/recurring', permission: 'bookings' },
    { prefix: '/admin/financial-report', permission: 'finance' },
    { prefix: '/admin/investors', permission: 'investors' },
    { prefix: '/admin/slot-pricing', permission: 'pricing' },
    { prefix: '/admin/refunds', permission: 'refunds' },
    { prefix: '/admin/shop-orders', permission: 'shop_orders' },
    { prefix: '/admin/products', permission: 'products' },
    { prefix: '/admin/registrations', permission: 'registrations' },
    { prefix: '/admin/players', permission: 'players' },
    { prefix: '/admin/customers', permission: 'players' },
    { prefix: '/admin/customer-list', permission: ['players', 'bookings'] },
    { prefix: '/admin/bulk-sms', permission: ['players', 'bookings', 'settings'] },
    { prefix: '/admin/events', permission: 'events' },
    { prefix: '/admin/match-results', permission: 'matches' },
    { prefix: '/admin/gallery', permission: 'gallery' }
];

/**
 * Can this user open the given admin page?
 * `/admin` (Overview) is open to full admins and any staff user with at least one role permission
 * (staff without `bookings` see their tailored Role Overview Dashboard there).
 */
export function canOpenAdminPath(user, pathname) {
    if (!canAccessAdminPortal(user)) return false;
    if (user.role === 'admin') return true;
    const path = String(pathname || '').replace(/\/+$/, '') || '/admin';
    if (path === '/admin') {
        return Array.isArray(user.permissions) && user.permissions.length > 0;
    }
    const page = ADMIN_PAGES.find(p => path === p.prefix || path.startsWith(`${p.prefix}/`));
    if (!page) return false;
    if (page.adminOnly) return false;
    if (page.open) return true;
    return hasPermission(user, page.permission);
}

/** Primary portal home path for a role or user object. */
export function getDefaultPortalForRole(userOrRole) {
    const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
    if (role === 'admin' || role === 'staff') return '/admin';
    if (role === 'investor') return '/investor';
    if (role === 'player') return '/customer';
    return '/login';
}

/**
 * Strict panel isolation across the 3 private portals:
 *   - `/admin*`    -> ONLY `admin` and `staff`
 *   - `/investor*` -> ONLY `investor`
 *   - `/customer*` -> ONLY `player` (customer)
 * Visitors / unauthenticated users cannot access any private portal.
 */
export function canAccessPortal(user, pathname) {
    const path = String(pathname || '') || '/';
    const isAdminRoute = path === '/admin' || path.startsWith('/admin/');
    const isInvestorRoute = path === '/investor' || path.startsWith('/investor/');
    const isCustomerRoute = path === '/customer' || path.startsWith('/customer/');

    if (!isAdminRoute && !isInvestorRoute && !isCustomerRoute) return true;
    if (!user || !user.role || user.role === 'visitor') return false;

    if (isAdminRoute) return user.role === 'admin' || user.role === 'staff';
    if (isInvestorRoute) return user.role === 'investor';
    if (isCustomerRoute) return user.role === 'player';
    return true;
}

const AUTH_PATHS = new Set(['/login', '/register', '/signup', '/logout', '/forgot-password']);

/**
 * Compute a safe, role-authorized post-login redirect path.
 * Prevents cross-panel redirect leaks (e.g. a customer logging in with `?callbackUrl=/admin`).
 */
export function resolvePostLoginPath(user, callbackUrl) {
    const fallback = getDefaultPortalForRole(user);
    if (!user || !user.role || user.role === 'visitor') return '/login';

    const raw = typeof callbackUrl === 'string' ? callbackUrl.trim() : '';
    if (!raw || !/^\/(?![\/\\])/.test(raw)) return fallback;

    const cleanPathname = raw.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
    if (AUTH_PATHS.has(cleanPathname)) return fallback;
    if (!canAccessPortal(user, cleanPathname)) return fallback;

    // If staff has loaded permissions and callbackUrl points to an unpermitted admin sub-route, land on /admin
    if (
        (cleanPathname === '/admin' || cleanPathname.startsWith('/admin/')) &&
        user.role === 'staff' &&
        Array.isArray(user.permissions) &&
        !canOpenAdminPath(user, cleanPathname)
    ) {
        return '/admin';
    }

    return raw;
}
