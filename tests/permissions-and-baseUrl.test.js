import { describe, it, expect, afterEach } from 'vitest';
import { hasPermission, canOpenAdminPath, cleanPermissions } from '@/lib/permissions';
import { publicBaseUrl } from '@/lib/baseUrl';

describe('admin permissions & route guards', () => {
    const admin = { role: 'admin' };
    const bookingsStaff = { role: 'staff', permissions: ['bookings'] };
    const playersStaff = { role: 'staff', permissions: ['players'] };
    const financeStaff = { role: 'staff', permissions: ['finance', 'investors'] };
    const player = { role: 'player' };

    it('grants admins full access to every admin path', () => {
        expect(canOpenAdminPath(admin, '/admin')).toBe(true);
        expect(canOpenAdminPath(admin, '/admin/users')).toBe(true);
        expect(canOpenAdminPath(admin, '/admin/roles')).toBe(true);
        expect(canOpenAdminPath(admin, '/admin/investors')).toBe(true);
        expect(canOpenAdminPath(admin, '/admin/customer-list')).toBe(true);
        expect(canOpenAdminPath(admin, '/admin/recurring')).toBe(true);
    });

    it('enforces staff permissions including /admin/customer-list and blocks admin-only routes', () => {
        expect(canOpenAdminPath(bookingsStaff, '/admin/recurring')).toBe(true);
        expect(canOpenAdminPath(bookingsStaff, '/admin/customer-list')).toBe(true);
        expect(canOpenAdminPath(playersStaff, '/admin/customer-list')).toBe(true);
        expect(canOpenAdminPath(financeStaff, '/admin/investors')).toBe(true);
        expect(canOpenAdminPath(financeStaff, '/admin/customer-list')).toBe(false);
        expect(canOpenAdminPath(bookingsStaff, '/admin/users')).toBe(false);
        expect(canOpenAdminPath(bookingsStaff, '/admin/roles')).toBe(false);
        expect(canOpenAdminPath(player, '/admin')).toBe(false);
    });

    it('checks single or array permissions and deduplicates unknown permission keys', () => {
        expect(hasPermission(financeStaff, ['players', 'investors'])).toBe(true);
        expect(hasPermission(financeStaff, ['players', 'bookings'])).toBe(false);
        expect(cleanPermissions(['bookings', 'bookings', 'made_up', 'investors'])).toEqual(['bookings', 'investors']);
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
