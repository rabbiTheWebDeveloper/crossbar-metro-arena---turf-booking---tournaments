/**
 * Customer list constants and pure helpers, shared by the server (models, API routes, lib/customers.js)
 * and the client (admin Customers page, customer panel). No server-only imports here.
 *
 * A "customer" is anyone the arena has dealt with, whether or not they have a login. They are added by
 * one of these ways (the `source`):
 *   signup          - created their own account on the website
 *   online_booking  - paid for a slot online
 *   walk_in         - booked at the counter / by phone (admin desk)
 *   fixed_slot      - weekly fixed-slot series created by the desk
 *   tournament      - registered a team for a tournament
 *   shop            - reserved something from the shop
 *   team            - captain of a registered team
 *   manual          - added individually by staff
 */

import { cleanPhone, isValidBdPhone } from './phone.js';

export const CUSTOMER_SOURCES = ['signup', 'online_booking', 'walk_in', 'fixed_slot', 'tournament', 'shop', 'team', 'manual'];

export const SOURCE_LABELS = {
    signup: 'Sign-up',
    online_booking: 'Online booking',
    walk_in: 'Counter booking',
    fixed_slot: 'Fixed slot',
    tournament: 'Tournament',
    shop: 'Shop order',
    team: 'Team captain',
    manual: 'Added by staff'
};

export const sourceLabel = (s) => SOURCE_LABELS[s] || String(s || '').replaceAll('_', ' ');

export const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];
export const CONTACT_CHANNELS = ['sms', 'whatsapp', 'email'];
export const CHANNEL_LABELS = { sms: 'SMS', whatsapp: 'WhatsApp', email: 'Email' };
export const REMINDER_HOURS = [2, 6, 12, 24, 48];
export const BOOKING_MATCH_TYPES = ['friendly', 'competitive', 'practice', 'corporate'];
export const BOOKING_PAYMENT_CHOICES = ['advance_500', 'full_payment'];

export const MAX_TAGS = 8;
export const MAX_TAG_LENGTH = 24;

/** What a customer gets until they change it. Used by the model defaults and the API. */
export const DEFAULT_CUSTOMER_SETTINGS = Object.freeze({
    preferredChannel: 'sms',
    notifications: Object.freeze({
        bookingConfirmations: true,
        bookingReminders: true,
        reminderHoursBefore: 24,
        matchResults: true,
        tournamentUpdates: true,
        offers: false
    }),
    bookingDefaults: Object.freeze({
        teamName: '',
        matchType: 'friendly',
        paymentChoice: 'advance_500'
    })
});

/** Placeholder address created at sign-up when the player gives none; it is not a real contact. */
export const isSyntheticEmail = (email) => /@bookcrossbar\.com$/i.test(String(email || '').trim());

/** A usable email address, or '' (blank, malformed or the sign-up placeholder). */
export function realEmail(email) {
    const e = String(email || '').trim().toLowerCase();
    if (!e || e.length > 120 || isSyntheticEmail(e)) return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : '';
}

/** Tidy a name typed by a person: one-space gaps, trimmed, capped. */
export const cleanName = (name) => String(name || '').trim().replace(/\s+/g, ' ').slice(0, 100);

/** Accept an array or a comma/newline separated string; lower-cased, de-duplicated, capped. */
export function normalizeTags(input) {
    const raw = Array.isArray(input) ? input : String(input || '').split(/[,\n]/);
    const out = [];
    for (const t of raw) {
        const tag = String(t || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, MAX_TAG_LENGTH);
        if (tag && !out.includes(tag)) out.push(tag);
        if (out.length >= MAX_TAGS) break;
    }
    return out;
}

/**
 * Validate the body of "add a customer" (partial: false) or "edit a customer" (partial: true).
 * Only known fields come back. On edit a field that is sent blank is cleared; a field that is not sent is left alone.
 * The mobile number is the customer's identity, so it is required on create and cannot change afterwards.
 * Returns { data } or { error }.
 */
export function parseCustomerInput(body, { partial = false, currentPhone = '' } = {}) {
    const b = body && typeof body === 'object' ? body : {};
    const data = {};

    if (!partial || b.name !== undefined) {
        const name = cleanName(b.name);
        if (name.length < 2) return { error: 'Name must be at least 2 characters.' };
        data.name = name;
    }

    if (!partial) {
        if (!isValidBdPhone(b.phone)) return { error: 'Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).' };
        data.phone = cleanPhone(b.phone);
    } else if (b.phone !== undefined && cleanPhone(b.phone) !== cleanPhone(currentPhone)) {
        return { error: 'The mobile number identifies the customer and cannot be changed. Add a new customer with the new number instead.' };
    }

    if (b.email !== undefined) {
        const raw = String(b.email || '').trim();
        if (raw && !realEmail(raw)) return { error: 'Enter a valid email address.' };
        data.email = raw ? realEmail(raw) : '';
    }

    if (b.playingPosition !== undefined) {
        const pos = String(b.playingPosition || '').trim();
        if (pos && !POSITIONS.includes(pos)) return { error: 'Choose GK, DEF, MID or FWD as the playing position.' };
        data.playingPosition = pos;
    }

    if (b.area !== undefined) {
        const area = String(b.area || '').trim().replace(/\s+/g, ' ');
        if (area.length > 80) return { error: 'Area must be at most 80 characters.' };
        data.area = area;
    }

    if (b.notes !== undefined) {
        const notes = String(b.notes || '').trim();
        if (notes.length > 1000) return { error: 'Notes must be at most 1000 characters.' };
        data.notes = notes;
    }

    if (b.tags !== undefined) data.tags = normalizeTags(b.tags);

    return { data };
}

const bool = (v, fallback) => (typeof v === 'boolean' ? v : fallback);

/**
 * Clean the settings a customer sends. Unknown keys are dropped and bad values keep what the customer
 * already had (`current`), so a partial or hand-edited request can never store junk.
 * Returns { value } or { error }.
 */
export function sanitizeCustomerSettings(input, current = DEFAULT_CUSTOMER_SETTINGS) {
    const src = input && typeof input === 'object' ? input : {};
    const cur = { ...DEFAULT_CUSTOMER_SETTINGS, ...(current || {}) };
    const curN = { ...DEFAULT_CUSTOMER_SETTINGS.notifications, ...(cur.notifications || {}) };
    const curB = { ...DEFAULT_CUSTOMER_SETTINGS.bookingDefaults, ...(cur.bookingDefaults || {}) };

    let preferredChannel = cur.preferredChannel;
    if (src.preferredChannel !== undefined) {
        if (!CONTACT_CHANNELS.includes(src.preferredChannel)) return { error: 'Choose SMS, WhatsApp or Email as your preferred contact.' };
        preferredChannel = src.preferredChannel;
    }

    const n = src.notifications && typeof src.notifications === 'object' ? src.notifications : {};
    let reminderHoursBefore = curN.reminderHoursBefore;
    if (n.reminderHoursBefore !== undefined) {
        const h = Number(n.reminderHoursBefore);
        if (!REMINDER_HOURS.includes(h)) return { error: `Reminders can be sent ${REMINDER_HOURS.join(', ')} hours before kick-off.` };
        reminderHoursBefore = h;
    }
    const notifications = {
        bookingConfirmations: bool(n.bookingConfirmations, curN.bookingConfirmations),
        bookingReminders: bool(n.bookingReminders, curN.bookingReminders),
        reminderHoursBefore,
        matchResults: bool(n.matchResults, curN.matchResults),
        tournamentUpdates: bool(n.tournamentUpdates, curN.tournamentUpdates),
        offers: bool(n.offers, curN.offers)
    };

    const b = src.bookingDefaults && typeof src.bookingDefaults === 'object' ? src.bookingDefaults : {};
    let teamName = curB.teamName;
    if (b.teamName !== undefined) {
        teamName = String(b.teamName || '').trim().replace(/\s+/g, ' ');
        if (teamName.length > 60) return { error: 'Default team name must be at most 60 characters.' };
    }
    let matchType = curB.matchType;
    if (b.matchType !== undefined) {
        if (!BOOKING_MATCH_TYPES.includes(b.matchType)) return { error: 'Choose a valid default match type.' };
        matchType = b.matchType;
    }
    let paymentChoice = curB.paymentChoice;
    if (b.paymentChoice !== undefined) {
        if (!BOOKING_PAYMENT_CHOICES.includes(b.paymentChoice)) return { error: 'Choose a valid default payment option.' };
        paymentChoice = b.paymentChoice;
    }

    return { value: { preferredChannel, notifications, bookingDefaults: { teamName, matchType, paymentChoice } } };
}

/**
 * Work out what to change on an existing customer when new facts arrive (a booking, a sign-up, an edit...).
 *
 * Staff-curated details are protected: a name, email, position or area that is already filled in is only
 * replaced when `overwrite` is true (the account owner or staff editing the record). Blank fields are always
 * filled in. The login link follows the newest account. Returns the Mongo update pieces; `null` when nothing
 * would change.
 *
 *   existing: the stored customer (plain object)
 *   facts:    { name, email, userId, playingPosition, area, source | sources[], at, overwrite }
 *   returns:  { set, addSources[], touch } or null
 */
export function planCustomerUpdate(existing, facts = {}) {
    const set = {};
    const overwrite = Boolean(facts.overwrite);
    const name = cleanName(facts.name);
    const email = realEmail(facts.email);
    const position = POSITIONS.includes(facts.playingPosition) ? facts.playingPosition : '';
    const area = String(facts.area || '').trim().slice(0, 80);
    const userId = String(facts.userId || '').trim();

    const hasName = existing.name && existing.name !== existing.phone;
    if (name && name !== existing.name && (overwrite || !hasName)) set.name = name;
    if (email && email !== existing.email && (overwrite || !existing.email)) set.email = email;
    if (position && position !== existing.playingPosition && (overwrite || !existing.playingPosition)) set.playingPosition = position;
    if (area && area !== existing.area && (overwrite || !existing.area)) set.area = area;
    if (userId && userId !== existing.userId) set.userId = userId;

    const known = existing.sources || [];
    const addSources = [...new Set([...(Array.isArray(facts.sources) ? facts.sources : []), facts.source])]
        .filter(s => CUSTOMER_SOURCES.includes(s) && !known.includes(s));

    const at = facts.at ? new Date(facts.at) : null;
    const validAt = at && !Number.isNaN(at.getTime()) ? at : null;
    const touch = validAt && (!existing.lastActivityAt || new Date(existing.lastActivityAt) < validAt) ? validAt : null;

    if (!Object.keys(set).length && !addSources.length && !touch) return null;
    return { set, addSources, touch };
}

/** Turn a plan from planCustomerUpdate into a Mongo update document. */
export function updateFromPlan(plan) {
    const update = {};
    if (Object.keys(plan.set).length) update.$set = plan.set;
    if (plan.addSources.length) update.$addToSet = { sources: { $each: plan.addSources } };
    if (plan.touch) update.$max = { lastActivityAt: plan.touch };
    return update;
}
