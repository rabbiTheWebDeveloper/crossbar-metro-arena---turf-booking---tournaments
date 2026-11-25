import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';

// Same fallback secret src/proxy.js uses outside production when JWT_SECRET is not set.
const SECRET = process.env.JWT_SECRET || 'crossbar_metro_dev_only_secret_do_not_use_in_production';
const token = (role, extra = {}) => jwt.sign({ userId: '64b000000000000000000001', name: 'Test', phone: '01711223344', role, ...extra }, SECRET, { expiresIn: '1h' });

async function visit(path, role) {
    const headers = role ? { cookie: `cma_auth_token=${role === 'forged' ? token('admin').slice(0, -4) + 'AAAA' : token(role)}` } : {};
    const res = await proxy(new NextRequest(new URL(path, 'http://localhost:3000'), { headers }));
    const location = res.headers.get('location');
    return { status: res.status, to: location ? new URL(location).pathname : null, search: location ? new URL(location).search : '' };
}

describe('proxy: private portal isolation', () => {
    it('sends signed-out visitors to /login with a callback for every portal', async () => {
        for (const path of ['/admin', '/admin/users', '/investor', '/investor/payouts', '/customer']) {
            const r = await visit(path);
            expect(r.status).toBe(307);
            expect(r.to).toBe('/login');
            expect(new URLSearchParams(r.search).get('callbackUrl')).toBe(path);
        }
    });

    it('rejects a token with a bad signature', async () => {
        const r = await visit('/admin', 'forged');
        expect(r.to).toBe('/login');
    });

    it('lets each role into its own portal only', async () => {
        expect((await visit('/admin', 'admin')).to).toBeNull();
        expect((await visit('/admin/roles', 'admin')).to).toBeNull();
        expect((await visit('/admin', 'staff')).to).toBeNull();
        expect((await visit('/investor', 'investor')).to).toBeNull();
        expect((await visit('/investor/settings', 'investor')).to).toBeNull();
        expect((await visit('/customer', 'player')).to).toBeNull();
    });

    it('bounces a signed-in user out of another panel to their own', async () => {
        expect((await visit('/admin', 'player')).to).toBe('/customer');
        expect((await visit('/investor', 'player')).to).toBe('/customer');
        expect((await visit('/admin/users', 'investor')).to).toBe('/investor');
        expect((await visit('/customer', 'investor')).to).toBe('/investor');
        expect((await visit('/investor', 'admin')).to).toBe('/admin');
        expect((await visit('/customer', 'staff')).to).toBe('/admin');
    });

    it('sends a signed-in user away from /login to their dashboard, unless switching accounts', async () => {
        expect((await visit('/login', 'admin')).to).toBe('/admin');
        expect((await visit('/login', 'investor')).to).toBe('/investor');
        expect((await visit('/login?callbackUrl=/admin', 'player')).to).toBe('/customer');
        expect((await visit('/login?switch=true', 'player')).to).toBeNull();
    });

    it('marks private pages as not cacheable so Back after logout does not show them', async () => {
        const res = await proxy(new NextRequest(new URL('/admin', 'http://localhost:3000'), { headers: { cookie: `cma_auth_token=${token('admin')}` } }));
        expect(res.headers.get('cache-control')).toContain('no-store');
    });
});
