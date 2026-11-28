export const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/9pqa9Z1xhphSgWvMA';
export const VENUE_COORDINATES = { latitude: 23.8580545, longitude: 90.3653792 };
export const GOOGLE_MAPS_EMBED_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3648.6258!2d90.3653792!3d23.8580545!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c3005ddfb04f%3A0x4b3d95a589e8394d!2sCrossbar%20Metro%20Arena!5e0!3m2!1sen!2sbd!4v1732800000000!5m2!1sen!2sbd';

/** Build an iframe-safe Google Maps embed URL from a saved Google Maps link or venue address. */
export function getGoogleMapsEmbedUrl(mapsUrl, address) {
    const raw = String(mapsUrl || '').trim();
    if (!raw || raw === GOOGLE_MAPS_URL || raw.includes('9pqa9Z1xhphSgWvMA') || raw.includes('0x3755c3005ddfb04f') || raw.includes('23.8762,90.3792')) {
        return GOOGLE_MAPS_EMBED_URL;
    }
    if (/^https:\/\/(www\.)?google\.com\/maps\/embed/i.test(raw) || /[?&]output=embed\b/i.test(raw)) {
        return raw;
    }
    const pinMatch = raw.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/) || raw.match(/(?:q=|@|ll=)(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/);
    if (pinMatch) {
        return `https://maps.google.com/maps?q=${pinMatch[1]},${pinMatch[2]}&z=16&output=embed`;
    }
    if (/goo\.gl\//i.test(raw)) {
        return GOOGLE_MAPS_EMBED_URL;
    }
    const query = encodeURIComponent(address || 'Crossbar Metro Arena, Uttara, Dhaka');
    return `https://maps.google.com/maps?q=${query}&z=16&output=embed`;
}

export const VENUE_INFO = {
    businessName: 'Crossbar Metro Arena',
    tagline: 'Dhaka’s Premier Floodlit Outdoor Turf',
    phone: '01796-337133',
    phoneFormatted: '+880 1796-337133',
    whatsappUrl: 'https://wa.me/8801796337133?text=Hi%20Crossbar%20Metro%20Arena%2C%20I%20want%20to%20book%20a%20slot!',
    email: 'bookcrossbar@gmail.com',
    address: 'Uttara Metro Center, Sector 17, Dhaka, Bangladesh, 1230',
    metroStation: 'Uttara Center Metro Station (MRT Line-6)',
    metroDetails: 'Directly adjacent to Metro Rail viaduct & station entrance (2 min walk)',
    googleMapsUrl: GOOGLE_MAPS_URL,
    facebookUrl: 'https://www.facebook.com/crossbarmetroarena',
    facebook: 'https://www.facebook.com/crossbarmetroarena',
    instagramUrl: 'https://www.instagram.com/crossbarmetroarena',
    website: 'bookcrossbar.com',
    openingHours: '6:30 AM – 12:30 AM Every Day',
    aboutText: 'Crossbar Metro Arena is Dhaka’s landmark sports destination, built with FIFA-standard shock-pad turf and stadium floodlights. Situated right beside Uttara Center Metro Station on MRT Line-6.'
};
// Single Ground definition for Crossbar Metro Arena
export const COURTS = [
    {
        id: 'main-turf',
        name: 'Crossbar Metro Arena (Main Turf)',
        code: 'CMA-MAIN',
        tagline: 'Full 7v7 Championship Turf with Metro Viaduct View',
        format: '7 vs 7',
        dimensions: '120ft x 75ft (FIFA Standard Small-Sided)',
        turfType: '50mm Monofilament Shock-Pad Artificial Grass with Cool-Infill',
        dayPrice: 2500,
        nightPrice: 5500,
        recommendedPlayers: '10 - 16 Players (5v5 to 8v8)',
        features: [
            'Pro 400-Lux High-Mast LED Floodlighting',
            'Electronic Digital Scoreboard & Match Clock',
            'Player Dugouts with Covered Benches',
            'High-impact Heavy Duty Enclosure Netting',
            'Direct Metro Train Skyline View'
        ]
    }
];
/**
 * The 12 daily slots (90 minutes each, 06:30 AM to 12:30 AM) with the grand-opening launch-offer prices.
 *   weekdayPrice / weekendPrice              -> what the customer pays (the "offer price")
 *   weekdayActualPrice / weekendActualPrice  -> the regular price, shown struck through while it is higher
 * Bump SLOT_SCHEDULE_VERSION whenever these defaults change: the stored settings are replaced once
 * with this list the next time the server reads them (see models/setting-model.js).
 */
export const SLOT_SCHEDULE_VERSION = 2;
export const SCHEDULE_SLOTS_DEFINITION = [
    { slotNumber: 1, startTime: '06:30', endTime: '08:00', displayTime: '06:30 AM – 08:00 AM', period: 'morning', weekdayActualPrice: 5000, weekdayPrice: 4000, weekendActualPrice: 5500, weekendPrice: 4500 },
    { slotNumber: 2, startTime: '08:00', endTime: '09:30', displayTime: '08:00 AM – 09:30 AM', period: 'morning', weekdayActualPrice: 5000, weekdayPrice: 4000, weekendActualPrice: 5500, weekendPrice: 4500 },
    { slotNumber: 3, startTime: '09:30', endTime: '11:00', displayTime: '09:30 AM – 11:00 AM', period: 'morning', weekdayActualPrice: 5000, weekdayPrice: 4000, weekendActualPrice: 5000, weekendPrice: 3000 },
    { slotNumber: 4, startTime: '11:00', endTime: '12:30', displayTime: '11:00 AM – 12:30 PM', period: 'morning', weekdayActualPrice: 4500, weekdayPrice: 2500, weekendActualPrice: 5000, weekendPrice: 3000 },
    { slotNumber: 5, startTime: '12:30', endTime: '14:00', displayTime: '12:30 PM – 02:00 PM', period: 'afternoon', weekdayActualPrice: 4500, weekdayPrice: 2500, weekendActualPrice: 5000, weekendPrice: 3000 },
    { slotNumber: 6, startTime: '14:00', endTime: '15:30', displayTime: '02:00 PM – 03:30 PM', period: 'afternoon', weekdayActualPrice: 6000, weekdayPrice: 5500, weekendActualPrice: 7000, weekendPrice: 6500 },
    { slotNumber: 7, startTime: '15:30', endTime: '17:00', displayTime: '03:30 PM – 05:00 PM', period: 'afternoon', weekdayActualPrice: 6000, weekdayPrice: 5500, weekendActualPrice: 7000, weekendPrice: 6500 },
    { slotNumber: 8, startTime: '17:00', endTime: '18:30', displayTime: '05:00 PM – 06:30 PM', period: 'afternoon', weekdayActualPrice: 6000, weekdayPrice: 5500, weekendActualPrice: 7000, weekendPrice: 6500 },
    { slotNumber: 9, startTime: '18:30', endTime: '20:00', displayTime: '06:30 PM – 08:00 PM', period: 'evening', weekdayActualPrice: 6000, weekdayPrice: 5500, weekendActualPrice: 7000, weekendPrice: 6500 },
    { slotNumber: 10, startTime: '20:00', endTime: '21:30', displayTime: '08:00 PM – 09:30 PM', period: 'evening', weekdayActualPrice: 6000, weekdayPrice: 5500, weekendActualPrice: 7000, weekendPrice: 6500 },
    { slotNumber: 11, startTime: '21:30', endTime: '23:00', displayTime: '09:30 PM – 11:00 PM', period: 'evening', weekdayActualPrice: 6000, weekdayPrice: 5500, weekendActualPrice: 7000, weekendPrice: 6500 },
    { slotNumber: 12, startTime: '23:00', endTime: '00:30', displayTime: '11:00 PM – 12:30 AM', period: 'evening', weekdayActualPrice: 6000, weekdayPrice: 5500, weekendActualPrice: 7000, weekendPrice: 6500 }
];
export const BOOKING_ADDONS = [
    { id: 'referee', name: 'Certified Match Referee', price: 500, description: 'Official referee for 90 minutes match', enabled: true },
    { id: 'bibs', name: 'Numbered Team Bibs (Set of 14)', price: 200, description: 'Two colored sets of match bibs', enabled: true },
    { id: 'ball', name: 'Extra FIFA Match Ball', price: 150, description: 'Official tournament spec match ball', enabled: true },
    { id: 'water', name: 'Chilled Water & Electrolyte Pack', price: 400, description: 'Cold mineral water bottles for both squads', enabled: true }
];
// All 12-slot pricing matrix + configurable rules
export const DEFAULT_PRICING = {
    morningSlotPrice: 4000,
    afternoonSlotPrice: 5500,
    eveningSlotPrice: 5500,
    weekendSurcharge: 1000,
    slotPrices: SCHEDULE_SLOTS_DEFINITION,
    advanceAmount: 500,
    holdMinutes: 10,
    bookingWindowDays: 60,
    cancellationHours: 24,
    weekendDays: ['Friday', 'Saturday'],
    approveResultsFirst: false
};
export const INITIAL_USERS = [];
export const INITIAL_BOOKINGS = [];
export const INITIAL_TOURNAMENTS = [];
export const INITIAL_COMMUNITY_CHALLENGES = [];
export const INITIAL_EXPENSES = [];
export const INITIAL_INVESTORS = [];
export const INITIAL_PAYOUTS = [];
export const INITIAL_REFUNDS = [];
export const INITIAL_OTHER_INCOME = [];
export const INITIAL_TEAMS = [];
export const INITIAL_MATCH_RESULTS = [];
export const INITIAL_SHOP_PRODUCTS = [];
export const INITIAL_SMS_LOGS = [];
export const INITIAL_GALLERY_PHOTOS = [];

