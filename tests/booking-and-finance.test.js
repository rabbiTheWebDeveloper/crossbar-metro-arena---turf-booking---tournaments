import { describe, it, expect } from 'vitest';
import { cleanPhone, isValidBdPhone } from '@/lib/phone';
import {
    statusFromPayment,
    mapGatewayMethod,
    isWeekend,
    addDays,
    generateBookingCode,
    publicBookingView,
    resolveAddOns,
    expandDates,
    resolveRequestedSessions
} from '@/lib/booking';
import { buildBulkSeriesInvoice } from '@/lib/invoice';
import {
    formatMoney,
    shiftMonth,
    paymentMethodLabel,
    payoutDetailsSummary
} from '@/data/finance';

describe('phone normalization and validation', () => {
    it('normalizes +880, 880, spaces, and dashes to 11-digit BD mobile', () => {
        expect(cleanPhone('+880 1711-223344')).toBe('01711223344');
        expect(cleanPhone('8801912345678')).toBe('01912345678');
        expect(cleanPhone('01819556677')).toBe('01819556677');
        expect(isValidBdPhone('+8801711223344')).toBe(true);
        expect(isValidBdPhone('01211223344')).toBe(false);
        expect(isValidBdPhone('0171122')).toBe(false);
    });
});

describe('booking helpers', () => {
    it('derives paymentStatus correctly from advance and total', () => {
        expect(statusFromPayment(3000, 3000)).toBe('paid_full');
        expect(statusFromPayment(3500, 3000)).toBe('paid_full');
        expect(statusFromPayment(500, 3000)).toBe('paid_advance');
        expect(statusFromPayment(0, 3000)).toBe('confirmed_unpaid');
        expect(statusFromPayment(0, 0)).toBe('confirmed_unpaid');
    });

    it('maps EPS / gateway financial entities to canonical payment methods', () => {
        expect(mapGatewayMethod('bKash')).toBe('bkash');
        expect(mapGatewayMethod('NAGAD')).toBe('nagad');
        expect(mapGatewayMethod('DBBL Mobile Banking')).toBe('rocket');
        expect(mapGatewayMethod('Upay')).toBe('upay');
        expect(mapGatewayMethod('VISA Credit')).toBe('card');
        expect(mapGatewayMethod('City Bank')).toBe('bank');
        expect(mapGatewayMethod('OKWallet')).toBe('eps');
    });

    it('computes weekend dates and adds calendar days accurately', () => {
        expect(isWeekend('2026-11-27')).toBe(true); // Friday
        expect(isWeekend('2026-11-28')).toBe(true); // Saturday
        expect(isWeekend('2026-11-25')).toBe(false); // Wednesday
        expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
        expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    });

    it('generates prefixed 6-char booking codes without ambiguous characters', () => {
        const code = generateBookingCode('CMA-R');
        expect(code).toMatch(/^CMA-R-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    });

    it('strips personal and payment details in publicBookingView', () => {
        const view = publicBookingView({
            id: 'abc123',
            bookingCode: 'CMA-123456',
            date: '2026-11-28',
            slotNumber: 10,
            startTime: '19:30',
            endTime: '21:00',
            displayTime: '07:30 PM – 09:00 PM',
            courtId: 'main-turf',
            teamName: 'Uttara FC',
            captainName: 'Secret Name',
            captainPhone: '01711223344',
            advanceAmount: 500,
            paymentStatus: 'paid_advance',
            isRecurring: false
        });
        expect(view.isPublicView).toBe(true);
        expect(view.teamName).toBe('Uttara FC');
        expect(view.captainPhone).toBeUndefined();
        expect(view.captainName).toBeUndefined();
        expect(view.advanceAmount).toBeUndefined();
    });

    it('resolves BookingAddOn model documents by ObjectId or slug while deduplicating and ignoring hidden/deleted items', () => {
        const modelCatalogue = [
            { id: '6745aa000000000000000001', slug: 'referee', name: 'Certified Match Referee', price: 650, description: 'Updated rate', enabled: true },
            { id: '6745aa000000000000000002', slug: 'drone-footage', name: 'Drone Footage', price: 1200, description: 'Aerial highlights', enabled: true },
            { id: '6745aa000000000000000003', slug: 'water', name: 'Water Pack', price: 400, description: 'Out of stock', enabled: false }
        ];
        // Requesting both slug 'referee' and its ObjectId should only charge once
        const resolved = resolveAddOns(['referee', '6745aa000000000000000002', 'water', 'deleted-id', '6745aa000000000000000001'], modelCatalogue);
        expect(resolved.addOns).toHaveLength(2);
        expect(resolved.addOnsPrice).toBe(1850);
        expect(resolved.addOns.map(a => a.id)).toEqual(['6745aa000000000000000001', '6745aa000000000000000002']);
    });

    it('expands bulk booking Date, Day, and Time schedules across range, specific dates, and custom per-row sessions', () => {
        // Fridays (5) and Saturdays (6) between 2026-11-27 and 2026-12-05 -> Nov 27, Nov 28, Dec 04, Dec 05
        const dates = expandDates({ startDate: '2026-11-27', endDate: '2026-12-05', weekdays: [5, 6] });
        expect(dates).toEqual(['2026-11-27', '2026-11-28', '2026-12-04', '2026-12-05']);

        // Custom per-row Date & Time Slot sessions (deduplicated + sorted)
        const custom = resolveRequestedSessions({
            sessions: [
                { date: '2026-12-10', slotNumber: 9 },
                { date: '2026-12-03', slotNumber: 10 },
                { date: '2026-12-10', slotNumber: 9 }
            ]
        });
        expect(custom.error).toBeUndefined();
        expect(custom.sessions).toEqual([
            { date: '2026-12-03', slotNumber: 10 },
            { date: '2026-12-10', slotNumber: 9 }
        ]);
        expect(custom.weekdays).toEqual([4]); // Thursday

        const seriesInv = buildBulkSeriesInvoice({
            seriesId: 'SER-TEST01',
            teamName: 'Uttara Veterans',
            captainName: 'Karim',
            captainPhone: '01711223344',
            firstDate: '2026-12-03',
            lastDate: '2026-12-10',
            weekdayNames: ['Thursday'],
            slotDetails: [{ slotNumber: 10, displayTime: '08:00 PM – 09:30 PM' }],
            totalValue: 11000,
            collected: 5000,
            bookings: [
                { bookingCode: 'CMA-R-000001', date: '2026-12-03', dayName: 'Thursday', slotNumber: 10, displayTime: '08:00 PM – 09:30 PM', totalPrice: 5500, paymentStatus: 'paid_advance' },
                { bookingCode: 'CMA-R-000002', date: '2026-12-10', dayName: 'Thursday', slotNumber: 9, displayTime: '06:30 PM – 08:00 PM', totalPrice: 5500, paymentStatus: 'confirmed_unpaid' }
            ]
        });
        expect(seriesInv.invoiceNumber).toBe('INV-SER-TEST01');
        expect(seriesInv.items).toHaveLength(2);
        expect(seriesInv.dueAmount).toBe(6000);
    });
});

describe('finance helpers', () => {
    it('formats BDT currency, shifts months, and summarizes payout details', () => {
        expect(formatMoney(50000)).toBe('৳50,000');
        expect(formatMoney(0)).toBe('৳0');
        expect(shiftMonth('2026-12', 1)).toBe('2027-01');
        expect(shiftMonth('2026-01', -1)).toBe('2025-12');
        expect(paymentMethodLabel('bank_transfer')).toBe('Bank Transfer');
        expect(paymentMethodLabel('bkash')).toBe('bKash');
        expect(payoutDetailsSummary({ method: 'bkash', accountNumber: '01711223344', accountName: 'Rahim' }))
            .toBe('bKash · 01711223344 (Rahim)');
        expect(payoutDetailsSummary(null)).toBe('');
    });
});
