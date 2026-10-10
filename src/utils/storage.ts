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
  ShopProduct,
  TeamMember,
  UserAccount,
  PayoutRecord,
  RefundRecord,
  OtherIncomeRecord,
  SiteSettings,
  SMSNotificationLog,
  GalleryPhoto
} from '../types';
import {
  INITIAL_BOOKINGS,
  INITIAL_TOURNAMENTS,
  INITIAL_COMMUNITY_CHALLENGES,
  DEFAULT_PRICING,
  INITIAL_EXPENSES,
  INITIAL_INVESTORS,
  INITIAL_TEAMS,
  INITIAL_MATCH_RESULTS,
  INITIAL_USERS,
  INITIAL_PAYOUTS,
  INITIAL_REFUNDS,
  INITIAL_OTHER_INCOME,
  INITIAL_SHOP_PRODUCTS,
  INITIAL_SMS_LOGS,
  SCHEDULE_SLOTS_DEFINITION,
  VENUE_INFO,
  INITIAL_GALLERY_PHOTOS
} from '../data/initialData';

const STORAGE_KEYS = {
  BOOKINGS: 'cma_bookings_v3',
  TOURNAMENTS: 'cma_tournaments_v3',
  REGISTRATIONS: 'cma_tournament_registrations_v3',
  CHALLENGES: 'cma_challenges_v3',
  PRICING: 'cma_pricing_v3',
  EXPENSES: 'cma_expenses_v3',
  INVESTORS: 'cma_investors_v3',
  TEAMS: 'cma_teams_v3',
  MATCH_RESULTS: 'cma_match_results_v3',
  SHOP_PRODUCTS: 'cma_shop_products_v3',
  SHOP_RESERVATIONS: 'cma_shop_reservations_v3',
  SLOT_HOLDS: 'cma_slot_holds_v3',
  USERS: 'cma_users_v3',
  CURRENT_USER: 'cma_current_user_v3',
  PAYOUTS: 'cma_payouts_v3',
  REFUNDS: 'cma_refunds_v3',
  OTHER_INCOME: 'cma_other_income_v3',
  SITE_SETTINGS: 'cma_site_settings_v3',
  SMS_LOGS: 'cma_sms_logs_v3',
  GALLERY_PHOTOS: 'cma_gallery_photos_v3'
};

export interface ActiveSlotHold {
  slotKey: string; // date + '_' + slotNumber
  courtId: string;
  date: string;
  slotNumber: number;
  teamName: string;
  heldAt: number;
  expiresAt: number;
}

// Slot Hold Manager (Hold while paying)
export const getActiveSlotHolds = (): ActiveSlotHold[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SLOT_HOLDS);
    if (!raw) return [];
    const holds: ActiveSlotHold[] = JSON.parse(raw);
    const now = Date.now();
    const active = holds.filter(h => h.expiresAt > now);
    if (active.length !== holds.length) {
      localStorage.setItem(STORAGE_KEYS.SLOT_HOLDS, JSON.stringify(active));
    }
    return active;
  } catch {
    return [];
  }
};

export const placeSlotHold = (courtId: string, date: string, slotNumber: number, teamName: string, holdMinutes = 10): ActiveSlotHold => {
  const current = getActiveSlotHolds();
  const slotKey = `${date}_${slotNumber}`;
  const now = Date.now();
  const expiresAt = now + holdMinutes * 60 * 1000;

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
  const slotKey = `${date}_${slotNumber}`;
  const updated = current.filter(h => h.slotKey !== slotKey);
  try {
    localStorage.setItem(STORAGE_KEYS.SLOT_HOLDS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to release hold', e);
  }
};

// Strict DB Double Booking Check
export const isSlotDoubleBooked = (date: string, slotNumber: number, excludeBookingId?: string): boolean => {
  const bookings = getStoredBookings();
  return bookings.some(b =>
    b.date === date &&
    b.slotNumber === slotNumber &&
    b.paymentStatus !== 'cancelled' &&
    b.id !== excludeBookingId
  );
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
  // Enforce unique constraint
  const alreadyBooked = current.find(
    b => b.date === newBooking.date &&
         b.slotNumber === newBooking.slotNumber &&
         b.paymentStatus !== 'cancelled' &&
         b.id !== newBooking.id
  );
  if (alreadyBooked) {
    throw new Error(`Slot #${newBooking.slotNumber} on ${newBooking.date} is already booked by ${alreadyBooked.teamName}. Double bookings are prohibited.`);
  }

  const updated = [newBooking, ...current.filter(b => b.id !== newBooking.id)];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
      releaseSlotHold(newBooking.courtId, newBooking.date, newBooking.slotNumber);
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

export const cancelBooking = (id: string, createRefund = true): { bookings: Booking[]; refund?: RefundRecord } => {
  const current = getStoredBookings();
  let createdRefund: RefundRecord | undefined;

  const target = current.find(b => b.id === id);
  if (target && createRefund && target.advanceAmount > 0) {
    createdRefund = {
      id: `ref-${Date.now()}`,
      bookingId: target.id,
      bookingCode: target.bookingCode,
      customerName: target.captainName,
      customerPhone: target.captainPhone,
      amount: target.advanceAmount,
      reason: 'player_cancelled',
      status: 'pending',
      requestDate: new Date().toISOString().split('T')[0],
      refundMethod: target.paymentMethod === 'bkash' ? 'bkash' : target.paymentMethod === 'nagad' ? 'nagad' : 'cash'
    };
    saveRefund(createdRefund);
  }

  const updated = current.map(b => b.id === id ? { ...b, paymentStatus: 'cancelled' as const } : b);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to cancel booking', e);
    }
  }
  return { bookings: updated, refund: createdRefund };
};

// Users
export const getStoredUsers = (): UserAccount[] => {
  if (typeof window === 'undefined') return INITIAL_USERS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
};

export const saveUser = (user: UserAccount): UserAccount[] => {
  const current = getStoredUsers();
  const updated = [user, ...current.filter(u => u.id !== user.id && u.phone !== user.phone)];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save user', e);
    }
  }
  return updated;
};

export const getStoredCurrentUser = (): UserAccount | null => {
  if (typeof window === 'undefined') return INITIAL_USERS[2]; // Default to Player Siam Chowdhury for friendly DX
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) return INITIAL_USERS[2];
    return JSON.parse(data);
  } catch {
    return INITIAL_USERS[2];
  }
};

export const saveCurrentUser = (user: UserAccount | null): void => {
  if (typeof window !== 'undefined') {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.error('Failed to save current user', e);
    }
  }
};

// Pricing Configuration (All 24 prices + rules)
export const getStoredPricing = (): PricingConfig => {
  if (typeof window === 'undefined') return DEFAULT_PRICING;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PRICING);
    if (!data) return DEFAULT_PRICING;
    const parsed = JSON.parse(data);
    // ensure slotPrices exists
    if (!parsed.slotPrices || parsed.slotPrices.length === 0) {
      parsed.slotPrices = SCHEDULE_SLOTS_DEFINITION;
    }
    return parsed;
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
  const updated = [expense, ...current.filter(e => e.id !== expense.id)];
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

// Investor Payouts
export const getStoredPayouts = (): PayoutRecord[] => {
  if (typeof window === 'undefined') return INITIAL_PAYOUTS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PAYOUTS);
    return data ? JSON.parse(data) : INITIAL_PAYOUTS;
  } catch {
    return INITIAL_PAYOUTS;
  }
};

export const savePayout = (payout: PayoutRecord): PayoutRecord[] => {
  const current = getStoredPayouts();
  const updated = [payout, ...current];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save payout', e);
    }
  }
  return updated;
};

// Refunds
export const getStoredRefunds = (): RefundRecord[] => {
  if (typeof window === 'undefined') return INITIAL_REFUNDS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REFUNDS);
    return data ? JSON.parse(data) : INITIAL_REFUNDS;
  } catch {
    return INITIAL_REFUNDS;
  }
};

export const saveRefund = (refund: RefundRecord): RefundRecord[] => {
  const current = getStoredRefunds();
  const updated = [refund, ...current.filter(r => r.id !== refund.id)];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.REFUNDS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save refund', e);
    }
  }
  return updated;
};

// Other Income
export const getStoredOtherIncome = (): OtherIncomeRecord[] => {
  if (typeof window === 'undefined') return INITIAL_OTHER_INCOME;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.OTHER_INCOME);
    return data ? JSON.parse(data) : INITIAL_OTHER_INCOME;
  } catch {
    return INITIAL_OTHER_INCOME;
  }
};

export const saveOtherIncome = (item: OtherIncomeRecord): OtherIncomeRecord[] => {
  const current = getStoredOtherIncome();
  const updated = [item, ...current];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.OTHER_INCOME, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save other income', e);
    }
  }
  return updated;
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

export const saveTeam = (team: PlayerTeam): PlayerTeam[] => {
  const current = getStoredTeams();
  const updated = [team, ...current.filter(t => t.id !== team.id)];
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
        players: [...t.players.filter(p => p.id !== player.id), player]
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

// Match Results
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
  const updated = [result, ...current.filter(m => m.id !== result.id)];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.MATCH_RESULTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save match result', e);
    }
  }
  return updated;
};

// Shop Products
export const getStoredShopProducts = (): ShopProduct[] => {
  if (typeof window === 'undefined') return INITIAL_SHOP_PRODUCTS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SHOP_PRODUCTS);
    return data ? JSON.parse(data) : INITIAL_SHOP_PRODUCTS;
  } catch {
    return INITIAL_SHOP_PRODUCTS;
  }
};

export const saveShopProduct = (product: ShopProduct): ShopProduct[] => {
  const current = getStoredShopProducts();
  const updated = [product, ...current.filter(p => p.id !== product.id)];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.SHOP_PRODUCTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save shop product', e);
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

export const saveShopReservation = (reservation: ShopReservation): ShopReservation[] => {
  const current = getStoredShopReservations();
  const updated = [reservation, ...current.filter(r => r.id !== reservation.id)];
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
  const target = current.find(r => r.id === id);

  const updated = current.map(r => {
    if (r.id === id) {
      return {
        ...r,
        status,
        collectedAt: status === 'collected' ? new Date().toISOString() : r.collectedAt
      };
    }
    return r;
  });

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.SHOP_RESERVATIONS, JSON.stringify(updated));
      // If collected, automatically add to other income and reduce stock
      if (status === 'collected' && target && target.status !== 'collected') {
        const incomeRecord: OtherIncomeRecord = {
          id: `inc-shop-${Date.now()}`,
          source: 'shop_sales',
          title: `Shop Pickup: ${target.productName} (${target.reservationCode})`,
          amount: target.price * (target.quantity || 1),
          date: new Date().toISOString().split('T')[0],
          referenceId: target.reservationCode,
          recordedBy: 'System (Shop Pickup)'
        };
        saveOtherIncome(incomeRecord);

        // Reduce product stock
        const prods = getStoredShopProducts();
        const updatedProds = prods.map(p => {
          if (p.id === target.productId) {
            return {
              ...p,
              stock: Math.max(0, p.stock - (target.quantity || 1))
            };
          }
          return p;
        });
        localStorage.setItem(STORAGE_KEYS.SHOP_PRODUCTS, JSON.stringify(updatedProds));
      }
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
          return {
            ...t,
            registeredCount: t.registeredCount + 1
          };
        }
        return t;
      });
      localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(updatedTournaments));
    } catch (e) {
      console.error('Failed to save tournament reg', e);
    }
  }
  return updated;
};

// Community Challenges
export const getStoredChallenges = (): CommunityMatchChallenge[] => {
  if (typeof window === 'undefined') return INITIAL_COMMUNITY_CHALLENGES;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
    return data ? JSON.parse(data) : INITIAL_COMMUNITY_CHALLENGES;
  } catch {
    return INITIAL_COMMUNITY_CHALLENGES;
  }
};

export const saveChallenge = (challenge: CommunityMatchChallenge): CommunityMatchChallenge[] => {
  const current = getStoredChallenges();
  const updated = [challenge, ...current];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save challenge', e);
    }
  }
  return updated;
};

// SMS Logs
export const getStoredSMSLogs = (): SMSNotificationLog[] => {
  if (typeof window === 'undefined') return INITIAL_SMS_LOGS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SMS_LOGS);
    return data ? JSON.parse(data) : INITIAL_SMS_LOGS;
  } catch {
    return INITIAL_SMS_LOGS;
  }
};

export const logSMSNotification = (sms: SMSNotificationLog): SMSNotificationLog[] => {
  const current = getStoredSMSLogs();
  const updated = [sms, ...current];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.SMS_LOGS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to log SMS', e);
    }
  }
  return updated;
};

// Site Settings
export const getStoredSiteSettings = (): SiteSettings => {
  if (typeof window === 'undefined') return VENUE_INFO;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SITE_SETTINGS);
    return data ? JSON.parse(data) : VENUE_INFO;
  } catch {
    return VENUE_INFO;
  }
};

export const saveSiteSettings = (settings: SiteSettings): SiteSettings => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.SITE_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save site settings', e);
    }
  }
  return settings;
};

// Gallery Photos Management
export const getStoredGalleryPhotos = (): GalleryPhoto[] => {
  if (typeof window === 'undefined') return INITIAL_GALLERY_PHOTOS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GALLERY_PHOTOS);
    return data ? JSON.parse(data) : INITIAL_GALLERY_PHOTOS;
  } catch {
    return INITIAL_GALLERY_PHOTOS;
  }
};

export const saveGalleryPhoto = (photo: GalleryPhoto): GalleryPhoto[] => {
  const current = getStoredGalleryPhotos();
  const existingIndex = current.findIndex(p => p.id === photo.id);
  const updated = existingIndex >= 0
    ? current.map(p => p.id === photo.id ? photo : p)
    : [photo, ...current];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.GALLERY_PHOTOS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save gallery photo', e);
    }
  }
  return updated;
};

export const deleteStoredGalleryPhoto = (photoId: string): GalleryPhoto[] => {
  const current = getStoredGalleryPhotos();
  const updated = current.filter(p => p.id !== photoId);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.GALLERY_PHOTOS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete gallery photo', e);
    }
  }
  return updated;
};

// Database Restore
export const restoreDatabaseBackup = (backupJson: any): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    if (backupJson.bookings) localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(backupJson.bookings));
    if (backupJson.pricing) localStorage.setItem(STORAGE_KEYS.PRICING, JSON.stringify(backupJson.pricing));
    if (backupJson.expenses) localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(backupJson.expenses));
    if (backupJson.investors) localStorage.setItem(STORAGE_KEYS.INVESTORS, JSON.stringify(backupJson.investors));
    if (backupJson.teams) localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(backupJson.teams));
    if (backupJson.matchResults) localStorage.setItem(STORAGE_KEYS.MATCH_RESULTS, JSON.stringify(backupJson.matchResults));
    if (backupJson.shopReservations) localStorage.setItem(STORAGE_KEYS.SHOP_RESERVATIONS, JSON.stringify(backupJson.shopReservations));
    if (backupJson.shopProducts) localStorage.setItem(STORAGE_KEYS.SHOP_PRODUCTS, JSON.stringify(backupJson.shopProducts));
    if (backupJson.tournaments) localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(backupJson.tournaments));
    if (backupJson.registrations) localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(backupJson.registrations));
    if (backupJson.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(backupJson.users));
    if (backupJson.payouts) localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(backupJson.payouts));
    if (backupJson.refunds) localStorage.setItem(STORAGE_KEYS.REFUNDS, JSON.stringify(backupJson.refunds));
    if (backupJson.otherIncome) localStorage.setItem(STORAGE_KEYS.OTHER_INCOME, JSON.stringify(backupJson.otherIncome));
    if (backupJson.siteSettings) localStorage.setItem(STORAGE_KEYS.SITE_SETTINGS, JSON.stringify(backupJson.siteSettings));
    if (backupJson.galleryPhotos) localStorage.setItem(STORAGE_KEYS.GALLERY_PHOTOS, JSON.stringify(backupJson.galleryPhotos));
    return true;
  } catch (e) {
    console.error('Failed to restore database', e);
    return false;
  }
};
