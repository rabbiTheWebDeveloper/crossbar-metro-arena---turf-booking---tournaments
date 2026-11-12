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
    googleMapsUrl: 'https://maps.google.com/?q=23.8762,90.3792',
    facebookUrl: 'https://www.facebook.com/crossbarmetroarena',
    facebook: 'https://www.facebook.com/crossbarmetroarena',
    instagramUrl: 'https://www.instagram.com/crossbarmetroarena',
    website: 'bookcrossbar.com',
    openingHours: '6:00 AM – 12:00 AM (Midnight) Every Day',
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
        dayPrice: 2200,
        nightPrice: 3500,
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
// 12 slots definition
export const SCHEDULE_SLOTS_DEFINITION = [
    { slotNumber: 1, startTime: '06:00', endTime: '07:30', displayTime: '06:00 AM – 07:30 AM', period: 'morning', weekdayPrice: 2000, weekendPrice: 2500 },
    { slotNumber: 2, startTime: '07:30', endTime: '09:00', displayTime: '07:30 AM – 09:00 AM', period: 'morning', weekdayPrice: 2000, weekendPrice: 2500 },
    { slotNumber: 3, startTime: '09:00', endTime: '10:30', displayTime: '09:00 AM – 10:30 AM', period: 'morning', weekdayPrice: 2200, weekendPrice: 2700 },
    { slotNumber: 4, startTime: '10:30', endTime: '12:00', displayTime: '10:30 AM – 12:00 PM', period: 'morning', weekdayPrice: 2200, weekendPrice: 2700 },
    { slotNumber: 5, startTime: '12:00', endTime: '13:30', displayTime: '12:00 PM – 01:30 PM', period: 'afternoon', weekdayPrice: 2400, weekendPrice: 2900 },
    { slotNumber: 6, startTime: '13:30', endTime: '15:00', displayTime: '01:30 PM – 03:00 PM', period: 'afternoon', weekdayPrice: 2400, weekendPrice: 2900 },
    { slotNumber: 7, startTime: '15:00', endTime: '16:30', displayTime: '03:00 PM – 04:30 PM', period: 'afternoon', weekdayPrice: 2600, weekendPrice: 3200 },
    { slotNumber: 8, startTime: '16:30', endTime: '18:00', displayTime: '04:30 PM – 06:00 PM', period: 'afternoon', weekdayPrice: 2800, weekendPrice: 3400 },
    { slotNumber: 9, startTime: '18:00', endTime: '19:30', displayTime: '06:00 PM – 07:30 PM', period: 'evening', weekdayPrice: 3200, weekendPrice: 3800 },
    { slotNumber: 10, startTime: '19:30', endTime: '21:00', displayTime: '07:30 PM – 09:00 PM', period: 'evening', weekdayPrice: 3500, weekendPrice: 4000 },
    { slotNumber: 11, startTime: '21:00', endTime: '22:30', displayTime: '09:00 PM – 10:30 PM', period: 'evening', weekdayPrice: 3500, weekendPrice: 4000 },
    { slotNumber: 12, startTime: '22:30', endTime: '24:00', displayTime: '10:30 PM – 12:00 AM', period: 'evening', weekdayPrice: 3000, weekendPrice: 3600 }
];
// All 24 pricing matrix + configurable rules
export const DEFAULT_PRICING = {
    morningSlotPrice: 2200,
    afternoonSlotPrice: 2600,
    eveningSlotPrice: 3500,
    weekendSurcharge: 500,
    slotPrices: SCHEDULE_SLOTS_DEFINITION,
    advanceAmount: 500,
    holdMinutes: 10,
    bookingWindowDays: 60,
    cancellationHours: 24,
    weekendDays: ['Friday', 'Saturday'],
    approveResultsFirst: false
};
export const BOOKING_ADDONS = [
    { id: 'referee', name: 'Certified Match Referee', price: 500, description: 'Official referee for 90 minutes match' },
    { id: 'bibs', name: 'Numbered Team Bibs (Set of 14)', price: 200, description: 'Two colored sets of match bibs' },
    { id: 'ball', name: 'Extra FIFA Match Ball', price: 150, description: 'Official tournament spec match ball' },
    { id: 'water', name: 'Chilled Water & Electrolyte Pack', price: 400, description: 'Cold mineral water bottles for both squads' }
];
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

