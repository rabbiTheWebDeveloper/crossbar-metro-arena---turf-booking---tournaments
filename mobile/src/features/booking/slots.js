/**
 * Slot availability + price helpers shared by Home, the booking tab and the payment screen.
 * Same rules as the website's BookingSection / SSLCommerzModal; the server re-prices everything
 * before a payment starts, so these numbers are previews only.
 */
import { useEffect, useState } from 'react';
import { COURTS, SCHEDULE_SLOTS_DEFINITION, BOOKING_ADDONS } from '@/data/initialData';
import { isWeekendDate, nowDhakaMinutes, timeToMinutes, todayDhakaIso } from '@/lib/dateUtils';

/** Booking statuses that occupy a slot. */
export const ACTIVE_STATUSES = ['pending_payment', 'confirmed_unpaid', 'paid_advance', 'paid_full', 'needs_refund'];
export const TOTAL_DAILY_SLOTS = 12;
export const PRIMARY_COURT = COURTS[0];

export const MATCH_TYPES = [
    { value: 'friendly', label: 'Friendly Scrimmage' },
    { value: 'competitive', label: 'Competitive Tournament Match' },
    { value: 'practice', label: 'Squad Tactical Training' },
    { value: 'corporate', label: 'Corporate / Office Game' }
];
export const MATCH_TYPE_LABEL = { friendly: 'Friendly Scrimmage', competitive: 'Competitive Match', practice: 'Tactical Training', corporate: 'Corporate Game' };

/** The 12 slot definitions with the admin's prices (falls back to the bundled defaults). */
export const slotDefinitions = (pricing) => (
    Array.isArray(pricing?.slotPrices) && pricing.slotPrices.length === TOTAL_DAILY_SLOTS ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION
);

export const bookingWindowDays = (pricing) => (Number(pricing?.bookingWindowDays) > 0 ? Number(pricing.bookingWindowDays) : 60);
export const advanceSetting = (pricing) => (Number(pricing?.advanceAmount) > 0 ? Number(pricing.advanceAmount) : 500);
export const holdMinutesSetting = (pricing) => (Number(pricing?.holdMinutes) > 0 ? Number(pricing.holdMinutes) : 10);

/** Free slots (0..12) on a date, counting every active booking including payment holds. */
export function freeSlotsOn(date, bookings) {
    const booked = (bookings || []).filter(b => b.date === date && ACTIVE_STATUSES.includes(b.paymentStatus)).length;
    return Math.max(0, TOTAL_DAILY_SLOTS - booked);
}

/**
 * The 12 slots of a day with their live status:
 *   available | on_hold (someone is paying) | booked | time_passed
 * `today` / `nowMinutes` are Dhaka wall-clock values (see useDhakaClock).
 */
export function buildDaySlots({ date, bookings, slotHolds, pricing, today, nowMinutes }) {
    const now = Date.now();
    const isPastDate = date < today;
    const isToday = date === today;
    const weekend = isWeekendDate(date, pricing?.weekendDays);
    return slotDefinitions(pricing).map((def) => {
        const price = Number(weekend ? def.weekendPrice : def.weekdayPrice) || 0;
        const existing = (bookings || []).find(b => b.date === date && Number(b.slotNumber) === Number(def.slotNumber) && ACTIVE_STATUSES.includes(b.paymentStatus));
        const slotKey = `${date}_${def.slotNumber}`;
        const activeHold = (slotHolds || []).find(h => h.slotKey === slotKey && h.expiresAt > now);
        const isPassed = isPastDate || (isToday && nowMinutes >= timeToMinutes(def.startTime));

        let status = 'available';
        let bookedTeam;
        let bookingId;
        let holdExpiresAt;
        if (existing && existing.paymentStatus === 'pending_payment') {
            status = 'on_hold';
            bookingId = existing.id;
        } else if (existing) {
            status = 'booked';
            bookedTeam = existing.teamName;
            bookingId = existing.id;
        } else if (isPassed) {
            status = 'time_passed';
        } else if (activeHold) {
            status = 'on_hold';
            bookedTeam = activeHold.teamName;
            holdExpiresAt = activeHold.expiresAt;
        }
        return {
            id: `slot-${date}-${def.slotNumber}`,
            slotNumber: def.slotNumber,
            courtId: PRIMARY_COURT.id,
            startTime: def.startTime,
            endTime: def.endTime,
            displayTime: def.displayTime,
            durationMinutes: 90,
            period: def.period,
            price,
            weekdayPrice: Number(def.weekdayPrice) || 0,
            weekendPrice: Number(def.weekendPrice) || 0,
            isPeak: def.period === 'evening',
            status,
            bookedTeam,
            bookingId,
            holdExpiresAt
        };
    });
}

/**
 * Client-side price estimate for a booking draft ({ date, slotNumber, addOns: [ids], paymentType }).
 * Shown before the server quote arrives; the server amounts replace it.
 */
export function estimateBooking(draft, pricing) {
    if (!draft) return null;
    const def = slotDefinitions(pricing).find(d => Number(d.slotNumber) === Number(draft.slotNumber)) || {};
    const weekend = isWeekendDate(draft.date, pricing?.weekendDays);
    const courtPrice = Number(weekend ? def.weekendPrice : def.weekdayPrice) || 0;
    const addOns = BOOKING_ADDONS.filter(a => (draft.addOns || []).includes(a.id));
    const addOnsPrice = addOns.reduce((sum, a) => sum + a.price, 0);
    const totalPrice = courtPrice + addOnsPrice;
    const amount = draft.paymentType === 'full_payment' ? totalPrice : Math.min(advanceSetting(pricing), totalPrice);
    return {
        displayTime: def.displayTime || `Slot #${draft.slotNumber}`,
        courtPrice,
        addOns,
        addOnsPrice,
        totalPrice,
        amount,
        dueAfterPayment: Math.max(0, totalPrice - amount)
    };
}

const readClock = () => ({ today: todayDhakaIso(), nowMinutes: nowDhakaMinutes() });

/**
 * Dhaka wall clock ({ today: 'YYYY-MM-DD', nowMinutes }) that re-renders the caller once a minute,
 * so "time passed" slots and the calendar's "today" flip over without a reload.
 */
export function useDhakaClock() {
    const [clock, setClock] = useState(readClock);
    useEffect(() => {
        const timer = setInterval(() => {
            setClock(prev => {
                const next = readClock();
                return prev.today === next.today && prev.nowMinutes === next.nowMinutes ? prev : next;
            });
        }, 15000);
        return () => clearInterval(timer);
    }, []);
    return clock;
}

/** mm:ss for a countdown in seconds. */
export const formatTimer = (secs) => `${String(Math.floor(Math.max(0, secs) / 60)).padStart(2, '0')}:${String(Math.max(0, secs) % 60).padStart(2, '0')}`;
