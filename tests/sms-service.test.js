import { describe, it, expect } from 'vitest';
import {
    formatSmsPhone,
    formatDhakaDateTime,
    computeReminderSchedule,
    buildBookingConfirmedSms,
    buildPaymentSuccessSms,
    buildPreMatchReminderSms,
    smsErrorMessage
} from '@/service/sms-service';
import {
    parsePhoneTokens,
    estimateSmsParts,
    normalizeScheduleInput
} from '@/lib/smsUtils';

describe('sms.net.bd helpers', () => {
    it('normalizes single and multiple Bangladeshi mobile numbers to 8801XXXXXXXXX', () => {
        expect(formatSmsPhone('01711223344')).toBe('8801711223344');
        expect(formatSmsPhone('+880 1812-345678')).toBe('8801812345678');
        expect(formatSmsPhone('01711223344, 8801911223344, 01711223344, invalid')).toBe('8801711223344,8801911223344');
        expect(formatSmsPhone('12345')).toBe('');
    });

    it('parses newline, space, and semicolon separated bulk numbers while tracking invalid entries', () => {
        const res = parsePhoneTokens('01711223344\n01811223344 01911223344; bad_num; +880 1611-223344');
        expect(res.valid).toEqual(['01711223344', '01811223344', '01911223344', '01611223344']);
        expect(res.invalid).toEqual(['bad_num']);
        expect(res.formatted).toBe('8801711223344,8801811223344,8801911223344,8801611223344');
    });

    it('calculates GSM-7 and Bangla Unicode SMS segments accurately', () => {
        const empty = estimateSmsParts('');
        expect(empty.parts).toBe(0);

        const shortGsm = estimateSmsParts('Crossbar Metro Arena: Slot confirmed!');
        expect(shortGsm.encoding).toBe('GSM-7');
        expect(shortGsm.parts).toBe(1);

        const multiGsm = estimateSmsParts('A'.repeat(165));
        expect(multiGsm.encoding).toBe('GSM-7');
        expect(multiGsm.parts).toBe(2);

        const bangla = estimateSmsParts('ক্রসবার মেট্রো এরিনা: আপনার বুকিং নিশ্চিত হয়েছে!');
        expect(bangla.encoding).toBe('Unicode');
        expect(bangla.parts).toBe(1);

        const multiBangla = estimateSmsParts('ক'.repeat(75));
        expect(multiBangla.encoding).toBe('Unicode');
        expect(multiBangla.parts).toBe(2);
    });

    it('normalizes datetime-local schedule inputs to Y-m-d H:i:s', () => {
        expect(normalizeScheduleInput('2026-11-25T19:15')).toBe('2026-11-25 19:15:00');
        expect(normalizeScheduleInput('2026-11-25 19:15:00')).toBe('2026-11-25 19:15:00');
        expect(normalizeScheduleInput('')).toBe('');
    });

    it('formats dates in Asia/Dhaka time as Y-m-d H:i:s for sms.net.bd schedule', () => {
        // 2026-11-25T08:35:02Z == 2026-11-25 14:35:02 +06:00
        const d = new Date('2026-11-25T08:35:02Z');
        expect(formatDhakaDateTime(d)).toBe('2026-11-25 14:35:02');
    });

    it('computes 15-minute pre-match reminder schedule accurately including midnight rollover', () => {
        const now = new Date('2026-11-25T10:00:00+06:00');
        const evening = computeReminderSchedule('2026-11-25', '19:30', 15, now);
        expect(evening.shouldSchedule).toBe(true);
        expect(evening.schedule).toBe('2026-11-25 19:15:00');

        const midnight = computeReminderSchedule('2026-11-26', '00:00', 15, now);
        expect(midnight.shouldSchedule).toBe(true);
        expect(midnight.schedule).toBe('2026-11-25 23:45:00');

        const tooClose = computeReminderSchedule('2026-11-25', '10:10', 15, now);
        expect(tooClose.shouldSchedule).toBe(false);
    });

    it('builds clear confirmation, payment success, and 15-min reminder SMS texts', () => {
        const booking = {
            bookingCode: 'CMA-AB1234',
            teamName: 'Uttara FC',
            date: '2026-11-28',
            displayTime: '07:30 PM – 09:00 PM',
            totalPrice: 3500,
            advanceAmount: 500,
            dueAmount: 3000
        };

        expect(buildBookingConfirmedSms(booking)).toContain('CMA-AB1234');
        expect(buildBookingConfirmedSms(booking)).toContain('CONFIRMED');
        expect(buildPaymentSuccessSms(booking, 500)).toContain('Tk 500');
        expect(buildPaymentSuccessSms(booking, 500)).toContain('CMA-AB1234');
        expect(buildPreMatchReminderSms(booking)).toContain('15 mins');
        expect(buildPreMatchReminderSms(booking)).toContain('Due at desk: Tk 3,000');
    });

    it('maps documented sms.net.bd error codes to human-readable messages', () => {
        expect(smsErrorMessage(417)).toMatch(/Insufficient SMS balance/i);
        expect(smsErrorMessage(412)).toMatch(/Invalid schedule/i);
        expect(smsErrorMessage(421)).toMatch(/registered phone number/i);
    });
});
