import { describe, it, expect } from 'vitest';
import { validate } from '@/lib/validate';
import { INVESTOR_SCHEMA, BULK_BOOKING_SCHEMA, validateSlotPrices } from '@/lib/schemas';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';

describe('validate() & schemas', () => {
    it('validates a complete investor payload including large capitalInvested', () => {
        const { data, error } = validate({
            name: '  Rahim   Ahmed ',
            email: 'Rahim@Example.com',
            phone: '+8801711223344',
            sharePercentage: 25,
            capitalInvested: 25000000,
            status: 'active',
            joinedDate: '2026-11-01'
        }, INVESTOR_SCHEMA);

        expect(error).toBeUndefined();
        expect(data).toEqual({
            name: 'Rahim Ahmed',
            email: 'rahim@example.com',
            phone: '01711223344',
            sharePercentage: 25,
            capitalInvested: 25000000,
            status: 'active',
            joinedDate: '2026-11-01'
        });
    });

    it('allows clearing an optional email explicitly on partial investor update', () => {
        const { data, error } = validate(
            { email: '', capitalInvested: 500000 },
            INVESTOR_SCHEMA,
            { partial: true }
        );
        expect(error).toBeUndefined();
        expect(data).toEqual({ email: '', capitalInvested: 500000 });
    });

    it('rejects investor share percentage outside 0..100', () => {
        const res = validate({
            name: 'Karim',
            phone: '01711223344',
            sharePercentage: 110
        }, INVESTOR_SCHEMA);
        expect(res.error).toMatch(/at most 100/i);
    });

    it('accepts pay_at_turf and bank in BULK_BOOKING_SCHEMA', () => {
        const base = {
            captainName: 'Siam',
            captainPhone: '8801812345678',
            teamName: 'Uttara FC',
            startDate: '2026-12-01',
            endDate: '2026-12-31',
            paidPerSlot: 0
        };

        const r1 = validate({ ...base, paymentMethod: 'pay_at_turf' }, BULK_BOOKING_SCHEMA);
        expect(r1.error).toBeUndefined();
        expect(r1.data.paymentMethod).toBe('pay_at_turf');
        expect(r1.data.captainPhone).toBe('01812345678');

        const r2 = validate({ ...base, paymentMethod: 'bank', paidPerSlot: 1000 }, BULK_BOOKING_SCHEMA);
        expect(r2.error).toBeUndefined();
        expect(r2.data.paymentMethod).toBe('bank');
    });

    it('rejects invalid calendar dates like 2026-02-30', () => {
        const res = validate({
            captainName: 'Siam',
            captainPhone: '01711223344',
            teamName: 'Uttara FC',
            startDate: '2026-02-30',
            endDate: '2026-03-05'
        }, BULK_BOOKING_SCHEMA);
        expect(res.error).toMatch(/real calendar date/i);
    });

    it('validates the 12-slot schedule pricing table', () => {
        const ok = validateSlotPrices(SCHEDULE_SLOTS_DEFINITION);
        expect(ok.error).toBeUndefined();
        expect(ok.value).toHaveLength(12);

        const bad = validateSlotPrices(SCHEDULE_SLOTS_DEFINITION.slice(0, 5));
        expect(bad.error).toMatch(/12 slots/i);
    });
});
