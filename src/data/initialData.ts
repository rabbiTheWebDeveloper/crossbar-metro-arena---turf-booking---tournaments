import {
  Court,
  Tournament,
  BookingAddOn,
  CommunityMatchChallenge,
  Booking,
  PricingConfig,
  ExpenseRecord,
  InvestorRecord,
  PlayerTeam,
  MatchDayResult,
  ShopProduct
} from '../types';

export const VENUE_INFO = {
  name: 'Crossbar Metro Arena',
  tagline: 'Dhaka’s Premier Floodlit Outdoor Turf',
  phone: '01796-337133',
  phoneFormatted: '+880 1796-337133',
  whatsappUrl: 'https://wa.me/8801796337133?text=Hi%20Crossbar%20Metro%20Arena%2C%20I%20want%20to%20book%20a%20slot!',
  email: 'bookcrossbar@gmail.com',
  address: 'Uttara Metro Center, Sector 17, Dhaka, Bangladesh, 1230',
  metroStation: 'Uttara Center Metro Station (MRT Line-6)',
  metroDetails: 'Directly adjacent to Metro Rail viaduct & station entrance (2 min walk)',
  website: 'bookcrossbar.com',
  facebook: 'https://www.facebook.com/crossbarmetroarena',
  coordinates: {
    lat: 23.8762,
    lng: 90.3792
  }
};

export const COURTS: Court[] = [
  {
    id: 'pitch-alpha',
    name: 'Pitch Alpha (Main Arena)',
    code: 'PITCH-A',
    tagline: 'Full 7v7 Championship Turf with Metro Viaduct View',
    format: '7 vs 7',
    dimensions: '120ft x 75ft (FIFA Standard Small-Sided)',
    turfType: '50mm Monofilament Shock-Pad Artificial Grass with Cool-Infill',
    dayPrice: 2000,
    nightPrice: 3200,
    recommendedPlayers: '14 - 16 Players (7v7 / 8v8)',
    features: [
      'Pro 400-Lux High-Mast LED Floodlighting',
      'Electronic Digital Scoreboard & Match Clock',
      'Player Dugouts with Covered Benches',
      'High-impact Heavy Duty Enclosure Netting',
      'Direct Metro Train Skyline View'
    ]
  },
  {
    id: 'pitch-bravo',
    name: 'Pitch Bravo (Speed Cage)',
    code: 'PITCH-B',
    tagline: 'High-Tempo 5v5 / 6v6 Fast Pace Turf with Rebound Walls',
    format: '5 vs 5',
    dimensions: '90ft x 55ft',
    turfType: 'High-Density 45mm Turf with Enhanced Ball Roll Control',
    dayPrice: 1800,
    nightPrice: 2600,
    recommendedPlayers: '10 - 12 Players (5v5 / 6v6)',
    features: [
      'Rebound Perimeter Boards for Non-stop Action',
      'Pro Floodlit Night Coverage',
      'Dedicated Team Warmup Zone',
      'Ideal for Quick 90-Min Scrimmages'
    ]
  },
  {
    id: 'full-arena',
    name: 'Full Arena (Combined Buyout)',
    code: 'ALL-ARENA',
    tagline: 'Exclusive Booking for Tournaments, Corporate Cups & Events',
    format: 'Multi-Format',
    dimensions: 'Dual Pitches + Player Pavilion + Viewing Deck',
    turfType: 'Complete Crossbar Metro Sports Complex',
    dayPrice: 3800,
    nightPrice: 5500,
    recommendedPlayers: 'Up to 60+ Attendees / Entire Squad',
    features: [
      'Dual Pitch Simultaneous Access',
      'PA Sound System & Commentary Mic',
      'Event Coordinator & Match Officials Desk',
      'Private Lounge & VIP Dugouts'
    ]
  }
];

export const DEFAULT_PRICING: PricingConfig = {
  morningSlotPrice: 2000,   // Slots 1 - 4 (06:00 - 12:00)
  afternoonSlotPrice: 2400, // Slots 5 - 8 (12:00 - 18:00)
  eveningSlotPrice: 3200,   // Slots 9 - 12 (18:00 - 00:00 Floodlight Prime)
  weekendSurcharge: 500     // Friday & Saturday surcharge
};

// 12 slots a day, 90 minutes each, from 6 AM to 12 AM (Midnight)
export const SCHEDULE_SLOTS_DEFINITION = [
  { slotNumber: 1, startTime: '06:00', endTime: '07:30', displayTime: '06:00 AM - 07:30 AM', period: 'morning' as const },
  { slotNumber: 2, startTime: '07:30', endTime: '09:00', displayTime: '07:30 AM - 09:00 AM', period: 'morning' as const },
  { slotNumber: 3, startTime: '09:00', endTime: '10:30', displayTime: '09:00 AM - 10:30 AM', period: 'morning' as const },
  { slotNumber: 4, startTime: '10:30', endTime: '12:00', displayTime: '10:30 AM - 12:00 PM', period: 'morning' as const },
  { slotNumber: 5, startTime: '12:00', endTime: '13:30', displayTime: '12:00 PM - 01:30 PM', period: 'afternoon' as const },
  { slotNumber: 6, startTime: '13:30', endTime: '15:00', displayTime: '01:30 PM - 03:00 PM', period: 'afternoon' as const },
  { slotNumber: 7, startTime: '15:00', endTime: '16:30', displayTime: '03:00 PM - 04:30 PM', period: 'afternoon' as const },
  { slotNumber: 8, startTime: '16:30', endTime: '18:00', displayTime: '04:30 PM - 06:00 PM', period: 'afternoon' as const },
  { slotNumber: 9, startTime: '18:00', endTime: '19:30', displayTime: '06:00 PM - 07:30 PM', period: 'evening' as const },
  { slotNumber: 10, startTime: '19:30', endTime: '21:00', displayTime: '07:30 PM - 09:00 PM', period: 'evening' as const },
  { slotNumber: 11, startTime: '21:00', endTime: '22:30', displayTime: '09:00 PM - 10:30 PM', period: 'evening' as const },
  { slotNumber: 12, startTime: '22:30', endTime: '24:00', displayTime: '10:30 PM - 12:00 AM', period: 'evening' as const }
];

export const BOOKING_ADDONS: BookingAddOn[] = [
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

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b-001',
    bookingCode: 'CMA-9142',
    courtId: 'pitch-alpha',
    courtName: 'Pitch Alpha (Main Arena)',
    date: '2026-10-04',
    slotNumber: 10,
    startTime: '19:30',
    endTime: '21:00',
    displayTime: '07:30 PM - 09:00 PM',
    captainName: 'Rahat Karim',
    captainPhone: '01712-445566',
    teamName: 'Dhaka Kings FC',
    playerCount: 14,
    matchType: 'friendly',
    addOns: [BOOKING_ADDONS[0], BOOKING_ADDONS[1]],
    courtPrice: 3200,
    addOnsPrice: 350,
    totalPrice: 3550,
    paymentType: 'advance_500',
    advanceAmount: 500,
    dueAmount: 3050,
    paymentMethod: 'bkash',
    paymentStatus: 'paid_advance',
    notes: 'Arriving 15 min early for warmup',
    createdAt: '2026-10-02T14:30:00Z'
  },
  {
    id: 'b-002',
    bookingCode: 'CMA-8831',
    courtId: 'pitch-bravo',
    courtName: 'Pitch Bravo (Speed Cage)',
    date: '2026-10-04',
    slotNumber: 11,
    startTime: '21:00',
    endTime: '22:30',
    displayTime: '09:00 PM - 10:30 PM',
    captainName: 'Arafat Hossain',
    captainPhone: '01899-771122',
    teamName: 'Metro Velocity 5s',
    playerCount: 10,
    matchType: 'competitive',
    addOns: [BOOKING_ADDONS[1]],
    courtPrice: 2600,
    addOnsPrice: 150,
    totalPrice: 2750,
    paymentType: 'full_payment',
    advanceAmount: 2750,
    dueAmount: 0,
    paymentMethod: 'nagad',
    paymentStatus: 'paid_full',
    notes: 'Need match ball at kickoff',
    createdAt: '2026-10-03T09:15:00Z'
  },
  {
    id: 'b-003',
    bookingCode: 'CMA-7429',
    courtId: 'pitch-alpha',
    courtName: 'Pitch Alpha (Main Arena)',
    date: '2026-10-05',
    slotNumber: 9,
    startTime: '18:00',
    endTime: '19:30',
    displayTime: '06:00 PM - 07:30 PM',
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
    notes: 'Friday night prime challenge',
    createdAt: '2026-10-03T18:00:00Z'
  }
];

export const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: 'uttara-metro-cup-2026',
    title: 'Dhaka Metro Super Cup',
    edition: 'Inaugural Launch Edition · Season 1',
    category: '7-a-side Open Football Championship',
    format: '16 Teams · 4 Groups + Knockouts',
    dates: 'Starting Nov 14 - 16, 2026 (Weekend)',
    registrationDeadline: 'Nov 10, 2026',
    entryFee: 6500,
    prizePool: 60000,
    firstPrize: '৳35,000 + Champions Trophy + Gold Medals',
    runnerUpPrize: '৳20,000 + Runners Trophy + Silver Medals',
    maxTeams: 16,
    registeredCount: 11,
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
    edition: 'Weekly 5-a-side Sprint',
    category: 'Fast-Paced 5v5 Knockout',
    format: '8 Teams · Single Elimination · Under Floodlights',
    dates: 'Every Friday 08:00 PM - 01:00 AM',
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
      'Rebound boards in play for nonstop fast football',
      'Hydration station provided for all squad members'
    ],
    rules: [
      '5 players on pitch + up to 3 subs',
      '10 minutes each half with direct penalty shootouts on tie'
    ]
  },
  {
    id: 'corporate-arena-clash',
    title: 'Metro Corporate Clash',
    edition: 'Inter-Company Sports Trophy',
    category: 'Corporate 6v6 Football League',
    format: '12 Corporate Squads · Weekend League',
    dates: 'Dec 05 - 07, 2026',
    registrationDeadline: 'Nov 28, 2026',
    entryFee: 9000,
    prizePool: 80000,
    firstPrize: '৳45,000 + Corporate Cup Trophy + Custom Jerseys',
    runnerUpPrize: '৳25,000 + Silver Plate',
    maxTeams: 12,
    registeredCount: 5,
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

export const INITIAL_COMMUNITY_CHALLENGES: CommunityMatchChallenge[] = [
  {
    id: 'challenge-1',
    teamName: 'Sector 17 Strikers',
    captainName: 'Tanvir Ahmed',
    captainPhone: '01711-889922',
    courtName: 'Pitch Alpha (7v7)',
    date: 'Oct 05, 2026',
    timeSlot: '07:30 PM - 09:00 PM (90 Min)',
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
    courtName: 'Pitch Bravo (5v5)',
    date: 'Oct 06, 2026',
    timeSlot: '09:00 PM - 10:30 PM (90 Min)',
    format: '5 vs 5 Fast Game',
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
    courtName: 'Pitch Alpha (7v7)',
    date: 'Oct 07, 2026',
    timeSlot: '06:00 PM - 07:30 PM (90 Min)',
    format: '7 vs 7 Match',
    level: 'Weekend Fun',
    lookingFor: '1-2 Players',
    costShare: '৳300 per player',
    notes: 'Need 2 midfielders to complete our squad for Tuesday evening!'
  }
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-01',
    category: 'floodlight_electricity',
    title: 'DESCO Commercial Electricity (Floodlights & Air Con)',
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

// Up to 10 Investors
export const INITIAL_INVESTORS: InvestorRecord[] = [
  {
    id: 'inv-01',
    name: 'Abid Hasan (Lead Partner)',
    email: 'abid@crossbarmetro.com',
    phone: '01711-223344',
    sharePercentage: 25.0,
    capitalInvested: 2500000,
    joinedDate: '2026-01-15',
    payoutsPaid: 185000
  },
  {
    id: 'inv-02',
    name: 'Rafiqul Islam',
    email: 'rafiqul@metroinvest.bd',
    phone: '01819-556677',
    sharePercentage: 20.0,
    capitalInvested: 2000000,
    joinedDate: '2026-02-01',
    payoutsPaid: 148000
  },
  {
    id: 'inv-03',
    name: 'Tareq Mansoor',
    email: 'tareq.mansoor@gmail.com',
    phone: '01912-334455',
    sharePercentage: 15.0,
    capitalInvested: 1500000,
    joinedDate: '2026-02-15',
    payoutsPaid: 111000
  },
  {
    id: 'inv-04',
    name: 'Zubair Hossain',
    email: 'zubair.hossain@fintechbd.com',
    phone: '01730-889900',
    sharePercentage: 15.0,
    capitalInvested: 1500000,
    joinedDate: '2026-03-01',
    payoutsPaid: 111000
  },
  {
    id: 'inv-05',
    name: 'Nafis Chowdhury',
    email: 'nafis@apexlogistics.com',
    phone: '01678-445566',
    sharePercentage: 10.0,
    capitalInvested: 1000000,
    joinedDate: '2026-03-20',
    payoutsPaid: 74000
  },
  {
    id: 'inv-06',
    name: 'Imtiaz Ahmed',
    email: 'imtiaz.ahmed@investdhaka.org',
    phone: '01755-112233',
    sharePercentage: 5.0,
    capitalInvested: 500000,
    joinedDate: '2026-04-10',
    payoutsPaid: 37000
  },
  {
    id: 'inv-07',
    name: 'Mahmudul Karim',
    email: 'mahmud.karim@capitalbd.com',
    phone: '01844-667788',
    sharePercentage: 5.0,
    capitalInvested: 500000,
    joinedDate: '2026-05-01',
    payoutsPaid: 37000
  }
];

export const INITIAL_TEAMS: PlayerTeam[] = [
  {
    id: 'team-01',
    name: 'Uttara Metro FC',
    shortCode: 'UMFC',
    captainName: 'Siam Chowdhury',
    captainPhone: '01844-332211',
    homeColor: '#10b981',
    stats: { played: 8, won: 6, drawn: 1, lost: 1, gf: 24, ga: 11, points: 19 },
    players: [
      { id: 'p1', name: 'Siam Chowdhury', number: 10, position: 'FWD', role: 'Captain', goals: 9, matchesPlayed: 8 },
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
    stats: { played: 8, won: 5, drawn: 2, lost: 1, gf: 21, ga: 12, points: 17 },
    players: [
      { id: 'p10', name: 'Tanvir Ahmed', number: 9, position: 'FWD', role: 'Captain', goals: 8, matchesPlayed: 8 },
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
    stats: { played: 8, won: 4, drawn: 2, lost: 2, gf: 18, ga: 14, points: 14 },
    players: [
      { id: 'p20', name: 'Rahat Karim', number: 7, position: 'FWD', role: 'Captain', goals: 7, matchesPlayed: 8 },
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
    stats: { played: 8, won: 3, drawn: 1, lost: 4, gf: 14, ga: 17, points: 10 },
    players: [
      { id: 'p30', name: 'Sharif Hossain', number: 10, position: 'FWD', role: 'Captain', goals: 5, matchesPlayed: 8 }
    ]
  }
];

export const INITIAL_MATCH_RESULTS: MatchDayResult[] = [
  {
    id: 'match-101',
    date: '2026-10-03',
    slotDisplay: '07:30 PM - 09:00 PM',
    courtName: 'Pitch Alpha (Main Arena)',
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
    matchType: '7v7 Championship Night',
    postedBy: 'Captain Siam Chowdhury',
    postedAt: '2026-10-03T21:15:00Z'
  },
  {
    id: 'match-102',
    date: '2026-10-02',
    slotDisplay: '09:00 PM - 10:30 PM',
    courtName: 'Pitch Bravo (Speed Cage)',
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
    matchType: '5v5 High-Tempo Scrimmage',
    postedBy: 'Captain Rahat Karim',
    postedAt: '2026-10-02T22:45:00Z'
  }
];

export const INITIAL_SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: 'shop-01',
    name: 'Crossbar Metro Pro Anti-Slip Grip Socks',
    category: 'accessories',
    price: 350,
    badge: 'Best Seller',
    description: 'Silicone anti-slip pads designed for maximum traction and blister prevention on synthetic turf.',
    specs: ['Breathable mesh instep', 'Cushioned heel & toe', 'One size fits all (EUR 39-45)', 'Black / Emerald Green accent'],
    inStock: true
  },
  {
    id: 'shop-02',
    name: 'Nike Aerowsculpt FIFA Quality Pro Turf Ball',
    category: 'balls',
    price: 3200,
    badge: 'Official Match Ball',
    description: 'Thermo-bonded 12-panel construction for true aerodynamic flight and consistent turf bounce.',
    specs: ['Size 5 standard', 'High-abrasion PU cover', 'Reinforced butyl bladder', 'Designed for floodlit night matches'],
    inStock: true
  },
  {
    id: 'shop-03',
    name: 'Crossbar Metro Official Arena Jersey (2026/27)',
    category: 'apparel',
    price: 850,
    badge: 'Limited Edition',
    description: 'Lightweight sweat-wicking dri-fit jersey featuring the Crossbar Metro crest and metro line graphic.',
    specs: ['100% Recycled Polyester', 'Breathable side mesh panels', 'Sizes: S, M, L, XL, XXL', 'Optional squad number print at counter'],
    inStock: true
  },
  {
    id: 'shop-04',
    name: 'Puma Ultra Play Cage Artificial Ground Boots (AG/TF)',
    category: 'footwear',
    price: 4900,
    badge: 'Pro Choice',
    description: 'Low-profile multi-studded rubber outsole engineered specifically for artificial grass surfaces.',
    specs: ['Lightweight synthetic upper', 'Non-marking multi-stud rubber sole', 'Shock-absorbing EVA midsole', 'Available sizes: 40, 41, 42, 43, 44'],
    inStock: true
  },
  {
    id: 'shop-05',
    name: 'Low-Profile Carbon-Fiber Style Shin Guards',
    category: 'accessories',
    price: 450,
    badge: 'Must Have',
    description: 'Ergonomic anatomical shell with EVA backing for lightweight impact protection during tough tackles.',
    specs: ['Includes compression sleeves', 'Featherlight 45g weight', 'Anatomical left/right fit', 'Impact dispersal shell'],
    inStock: true
  },
  {
    id: 'shop-06',
    name: 'Chilled Isotonic Electrolyte Drink (500ml)',
    category: 'drinks',
    price: 120,
    badge: 'Hydration',
    description: 'Rapid rehydration with sodium, potassium, and magnesium to prevent match cramps.',
    specs: ['Chilled at 4°C at counter', 'Citrus burst flavor', 'Zero added preservatives', 'Instant pickup at arena shop'],
    inStock: true
  }
];
