/**
 * Date helpers.
 *
 * All `YYYY-MM-DD` strings are LOCAL calendar dates (never `new Date('YYYY-MM-DD')`, which is UTC
 * midnight and shifts the weekday). "Now" is always taken in Dhaka time: Bangladesh is a fixed
 * UTC+06:00 with no daylight saving, so the offset is applied by hand instead of relying on
 * `Intl` time-zone support (which varies between JS engines on Android).
 */
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const pad = (n) => String(n).padStart(2, '0');

export const isIsoDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));

/** `YYYY-MM-DD` -> local Date (midnight). Invalid input yields an invalid Date. */
export function parseLocalDate(iso) {
    if (!isIsoDate(iso)) return new Date(NaN);
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}

/** Local Date -> `YYYY-MM-DD`. */
export function toIsoLocal(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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
    return list.map(d => String(d).slice(0, 3)).join('/');
}

/** A Date whose UTC fields read as Dhaka wall-clock time for the given instant. */
function dhakaShifted(input) {
    const t = input instanceof Date ? input.getTime() : (input ? new Date(input).getTime() : Date.now());
    return new Date((Number.isNaN(t) ? Date.now() : t) + DHAKA_OFFSET_MS);
}

/** Dhaka calendar date (YYYY-MM-DD) for an ISO timestamp / Date (defaults to now). */
export function dhakaDate(input) {
    if (input === null || input === undefined || input === '') return '';
    const d = dhakaShifted(input);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Today's calendar date in Dhaka (YYYY-MM-DD). */
export const todayDhakaIso = () => dhakaDate(new Date());
export const todayDhaka = todayDhakaIso;

/** Minutes since midnight right now in Dhaka (0..1439). */
export function nowDhakaMinutes() {
    const d = dhakaShifted(new Date());
    return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/** "HH:MM" -> minutes since midnight. */
export function timeToMinutes(hhmm) {
    const [h, m] = String(hhmm || '0:0').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

/** "18:30" -> "06:30 PM" */
export function formatTime12(hhmm) {
    const mins = timeToMinutes(hhmm);
    const h24 = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${pad(h12)}:${pad(m)} ${h24 < 12 ? 'AM' : 'PM'}`;
}

/**
 * Human-friendly date for a `YYYY-MM-DD` string. Default: "Fri, 30 Oct 2026".
 * opts: { weekday: 'short'|'long'|false, day: true|false, month: 'short'|'long'|false, year: true|false }
 */
export function formatIsoDate(iso, opts = {}) {
    const d = parseLocalDate(String(iso || '').slice(0, 10));
    if (Number.isNaN(d.getTime())) return String(iso || '');
    const { weekday = 'short', day = true, month = 'short', year = true } = opts;
    const parts = [];
    if (day) parts.push(String(d.getDate()));
    if (month) parts.push(month === 'long' ? MONTH_NAMES[d.getMonth()] : SHORT_MONTHS[d.getMonth()]);
    if (year) parts.push(String(d.getFullYear()));
    const main = parts.join(' ');
    if (!weekday) return main;
    const wd = weekday === 'long' ? DAY_NAMES[d.getDay()] : SHORT_DAYS[d.getDay()];
    return main ? `${wd}, ${main}` : wd;
}

/** "5 Oct" */
export const formatShortDate = (iso) => formatIsoDate(iso, { weekday: false, year: false });

/** ISO timestamp -> "12 Nov 2026, 06:30 PM" in Dhaka time. */
export function formatDateTime(input) {
    if (!input) return '';
    const t = new Date(input).getTime();
    if (Number.isNaN(t)) return String(input);
    const d = dhakaShifted(input);
    const date = `${d.getUTCDate()} ${SHORT_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    return `${date}, ${formatTime12(`${d.getUTCHours()}:${d.getUTCMinutes()}`)}`;
}

/** Current month in Dhaka as `YYYY-MM`. */
export const currentMonthDhaka = () => todayDhakaIso().slice(0, 7);

/** `YYYY-MM` (or `YYYY-MM-DD`) -> "October 2026" / "Oct 2026" / "Oct". */
export function formatMonth(monthStr, opts = {}) {
    const m = /^(\d{4})-(\d{2})/.exec(String(monthStr || ''));
    if (!m) return String(monthStr || '');
    const { month = 'long', year = true } = opts;
    const idx = Number(m[2]) - 1;
    const name = month === 'short' ? SHORT_MONTHS[idx] : MONTH_NAMES[idx];
    if (!name) return String(monthStr);
    return year ? `${name} ${m[1]}` : name;
}

/** Shift a `YYYY-MM` string by `delta` months. */
export function shiftMonth(monthStr, delta) {
    const m = /^(\d{4})-(\d{2})/.exec(String(monthStr || '')) || /^(\d{4})-(\d{2})/.exec(currentMonthDhaka());
    const next = new Date(Number(m[1]), Number(m[2]) - 1 + delta, 1);
    return `${next.getFullYear()}-${pad(next.getMonth() + 1)}`;
}

/** The last `count` months ending at `endMonth` (inclusive), oldest first: [{ key, label, short }] */
export function buildMonthList(endMonth, count = 6) {
    const list = [];
    for (let i = count - 1; i >= 0; i--) {
        const key = shiftMonth(endMonth, -i);
        list.push({ key, label: formatMonth(key).toUpperCase(), short: formatMonth(key, { month: 'short', year: false }) });
    }
    return list;
}

/** Number of days in a `YYYY-MM` month. */
export function daysInMonth(monthStr) {
    const [y, m] = String(monthStr).split('-').map(Number);
    return new Date(y, m, 0).getDate();
}

/** Kick-off as a real instant (Dhaka +06:00) for a date + "HH:MM". */
export function kickoffDate(dateIso, startTime = '00:00') {
    const [y, mo, d] = String(dateIso).split('-').map(Number);
    const mins = timeToMinutes(startTime);
    return new Date(Date.UTC(y, (mo || 1) - 1, d || 1, Math.floor(mins / 60), mins % 60) - DHAKA_OFFSET_MS);
}

/** Bangladeshi mobile number check on a raw phone string. */
export const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;
export function isValidBdPhone(raw) {
    let p = String(raw || '').replace(/[^0-9]/g, '');
    if (p.startsWith('8801')) p = p.substring(2);
    return BD_PHONE_REGEX.test(p);
}
