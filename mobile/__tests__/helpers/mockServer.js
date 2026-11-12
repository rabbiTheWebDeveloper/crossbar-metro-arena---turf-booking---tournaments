/**
 * In-memory stand-in for the arena API, used by the smoke tests.
 *  - public data: real responses captured from the live site (fixtures/public.json)
 *  - private data (bookings, finance, users…): synthesised below following src/models of the web app
 * `installMockServer(role)` replaces global.fetch; every write (POST/PATCH/PUT/DELETE) is accepted
 * and echoed back so screens can be exercised without touching a real server.
 */
const publicData = require('../fixtures/public.json');

const oid = (n) => (0x6ad000000000 + n).toString(16).padStart(24, '0');
const pad = (n) => String(n).padStart(2, '0');
const dhakaToday = () => {
    const d = new Date(Date.now() + 6 * 3600 * 1000);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};
const addDays = (iso, n) => {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d + n);
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};

const TODAY = dhakaToday();
const MONTH = TODAY.slice(0, 7);
const SLOTS = publicData.settings.pricing.slotPrices;

const USERS = {
    admin: { id: oid(1), _id: oid(1), name: 'Arena Admin', phone: '01711223344', role: 'admin', email: 'admin@bookcrossbar.com', playingPosition: 'MID', teamId: '', disabled: false, createdAt: '2026-09-01T10:00:00.000Z' },
    investor: { id: oid(2), _id: oid(2), name: 'Partner Karim', phone: '01819556677', role: 'investor', email: 'karim@example.com', playingPosition: 'DEF', teamId: '', disabled: false, createdAt: '2026-09-02T10:00:00.000Z' },
    player: { id: oid(3), _id: oid(3), name: 'Siam Chowdhury', phone: '01844332211', role: 'player', email: 'siam@example.com', playingPosition: 'FWD', teamId: '', disabled: false, createdAt: '2026-09-03T10:00:00.000Z' }
};

function makeBooking(n, { date, slot, status, team, captain, phone, userId, extra = {} }) {
    const def = SLOTS.find(s => s.slotNumber === slot);
    const courtPrice = def.weekdayPrice;
    const addOns = n % 2 === 0 ? [{ id: 'referee', name: 'Certified Match Referee', description: 'Official referee for 90 minutes match', price: 500, iconName: '' }] : [];
    const addOnsPrice = addOns.reduce((s, a) => s + a.price, 0);
    const totalPrice = courtPrice + addOnsPrice;
    const advance = status === 'paid_full' ? totalPrice : (status === 'paid_advance' || status === 'needs_refund' ? 500 : 0);
    return {
        id: oid(100 + n), _id: oid(100 + n), bookingCode: `CMA-TEST${pad(n)}`, courtId: 'main-turf', courtName: 'Crossbar Metro Arena (Main Turf)',
        date, slotNumber: slot, startTime: def.startTime, endTime: def.endTime, displayTime: def.displayTime,
        captainName: captain, captainPhone: phone, userId: userId || '', teamName: team, playerCount: 14, matchType: 'friendly',
        addOns, courtPrice, addOnsPrice, totalPrice, paymentType: status === 'paid_full' ? 'full_payment' : 'advance_500',
        advanceAmount: advance, dueAmount: Math.max(0, totalPrice - advance), paymentMethod: 'bkash', paymentStatus: status,
        transactionId: `TRX${n}`, paidAt: advance > 0 ? `${addDays(TODAY, -1)}T08:00:00.000Z` : undefined,
        isWalkIn: n % 3 === 0, played: false, isRecurring: false, notes: '', createdAt: `${addDays(TODAY, -2)}T06:00:00.000Z`, updatedAt: `${addDays(TODAY, -1)}T06:00:00.000Z`,
        ...extra
    };
}

const P = USERS.player;
const BOOKINGS = [
    makeBooking(1, { date: TODAY, slot: 9, status: 'paid_advance', team: 'Uttara Metro FC', captain: P.name, phone: P.phone, userId: P.id }),
    makeBooking(2, { date: TODAY, slot: 10, status: 'paid_full', team: 'Sector 7 United', captain: 'Rafiq Hasan', phone: '01712345678' }),
    makeBooking(3, { date: TODAY, slot: 11, status: 'confirmed_unpaid', team: 'Diabari Dynamos', captain: 'Imran Kabir', phone: '01912345678' }),
    makeBooking(4, { date: addDays(TODAY, 1), slot: 10, status: 'paid_advance', team: 'Uttara Metro FC', captain: P.name, phone: P.phone, userId: P.id, extra: { isRecurring: true, seriesId: 'SER-TEST1', seriesLabel: 'Friday squad' } }),
    makeBooking(5, { date: addDays(TODAY, 8), slot: 10, status: 'paid_advance', team: 'Uttara Metro FC', captain: P.name, phone: P.phone, userId: P.id, extra: { isRecurring: true, seriesId: 'SER-TEST1', seriesLabel: 'Friday squad' } }),
    makeBooking(6, { date: addDays(TODAY, -3), slot: 8, status: 'paid_full', team: 'Metro Rail Rovers', captain: 'Tariq Aziz', phone: '01612345678', extra: { played: true } }),
    makeBooking(7, { date: addDays(TODAY, -5), slot: 12, status: 'cancelled', team: 'Late Night XI', captain: 'Sabbir Rahman', phone: '01512345678', extra: { cancelledAt: `${addDays(TODAY, -6)}T10:00:00.000Z`, cancelledBy: 'admin' } }),
    makeBooking(8, { date: addDays(TODAY, 2), slot: 3, status: 'pending_payment', team: 'Morning Kickers', captain: 'Jahid Hasan', phone: '01312345678', extra: { holdExpiresAt: Date.now() + 5 * 60 * 1000 } }),
    makeBooking(9, { date: addDays(TODAY, -1), slot: 9, status: 'needs_refund', team: 'Rain Stopped FC', captain: 'Nayeem Islam', phone: '01412345678' })
];

const publicBookingView = (b) => ({ id: b.id, date: b.date, slotNumber: b.slotNumber, startTime: b.startTime, endTime: b.endTime, displayTime: b.displayTime, courtId: b.courtId, teamName: b.teamName, paymentStatus: b.paymentStatus, holdExpiresAt: b.holdExpiresAt, isRecurring: !!b.isRecurring, isPublicView: true });

const TEAMS = publicData.teams.teams;
const TOURNAMENTS = publicData.events.tournaments;
const PRODUCTS = publicData.products.products;

const MATCH_RESULTS = [
    {
        id: oid(201), _id: oid(201), date: addDays(TODAY, -2), slotDisplay: '07:30 PM – 09:00 PM', courtName: 'Crossbar Metro Arena (Main Turf)',
        homeTeam: TEAMS[0].name, awayTeam: TEAMS[1].name, homeTeamId: TEAMS[0].id, awayTeamId: TEAMS[1].id, homeScore: 3, awayScore: 2,
        scorers: [{ playerName: 'Siam Chowdhury', teamName: TEAMS[0].name, minute: 12 }, { playerName: 'Saad Al-Din', teamName: TEAMS[0].name, minute: 40 }],
        events: [{ side: 'home', type: 'goal', playerName: 'Siam Chowdhury', minute: 12 }], yellowCards: 2, redCards: 0, playerOfTheMatch: 'Siam Chowdhury',
        matchReport: 'A floodlit thriller settled late on.', teamPhoto: '', matchType: '7v7 Friendly', postedBy: 'Admin', postedAt: `${addDays(TODAY, -2)}T16:00:00.000Z`,
        userId: '', postedByPhone: '', standingsApplied: true, status: 'published', createdAt: `${addDays(TODAY, -2)}T16:00:00.000Z`
    },
    {
        id: oid(202), _id: oid(202), date: addDays(TODAY, -1), slotDisplay: '09:00 PM – 10:30 PM', courtName: 'Crossbar Metro Arena (Main Turf)',
        homeTeam: TEAMS[2].name, awayTeam: TEAMS[3].name, homeTeamId: TEAMS[2].id, awayTeamId: TEAMS[3].id, homeScore: 1, awayScore: 1,
        scorers: [], events: [], yellowCards: 0, redCards: 0, playerOfTheMatch: '', matchReport: '', teamPhoto: '', matchType: '7v7 Friendly',
        postedBy: P.name, postedAt: `${addDays(TODAY, -1)}T17:00:00.000Z`, userId: P.id, postedByPhone: P.phone, standingsApplied: false, status: 'pending_approval', createdAt: `${addDays(TODAY, -1)}T17:00:00.000Z`
    }
];

const CHALLENGES = [
    { id: oid(301), _id: oid(301), teamName: 'Uttara Metro FC', captainName: P.name, captainPhone: P.phone, courtName: 'Crossbar Metro Arena', date: addDays(TODAY, 3), timeSlot: '07:30 PM – 09:00 PM', format: '7 vs 7 Friendly Match', level: 'Competitive', lookingFor: 'Opponent Team', costShare: '50/50 Split', notes: 'Bring bibs', userId: P.id, matchedTeamName: '', matchedCaptainName: '', matchedPhone: '', status: 'open', createdAt: `${addDays(TODAY, -1)}T09:00:00.000Z` },
    { id: oid(302), _id: oid(302), teamName: 'Sector 7 United', captainName: 'Rafiq Hasan', captainPhone: '', courtName: 'Crossbar Metro Arena', date: addDays(TODAY, 5), timeSlot: '06:00 PM – 07:30 PM', format: '7 vs 7 Friendly Match', level: 'Casual', lookingFor: 'Opponent Team', costShare: 'Loser Pays', notes: '', userId: oid(9), matchedTeamName: 'Metro Rail Rovers', matchedCaptainName: 'Tariq Aziz', matchedPhone: '', status: 'matched', createdAt: `${addDays(TODAY, -2)}T09:00:00.000Z` }
];

const EXPENSES = [
    { id: oid(401), _id: oid(401), title: 'Floodlight electricity bill', category: 'floodlight_electricity', amount: 18500, date: `${MONTH}-03`, receiptNote: 'DESCO', recordedBy: 'Admin', createdAt: `${MONTH}-03T08:00:00.000Z` },
    { id: oid(402), _id: oid(402), title: 'Groundsman wages', category: 'staff_wages', amount: 24000, date: `${MONTH}-05`, receiptNote: '', recordedBy: 'Admin', createdAt: `${MONTH}-05T08:00:00.000Z` },
    { id: oid(403), _id: oid(403), title: 'Custom thing', category: 'drone_footage', amount: 3000, date: `${MONTH}-07`, receiptNote: '', recordedBy: 'Admin', createdAt: `${MONTH}-07T08:00:00.000Z` }
];
const INVESTORS = [
    { id: oid(501), _id: oid(501), name: 'Partner Karim', email: 'karim@example.com', phone: '01819556677', sharePercentage: 25, capitalInvested: 2500000, joinedDate: '2026-01-15', payoutsPaid: 40000, userId: USERS.investor.id, status: 'active' },
    { id: oid(502), _id: oid(502), name: 'Partner Selina', email: '', phone: '01777000111', sharePercentage: 15, capitalInvested: 1500000, joinedDate: '2026-02-01', payoutsPaid: 0, userId: '', status: 'active' },
    { id: oid(503), _id: oid(503), name: 'Old Partner', email: '', phone: '01777000222', sharePercentage: 5, capitalInvested: 300000, joinedDate: '2025-06-01', payoutsPaid: 12000, userId: '', status: 'inactive' }
];
const PAYOUTS = [
    { id: oid(601), _id: oid(601), investorId: oid(501), investorName: 'Partner Karim', month: MONTH, amount: 5000, datePaid: `${MONTH}-10`, paymentMethod: 'bank_transfer', transactionNote: 'IBBL 4411', recordedBy: 'Admin', createdAt: `${MONTH}-10T08:00:00.000Z` }
];
const REFUNDS = [
    { id: oid(701), _id: oid(701), bookingId: BOOKINGS[8].id, bookingCode: BOOKINGS[8].bookingCode, customerName: 'Nayeem Islam', customerPhone: '01412345678', amount: 500, reason: 'player_cancelled', refundMethod: 'bkash', status: 'pending', requestDate: addDays(TODAY, -1), refundedDate: '', transactionRef: '', recordedBy: 'Admin Desk', createdAt: `${addDays(TODAY, -1)}T08:00:00.000Z` },
    { id: oid(702), _id: oid(702), bookingId: '', bookingCode: 'CMA-OLD001', customerName: 'Sabbir Rahman', customerPhone: '01512345678', amount: 500, reason: 'slot_unavailable', refundMethod: 'nagad', status: 'completed', requestDate: `${MONTH}-02`, refundedDate: `${MONTH}-04`, transactionRef: 'NGD123', recordedBy: 'Admin Desk', createdAt: `${MONTH}-02T08:00:00.000Z` }
];
const OTHER_INCOME = [
    { id: oid(801), _id: oid(801), source: 'shop_sales', title: 'Shop Pickup: Grip Socks (SHP-TEST1)', amount: 700, date: `${MONTH}-06`, notes: '', recordedBy: 'System (Shop Pickup)', createdAt: `${MONTH}-06T08:00:00.000Z` },
    { id: oid(802), _id: oid(802), source: 'sponsorship', title: 'Banner sponsor', amount: 15000, date: `${MONTH}-08`, notes: 'Monthly', recordedBy: 'Admin', createdAt: `${MONTH}-08T08:00:00.000Z` }
];
const RESERVATIONS = [
    { id: oid(901), _id: oid(901), reservationCode: 'SHP-TEST1', userId: P.id, customerName: P.name, customerPhone: P.phone, productName: `${PRODUCTS[0].name} (x2)`, price: 700, size: '', items: [{ productId: PRODUCTS[0].id, name: PRODUCTS[0].name, price: 350, quantity: 2, size: (PRODUCTS[0].sizes || [''])[0], image: PRODUCTS[0].image || '' }], totalAmount: 700, status: 'reserved_pickup', pickupDate: addDays(TODAY, 1), notes: '', createdAt: `${addDays(TODAY, -1)}T08:00:00.000Z` },
    { id: oid(902), _id: oid(902), reservationCode: 'SHP-TEST2', userId: '', customerName: 'Walk-in Fan', customerPhone: '01712345678', productName: `${PRODUCTS[1].name} (x1)`, price: PRODUCTS[1].price, size: '', items: [{ productId: PRODUCTS[1].id, name: PRODUCTS[1].name, price: PRODUCTS[1].price, quantity: 1, size: '', image: '' }], totalAmount: PRODUCTS[1].price, status: 'collected', pickupDate: addDays(TODAY, -2), collectedAt: `${addDays(TODAY, -2)}T12:00:00.000Z`, notes: 'Paid cash', createdAt: `${addDays(TODAY, -3)}T08:00:00.000Z` }
];
const REGISTRATIONS = [
    { id: oid(1001), _id: oid(1001), tournamentId: TOURNAMENTS[0].id, tournamentTitle: TOURNAMENTS[0].title, teamName: 'Uttara Metro FC', captainName: P.name, captainPhone: P.phone, captainEmail: 'siam@example.com', jerseyColor: 'Green', playerCount: 10, playersList: ['Siam Chowdhury', 'Rahim Ullah'], players: [{ name: 'Siam Chowdhury', phone: P.phone, number: 10, position: 'FWD' }], paymentMethod: 'bkash', transactionId: 'BK12345', amount: TOURNAMENTS[0].entryFee, status: 'pending', notes: '', createdAt: `${addDays(TODAY, -1)}T08:00:00.000Z` },
    { id: oid(1002), _id: oid(1002), tournamentId: TOURNAMENTS[1].id, tournamentTitle: TOURNAMENTS[1].title, teamName: 'Sector 7 United', captainName: 'Rafiq Hasan', captainPhone: '01712345678', captainEmail: '', jerseyColor: '', playerCount: 12, playersList: [], players: [], paymentMethod: 'nagad', transactionId: 'NG999', amount: TOURNAMENTS[1].entryFee, status: 'confirmed', notes: 'Verified', createdAt: `${addDays(TODAY, -4)}T08:00:00.000Z` }
];
const ALL_USERS = [USERS.admin, USERS.investor, USERS.player, { id: oid(4), _id: oid(4), name: 'Disabled Dan', phone: '01999000111', role: 'player', email: '', playingPosition: 'GK', teamId: '', disabled: true, createdAt: '2026-10-01T10:00:00.000Z' }];

const json = (status, body, headers = {}) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k) => headers[String(k).toLowerCase()] ?? null },
    json: async () => body,
    text: async () => JSON.stringify(body)
});

/** Build the response for one request. Returns [status, body]. */
function route(role, method, pathname, query, body) {
    const user = USERS[role] || null;
    const isAdmin = role === 'admin';
    const isStaff = isAdmin || role === 'investor';
    const need = (ok) => (ok ? null : [user ? 403 : 401, { error: user ? 'You do not have permission to do that.' : 'Please sign in to continue.' }]);
    const seg = pathname.replace(/^\/api\//, '').split('/');
    const [resource, id] = seg;

    if (method === 'GET') {
        switch (resource) {
            case 'auth': return [200, user ? { authenticated: true, user } : { authenticated: false, user: null }];
            case 'settings': return [200, publicData.settings];
            case 'events': return [200, publicData.events];
            case 'products': return [200, publicData.products];
            case 'gallery': return [200, publicData.gallery];
            case 'teams': return [200, { success: true, teams: TEAMS.map((t, i) => ({ ...t, isMine: role === 'player' && i === 0, captainPhone: role === 'player' && i === 0 ? P.phone : undefined })) }];
            case 'bookings': {
                if (id) {
                    const b = BOOKINGS.find(x => x.bookingCode === decodeURIComponent(id) || x.id === id);
                    return b ? [200, { success: true, booking: query.phone || isAdmin ? b : publicBookingView(b) }] : [404, { error: 'Booking not found.' }];
                }
                if (query.mine) return need(!!user) || [200, { success: true, bookings: BOOKINGS.filter(b => b.captainPhone === user.phone) }];
                return [200, { success: true, bookings: isStaff ? BOOKINGS : BOOKINGS.filter(b => b.paymentStatus !== 'cancelled').map(publicBookingView) }];
            }
            case 'match-results': {
                if (query.status === 'all') return need(isAdmin) || [200, { success: true, matchResults: MATCH_RESULTS }];
                if (query.mine) return need(!!user) || [200, { success: true, matchResults: MATCH_RESULTS.filter(m => m.userId === user.id) }];
                return [200, { success: true, matchResults: MATCH_RESULTS.filter(m => m.status === 'published') }];
            }
            case 'challenges': {
                if (query.status === 'all') return need(isAdmin) || [200, { success: true, challenges: CHALLENGES }];
                if (query.mine) return need(!!user) || [200, { success: true, challenges: CHALLENGES.filter(c => c.userId === user.id) }];
                return [200, { success: true, challenges: CHALLENGES.filter(c => c.status === 'open') }];
            }
            case 'expenses': return need(isStaff) || [200, { success: true, expenses: EXPENSES }];
            case 'investors': return need(isStaff) || [200, { success: true, investors: isAdmin ? INVESTORS : INVESTORS.filter(i => i.userId === user.id), myInvestorId: role === 'investor' ? INVESTORS[0].id : null }];
            case 'payouts': return need(isStaff) || [200, { success: true, payouts: PAYOUTS }];
            case 'refunds': return need(isStaff) || [200, { success: true, refunds: REFUNDS }];
            case 'other-income': return need(isStaff) || [200, { success: true, otherIncome: OTHER_INCOME }];
            case 'shop-orders': {
                if (query.mine) return need(!!user) || [200, { success: true, reservations: RESERVATIONS.filter(r => r.userId === user.id) }];
                return need(isAdmin) || [200, { success: true, reservations: RESERVATIONS }];
            }
            case 'registrations': {
                if (query.mine) return need(!!user) || [200, { success: true, registrations: REGISTRATIONS.filter(r => r.captainPhone === user.phone) }];
                return need(isAdmin) || [200, { success: true, registrations: REGISTRATIONS }];
            }
            case 'users': return need(isAdmin) || [200, { success: true, users: ALL_USERS }];
            default: return [404, { error: 'Not found' }];
        }
    }

    // ---- writes: accept and echo ----
    const echo = (key, base = {}) => [200, { success: true, message: 'Saved', [key]: { id: oid(5000 + Math.floor(Math.random() * 999)), ...base, ...(body && typeof body === 'object' && !Array.isArray(body) ? body : {}) } }];
    switch (resource) {
        case 'auth':
            if (id === 'logout') return [200, { success: true }];
            if (id === 'me') return [200, { success: true, message: 'Profile updated successfully.', user: { ...user, ...body } }];
            return [401, { error: 'Invalid mobile number or password.' }];
        case 'payment': return [503, { error: 'Online payment is not configured yet. Please book by phone or pay at the arena counter.' }];
        case 'bookings': {
            if (id === 'bulk') return [200, { success: true, dryRun: !!body?.dryRun, bookings: [], conflicts: [], summary: { requested: 0, created: 0, conflicts: 0, firstDate: TODAY, lastDate: TODAY, totalValue: 0 } }];
            const existing = BOOKINGS.find(b => b.id === id) || BOOKINGS[0];
            if (method === 'DELETE') return [200, { success: true, message: 'Booking cancelled', booking: { ...existing, paymentStatus: 'cancelled' } }];
            if (method === 'PATCH') return [200, { success: true, booking: { ...existing, ...(body?.played !== undefined ? { played: body.played } : {}), ...(body?.status ? { paymentStatus: body.status } : {}) } }];
            return [201, { success: true, message: 'Booking confirmed', booking: { ...existing, id: oid(5999), bookingCode: 'CMA-NEW001', ...body } }];
        }
        case 'settings': return [200, publicData.settings];
        case 'expenses': return method === 'DELETE' ? [200, { success: true }] : echo('expense');
        case 'other-income': return echo('otherIncome');
        case 'payouts': return echo('payout');
        case 'refunds': return echo('refund', REFUNDS.find(r => r.id === id) || {});
        case 'investors': return method === 'POST' ? [200, { success: true, message: 'Investors saved', investors: INVESTORS }] : (method === 'DELETE' ? [200, { success: true, message: 'Investor removed' }] : echo('investor', INVESTORS.find(i => i.id === id) || {}));
        case 'teams': return method === 'DELETE' ? [200, { success: true }] : echo('team', TEAMS.find(t => t.id === id) || { players: [], stats: {} });
        case 'match-results': return method === 'DELETE' ? [200, { success: true }] : echo('matchResult', MATCH_RESULTS.find(m => m.id === id) || { status: 'pending_approval', scorers: [], events: [] });
        case 'products': return method === 'DELETE' ? [200, { success: true }] : echo('product', PRODUCTS.find(p => p.id === id) || {});
        case 'shop-orders': return echo('reservation', RESERVATIONS.find(r => r.id === id) || { reservationCode: 'SHP-NEW001', items: [], totalAmount: 0, status: 'reserved_pickup' });
        case 'registrations': return method === 'DELETE' ? [200, { success: true }] : echo('registration', REGISTRATIONS.find(r => r.id === id) || { status: 'pending' });
        case 'events': return method === 'DELETE' ? [200, { success: true }] : echo('tournament', TOURNAMENTS.find(t => t.id === id) || {});
        case 'challenges': return method === 'DELETE' ? [200, { success: true }] : echo('challenge', CHALLENGES.find(c => c.id === id) || { status: 'open' });
        case 'gallery': return method === 'DELETE' ? [200, { success: true }] : echo('photo');
        case 'users': return echo('user', ALL_USERS.find(u => u.id === id) || {});
        default: return [404, { error: 'Not found' }];
    }
}

/**
 * Replace global.fetch with the mock API for the given role ('visitor' | 'player' | 'admin' | 'investor').
 * Returns the jest mock so tests can inspect the calls.
 */
function installMockServer(role = 'visitor') {
    const fetchMock = jest.fn(async (url, options = {}) => {
        const u = new URL(String(url));
        if (!u.pathname.startsWith('/api/')) {
            // third-party requests (weather etc.): behave like an offline device
            throw new Error('Network request failed');
        }
        let body = null;
        try { body = options.body ? JSON.parse(options.body) : null; } catch { body = null; }
        const query = Object.fromEntries(u.searchParams.entries());
        const [status, payload] = route(role === 'visitor' ? null : role, String(options.method || 'GET').toUpperCase(), u.pathname, query, body);
        return json(status, payload);
    });
    global.fetch = fetchMock;
    return fetchMock;
}

module.exports = { installMockServer, USERS, BOOKINGS, TODAY, MONTH };
