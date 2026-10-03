export interface Court {
  id: string;
  name: string;
  code: string;
  tagline: string;
  format: '7 vs 7' | '5 vs 5' | 'Multi-Format';
  dimensions: string;
  turfType: string;
  dayPrice: number;    // BDT per hour (06:00 - 18:00)
  nightPrice: number;  // BDT per hour (18:00 - 02:00 Floodlight Prime)
  features: string[];
  recommendedPlayers: string;
}

export interface TimeSlot {
  id: string;
  courtId: string;
  startTime: string; // e.g. "18:00"
  endTime: string;   // e.g. "19:00"
  displayTime: string;
  period: 'morning' | 'afternoon' | 'prime_night' | 'late_night';
  price: number;
  isPeak: boolean;
  status: 'available' | 'booked' | 'blocked' | 'tournament';
  bookedBy?: string;
  bookingId?: string;
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
  date: string; // YYYY-MM-DD
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
  paymentMethod: 'pay_at_turf' | 'bkash' | 'nagad' | 'card';
  paymentStatus: 'confirmed_unpaid' | 'paid_advance' | 'paid_full';
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
  position: string; // e.g. GK, CB, LB, RB, CM, RW, LW, ST
  role?: string;
}
