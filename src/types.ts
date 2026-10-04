export interface Court {
  id: string;
  name: string;
  code: string;
  tagline: string;
  format: '7 vs 7' | '5 vs 5' | 'Multi-Format';
  dimensions: string;
  turfType: string;
  dayPrice: number;    // BDT base
  nightPrice: number;  // BDT prime
  features: string[];
  recommendedPlayers: string;
}

export interface PricingConfig {
  morningSlotPrice: number;   // 06:00 - 12:00 (Slots 1-4)
  afternoonSlotPrice: number; // 12:00 - 18:00 (Slots 5-8)
  eveningSlotPrice: number;   // 18:00 - 00:00 (Slots 9-12)
  weekendSurcharge: number;   // Additional BDT for Friday and Saturday
}

export interface TimeSlot {
  id: string;
  slotNumber: number; // 1 to 12
  courtId: string;
  startTime: string;  // e.g. "06:00"
  endTime: string;    // e.g. "07:30"
  displayTime: string;// e.g. "06:00 AM - 07:30 AM"
  durationMinutes: 90;
  period: 'morning' | 'afternoon' | 'evening';
  price: number;
  isPeak: boolean;
  status: 'available' | 'holding' | 'booked' | 'blocked';
  bookedBy?: string;
  bookingId?: string;
  holdExpiresAt?: number; // 10 minute hold expiration timestamp
}

export interface BookingAddOn {
  id: string;
  name: string;
  description: string;
  price: number; // BDT
  iconName: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  courtId: string;
  courtName: string;
  date: string; // YYYY-MM-DD (up to 60 days ahead)
  slotNumber?: number; // 1 to 12
  startTime: string;
  endTime: string;
  displayTime: string;
  captainName: string;
  captainPhone: string;
  teamName: string;
  playerCount: number;
  matchType: 'friendly' | 'competitive' | 'practice' | 'corporate';
  addOns: BookingAddOn[];
  courtPrice: number;
  addOnsPrice: number;
  totalPrice: number;
  paymentType: 'advance_500' | 'full_payment' | 'pay_at_turf';
  advanceAmount: number; // ৳500 or full
  dueAmount: number;     // Remaining balance to be paid at turf
  paymentMethod: 'pay_at_turf' | 'bkash' | 'nagad' | 'card';
  paymentStatus: 'confirmed_unpaid' | 'paid_advance' | 'paid_full';
  holdExpiresAt?: number;
  notes?: string;
  createdAt: string;
}

export interface Tournament {
  id: string;
  title: string;
  edition: string;
  category: string;
  format: string; // e.g. "7-a-side Knockout + Group Stage"
  dates: string;
  registrationDeadline: string;
  entryFee: number; // BDT
  prizePool: number; // BDT
  firstPrize: string;
  runnerUpPrize: string;
  maxTeams: number;
  registeredCount: number;
  status: 'open' | 'fast_filling' | 'closed' | 'in_progress';
  highlights: string[];
  rules: string[];
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  tournamentTitle: string;
  teamName: string;
  captainName: string;
  captainPhone: string;
  captainEmail: string;
  jerseyColor: string;
  playersList: string[];
  paymentMethod: 'bkash' | 'nagad' | 'bank_transfer' | 'arena_counter';
  transactionId?: string;
  status: 'verified' | 'pending';
  registeredAt: string;
}

export interface CommunityMatchChallenge {
  id: string;
  teamName: string;
  captainName: string;
  captainPhone: string;
  courtName: string;
  date: string;
  timeSlot: string;
  format: string;
  level: 'Casual' | 'Semi-Pro' | 'Competitive' | 'Weekend Fun';
  lookingFor: 'Opponent Team' | '1-2 Players' | 'Goalkeeper Needed';
  costShare: string;
  notes: string;
}

export interface SquadPlayer {
  id: string;
  name: string;
  number: number;
  position: string;
  role?: string;
  goals?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  number: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  role: 'Captain' | 'Vice Captain' | 'Player';
  phone?: string;
  goals: number;
  matchesPlayed: number;
}

export interface PlayerTeam {
  id: string;
  name: string;
  shortCode: string;
  captainName: string;
  captainPhone: string;
  homeColor: string;
  stats: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number; // goals for
    ga: number; // goals against
    points: number;
  };
  players: TeamMember[];
}

export interface GoalScorerRecord {
  playerName: string;
  teamName: string;
  minute?: number;
}

export interface MatchDayResult {
  id: string;
  date: string;
  slotDisplay: string;
  courtName: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  scorers: GoalScorerRecord[];
  matchType: string;
  postedBy: string;
  postedAt: string;
}

export interface ExpenseRecord {
  id: string;
  category: 'turf_maintenance' | 'floodlight_electricity' | 'staff_wages' | 'equipment' | 'cleaning' | 'marketing' | 'other';
  title: string;
  amount: number;
  date: string;
  receiptNote?: string;
  recordedBy: string;
}

export interface InvestorRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  sharePercentage: number; // % e.g. 15 for 15%
  capitalInvested: number;
  joinedDate: string;
  payoutsPaid: number;
}

export interface ShopProduct {
  id: string;
  name: string;
  category: 'footwear' | 'balls' | 'apparel' | 'accessories' | 'drinks';
  price: number;
  badge?: string;
  description: string;
  specs: string[];
  inStock: boolean;
  image?: string;
}

export interface ShopReservation {
  id: string;
  reservationCode: string;
  productId: string;
  productName: string;
  price: number;
  customerName: string;
  customerPhone: string;
  status: 'reserved_pickup' | 'collected' | 'cancelled';
  reservedAt: string;
}
