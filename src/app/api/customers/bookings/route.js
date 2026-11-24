import { NextResponse } from 'next/server';
import { requirePermission, cleanPhone } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models/booking-model';
import { Customer } from '@/models/customer-model';
import { User } from '@/models/user-model';
import { errorResponse } from '@/lib/validate';
import { todayDhaka, isIsoDate } from '@/lib/booking';

const PLACEHOLDER_EMAIL_RE = /^01[3-9]\d{8}@bookcrossbar\.com$/i;
const cleanRealEmail = (raw) => {
    const s = String(raw || '').trim().toLowerCase();
    if (!s || PLACEHOLDER_EMAIL_RE.test(s)) return '';
    return s;
};

function collectedForBooking(b) {
    if (b.paymentStatus === 'paid_full') return Number(b.totalPrice) || 0;
    if (b.paymentStatus === 'paid_advance' || b.paymentStatus === 'needs_refund') return Number(b.advanceAmount) || 0;
    return 0;
}

function dueForBooking(b) {
    if (b.paymentStatus === 'cancelled' || b.paymentStatus === 'paid_full' || b.paymentStatus === 'needs_refund') return 0;
    const total = Number(b.totalPrice) || 0;
    const paid = collectedForBooking(b);
    return Math.max(0, total - paid);
}

function bookingChannel(b) {
    if (b.isRecurring) return 'recurring';
    if (b.isWalkIn) return 'walk_in';
    return 'online';
}

/**
 * GET /api/customers/bookings  (admin, or staff with "players" or "bookings" permission)
 *
 * Returns a unified customer list combining ALL Booking records (grouped per customer mobile number,
 * supporting multiple bookings per customer across multiple customers) enriched with Customer & User
 * account metadata.
 *
 * Query params:
 *   q            - search name, mobile, email, area, tag, team name, or booking code
 *   segment      - 'booked' (default) | 'multiple' (2+ bookings) | 'single' (1) | 'due' | 'all' (incl. 0 bookings)
 *   bookingType  - '' | 'online' | 'walk_in' | 'recurring'
 *   sort         - 'recent' (default) | 'bookings_desc' | 'paid_desc' | 'due_desc' | 'name_asc'
 *   from, to     - optional YYYY-MM-DD date range for bookings
 *   page, limit  - pagination (default page=1, limit=25, max 100)
 */
export async function GET(request) {
    try {
        const { denied } = await requirePermission(request, ['players', 'bookings']);
        if (denied) return denied;

        await connectToDatabase();

        const sp = new URL(request.url).searchParams;
        const q = String(sp.get('q') || '').trim().toLowerCase().slice(0, 80);
        const segment = String(sp.get('segment') || 'booked').trim();
        const bookingType = String(sp.get('bookingType') || '').trim();
        const sort = String(sp.get('sort') || 'recent').trim();
        const from = isIsoDate(sp.get('from')) ? sp.get('from') : '';
        const to = isIsoDate(sp.get('to')) ? sp.get('to') : '';
        const limit = Math.min(100, Math.max(1, Number(sp.get('limit')) || 25));
        const requestedPage = Math.max(1, Number(sp.get('page')) || 1);

        const bookingQuery = {
            paymentStatus: { $ne: 'pending_payment' },
            notes: { $not: /^Gateway init failed/ }
        };
        if (from || to) {
            bookingQuery.date = {};
            if (from) bookingQuery.date.$gte = from;
            if (to) bookingQuery.date.$lte = to;
        }
        if (bookingType === 'recurring') bookingQuery.isRecurring = true;
        else if (bookingType === 'walk_in') { bookingQuery.isWalkIn = true; bookingQuery.isRecurring = { $ne: true }; }
        else if (bookingType === 'online') { bookingQuery.isWalkIn = { $ne: true }; bookingQuery.isRecurring = { $ne: true }; }

        const [rawBookings, rawCustomers, rawPlayerUsers] = await Promise.all([
            Booking.find(bookingQuery)
                .sort({ date: -1, slotNumber: 1, createdAt: -1 })
                .select(
                    'bookingCode date slotNumber startTime endTime displayTime captainName captainPhone userId teamName playerCount matchType totalPrice advanceAmount dueAmount paymentMethod paymentStatus isWalkIn isRecurring seriesLabel played notes createdAt'
                )
                .lean(),
            Customer.find({})
                .select('name phone email area tags notes source sources userId lastActivityAt createdAt')
                .lean(),
            User.find({ role: 'player' })
                .select('name phone email disabled')
                .lean()
        ]);

        const today = todayDhaka();
        const userByPhone = new Map();
        const userById = new Map();
        for (const u of rawPlayerUsers) {
            const p = cleanPhone(u.phone);
            const info = { id: String(u._id), name: u.name || '', email: cleanRealEmail(u.email), disabled: Boolean(u.disabled) };
            if (p) userByPhone.set(p, info);
            userById.set(info.id, info);
        }

        // Build unified customer map keyed by normalized phone (fallback to raw phone if non-standard)
        const byPhone = new Map();

        const getOrCreateEntry = (rawPhone) => {
            const cleaned = cleanPhone(rawPhone);
            const key = cleaned || String(rawPhone || '').trim();
            if (!key) return null;
            let entry = byPhone.get(key);
            if (!entry) {
                entry = {
                    key,
                    customerId: '',
                    name: '',
                    phone: key,
                    email: '',
                    area: '',
                    tags: [],
                    notes: '',
                    source: '',
                    sources: [],
                    userId: '',
                    hasLogin: false,
                    accountDisabled: false,
                    teamsSet: new Set(),
                    bookings: [],
                    stats: {
                        totalBookings: 0,      // non-cancelled bookings
                        allBookingsCount: 0,   // including cancelled
                        upcomingCount: 0,
                        playedCount: 0,
                        cancelledCount: 0,
                        onlineCount: 0,
                        walkInCount: 0,
                        recurringCount: 0,
                        totalBilled: 0,
                        totalPaid: 0,
                        totalDue: 0,
                        firstBookingDate: '',
                        lastBookingDate: ''
                    },
                    lastActivityAt: null
                };
                byPhone.set(key, entry);
            }
            return entry;
        };

        // 1. Seed from Customer collection
        for (const c of rawCustomers) {
            const entry = getOrCreateEntry(c.phone);
            if (!entry) continue;
            entry.customerId = String(c._id);
            entry.name = c.name || entry.name;
            entry.email = cleanRealEmail(c.email) || entry.email;
            entry.area = c.area || '';
            entry.tags = Array.isArray(c.tags) ? c.tags : [];
            entry.notes = c.notes || '';
            entry.source = c.source || '';
            entry.sources = Array.isArray(c.sources) && c.sources.length ? c.sources : (c.source ? [c.source] : []);
            entry.userId = c.userId ? String(c.userId) : '';
            entry.lastActivityAt = c.lastActivityAt || c.createdAt || null;

            const u = (entry.userId && userById.get(entry.userId)) || userByPhone.get(entry.phone);
            if (u) {
                entry.userId = entry.userId || u.id;
                entry.hasLogin = true;
                entry.accountDisabled = u.disabled;
                if (!entry.email && u.email) entry.email = u.email;
            }
        }

        // 2. Group all bookings onto their respective customer
        for (const b of rawBookings) {
            const entry = getOrCreateEntry(b.captainPhone);
            if (!entry) continue;

            if (!entry.name && b.captainName) entry.name = String(b.captainName).trim();
            if (!entry.hasLogin) {
                const u = userByPhone.get(entry.phone);
                if (u) {
                    entry.userId = entry.userId || u.id;
                    entry.hasLogin = true;
                    entry.accountDisabled = u.disabled;
                    if (!entry.email && u.email) entry.email = u.email;
                }
            }
            if (b.teamName) entry.teamsSet.add(String(b.teamName).trim());

            const cancelled = b.paymentStatus === 'cancelled';
            const collected = collectedForBooking(b);
            const due = dueForBooking(b);
            const channel = bookingChannel(b);
            const st = entry.stats;

            st.allBookingsCount += 1;
            if (cancelled) {
                st.cancelledCount += 1;
            } else {
                st.totalBookings += 1;
                if (b.date >= today) st.upcomingCount += 1;
                if (b.played) st.playedCount += 1;
                if (channel === 'recurring') st.recurringCount += 1;
                else if (channel === 'walk_in') st.walkInCount += 1;
                else st.onlineCount += 1;
                st.totalBilled += Number(b.totalPrice) || 0;
                st.totalPaid += collected;
                st.totalDue += due;
            }

            if (b.date) {
                if (!st.lastBookingDate || b.date > st.lastBookingDate) st.lastBookingDate = b.date;
                if (!st.firstBookingDate || b.date < st.firstBookingDate) st.firstBookingDate = b.date;
            }

            entry.bookings.push({
                id: String(b._id),
                bookingCode: b.bookingCode || '',
                date: b.date || '',
                slotNumber: b.slotNumber,
                displayTime: b.displayTime || `${b.startTime || ''} – ${b.endTime || ''}`,
                captainName: b.captainName || '',
                teamName: b.teamName || '',
                matchType: b.matchType || 'friendly',
                totalPrice: Number(b.totalPrice) || 0,
                advanceAmount: Number(b.advanceAmount) || 0,
                collectedAmount: collected,
                dueAmount: due,
                paymentMethod: b.paymentMethod || '',
                paymentStatus: b.paymentStatus || '',
                channel,
                isWalkIn: Boolean(b.isWalkIn),
                isRecurring: Boolean(b.isRecurring),
                seriesLabel: b.seriesLabel || '',
                played: Boolean(b.played),
                notes: b.notes || '',
                createdAt: b.createdAt || null
            });
        }

        const allEntries = Array.from(byPhone.values()).map(entry => ({
            id: entry.customerId || `phone:${entry.phone}`,
            customerId: entry.customerId,
            name: entry.name || entry.phone,
            phone: entry.phone,
            email: entry.email,
            area: entry.area,
            tags: entry.tags,
            notes: entry.notes,
            source: entry.source,
            sources: entry.sources,
            hasLogin: entry.hasLogin,
            accountDisabled: entry.accountDisabled,
            teams: Array.from(entry.teamsSet),
            stats: entry.stats,
            bookings: entry.bookings,
            lastActivityAt: entry.lastActivityAt
        }));

        // Compute overview numbers before segment / search filtering
        const overview = {
            totalCustomers: allEntries.length,
            bookedCustomers: 0,
            repeatCustomers: 0,
            singleBookingCustomers: 0,
            customersWithDue: 0,
            totalBookings: 0,
            totalAllBookings: 0,
            totalRevenueCollected: 0,
            totalDueAmount: 0
        };
        for (const c of allEntries) {
            if (c.stats.allBookingsCount > 0) overview.bookedCustomers += 1;
            if (c.stats.totalBookings >= 2 || c.stats.allBookingsCount >= 2) overview.repeatCustomers += 1;
            if (c.stats.allBookingsCount === 1) overview.singleBookingCustomers += 1;
            if (c.stats.totalDue > 0) overview.customersWithDue += 1;
            overview.totalBookings += c.stats.totalBookings;
            overview.totalAllBookings += c.stats.allBookingsCount;
            overview.totalRevenueCollected += c.stats.totalPaid;
            overview.totalDueAmount += c.stats.totalDue;
        }

        // Apply segment filter
        let filtered = allEntries.filter(c => {
            if (segment === 'all') return true;
            if (segment === 'multiple') return c.stats.allBookingsCount >= 2;
            if (segment === 'single') return c.stats.allBookingsCount === 1;
            if (segment === 'due') return c.stats.totalDue > 0;
            // default 'booked': every customer with at least 1 booking
            return c.stats.allBookingsCount > 0;
        });

        // Apply search query across customer fields, teams, and booking codes
        if (q) {
            const qDigits = q.replace(/[^0-9]/g, '');
            filtered = filtered.filter(c => {
                if ((c.name || '').toLowerCase().includes(q)) return true;
                if ((c.phone || '').includes(q) || (qDigits && (c.phone || '').includes(qDigits))) return true;
                if ((c.email || '').toLowerCase().includes(q)) return true;
                if ((c.area || '').toLowerCase().includes(q)) return true;
                if ((c.tags || []).some(t => String(t).toLowerCase().includes(q))) return true;
                if ((c.teams || []).some(t => t.toLowerCase().includes(q))) return true;
                if ((c.bookings || []).some(b =>
                    (b.bookingCode || '').toLowerCase().includes(q)
                    || (b.teamName || '').toLowerCase().includes(q)
                    || (b.captainName || '').toLowerCase().includes(q)
                )) return true;
                return false;
            });
        }

        // Sort customers
        filtered.sort((a, b) => {
            if (sort === 'bookings_desc') {
                return (b.stats.totalBookings - a.stats.totalBookings)
                    || (b.stats.allBookingsCount - a.stats.allBookingsCount)
                    || String(b.stats.lastBookingDate || '').localeCompare(String(a.stats.lastBookingDate || ''));
            }
            if (sort === 'paid_desc') {
                return (b.stats.totalPaid - a.stats.totalPaid) || (b.stats.totalBookings - a.stats.totalBookings);
            }
            if (sort === 'due_desc') {
                return (b.stats.totalDue - a.stats.totalDue) || (b.stats.totalBookings - a.stats.totalBookings);
            }
            if (sort === 'name_asc') {
                return String(a.name || '').localeCompare(String(b.name || ''));
            }
            // Default 'recent': latest booking date first, then most bookings, then last activity
            const dateCmp = String(b.stats.lastBookingDate || '').localeCompare(String(a.stats.lastBookingDate || ''));
            if (dateCmp !== 0) return dateCmp;
            if (b.stats.allBookingsCount !== a.stats.allBookingsCount) return b.stats.allBookingsCount - a.stats.allBookingsCount;
            return new Date(b.lastActivityAt || 0).getTime() - new Date(a.lastActivityAt || 0).getTime();
        });

        const total = filtered.length;
        const pages = Math.max(1, Math.ceil(total / limit));
        const page = Math.min(pages, requestedPage);
        const start = (page - 1) * limit;
        const customers = filtered.slice(start, start + limit);

        return NextResponse.json({
            success: true,
            customers,
            total,
            page,
            pages,
            limit,
            overview
        });
    } catch (err) {
        return errorResponse(err, 'GET /api/customers/bookings');
    }
}
