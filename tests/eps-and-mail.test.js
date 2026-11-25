import { describe, it, expect } from 'vitest';
import { validateEpsConfigValues } from '@/service/eps-service';
import { isDeliverableEmail } from '@/utils/mail';

describe('EPS configuration validation', () => {
    const validConfig = {
        username: 'merchant@example.com',
        password: 'StrongPassword123',
        hashKey: 'FMUNISHOY2lWZEPSXTyFD1FBIMPORTBAY',
        merchantId: 'c2e6a283-ab13-4a78-913a-609d65cf25ac',
        storeId: '12345529-d680-418d-89bd-d47fff571189'
    };

    it('accepts valid EPS email and 36-char UUID merchantId & storeId', () => {
        expect(validateEpsConfigValues(validConfig)).toBe('');
    });

    it('rejects a truncated 31-char storeId with a clear diagnostic message', () => {
        const err = validateEpsConfigValues({
            ...validConfig,
            storeId: '529-d680-418d-89bd-d47fff571189'
        });
        expect(err).toMatch(/31 characters/i);
        expect(err).toMatch(/36-character UUID/i);
    });

    it('rejects non-UUID merchantId, non-email username, and missing fields', () => {
        expect(validateEpsConfigValues({ ...validConfig, merchantId: 'bad-id' })).toMatch(/Merchant ID/i);
        expect(validateEpsConfigValues({ ...validConfig, username: 'not-an-email' })).toMatch(/email/i);
        expect(validateEpsConfigValues({ ...validConfig, hashKey: '' })).toMatch(/Missing/i);
    });
});

describe('mail deliverability checks', () => {
    it('accepts real email addresses and rejects blanks or phone placeholders', () => {
        expect(isDeliverableEmail('investor@gmail.com')).toBe(true);
        expect(isDeliverableEmail('  Partner.One@company.com.bd ')).toBe(true);
        expect(isDeliverableEmail('')).toBe(false);
        expect(isDeliverableEmail('not-an-email')).toBe(false);
        expect(isDeliverableEmail('01711223344@bookcrossbar.com')).toBe(false);
    });
});
