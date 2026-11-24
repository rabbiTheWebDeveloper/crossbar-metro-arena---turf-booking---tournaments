import { Customer } from '@/models/customer-model';
import { CustomerSetting } from '@/models/customer-setting-model';
import { Booking } from '@/models/booking-model';
import { TournamentRegistration } from '@/models/tournament-registration-model';
import { ShopReservation } from '@/models/shop-reservation-model';
import { Team } from '@/models/team-model';
import { User } from '@/models/user-model';
import { cleanPhone, isValidBdPhone } from './phone';
import { escapeRegex } from './apiAuth';
import {
    CUSTOMER_SOURCES, POSITIONS, cleanName, realEmail, planCustomerUpdate, updateFromPlan
} from './customerMeta';

/**
 * Server side of the customer list. Every flow that learns a name + mobile number calls trackCustomer(), so the
 * list fills itself: sign-up, online booking (once paid), counter booking, fixed slots, tournament registration,
 * shop orders. Staff can also add people one by one, and syncCustomersFromAllModels() backfills everything that
 * existed before the customer list did.
 */

/* ------------------------------------------------------------------ capture */

const validDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Create the customer for this mobile number, or enrich the one that exists (see planCustomerUpdate for what is
 * and is not overwritten). Returns { customer, created } or null when the number is not a valid BD mobile.
 *
 *   facts: { name, phone, email, userId, playingPosition, area, source, at, overwrite }
 */
export async function upsertCustomer(facts = {}) {
    const phone = cleanPhone(facts.phone);
    if (!isValidBdPhone(phone)) return null;

    let doc = await Customer.findOne({ phone });
    if (!doc) {
        const source = CUSTOMER_SOURCES.includes(facts.source) ? facts.source : 'manual';
        try {
            doc = await Customer.create({
                name: cleanName(facts.name) || phone,
                phone,
                email: realEmail(facts.email),
                playingPosition: POSITIONS.includes(facts.playingPosition) ? facts.playingPosition : '',
                area: String(facts.area || '').trim().slice(0, 80),
                userId: String(facts.userId || '').trim(),
                source,
                sources: [source],
                lastActivityAt: validDate(facts.at) || new Date()
            });
            return { customer: doc, created: true };
        } catch (err) {
            if (err?.code !== 11000) throw err;
            // Someone saved the same number a moment ago: carry on with that record
            doc = await Customer.findOne({ phone });
            if (!doc) throw err;
        }
    }

    const plan = planCustomerUpdate(doc.toObject(), facts);
    if (plan) doc = await Customer.findOneAndUpdate({ _id: doc._id }, updateFromPlan(plan), { returnDocument: 'after' });
    return { customer: doc, created: false };
}

/**
 * Same as upsertCustomer but never throws: recording a customer must not break the booking, payment or
 * registration that triggered it. Failures are logged and the run-anytime sync catches up later.
 */
export async function trackCustomer(facts) {
    try {
        const result = await upsertCustomer(facts);
        return result ? result.customer : null;
    } catch (err) {
        console.warn('[customers] could not record customer:', err?.message || err);
        return null;
    }
}

/**
 * Keep the customer record in step with a player's login account (sign-up, profile edit, admin edit).
 * The account owner's own details win over what an old booking said. A changed mobile number moves the
 * customer record along with the account.
 */
export async function syncCustomerFromUser(user, { previousPhone = '', source = 'signup' } = {}) {
    if (!user || user.role !== 'player') return null;
    const phone = cleanPhone(user.phone);
    const previous = cleanPhone(previousPhone);
    const userId = String(user._id || user.id || user.userId || '');
    try {
        if (previous && previous !== phone && userId) {
            // Duplicate key (the new number already has a record) is fine: that record gets linked below
            await Customer.updateOne({ phone: previous, userId }, { $set: { phone } }).catch(() => null);
        }
    } catch { /* handled above */ }
    return trackCustomer({ name: user.name, phone, email: user.email, userId, playingPosition: user.playingPosition, source, overwrite: true });
}

/** The signed-in player's customer record, created on first use (accounts older than the customer list). */
export async function ensureCustomerForUser(user) {
    return trackCustomer({
        name: user.name,
        phone: user.phone,
        email: user.email,
        userId: String(user.userId || user.id || ''),
        playingPosition: user.playingPosition,
        source: 'signup'
    });
}

/* ----------------------------------------------------------------- settings */

export const getCustomerSettings = (customerId) => CustomerSetting.forCustomer(customerId);

export async function saveCustomerSettings(customerId, value) {
    const doc = await CustomerSetting.findOneAndUpdate(
        { customerId: String(customerId) },
        { $set: value },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
    );
    return doc.toJSON();
}

/* -------------------------------------------------------------------- stats */

const isCancelled = { $eq: ['$paymentStatus', 'cancelled'] };
// Money actually collected for a booking (mirrors collectedAmount() in ArenaContext)
const collectedExpr = {
    $switch: {
        branches: [
            { case: { $eq: ['$paymentStatus', 'paid_full'] }, then: '$totalPrice' },
            { case: { $in: ['$paymentStatus', ['paid_advance', 'needs_refund']] }, then: '$advanceAmount' }
        ],
        default: 0
    }
};

/** Activity per mobile number: Map(phone -> { bookings, cancelled, paid, lastBookingDate, tournaments, orders, orderTotal }). */
export async function customerStats(phones) {
    const list = [...new Set((phones || []).filter(Boolean))];
    const out = new Map(list.map(p => [p, { bookings: 0, cancelled: 0, paid: 0, lastBookingDate: '', tournaments: 0, orders: 0, orderTotal: 0 }]));
    if (!list.length) return out;

    const [bookings, registrations, orders] = await Promise.all([
        Booking.aggregate([
            { $match: { captainPhone: { $in: list }, paymentStatus: { $ne: 'pending_payment' } } },
            { $group: {
                _id: '$captainPhone',
                bookings: { $sum: { $cond: [isCancelled, 0, 1] } },
                cancelled: { $sum: { $cond: [isCancelled, 1, 0] } },
                paid: { $sum: collectedExpr },
                lastBookingDate: { $max: { $cond: [isCancelled, null, '$date'] } }
            } }
        ]),
        TournamentRegistration.aggregate([
            { $match: { captainPhone: { $in: list }, status: { $ne: 'rejected' } } },
            { $group: { _id: '$captainPhone', count: { $sum: 1 } } }
        ]),
        ShopReservation.aggregate([
            { $match: { customerPhone: { $in: list }, status: { $ne: 'cancelled' } } },
            { $group: { _id: '$customerPhone', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }
        ])
    ]);
    bookings.forEach(b => Object.assign(out.get(b._id) || {}, { bookings: b.bookings, cancelled: b.cancelled, paid: b.paid, lastBookingDate: b.lastBookingDate || '' }));
    registrations.forEach(r => { const s = out.get(r._id); if (s) s.tournaments = r.count; });
    orders.forEach(o => { const s = out.get(o._id); if (s) { s.orders = o.count; s.orderTotal = o.total; } });
    return out;
}

const withId = (doc) => ({ ...doc, id: String(doc._id), _id: undefined, __v: undefined });

/** Recent bookings, tournament entries and shop orders for one mobile number (the customer detail view). */
export async function customerHistory(phone) {
    const [bookings, registrations, orders] = await Promise.all([
        Booking.find({ captainPhone: phone, paymentStatus: { $ne: 'pending_payment' } })
            .sort({ date: -1, slotNumber: 1 }).limit(25)
            .select('bookingCode date displayTime slotNumber teamName paymentStatus totalPrice advanceAmount dueAmount isWalkIn isRecurring played').lean(),
        TournamentRegistration.find({ captainPhone: phone })
            .sort({ createdAt: -1 }).limit(10)
            .select('tournamentTitle teamName status amount createdAt').lean(),
        ShopReservation.find({ customerPhone: phone })
            .sort({ createdAt: -1 }).limit(10)
            .select('reservationCode status totalAmount pickupDate createdAt').lean()
    ]);
    return { bookings: bookings.map(withId), registrations: registrations.map(withId), orders: orders.map(withId) };
}

/* --------------------------------------------------------------------- list */

/**
 * Page of customers for the admin list, each with its activity stats.
 *   q (name, mobile, email, area, tag), source, account ('with' | 'without'), page, limit
 */
export async function listCustomers({ q = '', source = '', account = '', page = 1, limit = 25 } = {}) {
    const query = {};
    const search = String(q || '').trim().slice(0, 60);
    if (search) {
        const re = { $regex: escapeRegex(search), $options: 'i' };
        query.$or = [{ name: re }, { phone: re }, { email: re }, { area: re }, { tags: re }];
    }
    if (CUSTOMER_SOURCES.includes(source)) query.sources = source;
    if (account === 'with') query.userId = { $ne: '' };
    if (account === 'without') query.userId = '';

    const size = Math.min(100, Math.max(1, Number(limit) || 25));
    const total = await Customer.countDocuments(query);
    const pages = Math.max(1, Math.ceil(total / size));
    const current = Math.min(pages, Math.max(1, Number(page) || 1));
    const rows = await Customer.find(query).sort({ lastActivityAt: -1, createdAt: -1 }).skip((current - 1) * size).limit(size);

    const stats = await customerStats(rows.map(r => r.phone));
    const customers = rows.map(r => ({ ...r.toJSON(), stats: stats.get(r.phone) }));
    return { customers, total, page: current, pages, limit: size };
}

/** Headline numbers for the top of the admin list (whole collection, not just the current page). */
export async function customerOverview() {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [total, withAccount, thisMonth, bySource] = await Promise.all([
        Customer.countDocuments({}),
        Customer.countDocuments({ userId: { $ne: '' } }),
        Customer.countDocuments({ createdAt: { $gte: monthStart } }),
        Customer.aggregate([{ $unwind: '$sources' }, { $group: { _id: '$sources', count: { $sum: 1 } } }])
    ]);
    return { total, withAccount, thisMonth, bySource: Object.fromEntries(bySource.map(s => [s._id, s.count])) };
}

/* --------------------------------------------------------------------- sync */

const FIRST_SEEN = { $ifNull: ['$createdAt', { $toDate: '$_id' }] };

/**
 * Backfill the customer list from every record that carries a name and mobile number: login accounts, bookings
 * (online, counter and fixed slots), tournament registrations, shop orders and team captains. Safe to run any
 * number of times: existing customers only get blank details filled in and new ways added, never overwritten.
 */
export async function syncCustomersFromAllModels() {
    const seen = new Map(); // phone -> { name, nameAt, accountName, email, userId, playingPosition, bySource }
    const scanned = { accounts: 0, bookings: 0, registrations: 0, orders: 0, teams: 0 };

    const note = (rawPhone, { name, email, userId, playingPosition, source, first, last, account = false }) => {
        const phone = cleanPhone(rawPhone);
        if (!isValidBdPhone(phone)) return;
        let f = seen.get(phone);
        if (!f) { f = { name: '', nameAt: 0, accountName: '', email: '', userId: '', playingPosition: '', bySource: {} }; seen.set(phone, f); }
        const firstAt = first ? new Date(first) : new Date();
        const lastAt = last ? new Date(last) : firstAt;
        const cleaned = cleanName(name);
        if (cleaned) {
            if (account) f.accountName = cleaned;
            else if (lastAt.getTime() >= f.nameAt) { f.name = cleaned; f.nameAt = lastAt.getTime(); }
        }
        if (!f.email && realEmail(email)) f.email = realEmail(email);
        if (userId) f.userId = String(userId);
        if (POSITIONS.includes(playingPosition)) f.playingPosition = playingPosition;
        const s = f.bySource[source] || { first: firstAt, last: lastAt };
        if (firstAt < s.first) s.first = firstAt;
        if (lastAt > s.last) s.last = lastAt;
        f.bySource[source] = s;
    };

    // Login accounts (players only: admin, staff and investor logins are not customers)
    const users = await User.find({ role: 'player' }).select('name phone email playingPosition createdAt').lean();
    scanned.accounts = users.length;
    users.forEach(u => note(u.phone, { name: u.name, email: u.email, userId: String(u._id), playingPosition: u.playingPosition, source: 'signup', first: u.createdAt, account: true }));

    // Bookings: unpaid payment holds and failed gateway attempts are not customers yet
    const bookings = await Booking.aggregate([
        { $match: { paymentStatus: { $ne: 'pending_payment' }, notes: { $not: /^Gateway init failed/ } } },
        { $addFields: { seenAt: FIRST_SEEN } },
        { $sort: { seenAt: 1 } },
        { $group: {
            _id: { phone: '$captainPhone', kind: { $cond: ['$isRecurring', 'fixed_slot', { $cond: ['$isWalkIn', 'walk_in', 'online_booking'] }] } },
            name: { $last: '$captainName' }, first: { $min: '$seenAt' }, last: { $max: '$seenAt' }, count: { $sum: 1 }
        } }
    ]).allowDiskUse(true);
    // The login link is never taken from bookings or orders: the account on a booking may belong to someone
    // booking for a friend. Only a player's own account (above) links to the customer with that number.
    bookings.forEach(b => { scanned.bookings += b.count; note(b._id.phone, { name: b.name, source: b._id.kind, first: b.first, last: b.last }); });

    const registrations = await TournamentRegistration.aggregate([
        { $addFields: { seenAt: FIRST_SEEN } },
        { $sort: { seenAt: 1 } },
        { $group: { _id: '$captainPhone', name: { $last: '$captainName' }, email: { $last: '$captainEmail' }, first: { $min: '$seenAt' }, last: { $max: '$seenAt' }, count: { $sum: 1 } } }
    ]).allowDiskUse(true);
    registrations.forEach(r => { scanned.registrations += r.count; note(r._id, { name: r.name, email: r.email, source: 'tournament', first: r.first, last: r.last }); });

    const orders = await ShopReservation.aggregate([
        { $addFields: { seenAt: FIRST_SEEN } },
        { $sort: { seenAt: 1 } },
        { $group: { _id: '$customerPhone', name: { $last: '$customerName' }, first: { $min: '$seenAt' }, last: { $max: '$seenAt' }, count: { $sum: 1 } } }
    ]).allowDiskUse(true);
    orders.forEach(o => { scanned.orders += o.count; note(o._id, { name: o.name, source: 'shop', first: o.first, last: o.last }); });

    const teams = await Team.aggregate([
        { $addFields: { seenAt: FIRST_SEEN } },
        { $sort: { seenAt: 1 } },
        { $group: { _id: '$captainPhone', name: { $last: '$captainName' }, first: { $min: '$seenAt' }, last: { $max: '$seenAt' }, count: { $sum: 1 } } }
    ]).allowDiskUse(true);
    teams.forEach(t => { scanned.teams += t.count; note(t._id, { name: t.name, source: 'team', first: t.first, last: t.last }); });

    // Compare with what is already in the list
    const phones = [...seen.keys()];
    const existing = new Map();
    for (let i = 0; i < phones.length; i += 1000) {
        const rows = await Customer.find({ phone: { $in: phones.slice(i, i + 1000) } }).lean();
        rows.forEach(r => existing.set(r.phone, r));
    }

    const ops = [];
    let toCreate = 0;
    let toUpdate = 0;
    for (const [phone, f] of seen) {
        const sources = Object.keys(f.bySource);
        const lastAt = sources.reduce((max, s) => (f.bySource[s].last > max ? f.bySource[s].last : max), new Date(0));
        const name = f.accountName || f.name;
        const current = existing.get(phone);
        if (!current) {
            const firstSource = sources.reduce((a, b) => (f.bySource[b].first < f.bySource[a].first ? b : a));
            ops.push({ insertOne: { document: {
                name: name || phone, phone, email: f.email, playingPosition: f.playingPosition, userId: f.userId,
                source: firstSource, sources, lastActivityAt: lastAt
            } } });
            toCreate += 1;
            continue;
        }
        const plan = planCustomerUpdate(current, {
            name, email: f.email, userId: f.userId, playingPosition: f.playingPosition, sources, at: lastAt
        });
        if (plan) {
            ops.push({ updateOne: { filter: { _id: current._id }, update: updateFromPlan(plan) } });
            toUpdate += 1;
        }
    }

    let skipped = 0;
    for (let i = 0; i < ops.length; i += 500) {
        try {
            await Customer.bulkWrite(ops.slice(i, i + 500), { ordered: false });
        } catch (err) {
            // A number saved by someone else while this ran is a duplicate, not a failure
            const errors = err?.writeErrors || [];
            if (!errors.length || errors.some(w => (w.err?.code ?? w.code) !== 11000)) throw err;
            skipped += errors.length;
        }
    }

    return {
        scanned,
        found: phones.length,
        created: Math.max(0, toCreate - skipped),
        updated: toUpdate,
        unchanged: phones.length - toCreate - toUpdate
    };
}
