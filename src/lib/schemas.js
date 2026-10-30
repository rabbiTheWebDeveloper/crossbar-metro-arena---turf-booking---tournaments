/**
 * Input schemas for the admin / write API routes (see lib/validate.js for the rule syntax).
 * Keeping them here keeps route files small and lets POST and PATCH share one definition.
 */

export const EXPENSE_CATEGORY_KEYS = ['turf_maintenance', 'floodlight_electricity', 'staff_wages', 'rent', 'equipment', 'marketing', 'other'];
export const INCOME_SOURCE_KEYS = ['shop_sales', 'event_fees', 'sponsorship', 'other'];
export const REFUND_METHODS = ['bkash', 'nagad', 'rocket', 'bank', 'bank_transfer', 'card', 'cash'];
export const REFUND_STATUSES = ['pending', 'approved', 'completed', 'rejected'];
export const PRODUCT_CATEGORIES = ['accessories', 'balls', 'apparel', 'footwear', 'drinks', 'equipment'];
export const GALLERY_ASPECTS = ['wide', 'square', 'portrait', 'tall'];
export const TOURNAMENT_STATUSES = ['open', 'fast_filling', 'closed', 'completed'];

export const TOURNAMENT_SCHEMA = {
    title: { type: 'string', required: true, min: 3, max: 120, label: 'Tournament title' },
    edition: { type: 'string', max: 80, default: 'Season Trophy' },
    category: { type: 'string', max: 80, default: '7v7 Championship' },
    format: { type: 'string', max: 120, default: '7 vs 7 Knockouts' },
    dates: { type: 'string', required: true, max: 80, label: 'Tournament dates' },
    registrationDeadline: { type: 'date', label: 'Registration deadline' },
    entryFee: { type: 'money', required: true, label: 'Entry fee' },
    prizePool: { type: 'money', default: 0, label: 'Prize pool' },
    firstPrize: { type: 'string', max: 80, default: '' },
    runnerUpPrize: { type: 'string', max: 80, default: '' },
    maxTeams: { type: 'int', min: 2, max: 128, default: 16, label: 'Max teams' },
    registeredCount: { type: 'int', min: 0, max: 128, label: 'Registered count' },
    status: { type: 'enum', values: TOURNAMENT_STATUSES },
    highlights: { type: 'stringArray', maxItems: 12, itemMax: 120, default: [] },
    rules: { type: 'stringArray', maxItems: 20, itemMax: 240, default: [] },
    bannerUrl: { type: 'url', label: 'Banner image', default: '' }
};

export const EXPENSE_SCHEMA = {
    title: { type: 'string', required: true, min: 2, max: 120, label: 'Title' },
    category: { type: 'enum', values: EXPENSE_CATEGORY_KEYS, default: 'other' },
    amount: { type: 'money', required: true, label: 'Amount' },
    date: { type: 'date', required: true, label: 'Date' },
    receiptNote: { type: 'text', max: 300, default: '', label: 'Receipt note' }
};

export const OTHER_INCOME_SCHEMA = {
    source: { type: 'enum', values: INCOME_SOURCE_KEYS, default: 'other' },
    title: { type: 'string', required: true, min: 2, max: 120, label: 'Title' },
    amount: { type: 'money', required: true, label: 'Amount' },
    date: { type: 'date', required: true, label: 'Date' },
    notes: { type: 'text', max: 300, default: '' }
};

export const REFUND_SCHEMA = {
    bookingId: { type: 'string', max: 40, default: '', label: 'Booking id' },
    bookingCode: { type: 'string', required: true, max: 30, label: 'Booking code' },
    customerName: { type: 'string', required: true, min: 2, max: 80, label: 'Customer name' },
    customerPhone: { type: 'phone', label: 'Customer phone' },
    amount: { type: 'money', required: true, label: 'Refund amount' },
    reason: { type: 'string', max: 60, default: 'player_cancelled' },
    refundMethod: { type: 'enum', values: REFUND_METHODS, default: 'bkash', label: 'Refund method' }
};

export const REFUND_UPDATE_SCHEMA = {
    status: { type: 'enum', values: REFUND_STATUSES },
    amount: { type: 'money', label: 'Refund amount' },
    refundMethod: { type: 'enum', values: REFUND_METHODS, label: 'Refund method' },
    transactionRef: { type: 'string', max: 300, label: 'Transaction reference' },
    notes: { type: 'text', max: 300 },
    refundedDate: { type: 'date', label: 'Refunded date' }
};

export const PRODUCT_SCHEMA = {
    name: { type: 'string', required: true, min: 2, max: 120, label: 'Product name' },
    category: { type: 'enum', values: PRODUCT_CATEGORIES, default: 'accessories' },
    price: { type: 'money', required: true, label: 'Price' },
    salePrice: { type: 'money', label: 'Sale price' },
    stock: { type: 'int', min: 0, max: 100000, default: 10, label: 'Stock' },
    sizes: { type: 'stringArray', maxItems: 15, itemMax: 20, default: [] },
    badge: { type: 'string', max: 30, default: '' },
    description: { type: 'text', max: 600, default: '' },
    image: { type: 'url', label: 'Image' },
    featured: { type: 'bool' },
    visible: { type: 'bool' }
};

export const GALLERY_SCHEMA = {
    title: { type: 'string', required: true, min: 2, max: 120, label: 'Title' },
    url: { type: 'url', required: true, label: 'Image URL' },
    album: { type: 'string', max: 60, default: 'Arena' },
    caption: { type: 'text', max: 300, default: '' },
    photographer: { type: 'string', max: 80, default: 'Media Desk' },
    featured: { type: 'bool', default: false },
    aspect: { type: 'enum', values: GALLERY_ASPECTS, default: 'wide' },
    tags: { type: 'stringArray', maxItems: 15, itemMax: 40, default: [] }
};


export const PAYMENT_METHODS = ['pay_at_turf', 'bkash', 'nagad', 'rocket', 'upay', 'card', 'cash'];
export const MATCH_TYPES = ['friendly', 'competitive', 'practice', 'corporate'];

/** Admin edits to an existing booking (money fields are clamped against the booking total in the route). */
export const BOOKING_UPDATE_SCHEMA = {
    collectedCash: { type: 'money', label: 'Collected cash' },
    advanceAmount: { type: 'money', label: 'Paid amount' },
    paymentStatus: { type: 'enum', values: ['paid_full', 'needs_refund', 'confirmed_unpaid', 'paid_advance'], label: 'Payment status' },
    status: { type: 'enum', values: ['paid_full', 'needs_refund', 'confirmed_unpaid', 'paid_advance'], label: 'Status' },
    paymentMethod: { type: 'enum', values: PAYMENT_METHODS, label: 'Payment method' },
    played: { type: 'bool' },
    notes: { type: 'text', max: 500 },
    transactionId: { type: 'string', max: 80, label: 'Transaction id' },
    captainName: { type: 'string', min: 2, max: 80, label: 'Captain name' },
    captainPhone: { type: 'phone', label: 'Captain phone' },
    teamName: { type: 'string', min: 2, max: 80, label: 'Team name' }
};

/** Weekly fixed-slot (bulk) booking request. */
export const BULK_BOOKING_SCHEMA = {
    captainName: { type: 'string', required: true, min: 2, max: 80, label: 'Captain name' },
    captainPhone: { type: 'phone', required: true, label: 'Captain mobile number' },
    teamName: { type: 'string', required: true, min: 2, max: 80, label: 'Team name' },
    startDate: { type: 'date', required: true, label: 'Start date' },
    endDate: { type: 'date', required: true, label: 'End date' },
    paidPerSlot: { type: 'money', default: 0, label: 'Paid per slot' },
    paymentMethod: { type: 'enum', values: PAYMENT_METHODS.filter(m => m !== 'pay_at_turf'), default: 'cash', label: 'Payment method' },
    pricePerSlot: { type: 'money', label: 'Price per slot' },
    notes: { type: 'text', max: 500, default: '' },
    matchType: { type: 'enum', values: MATCH_TYPES, default: 'friendly', label: 'Match type' },
    seriesLabel: { type: 'string', max: 160 },
    skipConflicts: { type: 'bool', default: false },
    dryRun: { type: 'bool', default: false }
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_PERIODS = ['morning', 'afternoon', 'evening'];
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;

/** Arena settings + pricing rules (admin Settings and Slot Pricing pages). Every field is optional on update. */
export const SETTINGS_SCHEMA = {
    businessName: { type: 'string', max: 100 },
    tagline: { type: 'string', max: 160 },
    phone: { type: 'string', max: 30 },
    phoneFormatted: { type: 'string', max: 40 },
    whatsappUrl: { type: 'url', label: 'WhatsApp link' },
    email: { type: 'email', label: 'Email' },
    address: { type: 'string', max: 240 },
    metroStation: { type: 'string', max: 100 },
    metroDetails: { type: 'text', max: 300 },
    googleMapsUrl: { type: 'url', label: 'Google Maps link' },
    facebookUrl: { type: 'url', label: 'Facebook link' },
    instagramUrl: { type: 'url', label: 'Instagram link' },
    website: { type: 'url', label: 'Website' },
    openingHours: { type: 'string', max: 120 },
    aboutText: { type: 'text', max: 2000 },
    morningSlotPrice: { type: 'money', label: 'Morning price' },
    afternoonSlotPrice: { type: 'money', label: 'Afternoon price' },
    eveningSlotPrice: { type: 'money', label: 'Evening price' },
    weekendSurcharge: { type: 'money', label: 'Weekend surcharge' },
    advanceAmount: { type: 'money', label: 'Advance amount' },
    holdMinutes: { type: 'int', min: 5, max: 120, label: 'Hold minutes' },
    bookingWindowDays: { type: 'int', min: 1, max: 365, label: 'Booking window (days)' },
    cancellationHours: { type: 'int', min: 0, max: 168, label: 'Cancellation window (hours)' },
    weekendDays: { type: 'stringArray', maxItems: 7, itemMax: 10, label: 'Weekend days' },
    approveResultsFirst: { type: 'bool', label: 'Approve results first' }
};

/** The 12-slot price table. Returns { value } (cleaned) or { error }. */
export function validateSlotPrices(slots) {
    if (!Array.isArray(slots) || slots.length !== 12) return { error: 'Slot prices must contain exactly 12 slots.' };
    const seen = new Set();
    const out = [];
    for (const s of slots) {
        const n = Number(s?.slotNumber);
        if (!Number.isInteger(n) || n < 1 || n > 12 || seen.has(n)) return { error: 'Slot numbers must be 1 to 12 with no repeats.' };
        seen.add(n);
        if (!HHMM.test(String(s.startTime || '')) || !HHMM.test(String(s.endTime || ''))) return { error: `Slot ${n} needs start and end times like 18:00.` };
        const weekday = Number(s.weekdayPrice);
        const weekend = Number(s.weekendPrice);
        if (![weekday, weekend].every(p => Number.isFinite(p) && p >= 0 && p <= 100000)) return { error: `Slot ${n} prices must be between 0 and 100000.` };
        const period = SLOT_PERIODS.includes(s.period) ? s.period : undefined;
        out.push({
            slotNumber: n,
            startTime: s.startTime,
            endTime: s.endTime,
            displayTime: String(s.displayTime || '').slice(0, 40),
            period,
            weekdayPrice: weekday,
            weekendPrice: weekend
        });
    }
    return { value: out.sort((a, b) => a.slotNumber - b.slotNumber) };
}

export const isDayName = (d) => DAY_NAMES.includes(d);

export const INVESTOR_SCHEMA = {
    name: { type: 'string', required: true, min: 2, max: 80, label: 'Investor name' },
    email: { type: 'email', label: 'Email' },
    phone: { type: 'phone', required: true, label: 'Phone' },
    sharePercentage: { type: 'number', required: true, min: 0, max: 100, label: 'Share percentage' },
    capitalInvested: { type: 'money', label: 'Capital invested' },
    status: { type: 'enum', values: ['active', 'inactive'] },
    joinedDate: { type: 'date', label: 'Joined date' }
};

export const PAYOUT_SCHEMA = {
    month: { type: 'month', required: true, label: 'Month' },
    amount: { type: 'money', required: true, label: 'Amount' },
    datePaid: { type: 'date', label: 'Date paid' },
    paymentMethod: { type: 'enum', values: ['bank_transfer', 'bkash', 'nagad', 'rocket', 'cheque', 'cash'], default: 'bank_transfer', label: 'Payment method' },
    transactionNote: { type: 'text', max: 200, default: '' },
    allowDuplicate: { type: 'bool', default: false }
};

/** Admin edits to a tournament registration (squad, captain, payment, status). */
export const REGISTRATION_EDIT_SCHEMA = {
    teamName: { type: 'string', min: 2, max: 60, label: 'Team name' },
    captainName: { type: 'string', min: 2, max: 80, label: 'Captain name' },
    captainPhone: { type: 'phone', label: 'Captain phone' },
    captainEmail: { type: 'email', label: 'Captain email' },
    jerseyColor: { type: 'string', max: 30 },
    tournamentTitle: { type: 'string', max: 120 },
    playersList: { type: 'stringArray', maxItems: 12, itemMax: 60, label: 'Players list' },
    playerCount: { type: 'int', min: 1, max: 30, label: 'Player count' },
    paymentMethod: { type: 'enum', values: ['bkash', 'nagad', 'rocket', 'bank', 'card', 'cash', 'pay_at_turf'], label: 'Payment method' },
    transactionId: { type: 'string', max: 80, label: 'Transaction id' },
    amount: { type: 'money', label: 'Amount' },
    notes: { type: 'text', max: 500 },
    status: { type: 'enum', values: ['pending', 'confirmed', 'rejected'], label: 'Status' }
};
