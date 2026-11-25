import { describe, it, expect, afterEach } from 'vitest';
import {
    hasPermission,
    canOpenAdminPath,
    cleanPermissions,
    canDelete,
    canAccessPortal,
    getDefaultPortalForRole,
    resolvePostLoginPath
} from '@/lib/permissions';
import { publicBaseUrl } from '@/lib/baseUrl';

describe('admin permissions & route guards', () => {
    const admin = { role: 'admin' };
    const bookingsStaff = { role: 'staff', permissions: ['bookings'] };
    const playersStaff = { role: 'staff', permissions: ['players'] };
    const financeStaff = { role: 'staff', permissions: ['finance', 'investors'] };
    const emptyStaff = { role: 'staff', permissions: [] };
    const investor = { role: 'investor' };
    const player = { role: 'player' };
    const visitor = { role: 'visitor' };

    it('grants admins full access to every admin path', () => {
        expect(canOpenAdminPath(admin, '/admin')).toBe(true);
        expect(canOpenAdminPath(admin, '/admin/users')).toBe(true);
        expect(canOpenAdminPath(admin, '/admin/roles')).toBe(true);
        expect(canOpenAdminPath(admin, '/admin/investors')).toBe(true);
        expect(canOpenAdminPath(admin, '/admin/customer-list')).toBe(true);
        expect(canOpenAdminPath(admin, '/admin/bulk-sms')).toBe(true);
        expect(canOpenAdminPath(admin, '/admin/recurring')).toBe(true);
    });

    it('allows custom staff roles with permissions to open /admin Role Dashboard while blocking unpermitted sub-routes', () => {
        expect(canOpenAdminPath(bookingsStaff, '/admin')).toBe(true);
        expect(canOpenAdminPath(financeStaff, '/admin')).toBe(true);
        expect(canOpenAdminPath(playersStaff, '/admin')).toBe(true);
        expect(canOpenAdminPath(emptyStaff, '/admin')).toBe(false);
        expect(canOpenAdminPath(bookingsStaff, '/admin/recurring')).toBe(true);
        expect(canOpenAdminPath(bookingsStaff, '/admin/customer-list')).toBe(true);
        expect(canOpenAdminPath(bookingsStaff, '/admin/bulk-sms')).toBe(true);
        expect(canOpenAdminPath(playersStaff, '/admin/customer-list')).toBe(true);
        expect(canOpenAdminPath(playersStaff, '/admin/bulk-sms')).toBe(true);
        expect(canOpenAdminPath(financeStaff, '/admin/investors')).toBe(true);
        expect(canOpenAdminPath(financeStaff, '/admin/customer-list')).toBe(false);
        expect(canOpenAdminPath(financeStaff, '/admin/bulk-sms')).toBe(false);
        expect(canOpenAdminPath(bookingsStaff, '/admin/users')).toBe(false);
        expect(canOpenAdminPath(bookingsStaff, '/admin/roles')).toBe(false);
        expect(canOpenAdminPath(player, '/admin')).toBe(false);
        expect(canOpenAdminPath(investor, '/admin')).toBe(false);
    });

    it('enforces strict portal isolation across /admin, /investor, and /customer', () => {
        // Logged-out / visitor blocked from all 3 private portals
        expect(canAccessPortal(null, '/admin')).toBe(false);
        expect(canAccessPortal(visitor, '/admin')).toBe(false);
        expect(canAccessPortal(visitor, '/investor')).toBe(false);
        expect(canAccessPortal(visitor, '/customer')).toBe(false);
        expect(canAccessPortal(visitor, '/booking')).toBe(true);

        // Admin & Staff -> /admin only
        expect(canAccessPortal(admin, '/admin')).toBe(true);
        expect(canAccessPortal(admin, '/admin/users')).toBe(true);
        expect(canAccessPortal(admin, '/investor')).toBe(false);
        expect(canAccessPortal(admin, '/customer')).toBe(false);
        expect(canAccessPortal(financeStaff, '/admin/financial-report')).toBe(true);
        expect(canAccessPortal(financeStaff, '/investor')).toBe(false);
        expect(canAccessPortal(financeStaff, '/customer')).toBe(false);

        // Investor -> /investor only
        expect(canAccessPortal(investor, '/investor')).toBe(true);
        expect(canAccessPortal(investor, '/investor/payouts')).toBe(true);
        expect(canAccessPortal(investor, '/admin')).toBe(false);
        expect(canAccessPortal(investor, '/customer')).toBe(false);

        // Customer (player) -> /customer only
        expect(canAccessPortal(player, '/customer')).toBe(true);
        expect(canAccessPortal(player, '/admin')).toBe(false);
        expect(canAccessPortal(player, '/investor')).toBe(false);
    });

    it('resolves safe role-authorized post-login destinations without cross-panel leaks', () => {
        expect(getDefaultPortalForRole('admin')).toBe('/admin');
        expect(getDefaultPortalForRole('staff')).toBe('/admin');
        expect(getDefaultPortalForRole('investor')).toBe('/investor');
        expect(getDefaultPortalForRole('player')).toBe('/customer');

        // Cross-panel callbackUrls fall back to user's own portal
        expect(resolvePostLoginPath(player, '/admin/financial-report')).toBe('/customer');
        expect(resolvePostLoginPath(player, '/investor')).toBe('/customer');
        expect(resolvePostLoginPath(investor, '/customer')).toBe('/investor');
        expect(resolvePostLoginPath(investor, '/admin')).toBe('/investor');
        expect(resolvePostLoginPath(admin, '/customer')).toBe('/admin');

        // Staff callbackUrl: allowed sub-route passes, unpermitted sub-route lands on /admin Role Dashboard
        expect(resolvePostLoginPath(financeStaff, '/admin/investors')).toBe('/admin/investors');
        expect(resolvePostLoginPath(financeStaff, '/admin/users')).toBe('/admin');

        // Public relative path (e.g. booking flow) is preserved; external protocol-relative URLs are blocked
        expect(resolvePostLoginPath(player, '/booking')).toBe('/booking');
        expect(resolvePostLoginPath(player, '//evil.example.com')).toBe('/customer');
        expect(resolvePostLoginPath(player, '/login')).toBe('/customer');
    });

    it('checks single or array permissions and deduplicates unknown permission keys', () => {
        expect(hasPermission(financeStaff, ['players', 'investors'])).toBe(true);
        expect(hasPermission(financeStaff, ['players', 'bookings'])).toBe(false);
        expect(cleanPermissions(['bookings', 'bookings', 'made_up', 'investors'])).toEqual(['bookings', 'investors']);
    });

    it('restricts delete permission strictly to Super Admin (role === admin)', () => {
        expect(canDelete(admin)).toBe(true);
        expect(canDelete(bookingsStaff)).toBe(false);
        expect(canDelete(playersStaff)).toBe(false);
        expect(canDelete(financeStaff)).toBe(false);
        expect(canDelete({ role: 'staff', permissions: ['bookings', 'players', 'finance', 'investors', 'settings'] })).toBe(false);
        expect(canDelete({ role: 'investor' })).toBe(false);
        expect(canDelete(player)).toBe(false);
        expect(canDelete(null)).toBe(false);
    });
});

describe('publicBaseUrl()', () => {
    const prevBase = process.env.NEXT_PUBLIC_BASE_URL;
    const prevApp = process.env.APP_URL;

    afterEach(() => {
        if (prevBase === undefined) delete process.env.NEXT_PUBLIC_BASE_URL;
        else process.env.NEXT_PUBLIC_BASE_URL = prevBase;
        if (prevApp === undefined) delete process.env.APP_URL;
        else process.env.APP_URL = prevApp;
    });

    it('prefers configured NEXT_PUBLIC_BASE_URL without trailing slash', () => {
        process.env.NEXT_PUBLIC_BASE_URL = 'https://bookcrossbar.com///';
        expect(publicBaseUrl('http://localhost:3000/api/payment/eps/init')).toBe('https://bookcrossbar.com');
    });

    it('falls back to request origin when env URLs are unset', () => {
        delete process.env.NEXT_PUBLIC_BASE_URL;
        delete process.env.APP_URL;
        expect(publicBaseUrl('https://staging.example.com/api/payment/eps/callback?status=success')).toBe('https://staging.example.com');
        expect(publicBaseUrl()).toBe('http://localhost:3000');
    });
});
