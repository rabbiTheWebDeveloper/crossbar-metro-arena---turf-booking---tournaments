import { Court, Tournament, BookingAddOn, CommunityMatchChallenge, Booking } from '../types';

export const VENUE_INFO = {
  name: 'Crossbar Metro Arena',
  tagline: 'Premium Outdoor Turf for Football & Sports Events',
  phone: '01796-337133',
  phoneFormatted: '+880 1796-337133',
  whatsappUrl: 'https://wa.me/8801796337133?text=Hi%20Crossbar%20Metro%20Arena%2C%20I%20want%20to%20inquire%20about%20booking%20a%20slot!',
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
    nightPrice: 3000,
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
    dayPrice: 1600,
    nightPrice: 2400,
    recommendedPlayers: '10 - 12 Players (5v5 / 6v6)',
    features: [
      'Rebound Perimeter Boards for Non-stop Action',
      'Pro Floodlit Night Coverage',
      'Dedicated Team Warmup Zone',
      'Ideal for Quick 1-Hour Evening Scrimmages'
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
    dayPrice: 3500,
    nightPrice: 5000,
    recommendedPlayers: 'Up to 60+ Attendees / Entire Squad',
    features: [
      'Dual Pitch Simultaneous Access',
      'PA Sound System & Commentary Mic',
      'Event Coordinator & Match Officials Desk',
      'Private Lounge & VIP Dugouts'
    ]
  }
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
    runnerUpPrize: '৳7,000 Cash + Free 2-Hour Turf Slot Voucher',
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
    date: 'Tomorrow, Oct 04',
    timeSlot: '08:00 PM - 09:00 PM',
    format: '7 vs 7 Friendly Match',
    level: 'Semi-Pro',
    lookingFor: 'Opponent Team',
    costShare: '50/50 Split (৳1,500 each)',
    notes: 'Good passing squad, looking for a competitive and respectful 7s squad!'
  },
  {
    id: 'challenge-2',
    teamName: 'Uttara Metro FC',
    captainName: 'Siam Chowdhury',
    captainPhone: '01844-332211',
    courtName: 'Pitch Bravo (5v5)',
    date: 'Saturday, Oct 05',
    timeSlot: '09:00 PM - 10:00 PM',
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
    date: 'Sunday, Oct 06',
    timeSlot: '07:00 PM - 08:00 PM',
    format: '7 vs 7 Match',
    level: 'Weekend Fun',
    lookingFor: '1-2 Players',
    costShare: '৳250 per player',
    notes: 'Two of our regulars are stuck at work, need 2 midfielders to complete the 7s!'
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b-001',
    bookingCode: 'CMA-9142',
    courtId: 'pitch-alpha',
    courtName: 'Pitch Alpha (Main Arena)',
    date: '2026-10-04',
    startTime: '19:00',
    endTime: '20:00',
    displayTime: '07:00 PM - 08:00 PM',
    captainName: 'Rahat Karim',
    captainPhone: '01712-445566',
    teamName: 'Dhaka Kings FC',
    playerCount: 14,
    matchType: 'friendly',
    addOns: [BOOKING_ADDONS[0], BOOKING_ADDONS[1]],
    courtPrice: 3000,
    addOnsPrice: 350,
    totalPrice: 3350,
    paymentMethod: 'bkash',
    paymentStatus: 'paid_full',
    notes: 'Birthday match for captain',
    createdAt: '2026-10-02T14:30:00Z'
  },
  {
    id: 'b-002',
    bookingCode: 'CMA-8831',
    courtId: 'pitch-bravo',
    courtName: 'Pitch Bravo (Speed Cage)',
    date: '2026-10-04',
    startTime: '21:00',
    endTime: '22:00',
    displayTime: '09:00 PM - 10:00 PM',
    captainName: 'Arafat Hossain',
    captainPhone: '01899-771122',
    teamName: 'Metro Velocity 5s',
    playerCount: 10,
    matchType: 'competitive',
    addOns: [BOOKING_ADDONS[1]],
    courtPrice: 2400,
    addOnsPrice: 150,
    totalPrice: 2550,
    paymentMethod: 'pay_at_turf',
    paymentStatus: 'confirmed_unpaid',
    notes: 'Need bibs if possible',
    createdAt: '2026-10-03T09:15:00Z'
  }
];
