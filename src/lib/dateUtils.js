/**
 * Date helpers that are safe to import from client components (no server-only imports).
 * All `YYYY-MM-DD` strings are treated as LOCAL calendar dates — never `new Date('YYYY-MM-DD')`,
 * which would be parsed as UTC midnight and shift the weekday near midnight.
 */
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAY = { Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' };

export const isIsoDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));

/** `YYYY-MM-DD` -> local Date (midnight). Invalid input yields an invalid Date. */
export function parseLocalDate(iso) {
    if (!isIsoDate(iso)) return new Date(NaN);
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}

/** Local Date -> `YYYY-MM-DD`. */
export function toIsoLocal(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Adds `n` days to a `YYYY-MM-DD` string (local arithmetic). */
export function addDaysIso(iso, n) {
    const d = parseLocalDate(iso);
    if (Number.isNaN(d.getTime())) return iso;
    d.setDate(d.getDate() + n);
    return toIsoLocal(d);
}

/** Long weekday name ("Friday") for a `YYYY-MM-DD` string. */
export function dayNameOf(iso) {
    const d = parseLocalDate(iso);
    return Number.isNaN(d.getTime()) ? '' : DAY_NAMES[d.getDay()];
}

/** True when the date falls on one of the configured weekend days (defaults to Fri/Sat). */
export function isWeekendDate(iso, weekendDays) {
    const list = Array.isArray(weekendDays) && weekendDays.length ? weekendDays : ['Friday', 'Saturday'];
    const name = dayNameOf(iso);
    return !!name && list.includes(name);
}

/** "Fri/Sat" style label for the configured weekend days. */
export function weekendDaysLabel(weekendDays) {
    const list = Array.isArray(weekendDays) && weekendDays.length ? weekendDays : ['Friday', 'Saturday'];
    return list.map(d => SHORT_DAY[d] || d.slice(0, 3)).join('/');
}

/** Today's calendar date in Dhaka (YYYY-MM-DD). */
export function todayDhakaIso() {
    try {
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    } catch {
        return toIsoLocal(new Date());
    }
}

/** Minutes since midnight right now in Dhaka (0..1439). */
export function nowDhakaMinutes() {
    try {
        const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
        const h = Number(parts.find(p => p.type === 'hour')?.value) % 24;
        const m = Number(parts.find(p => p.type === 'minute')?.value);
        return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
    } catch {
        const d = new Date();
        return d.getHours() * 60 + d.getMinutes();
    }
}

/** "HH:MM" -> minutes since midnight. */
export function timeToMinutes(hhmm) {
    const [h, m] = String(hhmm || '0:0').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

/** Human-friendly date, e.g. "Fri, 30 Oct 2026". */
export function formatIsoDate(iso, opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) {
    const d = parseLocalDate(iso);
    return Number.isNaN(d.getTime()) ? String(iso || '') : d.toLocaleDateString('en-GB', opts);
}

/** Bangladeshi mobile number check on a cleaned (digits-only, 01XXXXXXXXX) phone. */
export const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;
export function isValidBdPhone(raw) {
    let p = String(raw || '').replace(/[^0-9]/g, '');
    if (p.startsWith('8801')) p = p.substring(2);
    return BD_PHONE_REGEX.test(p);
}
