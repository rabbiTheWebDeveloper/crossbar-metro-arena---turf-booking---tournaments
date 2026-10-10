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
export const INITIAL_USERS = [
    {
        id: 'user-admin-1',
        name: 'Abid Hasan (Owner)',
        phone: '01796337133',
        password: 'password123',
        role: 'admin',
        email: 'abid@bookcrossbar.com',
        createdAt: '2026-01-01T00:00:00Z'
    },
    {
        id: 'user-admin-2',
        name: 'Kabir Chowdhury (Manager)',
        phone: '01711223344',
        password: 'password123',
        role: 'admin',
        email: 'kabir@bookcrossbar.com',
        createdAt: '2026-01-10T00:00:00Z'
    },
    {
        id: 'user-player-1',
        name: 'Siam Chowdhury',
        phone: '01844332211',
        password: 'password123',
        role: 'player',
        playingPosition: 'FWD',
        email: 'siam@gmail.com',
        teamId: 'team-01',
        createdAt: '2026-02-01T00:00:00Z'
    },
    {
        id: 'user-player-2',
        name: 'Tanvir Ahmed',
        phone: '01711889922',
        password: 'password123',
        role: 'player',
        playingPosition: 'FWD',
        email: 'tanvir@gmail.com',
        teamId: 'team-02',
        createdAt: '2026-02-15T00:00:00Z'
    },
    {
        id: 'user-investor-1',
        name: 'Rafiqul Islam (Investor)',
        phone: '01819556677',
        password: 'password123',
        role: 'investor',
        email: 'rafiqul@metroinvest.bd',
        investorId: 'inv-02',
        createdAt: '2026-02-01T00:00:00Z'
    },
    {
        id: 'user-investor-2',
        name: 'Tareq Mansoor (Investor)',
        phone: '01912334455',
        password: 'password123',
        role: 'investor',
        email: 'tareq.mansoor@gmail.com',
        investorId: 'inv-03',
        createdAt: '2026-02-15T00:00:00Z'
    }
];
export const BOOKING_ADDONS = [
    {
        id: 'addon-bibs',
        name: 'Match Bibs Set (14 Vests)',
        description: 'Neon Green vs Bright Orange pro training bibs',
        price: 200,
        iconName: 'Shirt'
    },
    {
        id: 'addon-ball',
        name: 'Official FIFA Match Ball',
        description: 'Nike / Adidas size 5 thermobonded turf match ball',
        price: 150,
        iconName: 'CircleDot'
    },
    {
        id: 'addon-referee',
        name: 'Certified Match Referee',
        description: 'Official referee with whistle, cards & timekeeper',
        price: 600,
        iconName: 'ShieldAlert'
    },
    {
        id: 'addon-recording',
        name: '4K Match Video Highlights',
        description: 'Overhead elevated camera footage of your game',
        price: 800,
        iconName: 'Video'
    },
    {
        id: 'addon-icebox',
        name: 'Electrolyte & Chilled Water Tub',
        description: 'Ice cooler packed with chilled water & glucose drinks',
        price: 450,
        iconName: 'GlassWater'
    }
];
export const INITIAL_BOOKINGS = [
    {
        id: 'b-001',
        bookingCode: 'CMA-7KQ2PX',
        courtId: 'main-turf',
        courtName: 'Crossbar Metro Arena (Main Turf)',
        date: '2026-10-10',
        slotNumber: 10,
        startTime: '19:30',
        endTime: '21:00',
        displayTime: '07:30 PM – 09:00 PM',
        captainName: 'Rahat Karim',
        captainPhone: '01712-445566',
        teamName: 'Dhaka Kings FC',
        playerCount: 14,
        matchType: 'friendly',
        addOns: [BOOKING_ADDONS[0], BOOKING_ADDONS[1]],
        courtPrice: 4000,
        addOnsPrice: 350,
        totalPrice: 4350,
        paymentType: 'advance_500',
        advanceAmount: 500,
        dueAmount: 3850,
        paymentMethod: 'bkash',
        paymentStatus: 'paid_advance',
        transactionId: 'BK-TRX-994821',
        notes: 'Arriving 15 min early for warmup',
        createdAt: '2026-10-09T14:30:00Z'
    },
    {
        id: 'b-002',
        bookingCode: 'CMA-4NW89M',
        courtId: 'main-turf',
        courtName: 'Crossbar Metro Arena (Main Turf)',
        date: '2026-10-10',
        slotNumber: 11,
        startTime: '21:00',
        endTime: '22:30',
        displayTime: '09:00 PM – 10:30 PM',
        captainName: 'Siam Chowdhury',
        captainPhone: '01844-332211',
        teamName: 'Uttara Metro FC',
        playerCount: 14,
        matchType: 'competitive',
        addOns: [BOOKING_ADDONS[1]],
        courtPrice: 4000,
        addOnsPrice: 150,
        totalPrice: 4150,
        paymentType: 'full_payment',
        advanceAmount: 4150,
        dueAmount: 0,
        paymentMethod: 'nagad',
        paymentStatus: 'paid_full',
        transactionId: 'NGD-882014',
        notes: 'Need official match ball',
        createdAt: '2026-10-09T16:00:00Z'
    },
    {
        id: 'b-003',
        bookingCode: 'CMA-9PZ31A',
        courtId: 'main-turf',
        courtName: 'Crossbar Metro Arena (Main Turf)',
        date: '2026-10-11',
        slotNumber: 9,
        startTime: '18:00',
        endTime: '19:30',
        displayTime: '06:00 PM – 07:30 PM',
        captainName: 'Tanvir Ahmed',
        captainPhone: '01711-889922',
        teamName: 'Sector 17 Strikers',
        playerCount: 14,
        matchType: 'competitive',
        addOns: [],
        courtPrice: 3200,
        addOnsPrice: 0,
        totalPrice: 3200,
        paymentType: 'advance_500',
        advanceAmount: 500,
        dueAmount: 2700,
        paymentMethod: 'bkash',
        paymentStatus: 'paid_advance',
        transactionId: 'BK-TRX-312845',
        notes: 'Sunday challenge',
        createdAt: '2026-10-09T18:00:00Z'
    }
];
export const INITIAL_TOURNAMENTS = [
    {
        id: 'uttara-metro-cup-2026',
        title: 'Dhaka Metro Super Cup',
        edition: 'Season 1 · Inaugural Trophy',
        category: '7-a-side Open Football Championship',
        format: '16 Teams · 4 Groups + Knockouts',
        dates: 'Starting Nov 14 – 16, 2026 (Weekend)',
        registrationDeadline: 'Nov 10, 2026',
        entryFee: 6500,
        prizePool: 60000,
        firstPrize: '৳35,000 + Champions Trophy + Gold Medals',
        runnerUpPrize: '৳20,000 + Runners Trophy + Silver Medals',
        maxTeams: 16,
        registeredCount: 12,
        status: 'fast_filling',
        highlights: [
            'Top Scorer & Best Goalkeeper cash awards + Golden Boot trophy',
            'Live Facebook Streamed Knockout Matches & Professional Commentary',
            'BFF certified match officials & medical first-aid on pitch'
        ],
        rules: [
            '7 players on pitch + up to 4 substitutes (rolling substitutions)',
            '15 minutes each half (30 minutes total)',
            'No metal studs permitted (turf shoes or molded studs only)'
        ]
    },
    {
        id: 'friday-night-blitz',
        title: 'Friday Night Turf Blitz',
        edition: 'Weekly 7-a-side Sprint',
        category: 'Fast-Paced Knockout Under Floodlights',
        format: '8 Teams · Single Elimination',
        dates: 'Every Friday 08:00 PM – 01:00 AM',
        registrationDeadline: 'Thursday Midnight',
        entryFee: 3500,
        prizePool: 22000,
        firstPrize: '৳15,000 Cash + Winners Plaque',
        runnerUpPrize: '৳7,000 Cash + Free 90-Min Turf Slot Voucher',
        maxTeams: 8,
        registeredCount: 6,
        status: 'open',
        highlights: [
            'High-tempo 20-minute matches under 400-lux stadium floodlights',
            'Certified referee and line officials',
            'Hydration station provided for all squad members'
        ],
        rules: [
            '7 players on pitch + up to 3 subs',
            '10 minutes each half with direct penalty shootouts on tie'
        ]
    },
    {
        id: 'corporate-arena-clash',
        title: 'Metro Corporate Clash',
        edition: 'Inter-Company Sports Trophy',
        category: 'Corporate 7v7 Football League',
        format: '12 Corporate Squads · Weekend League',
        dates: 'Dec 05 – 07, 2026',
        registrationDeadline: 'Nov 28, 2026',
        entryFee: 9000,
        prizePool: 80000,
        firstPrize: '৳45,000 + Corporate Cup Trophy + Custom Jerseys',
        runnerUpPrize: '৳25,000 + Silver Plate',
        maxTeams: 12,
        registeredCount: 7,
        status: 'open',
        highlights: [
            'Company ID cards required for all registered employees',
            'Networking lounge with barista coffee & snacks catered',
            'Team photography & highlight reel for corporate PR'
        ],
        rules: [
            'Official company email required during team roster submission',
            'Gentlemen rules: zero tolerance for reckless sliding tackles'
        ]
    }
];
export const INITIAL_COMMUNITY_CHALLENGES = [
    {
        id: 'challenge-1',
        teamName: 'Sector 17 Strikers',
        captainName: 'Tanvir Ahmed',
        captainPhone: '01711-889922',
        courtName: 'Crossbar Metro Arena',
        date: 'Oct 11, 2026',
        timeSlot: '07:30 PM – 09:00 PM (90 Min)',
        format: '7 vs 7 Friendly Match',
        level: 'Semi-Pro',
        lookingFor: 'Opponent Team',
        costShare: '50/50 Split (৳1,600 each)',
        notes: 'Good passing squad, looking for a competitive and respectful 7s squad!'
    },
    {
        id: 'challenge-2',
        teamName: 'Uttara Metro FC',
        captainName: 'Siam Chowdhury',
        captainPhone: '01844-332211',
        courtName: 'Crossbar Metro Arena',
        date: 'Oct 12, 2026',
        timeSlot: '09:00 PM – 10:30 PM (90 Min)',
        format: '7 vs 7 Fast Game',
        level: 'Casual',
        lookingFor: 'Goalkeeper Needed',
        costShare: 'Free for Goalkeeper!',
        notes: 'Need 1 solid goalkeeper who wants regular weekend turf sessions.'
    },
    {
        id: 'challenge-3',
        teamName: 'Apex United',
        captainName: 'Mahir Faisal',
        captainPhone: '01912-774433',
        courtName: 'Crossbar Metro Arena',
        date: 'Oct 13, 2026',
        timeSlot: '06:00 PM – 07:30 PM (90 Min)',
        format: '7 vs 7 Match',
        level: 'Weekend Fun',
        lookingFor: '1-2 Players',
        costShare: '৳300 per player',
        notes: 'Need 2 midfielders to complete our squad for Tuesday evening!'
    }
];
export const INITIAL_EXPENSES = [
    {
        id: 'exp-01',
        category: 'floodlight_electricity',
        title: 'DESCO Commercial Electricity (Floodlights & AC)',
        amount: 14500,
        date: '2026-10-01',
        receiptNote: 'Bill #DESCO-99824 Paid via bKash',
        recordedBy: 'Admin Abid'
    },
    {
        id: 'exp-02',
        category: 'turf_maintenance',
        title: 'Rubber Infill Grooming & Power Brush Servicing',
        amount: 6000,
        date: '2026-10-02',
        receiptNote: 'Monthly infill brushing contractor invoice',
        recordedBy: 'Staff Kabir'
    },
    {
        id: 'exp-03',
        category: 'staff_wages',
        title: 'Turf Groundsmen & Night Security Bi-Weekly Wages',
        amount: 18000,
        date: '2026-10-01',
        receiptNote: '3 ground staff + 1 night guard cash disbursement',
        recordedBy: 'Admin Abid'
    },
    {
        id: 'exp-04',
        category: 'equipment',
        title: '4x Match Balls & 2 Sets Fluorescent Training Bibs',
        amount: 4800,
        date: '2026-10-03',
        receiptNote: 'Stadium sports store Uttara voucher #412',
        recordedBy: 'Staff Kabir'
    },
    {
        id: 'exp-05',
        category: 'cleaning',
        title: 'Changing Room Sanitation, Disinfectants & Waste Bags',
        amount: 2200,
        date: '2026-10-03',
        receiptNote: 'Weekly hygiene consumables',
        recordedBy: 'Staff Kabir'
    }
];
export const INITIAL_INVESTORS = [
    {
        id: 'inv-01',
        name: 'Abid Hasan (Lead Partner)',
        email: 'abid@crossbarmetro.com',
        phone: '01796-337133',
        sharePercentage: 25.0,
        capitalInvested: 2500000,
        joinedDate: '2026-01-15',
        payoutsPaid: 185000,
        status: 'active'
    },
    {
        id: 'inv-02',
        name: 'Rafiqul Islam',
        email: 'rafiqul@metroinvest.bd',
        phone: '01819-556677',
        sharePercentage: 20.0,
        capitalInvested: 2000000,
        joinedDate: '2026-02-01',
        payoutsPaid: 148000,
        status: 'active'
    },
    {
        id: 'inv-03',
        name: 'Tareq Mansoor',
        email: 'tareq.mansoor@gmail.com',
        phone: '01912-334455',
        sharePercentage: 15.0,
        capitalInvested: 1500000,
        joinedDate: '2026-02-15',
        payoutsPaid: 111000,
        status: 'active'
    },
    {
        id: 'inv-04',
        name: 'Zubair Hossain',
        email: 'zubair.hossain@fintechbd.com',
        phone: '01730-889900',
        sharePercentage: 15.0,
        capitalInvested: 1500000,
        joinedDate: '2026-03-01',
        payoutsPaid: 111000,
        status: 'active'
    },
    {
        id: 'inv-05',
        name: 'Nafis Chowdhury',
        email: 'nafis@apexlogistics.com',
        phone: '01678-445566',
        sharePercentage: 10.0,
        capitalInvested: 1000000,
        joinedDate: '2026-03-20',
        payoutsPaid: 74000,
        status: 'active'
    },
    {
        id: 'inv-06',
        name: 'Imtiaz Ahmed',
        email: 'imtiaz.ahmed@investdhaka.org',
        phone: '01755-112233',
        sharePercentage: 5.0,
        capitalInvested: 500000,
        joinedDate: '2026-04-10',
        payoutsPaid: 37000,
        status: 'active'
    },
    {
        id: 'inv-07',
        name: 'Mahmudul Karim',
        email: 'mahmud.karim@capitalbd.com',
        phone: '01844-667788',
        sharePercentage: 5.0,
        capitalInvested: 500000,
        joinedDate: '2026-05-01',
        payoutsPaid: 37000,
        status: 'active'
    }
];
export const INITIAL_PAYOUTS = [
    {
        id: 'payout-01',
        investorId: 'inv-02',
        investorName: 'Rafiqul Islam',
        month: '2026-09',
        amount: 54000,
        datePaid: '2026-10-02',
        paymentMethod: 'bank_transfer',
        transactionNote: 'City Bank AC Transfer #TX88102',
        recordedBy: 'Admin Abid'
    },
    {
        id: 'payout-02',
        investorId: 'inv-03',
        investorName: 'Tareq Mansoor',
        month: '2026-09',
        amount: 40500,
        datePaid: '2026-10-02',
        paymentMethod: 'bank_transfer',
        transactionNote: 'BRAC Bank Transfer #TX88103',
        recordedBy: 'Admin Abid'
    }
];
export const INITIAL_REFUNDS = [
    {
        id: 'ref-01',
        bookingId: 'b-old-99',
        bookingCode: 'CMA-OLD99',
        customerName: 'Shakil Anowar',
        customerPhone: '01711-332211',
        amount: 500,
        reason: 'player_cancelled',
        refundMethod: 'bkash',
        status: 'completed',
        requestDate: '2026-10-01',
        refundedDate: '2026-10-02',
        transactionRef: 'BK-REF-8841',
        recordedBy: 'Admin Abid'
    }
];
export const INITIAL_OTHER_INCOME = [
    {
        id: 'inc-01',
        source: 'shop_sales',
        title: 'Counter Grip Socks & Electrolyte Drinks',
        amount: 3200,
        date: '2026-10-02',
        notes: 'Evening match counter sales',
        recordedBy: 'Staff Kabir'
    },
    {
        id: 'inc-02',
        source: 'event_fees',
        title: 'Uttara Metro Cup Team Registrations (2 Squads)',
        amount: 13000,
        date: '2026-10-03',
        notes: 'bKash Merchant collection',
        recordedBy: 'Admin Abid'
    }
];
export const INITIAL_TEAMS = [
    {
        id: 'team-01',
        name: 'Uttara Metro FC',
        shortCode: 'UMFC',
        captainName: 'Siam Chowdhury',
        captainPhone: '01844-332211',
        homeColor: '#10b981',
        area: 'Sector 17, Uttara',
        stats: { played: 8, won: 6, drawn: 1, lost: 1, gf: 24, ga: 11, points: 19, form: ['W', 'W', 'D', 'W', 'W'] },
        players: [
            { id: 'p1', name: 'Siam Chowdhury', number: 10, position: 'FWD', role: 'Captain', phone: '01844332211', goals: 9, matchesPlayed: 8 },
            { id: 'p2', name: 'Rahim Ullah', number: 1, position: 'GK', role: 'Player', goals: 0, matchesPlayed: 8 },
            { id: 'p3', name: 'Farhan Zahed', number: 4, position: 'DEF', role: 'Vice Captain', goals: 2, matchesPlayed: 7 },
            { id: 'p4', name: 'Nafis Zaman', number: 8, position: 'MID', role: 'Player', goals: 5, matchesPlayed: 8 },
            { id: 'p5', name: 'Saad Al-Din', number: 7, position: 'FWD', role: 'Player', goals: 6, matchesPlayed: 8 },
            { id: 'p6', name: 'Tanvir Hossain', number: 6, position: 'MID', role: 'Player', goals: 1, matchesPlayed: 6 },
            { id: 'p7', name: 'Adnan Sami', number: 3, position: 'DEF', role: 'Player', goals: 1, matchesPlayed: 7 }
        ]
    },
    {
        id: 'team-02',
        name: 'Sector 17 Strikers',
        shortCode: 'S17S',
        captainName: 'Tanvir Ahmed',
        captainPhone: '01711-889922',
        homeColor: '#38bdf8',
        area: 'Sector 17, Uttara',
        stats: { played: 8, won: 5, drawn: 2, lost: 1, gf: 21, ga: 12, points: 17, form: ['W', 'D', 'W', 'W', 'L'] },
        players: [
            { id: 'p10', name: 'Tanvir Ahmed', number: 9, position: 'FWD', role: 'Captain', phone: '01711889922', goals: 8, matchesPlayed: 8 },
            { id: 'p11', name: 'Kawsar Mahmud', number: 1, position: 'GK', role: 'Player', goals: 0, matchesPlayed: 8 },
            { id: 'p12', name: 'Rubel Mia', number: 5, position: 'DEF', role: 'Vice Captain', goals: 1, matchesPlayed: 8 },
            { id: 'p13', name: 'Tamim Iqbal', number: 11, position: 'FWD', role: 'Player', goals: 7, matchesPlayed: 8 },
            { id: 'p14', name: 'Ashiqur Rahman', number: 8, position: 'MID', role: 'Player', goals: 3, matchesPlayed: 8 }
        ]
    },
    {
        id: 'team-03',
        name: 'Dhaka Kings FC',
        shortCode: 'DKFC',
        captainName: 'Rahat Karim',
        captainPhone: '01712-445566',
        homeColor: '#f59e0b',
        area: 'Mirpur DOHS',
        stats: { played: 8, won: 4, drawn: 2, lost: 2, gf: 18, ga: 14, points: 14, form: ['W', 'L', 'D', 'W', 'D'] },
        players: [
            { id: 'p20', name: 'Rahat Karim', number: 7, position: 'FWD', role: 'Captain', phone: '01712445566', goals: 7, matchesPlayed: 8 },
            { id: 'p21', name: 'Shakil Anowar', number: 10, position: 'MID', role: 'Player', goals: 4, matchesPlayed: 8 },
            { id: 'p22', name: 'Hasib Hasan', number: 3, position: 'DEF', role: 'Vice Captain', goals: 1, matchesPlayed: 7 }
        ]
    },
    {
        id: 'team-04',
        name: 'Banani Velocity',
        shortCode: 'BVFC',
        captainName: 'Sharif Hossain',
        captainPhone: '01923-112233',
        homeColor: '#ef4444',
        area: 'Banani, Dhaka',
        stats: { played: 8, won: 3, drawn: 1, lost: 4, gf: 14, ga: 17, points: 10, form: ['L', 'W', 'L', 'L', 'W'] },
        players: [
            { id: 'p30', name: 'Sharif Hossain', number: 10, position: 'FWD', role: 'Captain', goals: 5, matchesPlayed: 8 }
        ]
    }
];
export const INITIAL_MATCH_RESULTS = [
    {
        id: 'match-101',
        date: '2026-10-09',
        slotDisplay: '07:30 PM – 09:00 PM',
        courtName: 'Crossbar Metro Arena (Main Turf)',
        homeTeam: 'Uttara Metro FC',
        awayTeam: 'Sector 17 Strikers',
        homeScore: 4,
        awayScore: 3,
        scorers: [
            { playerName: 'Siam Chowdhury', teamName: 'Uttara Metro FC', minute: 14 },
            { playerName: 'Tanvir Ahmed', teamName: 'Sector 17 Strikers', minute: 22 },
            { playerName: 'Saad Al-Din', teamName: 'Uttara Metro FC', minute: 37 },
            { playerName: 'Tamim Iqbal', teamName: 'Sector 17 Strikers', minute: 51 },
            { playerName: 'Siam Chowdhury', teamName: 'Uttara Metro FC', minute: 68 },
            { playerName: 'Tanvir Ahmed', teamName: 'Sector 17 Strikers', minute: 74 },
            { playerName: 'Nafis Zaman', teamName: 'Uttara Metro FC', minute: 86 }
        ],
        yellowCards: 2,
        redCards: 0,
        playerOfTheMatch: 'Siam Chowdhury (Uttara Metro FC)',
        matchReport: 'Thrilling 7-goal thriller under the lights. Siam Chowdhury scored a decisive brace to earn Uttara Metro FC all three points.',
        teamPhoto: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
        matchType: '7v7 Championship Night',
        postedBy: 'Captain Siam Chowdhury',
        postedAt: '2026-10-09T21:15:00Z',
        status: 'published'
    },
    {
        id: 'match-102',
        date: '2026-10-08',
        slotDisplay: '09:00 PM – 10:30 PM',
        courtName: 'Crossbar Metro Arena (Main Turf)',
        homeTeam: 'Dhaka Kings FC',
        awayTeam: 'Banani Velocity',
        homeScore: 5,
        awayScore: 2,
        scorers: [
            { playerName: 'Rahat Karim', teamName: 'Dhaka Kings FC', minute: 12 },
            { playerName: 'Rahat Karim', teamName: 'Dhaka Kings FC', minute: 28 },
            { playerName: 'Sharif Hossain', teamName: 'Banani Velocity', minute: 40 },
            { playerName: 'Shakil Anowar', teamName: 'Dhaka Kings FC', minute: 55 },
            { playerName: 'Sharif Hossain', teamName: 'Banani Velocity', minute: 71 },
            { playerName: 'Rahat Karim', teamName: 'Dhaka Kings FC', minute: 82 }
        ],
        yellowCards: 1,
        redCards: 0,
        playerOfTheMatch: 'Rahat Karim (Dhaka Kings FC)',
        matchReport: 'Hat-trick hero Rahat Karim led Dhaka Kings FC to an emphatic victory against Banani Velocity.',
        teamPhoto: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
        matchType: '7v7 League Fixture',
        postedBy: 'Captain Rahat Karim',
        postedAt: '2026-10-08T22:45:00Z',
        status: 'published'
    }
];
export const INITIAL_SHOP_PRODUCTS = [
    {
        id: 'shop-01',
        name: 'Crossbar Metro Pro Anti-Slip Grip Socks',
        category: 'accessories',
        price: 450,
        salePrice: 350,
        stock: 24,
        sizes: ['One Size (EUR 39-45)'],
        badge: 'Best Seller',
        description: 'Silicone anti-slip pads designed for maximum traction and blister prevention on synthetic turf.',
        specs: ['Breathable mesh instep', 'Cushioned heel & toe', 'One size fits all (EUR 39-45)', 'Black / Emerald Green accent'],
        inStock: true,
        featured: true,
        visible: true,
        image: 'https://images.unsplash.com/photo-1582965372481-87a641198547?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'shop-02',
        name: 'Nike Aerowsculpt FIFA Quality Pro Turf Ball',
        category: 'balls',
        price: 3600,
        salePrice: 3200,
        stock: 12,
        sizes: ['Size 5 Standard'],
        badge: 'Official Match Ball',
        description: 'Thermo-bonded 12-panel construction for true aerodynamic flight and consistent turf bounce.',
        specs: ['Size 5 standard', 'High-abrasion PU cover', 'Reinforced butyl bladder', 'Designed for floodlit night matches'],
        inStock: true,
        featured: true,
        visible: true,
        image: 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'shop-03',
        name: 'Crossbar Metro Official Arena Jersey (2026/27)',
        category: 'apparel',
        price: 1050,
        salePrice: 850,
        stock: 18,
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        badge: 'Limited Edition',
        description: 'Lightweight sweat-wicking dri-fit jersey featuring the Crossbar Metro crest and metro line graphic.',
        specs: ['100% Recycled Polyester', 'Breathable side mesh panels', 'Sizes: S, M, L, XL, XXL', 'Optional squad number print at counter'],
        inStock: true,
        featured: true,
        visible: true,
        image: 'https://images.unsplash.com/photo-1577212017184-80cc0da11082?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'shop-04',
        name: 'Puma Ultra Play Cage Artificial Ground Boots (AG/TF)',
        category: 'footwear',
        price: 5400,
        salePrice: 4900,
        stock: 8,
        sizes: ['EUR 40', 'EUR 41', 'EUR 42', 'EUR 43', 'EUR 44'],
        badge: 'Pro Choice',
        description: 'Low-profile multi-studded rubber outsole engineered specifically for artificial grass surfaces.',
        specs: ['Lightweight synthetic upper', 'Non-marking multi-stud rubber sole', 'Shock-absorbing EVA midsole', 'Available sizes: 40, 41, 42, 43, 44'],
        inStock: true,
        featured: false,
        visible: true,
        image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'shop-05',
        name: 'Low-Profile Carbon-Fiber Style Shin Guards',
        category: 'accessories',
        price: 550,
        salePrice: 450,
        stock: 15,
        sizes: ['Standard Adult'],
        badge: 'Must Have',
        description: 'Ergonomic anatomical shell with EVA backing for lightweight impact protection during tough tackles.',
        specs: ['Includes compression sleeves', 'Featherlight 45g weight', 'Anatomical left/right fit', 'Impact dispersal shell'],
        inStock: true,
        featured: false,
        visible: true,
        image: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'shop-06',
        name: 'Chilled Isotonic Electrolyte Drink (500ml)',
        category: 'drinks',
        price: 140,
        salePrice: 120,
        stock: 50,
        sizes: ['500ml Chilled Bottle'],
        badge: 'Hydration',
        description: 'Rapid rehydration with sodium, potassium, and magnesium to prevent match cramps.',
        specs: ['Chilled at 4°C at counter', 'Citrus burst flavor', 'Zero added preservatives', 'Instant pickup at arena shop'],
        inStock: true,
        featured: true,
        visible: true,
        image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80'
    }
];
export const INITIAL_SMS_LOGS = [
    {
        id: 'sms-001',
        recipientPhone: '01712-445566',
        message: 'Crossbar Metro: Booking CMA-7KQ2PX confirmed for 10-Oct 07:30 PM. Paid ৳500 advance, due ৳3,850 at turf.',
        event: 'booking_confirmed',
        provider: 'SSLWireless',
        sentAt: '2026-10-09T14:30:15Z',
        status: 'delivered'
    },
    {
        id: 'sms-002',
        recipientPhone: '01844-332211',
        message: 'Crossbar Metro: Booking CMA-4NW89M confirmed for 10-Oct 09:00 PM. Paid in full (৳4,150). See you on turf!',
        event: 'booking_confirmed',
        provider: 'SSLWireless',
        sentAt: '2026-10-09T16:00:22Z',
        status: 'delivered'
    }
];
export const INITIAL_GALLERY_PHOTOS = [
    {
        id: 'g1',
        title: 'Floodlit Night Championship Final',
        album: 'Matches',
        caption: 'Pro 400-Lux stadium LED floodlights in action during Friday night 7v7 championship final.',
        url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
        aspect: 'wide',
        featured: true,
        uploadedAt: '2026-10-08',
        photographer: 'Admin Media Desk',
        tags: ['NightDerby', 'Floodlights400Lux', '7v7Final']
    },
    {
        id: 'g2',
        title: 'Metro Rail Viaduct Skyline View',
        album: 'Arena',
        caption: 'MRT Line-6 train passing directly beside the arena enclosure as dusk settles over Sector 17 Uttara.',
        url: 'https://images.unsplash.com/photo-1529900240041-22f1ff5d8793?auto=format&fit=crop&w=1200&q=80',
        aspect: 'wide',
        featured: true,
        uploadedAt: '2026-10-07',
        photographer: 'CMA Drone Unit',
        tags: ['MRTLine6', 'UttaraSector17', 'Skyline']
    },
    {
        id: 'g3',
        title: 'Uttara Metro Super Cup Trophy Kickoff',
        album: 'Tournaments',
        caption: 'BFF certified officials and captains during the coin toss at inaugural season tournament opening.',
        url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
        aspect: 'wide',
        featured: true,
        uploadedAt: '2026-10-06',
        photographer: 'Arena Media Team',
        tags: ['SuperCup', 'BFFReferees', 'Kickoff']
    },
    {
        id: 'g4',
        title: 'FIFA Standard 50mm Shock-Pad Turf Close-up',
        album: 'Arena',
        caption: 'High-density monofilament artificial grass with eco-friendly rubber infill for natural ball bounce.',
        url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80',
        aspect: 'square',
        featured: false,
        uploadedAt: '2026-10-05',
        photographer: 'Technical Maintenance',
        tags: ['FIFAStandard', 'ShockPad', 'GrassDetail']
    },
    {
        id: 'g5',
        title: 'Squad Warm-Up & Player Dugouts',
        album: 'Facilities',
        caption: 'Weather-protected player pavilion with covered dugout benches and digital electronic match clock.',
        url: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80',
        aspect: 'square',
        featured: false,
        uploadedAt: '2026-10-04',
        photographer: 'Staff Kabir',
        tags: ['Dugout', 'Pavilion', 'Warmup']
    },
    {
        id: 'g6',
        title: 'Friday Night Turf Blitz Knockouts',
        album: 'Tournaments',
        caption: 'High-tempo tournament action under the floodlights with live commentary and spectators.',
        url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80',
        aspect: 'wide',
        featured: true,
        uploadedAt: '2026-10-03',
        photographer: 'Media Crew',
        tags: ['FridayBlitz', 'Knockouts', 'Crowd']
    },
    {
        id: 'g7',
        title: 'Sector 17 Strikers vs Uttara Metro FC Scrimmage',
        album: 'Matches',
        caption: 'Captains competing for ball possession in an intense competitive 90-minute derby fixture.',
        url: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80',
        aspect: 'wide',
        featured: true,
        uploadedAt: '2026-10-02',
        photographer: 'Sports Photographers BD',
        tags: ['Derby', 'Sector17Strikers', 'MatchHighlights']
    },
    {
        id: 'g8',
        title: 'Crossbar Sports Shop & Reception Pavilion',
        album: 'Facilities',
        caption: 'In-house pro shop featuring official grip socks, FIFA balls, and chilled electrolyte hydration.',
        url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
        aspect: 'square',
        featured: false,
        uploadedAt: '2026-10-01',
        photographer: 'Front Desk',
        tags: ['ProShop', 'GripSocks', 'Hydration']
    }
];
