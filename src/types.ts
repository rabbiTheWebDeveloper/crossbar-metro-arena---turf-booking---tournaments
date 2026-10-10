export type UserRole = 'visitor' | 'player' | 'admin' | 'investor';

export interface UserAccount {
  id: string;
  name: string;
  phone: string; // Bangladeshi mobile (01XXXXXXXXX)
  password?: string;
  role: UserRole;
  playingPosition?: 'GK' | 'DEF' | 'MID' | 'FWD';
  email?: string;
  investorId?: string; // Linked investor record for investor role
  teamId?: string;     // Linked team if captain
  createdAt: string;
  disabled?: boolean;
}

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

export interface SlotPriceItem {
  slotNumber: number; // 1 to 12
  startTime: string;  // e.g. "06:00"
  endTime: string;    // e.g. "07:30"
  displayTime: string;// e.g. "06:00 AM - 07:30 AM"
  period: 'morning' | 'afternoon' | 'evening';
  weekdayPrice: number; // Regular Sunday - Thursday price in BDT
  weekendPrice: number; // Friday & Saturday price in BDT
}

export interface PricingConfig {
  morningSlotPrice: number;   // backwards compatible default
  afternoonSlotPrice: number; // backwards compatible default
  eveningSlotPrice: number;   // backwards compatible default
  weekendSurcharge: number;   // backwards compatible default
  slotPrices: SlotPriceItem[]; // All 24 slot prices (12 weekday + 12 weekend)
  advanceAmount: number;      // Default ৳500 (or full)
  holdMinutes: number;        // Default 10 minutes hold
  bookingWindowDays: number;  // Default 60 days ahead
  cancellationHours: number;  // Default 24 hours before kickoff
  weekendDays: ('Friday' | 'Saturday' | 'Sunday')[]; // Friday, Saturday
  approveResultsFirst: boolean; // Require admin approval before publishing match results
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
  weekdayPrice?: number;
  weekendPrice?: number;
  isPeak: boolean;
  status: 'available' | 'holding' | 'booked' | 'blocked' | 'time_passed';
  bookedBy?: string;
  bookedTeam?: string;
  bookingId?: string;
  blockedReason?: string;
  holdExpiresAt?: number; // timestamp in ms
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
  bookingCode: string; // e.g. "CMA-7KQ2PX"
  courtId: string;
  courtName: string;
  date: string; // YYYY-MM-DD (up to 60 days ahead)
  slotNumber: number; // 1 to 12
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
  paymentMethod: 'pay_at_turf' | 'bkash' | 'nagad' | 'rocket' | 'upay' | 'card' | 'cash';
  paymentStatus: 'confirmed_unpaid' | 'paid_advance' | 'paid_full' | 'needs_refund' | 'cancelled';
  transactionId?: string;
  holdExpiresAt?: number;
  isWalkIn?: boolean;
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
  captainEmail?: string;
  playerCount: number;
  jerseyColor: string;
  playersList: string[];
  paymentMethod: 'bkash' | 'nagad' | 'bank_transfer' | 'arena_counter';
  transactionId?: string;
  status: 'verified' | 'pending' | 'rejected';
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
  isMatched?: boolean;
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
  area?: string;
  logoUrl?: string;
  stats: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number; // goals for
    ga: number; // goals against
    points: number;
    form?: ('W' | 'D' | 'L')[];
  };
  players: TeamMember[];
}

export interface GoalScorerRecord {
  playerName: string;
  teamName: string;
  minute?: number;
}

export interface MatchEventItem {
  id: string;
  side: 'home' | 'away';
  type: 'goal' | 'assist' | 'own_goal' | 'yellow_card' | 'red_card';
  playerName: string;
  minute: number;
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
  events?: MatchEventItem[];
  yellowCards?: number;
  redCards?: number;
  playerOfTheMatch?: string;
  matchReport?: string;
  teamPhoto?: string;
  matchType: string;
  postedBy: string;
  postedAt: string;
  status: 'published' | 'pending_approval' | 'hidden';
}

export interface ExpenseRecord {
  id: string;
  category: 'turf_maintenance' | 'floodlight_electricity' | 'staff_wages' | 'equipment' | 'cleaning' | 'marketing' | 'water' | 'internet' | 'rent' | 'shop_stock' | 'other';
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
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
  status?: 'active' | 'inactive';
}

export interface PayoutRecord {
  id: string;
  investorId: string;
  investorName: string;
  month: string; // YYYY-MM
  amount: number;
  datePaid: string; // YYYY-MM-DD
  paymentMethod: 'bkash' | 'nagad' | 'bank_transfer' | 'cash';
  transactionNote?: string;
  recordedBy: string;
}

export interface RefundRecord {
  id: string;
  bookingId: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  reason: 'player_cancelled' | 'hold_expired_late_payment' | 'admin_cancelled' | 'weather';
  refundMethod?: 'bkash' | 'nagad' | 'bank_transfer' | 'cash';
  status: 'pending' | 'completed';
  requestDate: string;
  refundedDate?: string;
  transactionRef?: string;
  recordedBy?: string;
}

export interface OtherIncomeRecord {
  id: string;
  source: 'shop_sales' | 'event_fees' | 'sponsorship' | 'equipment_rental' | 'other';
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  referenceId?: string;
  notes?: string;
  recordedBy: string;
}

export interface ShopProduct {
  id: string;
  name: string;
  category: 'footwear' | 'balls' | 'apparel' | 'accessories' | 'drinks';
  price: number;
  salePrice?: number;
  stock: number;
  sizes?: string[];
  badge?: string;
  description: string;
  specs: string[];
  inStock: boolean;
  featured?: boolean;
  visible?: boolean;
  image?: string;
}

export interface ShopCartItem {
  product: ShopProduct;
  selectedSize?: string;
  quantity: number;
}

export interface ShopReservation {
  id: string;
  reservationCode: string;
  productId: string;
  productName: string;
  size?: string;
  quantity?: number;
  price: number;
  customerName: string;
  customerPhone: string;
  status: 'reserved_pickup' | 'ready' | 'collected' | 'cancelled';
  reservedAt: string;
  collectedAt?: string;
}

export interface SMSNotificationLog {
  id: string;
  recipientPhone: string;
  message: string;
  event: 'booking_confirmed' | 'booking_cancelled' | 'refund_processed' | 'otp_reset';
  provider: 'SSLWireless' | 'BulkSMSBD';
  sentAt: string;
  status: 'delivered' | 'sent';
}

export interface SiteSettings {
  businessName: string;
  tagline: string;
  phone: string;
  phoneFormatted: string;
  whatsappUrl: string;
  email: string;
  address: string;
  metroStation: string;
  metroDetails: string;
  googleMapsUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  website?: string;
  facebook?: string;
  openingHours: string;
  aboutText: string;
}
