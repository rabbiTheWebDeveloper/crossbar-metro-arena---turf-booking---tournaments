import {
  Booking,
  TournamentRegistration,
  CommunityMatchChallenge,
  Tournament,
  PricingConfig,
  ExpenseRecord,
  InvestorRecord,
  PlayerTeam,
  MatchDayResult,
  ShopReservation,
  TeamMember
} from '../types';
import {
  INITIAL_BOOKINGS,
  INITIAL_TOURNAMENTS,
  INITIAL_COMMUNITY_CHALLENGES,
  DEFAULT_PRICING,
  INITIAL_EXPENSES,
  INITIAL_INVESTORS,
  INITIAL_TEAMS,
  INITIAL_MATCH_RESULTS
} from '../data/initialData';

const STORAGE_KEYS = {
  BOOKINGS: 'cma_bookings_v2',
  TOURNAMENTS: 'cma_tournaments_v2',
  REGISTRATIONS: 'cma_tournament_registrations_v2',
  CHALLENGES: 'cma_challenges_v2',
  PRICING: 'cma_pricing_v2',
  EXPENSES: 'cma_expenses_v2',
  INVESTORS: 'cma_investors_v2',
  TEAMS: 'cma_teams_v2',
  MATCH_RESULTS: 'cma_match_results_v2',
  SHOP_RESERVATIONS: 'cma_shop_reservations_v2',
  SLOT_HOLDS: 'cma_slot_holds_v2'
};

export interface ActiveSlotHold {
  slotKey: string; // courtId + '_' + date + '_' + slotNumber
  courtId: string;
  date: string;
  slotNumber: number;
  teamName: string;
  heldAt: number;
  expiresAt: number; // heldAt + 10 mins (600,000 ms)
}

// Slot Hold Manager (10 minute hold while paying)
export const getActiveSlotHolds = (): ActiveSlotHold[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SLOT_HOLDS);
    if (!raw) return [];
    const holds: ActiveSlotHold[] = JSON.parse(raw);
    const now = Date.now();
    // Filter out expired holds automatically
    const active = holds.filter(h => h.expiresAt > now);
    if (active.length !== holds.length) {
      localStorage.setItem(STORAGE_KEYS.SLOT_HOLDS, JSON.stringify(active));
    }
    return active;
  } catch {
    return [];
  }
};

export const placeSlotHold = (courtId: string, date: string, slotNumber: number, teamName: string): ActiveSlotHold => {
  const current = getActiveSlotHolds();
  const slotKey = `${courtId}_${date}_${slotNumber}`;
  const now = Date.now();
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes from now

  const newHold: ActiveSlotHold = {
    slotKey,
    courtId,
    date,
    slotNumber,
    teamName,
    heldAt: now,
    expiresAt
  };

  const updated = [newHold, ...current.filter(h => h.slotKey !== slotKey)];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.SLOT_HOLDS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save slot hold', e);
    }
  }
  return newHold;
};

export const releaseSlotHold = (courtId: string, date: string, slotNumber: number): void => {
  if (typeof window === 'undefined') return;
  const current = getActiveSlotHolds();
  const slotKey = `${courtId}_${date}_${slotNumber}`;
  const updated = current.filter(h => h.slotKey !== slotKey);
  try {
    localStorage.setItem(STORAGE_KEYS.SLOT_HOLDS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to release hold', e);
  }
};

// Bookings
export const getStoredBookings = (): Booking[] => {
  if (typeof window === 'undefined') return INITIAL_BOOKINGS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return data ? JSON.parse(data) : INITIAL_BOOKINGS;
  } catch {
    return INITIAL_BOOKINGS;
  }
};

export const saveBooking = (newBooking: Booking): Booking[] => {
  const current = getStoredBookings();
  const updated = [newBooking, ...current.filter(b => b.id !== newBooking.id)];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
      // Release any active hold on this slot once confirmed
      if (newBooking.slotNumber) {
        releaseSlotHold(newBooking.courtId, newBooking.date, newBooking.slotNumber);
      }
    } catch (e) {
      console.error('Failed to save booking', e);
    }
  }
  return updated;
};

export const updateBookingStatus = (id: string, status: Booking['paymentStatus'], collectedCashAmount?: number): Booking[] => {
  const current = getStoredBookings();
  const updated = current.map(b => {
    if (b.id === id) {
      const isFull = status === 'paid_full';
      const updatedAdvance = isFull ? b.totalPrice : (collectedCashAmount ? b.advanceAmount + collectedCashAmount : b.advanceAmount);
      const updatedDue = Math.max(0, b.totalPrice - updatedAdvance);
      return {
        ...b,
        paymentStatus: status,
        advanceAmount: updatedAdvance,
        dueAmount: updatedDue
      };
    }
    return b;
  });
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update booking status', e);
    }
  }
  return updated;
};

export const cancelBooking = (id: string): Booking[] => {
  const current = getStoredBookings();
  const updated = current.filter(b => b.id !== id);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to cancel booking', e);
    }
  }
  return updated;
};

// Pricing Configuration
export const getStoredPricing = (): PricingConfig => {
  if (typeof window === 'undefined') return DEFAULT_PRICING;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PRICING);
    return data ? JSON.parse(data) : DEFAULT_PRICING;
  } catch {
    return DEFAULT_PRICING;
  }
};

export const savePricing = (config: PricingConfig): PricingConfig => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.PRICING, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save pricing config', e);
    }
  }
  return config;
};

// Expenses
export const getStoredExpenses = (): ExpenseRecord[] => {
  if (typeof window === 'undefined') return INITIAL_EXPENSES;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return data ? JSON.parse(data) : INITIAL_EXPENSES;
  } catch {
    return INITIAL_EXPENSES;
  }
};

export const saveExpense = (expense: ExpenseRecord): ExpenseRecord[] => {
  const current = getStoredExpenses();
  const updated = [expense, ...current];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save expense', e);
    }
  }
  return updated;
};

export const deleteExpense = (id: string): ExpenseRecord[] => {
  const current = getStoredExpenses();
  const updated = current.filter(e => e.id !== id);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete expense', e);
    }
  }
  return updated;
};

// Investors (Up to 10)
export const getStoredInvestors = (): InvestorRecord[] => {
  if (typeof window === 'undefined') return INITIAL_INVESTORS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INVESTORS);
    return data ? JSON.parse(data) : INITIAL_INVESTORS;
  } catch {
    return INITIAL_INVESTORS;
  }
};

export const saveInvestors = (investors: InvestorRecord[]): InvestorRecord[] => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.INVESTORS, JSON.stringify(investors));
    } catch (e) {
      console.error('Failed to save investors', e);
    }
  }
  return investors;
};

// Teams & Players
export const getStoredTeams = (): PlayerTeam[] => {
  if (typeof window === 'undefined') return INITIAL_TEAMS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TEAMS);
    return data ? JSON.parse(data) : INITIAL_TEAMS;
  } catch {
    return INITIAL_TEAMS;
  }
};

export const saveTeam = (newTeam: PlayerTeam): PlayerTeam[] => {
  const current = getStoredTeams();
  const exists = current.some(t => t.id === newTeam.id);
  const updated = exists ? current.map(t => t.id === newTeam.id ? newTeam : t) : [newTeam, ...current];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save team', e);
    }
  }
  return updated;
};

export const addPlayerToTeam = (teamId: string, player: TeamMember): PlayerTeam[] => {
  const current = getStoredTeams();
  const updated = current.map(t => {
    if (t.id === teamId) {
      return {
        ...t,
        players: [...t.players, player]
      };
    }
    return t;
  });
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to add player to team', e);
    }
  }
  return updated;
};

// Match Results & Goal Scorers
export const getStoredMatchResults = (): MatchDayResult[] => {
  if (typeof window === 'undefined') return INITIAL_MATCH_RESULTS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MATCH_RESULTS);
    return data ? JSON.parse(data) : INITIAL_MATCH_RESULTS;
  } catch {
    return INITIAL_MATCH_RESULTS;
  }
};

export const saveMatchResult = (result: MatchDayResult): MatchDayResult[] => {
  const current = getStoredMatchResults();
  const updated = [result, ...current];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.MATCH_RESULTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save match result', e);
    }
  }
  return updated;
};

// Shop Reservations
export const getStoredShopReservations = (): ShopReservation[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SHOP_RESERVATIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveShopReservation = (res: ShopReservation): ShopReservation[] => {
  const current = getStoredShopReservations();
  const updated = [res, ...current];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.SHOP_RESERVATIONS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save shop reservation', e);
    }
  }
  return updated;
};

export const updateShopReservationStatus = (id: string, status: ShopReservation['status']): ShopReservation[] => {
  const current = getStoredShopReservations();
  const updated = current.map(r => r.id === id ? { ...r, status } : r);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.SHOP_RESERVATIONS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update shop reservation', e);
    }
  }
  return updated;
};

// Tournaments & Registrations
export const getStoredTournaments = (): Tournament[] => {
  if (typeof window === 'undefined') return INITIAL_TOURNAMENTS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
    return data ? JSON.parse(data) : INITIAL_TOURNAMENTS;
  } catch {
    return INITIAL_TOURNAMENTS;
  }
};

export const getStoredRegistrations = (): TournamentRegistration[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveTournamentRegistration = (reg: TournamentRegistration): TournamentRegistration[] => {
  const current = getStoredRegistrations();
  const updated = [reg, ...current];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(updated));

      const tournaments = getStoredTournaments();
      const updatedTournaments = tournaments.map(t => {
        if (t.id === reg.tournamentId) {
          const count = t.registeredCount + 1;
          return {
            ...t,
            registeredCount: count,
            status: (count >= t.maxTeams ? 'closed' : count >= t.maxTeams - 3 ? 'fast_filling' : 'open') as Tournament['status']
          };
        }
        return t;
      });
      localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(updatedTournaments));
    } catch (e) {
      console.error('Failed to save registration', e);
    }
  }
  return updated;
};

// Challenges
export const getStoredChallenges = (): CommunityMatchChallenge[] => {
  if (typeof window === 'undefined') return INITIAL_COMMUNITY_CHALLENGES;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
    return data ? JSON.parse(data) : INITIAL_COMMUNITY_CHALLENGES;
  } catch {
    return INITIAL_COMMUNITY_CHALLENGES;
  }
};

export const saveChallenge = (newChallenge: CommunityMatchChallenge): CommunityMatchChallenge[] => {
  const current = getStoredChallenges();
  const updated = [newChallenge, ...current];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save challenge', e);
    }
  }
  return updated;
};
