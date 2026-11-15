'use client';
import { useEffect, useMemo, useState } from 'react';
import { COURTS, SCHEDULE_SLOTS_DEFINITION } from '../../data/initialData';
import { useArena, todayDhaka } from '../../context/ArenaContext';
import { addDaysIso, isWeekendDate, nowDhakaMinutes, parseLocalDate, timeToMinutes } from '../../lib/dateUtils';

/** Booking statuses that occupy a slot (same list the booking page and the server use). */
export const ACTIVE_STATUSES = ['pending_payment', 'confirmed_unpaid', 'paid_advance', 'paid_full', 'needs_refund'];

export const PERIODS = [
    { key: 'morning', label: 'Morning' },
    { key: 'afternoon', label: 'Afternoon' },
    { key: 'evening', label: 'Evening' }
];

export const PRIMARY_COURT = COURTS[0];

/** "BDT 2,800" */
export const bdt = (amount) => `BDT ${Math.round(Number(amount) || 0).toLocaleString('en-US')}`;

/** "18:00" -> "6:00 PM", "24:00" -> "12:00 AM" */
export function clock12(hhmm) {
    const mins = timeToMinutes(hhmm);
    const h24 = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

/** "18:00" -> "6 PM", "07:30" -> "7:30 AM" (compact, for ranges) */
export function clockShort(hhmm) {
    const full = clock12(hhmm);
    return full.replace(':00 ', ' ');
}

/** The regular ("actual") price of a slot when an offer is running on it, otherwise 0. */
export function actualPriceOf(def, weekend) {
    const actual = Number(weekend ? def.weekendActualPrice : def.weekdayActualPrice) || 0;
    const offer = Number(weekend ? def.weekendPrice : def.weekdayPrice) || 0;
    return actual > offer ? actual : 0;
}

/** Biggest saving on the price list (0 when no offer is running): "up to BDT 2,000 off". */
export function maxDiscount(pricing) {
    return slotDefinitions(pricing).reduce((max, d) => Math.max(
        max,
        (Number(d.weekdayActualPrice) || 0) - (Number(d.weekdayPrice) || 0),
        (Number(d.weekendActualPrice) || 0) - (Number(d.weekendPrice) || 0)
    ), 0);
}

/** The admin's 12 slot definitions (falls back to the built-in schedule). */
export function slotDefinitions(pricing) {
    return Array.isArray(pricing?.slotPrices) && pricing.slotPrices.length === 12 ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION;
}

/** { morning: { range: '6:30 AM – 12:30 PM', weekdayMin, weekdayMax, weekdayMinActual, weekendMin, weekendMax, count }, … } */
export function periodSummary(pricing) {
    const out = {};
    for (const { key } of PERIODS) {
        const defs = slotDefinitions(pricing).filter(d => d.period === key);
        if (!defs.length) continue;
        const weekday = defs.map(d => Number(d.weekdayPrice) || 0);
        const weekend = defs.map(d => Number(d.weekendPrice) || 0);
        // the regular price of the cheapest weekday slot, for the struck-through figure on the price card
        const cheapest = defs.reduce((a, b) => ((Number(b.weekdayPrice) || 0) < (Number(a.weekdayPrice) || 0) ? b : a), defs[0]);
        out[key] = {
            count: defs.length,
            range: `${clockShort(defs[0].startTime)} – ${clockShort(defs[defs.length - 1].endTime)}`,
            weekdayMin: Math.min(...weekday), weekdayMax: Math.max(...weekday),
            weekdayMinActual: actualPriceOf(cheapest, false),
            weekendMin: Math.min(...weekend), weekendMax: Math.max(...weekend)
        };
    }
    return out;
}

/** Rank the periods by price so they can be labelled Off-peak / Standard / Peak from real rates. */
export function periodTiers(pricing) {
    const summary = periodSummary(pricing);
    const ranked = Object.keys(summary).sort((a, b) => summary[a].weekdayMin - summary[b].weekdayMin || summary[a].weekdayMax - summary[b].weekdayMax);
    const names = ranked.length === 3 ? ['Off-peak', 'Standard', 'Peak'] : ranked.map(() => 'Standard');
    return Object.fromEntries(ranked.map((key, i) => [key, names[i]]));
}

/** Builds the 12 slots of one date with their live status and price. */
export function buildSlots({ date, today, bookings, slotHolds, pricing }) {
    const now = Date.now();
    const nowMins = nowDhakaMinutes();
    const weekend = isWeekendDate(date, pricing?.weekendDays);
    const defs = slotDefinitions(pricing);
    const dayPrices = defs.map(d => Number(weekend ? d.weekendPrice : d.weekdayPrice) || 0);
    const maxPrice = Math.max(...dayPrices);
    const hasPeak = maxPrice > Math.min(...dayPrices); // a flat price list has no peak rate
    return defs.map((def) => {
        const price = Number(weekend ? def.weekendPrice : def.weekdayPrice) || 0;
        const booking = (bookings || []).find(b => b.date === date && Number(b.slotNumber) === Number(def.slotNumber) && ACTIVE_STATUSES.includes(b.paymentStatus));
        const hold = (slotHolds || []).find(h => h.slotKey === `${date}_${def.slotNumber}` && h.expiresAt > now);
        const passed = date < today || (date === today && nowMins >= timeToMinutes(def.startTime));
        let status = 'available';
        if (booking && booking.paymentStatus === 'pending_payment') status = 'on_hold';
        else if (booking) status = 'booked';
        else if (passed) status = 'time_passed';
        else if (hold) status = 'on_hold';
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
            actualPrice: actualPriceOf(def, weekend), // 0 when there is no offer on this slot
            weekdayPrice: Number(def.weekdayPrice),
            weekendPrice: Number(def.weekendPrice),
            isPeak: hasPeak && price === maxPrice,
            status
        };
    });
}

/**
 * Live availability for the home page: today's date (Dhaka), the bookable window and a slot
 * builder that re-evaluates every minute and refreshes from the server every 60 seconds.
 */
export function useAvailability() {
    const { bookings, slotHolds, pricing, refreshBookings } = useArena();
    const today = useMemo(() => todayDhaka(), []);
    const windowDays = Number(pricing.bookingWindowDays) > 0 ? Number(pricing.bookingWindowDays) : 60;
    const lastDate = useMemo(() => addDaysIso(today, windowDays), [today, windowDays]);
    const [tick, setTick] = useState(0);
    const [secondsToRefresh, setSecondsToRefresh] = useState(60);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsToRefresh((prev) => {
                if (prev <= 1) {
                    refreshBookings().catch(() => { /* keep the last known grid */ });
                    return 60;
                }
                return prev - 1;
            });
            setTick(Math.floor(Date.now() / 60000));
        }, 1000);
        return () => clearInterval(timer);
    }, [refreshBookings]);

    const refreshNow = async () => {
        setRefreshing(true);
        try { await refreshBookings(); } finally { setRefreshing(false); setSecondsToRefresh(60); }
    };

    const slotsFor = useMemo(
        () => (date) => buildSlots({ date, today, bookings, slotHolds, pricing }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [today, bookings, slotHolds, pricing, tick]
    );
    const todaySlots = useMemo(() => slotsFor(today), [slotsFor, today]);

    return { today, lastDate, windowDays, slotsFor, todaySlots, secondsToRefresh, refreshing, refreshNow };
}

/** { iso, weekday: 'Sat', day: 14, month: 'Nov', isToday } */
export function dayParts(iso, today) {
    const d = parseLocalDate(iso);
    return {
        iso,
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        day: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        year: d.getFullYear(),
        isToday: iso === today
    };
}

/** "Sat, 14 Nov 2026" */
export function longDate(iso) {
    const p = dayParts(iso);
    return `${p.weekday}, ${p.day} ${p.month} ${p.year}`;
}

/** Arena opening / closing minutes derived from the first and last slot. */
export function openingWindow(pricing) {
    const defs = slotDefinitions(pricing);
    const open = timeToMinutes(defs[0].startTime);
    const end = timeToMinutes(defs[defs.length - 1].endTime);
    // the last slot may finish after midnight ("00:30"): count that as the same arena day
    const close = end <= open ? end + 1440 : end;
    return { open, close, openLabel: clockShort(defs[0].startTime), closeLabel: clockShort(defs[defs.length - 1].endTime) };
}
