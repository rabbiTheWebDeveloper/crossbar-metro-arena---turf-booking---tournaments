import { toIsoLocal, parseLocalDate } from '@/lib/dateUtils';

/** Weekday chips in the order a Bangladeshi week is usually read (0 = Sunday, as the API expects). */
export const WEEKDAYS = [
    { value: 6, label: 'Sat' },
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' }
];

export const RANGE_PRESETS = [
    { label: '1 month', months: 1 },
    { label: '3 months', months: 3 },
    { label: '6 months', months: 6 },
    { label: 'Full year', months: 12 }
];

export const PRICE_MODES = [
    { value: 'auto', label: 'Use slot pricing (weekday / weekend)' },
    { value: 'custom', label: 'Fixed package price per slot' }
];

/** Methods accepted by POST /api/bookings/bulk. */
export const SERIES_PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash (counter)' },
    { value: 'bkash', label: 'bKash' },
    { value: 'nagad', label: 'Nagad' },
    { value: 'rocket', label: 'Rocket' },
    { value: 'card', label: 'Card / POS' }
];

/** Inclusive end date `months` after `iso`: 1 month from 1 Nov = 30 Nov. */
export function addMonths(iso, months) {
    const start = parseLocalDate(iso);
    if (Number.isNaN(start.getTime())) return iso;
    const date = new Date(start.getFullYear(), start.getMonth() + months, start.getDate());
    date.setDate(date.getDate() - 1);
    return toIsoLocal(date);
}
