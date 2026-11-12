import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { isWeekendDate, formatTime12 } from '@/lib/dateUtils';

/** The 12 slot definitions with the admin's prices (falls back to the built-in schedule). */
export const getSlotList = (pricing) => (pricing?.slotPrices?.length === 12 ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION);

/**
 * The 12 slots of one play date: each definition plus its active (non-cancelled) booking and the
 * list price for that day (weekend rule applied).
 */
export function buildDaySlots(bookings, pricing, date) {
    const weekend = isWeekendDate(date, pricing?.weekendDays);
    return getSlotList(pricing).map(def => {
        const booking = bookings.find(b => b.date === date && Number(b.slotNumber) === Number(def.slotNumber) && b.paymentStatus !== 'cancelled');
        return { ...def, booking, price: Number(weekend ? def.weekendPrice : def.weekdayPrice) || 0 };
    });
}

/** "18:00" -> "06:00 PM" */
export const slotStartLabel = (startTime) => formatTime12(startTime);
