'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  ShopCartItem,
  TeamMember,
  UserAccount,
  UserRole,
  PayoutRecord,
  RefundRecord,
  OtherIncomeRecord,
  SiteSettings,
  SMSNotificationLog,
  GalleryPhoto
} from '../types';
import {
  getStoredBookings,
  saveBooking,
  updateBookingStatus,
  cancelBooking,
  getStoredTournaments,
  getStoredRegistrations,
  saveTournamentRegistration,
  getStoredChallenges,
  saveChallenge,
  getStoredPricing,
  savePricing,
  getStoredExpenses,
  saveExpense,
  deleteExpense,
  getStoredInvestors,
  saveInvestors,
  getStoredTeams,
  saveTeam,
  addPlayerToTeam,
  getStoredMatchResults,
  saveMatchResult,
  getStoredShopProducts,
  saveShopProduct,
  getStoredShopReservations,
  saveShopReservation,
  updateShopReservationStatus,
  getActiveSlotHolds,
  placeSlotHold,
  releaseSlotHold,
  getStoredUsers,
  saveUser,
  getStoredCurrentUser,
  saveCurrentUser,
  getStoredPayouts,
  savePayout,
  getStoredRefunds,
  saveRefund,
  getStoredOtherIncome,
  saveOtherIncome,
  getStoredSMSLogs,
  logSMSNotification,
  getStoredSiteSettings,
  saveSiteSettings,
  getStoredGalleryPhotos,
  saveGalleryPhoto,
  deleteStoredGalleryPhoto,
  restoreDatabaseBackup,
  ActiveSlotHold
} from '../utils/storage';
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
  VENUE_INFO,
  INITIAL_GALLERY_PHOTOS
} from '../data/initialData';

export interface MonthlyFinanceSummary {
  month: string; // YYYY-MM
  bookingMoneyCollected: number;
  otherIncomeTotal: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  isLossMonth: boolean;
  profitMargin: number;
  slotsBooked: number;
  occupancyRate: number;
  cancellationsCount: number;
  cancellationsAmount: number;
  dueAmountTotal: number;
  investorShares: Array<{
    investor: InvestorRecord;
    shareAmount: number;
    percentage: number;
    isPaid: boolean;
  }>;
  ownersShare: number;
  dailyBreakdown: Array<{
    date: string;
    slotsBooked: number;
    moneyCollected: number;
    expenses: number;
    net: number;
  }>;
  expensesByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  incomeBySource: Array<{
    source: string;
    amount: number;
    percentage: number;
  }>;
  popularSlotsRanking: Array<{
    slotNumber: number;
    displayTime: string;
    count: number;
  }>;
}

interface ArenaContextType {
  // State
  bookings: Booking[];
  slotHolds: ActiveSlotHold[];
  pricing: PricingConfig;
  expenses: ExpenseRecord[];
  investors: InvestorRecord[];
  payouts: PayoutRecord[];
  refunds: RefundRecord[];
  otherIncome: OtherIncomeRecord[];
  teams: PlayerTeam[];
  matchResults: MatchDayResult[];
  shopProducts: ShopProduct[];
  shopReservations: ShopReservation[];
  tournaments: Tournament[];
  registrations: TournamentRegistration[];
  challenges: CommunityMatchChallenge[];
  galleryPhotos: GalleryPhoto[];
  users: UserAccount[];
  currentUser: UserAccount | null;
  smsLogs: SMSNotificationLog[];
  siteSettings: SiteSettings;
  isInitialized: boolean;

  // Cart
  cartItems: ShopCartItem[];
  addToCart: (product: ShopProduct, selectedSize?: string, qty?: number) => void;
  removeFromCart: (productId: string, size?: string) => void;
  clearCart: () => void;
  showCartDrawer: boolean;
  setShowCartDrawer: (show: boolean) => void;

  // Financial computations
  grossRevenue: number;
  totalExpenses: number;
  netProfit: number;
  isLossMonth: boolean;
  calculateMonthlyFinance: (monthStr: string) => MonthlyFinanceSummary;

  // Modals & UI States
  activeTicketPass: Booking | null;
  setActiveTicketPass: (b: Booking | null) => void;
  showSquadModal: boolean;
  setShowSquadModal: (show: boolean) => void;
  showAdminModal: boolean;
  setShowAdminModal: (show: boolean) => void;
  showPassesDrawer: boolean;
  setShowPassesDrawer: (show: boolean) => void;
  showInstallModal: boolean;
  setShowInstallModal: (show: boolean) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authModalInitialTab: 'login' | 'signup' | 'forgot';
  setAuthModalInitialTab: (tab: 'login' | 'signup' | 'forgot') => void;
  showSSLCommerzModal: boolean;
  setShowSSLCommerzModal: (show: boolean) => void;
  pendingBookingData: Partial<Booking> | null;
  setPendingBookingData: (b: Partial<Booking> | null) => void;
  showHandoverGuide: boolean;
  setShowHandoverGuide: (show: boolean) => void;

  // Auth Operations
  login: (phone: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  signup: (data: Partial<UserAccount>) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchDemoUser: (role: UserRole, specificId?: string) => void;
  resetPasswordSMS: (phone: string) => Promise<{ success: boolean; otp?: string; message?: string }>;
  handleUpdateUserRole: (userId: string, newRole: UserRole) => void;
  handleToggleUserDisabled: (userId: string) => void;

  // Booking & Arena Operations
  handleBookingSuccess: (newBooking: Booking) => void;
  handlePlaceSlotHold: (courtId: string, date: string, slotNumber: number, teamName: string) => ActiveSlotHold;
  handleReleaseSlotHold: (courtId: string, date: string, slotNumber: number) => void;
  handleUpdateBookingStatus: (id: string, status: Booking['paymentStatus'], collectedCash?: number) => void;
  handleCancelBooking: (id: string) => void;
  handleRecordRefund: (refundId: string, amount: number, method: RefundRecord['refundMethod'], transactionRef?: string) => void;
  handleRecordPayout: (payout: PayoutRecord) => void;
  handleAddOtherIncome: (income: OtherIncomeRecord) => void;
  handleSavePricing: (newConfig: PricingConfig) => void;
  handleAddExpense: (expense: ExpenseRecord) => void;
  handleDeleteExpense: (id: string) => void;
  handleSaveInvestors: (investors: InvestorRecord[]) => void;
  handleSaveTeam: (team: PlayerTeam) => void;
  handleAddPlayerToTeam: (teamId: string, player: TeamMember) => void;
  handleSaveMatchResult: (result: MatchDayResult) => void;
  handleSaveShopProduct: (product: ShopProduct) => void;
  handleSaveShopReservation: (reservation: ShopReservation) => void;
  handleUpdateShopReservationStatus: (id: string, status: ShopReservation['status']) => void;
  handleRegistrationSuccess: (newReg: TournamentRegistration) => void;
  handleAddChallenge: (newChallenge: CommunityMatchChallenge) => void;
  handleSavePhoto: (photo: GalleryPhoto) => void;
  handleDeletePhoto: (id: string) => void;
  handleToggleFeaturedPhoto: (id: string) => void;
  handleSaveSiteSettings: (settings: SiteSettings) => void;
  sendSMSNotification: (phone: string, message: string, event: SMSNotificationLog['event']) => void;
  exportDatabaseBackup: () => void;
  handleRestoreDatabase: (backupJson: any) => boolean;
}

const ArenaContext = createContext<ArenaContextType | undefined>(undefined);

export const ArenaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [slotHolds, setSlotHolds] = useState<ActiveSlotHold[]>([]);
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES);
  const [investors, setInvestors] = useState<InvestorRecord[]>(INITIAL_INVESTORS);
  const [payouts, setPayouts] = useState<PayoutRecord[]>(INITIAL_PAYOUTS);
  const [refunds, setRefunds] = useState<RefundRecord[]>(INITIAL_REFUNDS);
  const [otherIncome, setOtherIncome] = useState<OtherIncomeRecord[]>(INITIAL_OTHER_INCOME);
  const [teams, setTeams] = useState<PlayerTeam[]>(INITIAL_TEAMS);
  const [matchResults, setMatchResults] = useState<MatchDayResult[]>(INITIAL_MATCH_RESULTS);
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>(INITIAL_SHOP_PRODUCTS);
  const [shopReservations, setShopReservations] = useState<ShopReservation[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>(INITIAL_TOURNAMENTS);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [challenges, setChallenges] = useState<CommunityMatchChallenge[]>(INITIAL_COMMUNITY_CHALLENGES);
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>(INITIAL_GALLERY_PHOTOS);
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(INITIAL_USERS[2]); // Default player Siam
  const [smsLogs, setSmsLogs] = useState<SMSNotificationLog[]>(INITIAL_SMS_LOGS);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(VENUE_INFO);
  const [cartItems, setCartItems] = useState<ShopCartItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Modals state
  const [activeTicketPass, setActiveTicketPass] = useState<Booking | null>(null);
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPassesDrawer, setShowPassesDrawer] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'login' | 'signup' | 'forgot'>('login');
  const [showSSLCommerzModal, setShowSSLCommerzModal] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<Partial<Booking> | null>(null);
  const [showHandoverGuide, setShowHandoverGuide] = useState(false);

  // Load client data on mount
  useEffect(() => {
    setBookings(getStoredBookings());
    setSlotHolds(getActiveSlotHolds());
    setPricing(getStoredPricing());
    setExpenses(getStoredExpenses());
    setInvestors(getStoredInvestors());
    setPayouts(getStoredPayouts());
    setRefunds(getStoredRefunds());
    setOtherIncome(getStoredOtherIncome());
    setTeams(getStoredTeams());
    setMatchResults(getStoredMatchResults());
    setShopProducts(getStoredShopProducts());
    setShopReservations(getStoredShopReservations());
    setTournaments(getStoredTournaments());
    setRegistrations(getStoredRegistrations());
    setChallenges(getStoredChallenges());
    setGalleryPhotos(getStoredGalleryPhotos());
    setUsers(getStoredUsers());
    setCurrentUser(getStoredCurrentUser());
    setSmsLogs(getStoredSMSLogs());
    setSiteSettings(getStoredSiteSettings());
    setIsInitialized(true);

    // Check if real database auth cookie exists
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          saveCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // 10-minute hold ticker: check every 5 seconds to auto-release expired holds
  useEffect(() => {
    const timer = setInterval(() => {
      const active = getActiveSlotHolds();
      setSlotHolds(active);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Current Overall Financial calculations
  const grossRevenue = useMemo(() => {
    const bookingRevenue = bookings.reduce((sum, b) => {
      if (b.paymentStatus === 'paid_full') return sum + b.totalPrice;
      if (b.paymentStatus === 'paid_advance') return sum + (b.advanceAmount || 500);
      return sum;
    }, 0);
    const otherTotal = otherIncome.reduce((sum, o) => sum + o.amount, 0);
    const refundsTotal = refunds.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.amount, 0);
    return Math.max(0, bookingRevenue + otherTotal - refundsTotal);
  }, [bookings, otherIncome, refunds]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const netProfit = useMemo(() => {
    return grossRevenue - totalExpenses;
  }, [grossRevenue, totalExpenses]);

  const isLossMonth = useMemo(() => {
    return netProfit <= 0;
  }, [netProfit]);

  // Exact Section 8 Monthly Financial Report Formula
  const calculateMonthlyFinance = useCallback((monthStr: string): MonthlyFinanceSummary => {
    // monthStr format: "YYYY-MM"
    const [year, month] = monthStr.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    // 1. Booking money collected in this month
    // Counted by payment date (createdAt starts with monthStr)
    const monthBookings = bookings.filter(b => b.createdAt.startsWith(monthStr) && b.paymentStatus !== 'cancelled');
    const bookingPayments = monthBookings.reduce((sum, b) => {
      if (b.paymentStatus === 'paid_full') return sum + b.totalPrice;
      if (b.paymentStatus === 'paid_advance') return sum + (b.advanceAmount || 500);
      return sum;
    }, 0);

    // Completed refunds processed in this month
    const monthRefunds = refunds.filter(r => r.status === 'completed' && (r.refundedDate?.startsWith(monthStr) || r.requestDate.startsWith(monthStr)));
    const refundsAmount = monthRefunds.reduce((sum, r) => sum + r.amount, 0);

    const bookingMoneyCollected = Math.max(0, bookingPayments - refundsAmount);

    // 2. Other income entered for that month
    const monthOtherIncome = otherIncome.filter(o => o.date.startsWith(monthStr));
    const otherIncomeTotal = monthOtherIncome.reduce((sum, o) => sum + o.amount, 0);

    // Total revenue = booking money collected + other income
    const totalRevenue = bookingMoneyCollected + otherIncomeTotal;

    // 3. Expenses dated in that month
    const monthExpenses = expenses.filter(e => e.date.startsWith(monthStr));
    const totalExpensesMonth = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    // 4. Net profit = total revenue - expenses
    const monthNetProfit = totalRevenue - totalExpensesMonth;
    const isLoss = monthNetProfit <= 0;
    const profitMargin = totalRevenue > 0 ? (monthNetProfit / totalRevenue) * 100 : 0;

    // 5. Slots booked and occupancy
    const slotsBooked = monthBookings.length;
    const totalPossibleSlots = 12 * daysInMonth;
    const occupancyRate = (slotsBooked / totalPossibleSlots) * 100;

    // Cancellations
    const cancelledBookings = bookings.filter(b => b.createdAt.startsWith(monthStr) && b.paymentStatus === 'cancelled');
    const cancellationsCount = cancelledBookings.length;
    const cancellationsAmount = cancelledBookings.reduce((sum, b) => sum + (b.advanceAmount || 0), 0);

    // Money still due
    const dueAmountTotal = monthBookings.reduce((sum, b) => sum + (b.dueAmount || 0), 0);

    // 6. Investor shares
    // Investor share = net profit × investor % ÷ 100. If net profit is zero or negative, every share is ৳0.
    const monthPayouts = payouts.filter(p => p.month === monthStr);
    const investorShares = investors.map(inv => {
      const shareAmount = isLoss ? 0 : Math.round((monthNetProfit * inv.sharePercentage) / 100);
      const isPaid = monthPayouts.some(p => p.investorId === inv.id);
      return {
        investor: inv,
        shareAmount,
        percentage: inv.sharePercentage,
        isPaid
      };
    });

    const totalInvestorShare = investorShares.reduce((sum, i) => sum + i.shareAmount, 0);
    const ownersShare = Math.max(0, monthNetProfit - totalInvestorShare);

    // 7. Daily Breakdown Table
    const dailyBreakdown = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${monthStr}-${String(d).padStart(2, '0')}`;
      const dayBookings = monthBookings.filter(b => b.date === dayStr);
      const dayIncome = dayBookings.reduce((sum, b) => {
        if (b.paymentStatus === 'paid_full') return sum + b.totalPrice;
        return sum + (b.advanceAmount || 500);
      }, 0);
      const dayExp = monthExpenses.filter(e => e.date === dayStr).reduce((sum, e) => sum + e.amount, 0);
      dailyBreakdown.push({
        date: dayStr,
        slotsBooked: dayBookings.length,
        moneyCollected: dayIncome,
        expenses: dayExp,
        net: dayIncome - dayExp
      });
    }

    // 8. Expenses by Category
    const categoryTotals: Record<string, number> = {};
    monthExpenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    const expensesByCategory = Object.entries(categoryTotals).map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percentage: totalExpensesMonth > 0 ? (amt / totalExpensesMonth) * 100 : 0
    }));

    // 9. Income by Source
    const incomeBySource = [
      { source: 'Turf Slots Booking', amount: bookingMoneyCollected, percentage: totalRevenue > 0 ? (bookingMoneyCollected / totalRevenue) * 100 : 0 },
      { source: 'Sports Shop Pickup Sales', amount: monthOtherIncome.filter(o => o.source === 'shop_sales').reduce((sum, o) => sum + o.amount, 0), percentage: totalRevenue > 0 ? (monthOtherIncome.filter(o => o.source === 'shop_sales').reduce((sum, o) => sum + o.amount, 0) / totalRevenue) * 100 : 0 },
      { source: 'Tournament & Event Fees', amount: monthOtherIncome.filter(o => o.source === 'event_fees').reduce((sum, o) => sum + o.amount, 0), percentage: totalRevenue > 0 ? (monthOtherIncome.filter(o => o.source === 'event_fees').reduce((sum, o) => sum + o.amount, 0) / totalRevenue) * 100 : 0 },
      { source: 'Sponsorship & Other', amount: monthOtherIncome.filter(o => !['shop_sales', 'event_fees'].includes(o.source)).reduce((sum, o) => sum + o.amount, 0), percentage: totalRevenue > 0 ? (monthOtherIncome.filter(o => !['shop_sales', 'event_fees'].includes(o.source)).reduce((sum, o) => sum + o.amount, 0) / totalRevenue) * 100 : 0 }
    ];

    // 10. Most Popular Slots
    const slotCounts: Record<number, number> = {};
    monthBookings.forEach(b => {
      slotCounts[b.slotNumber] = (slotCounts[b.slotNumber] || 0) + 1;
    });
    const popularSlotsRanking = pricing.slotPrices.map(s => ({
      slotNumber: s.slotNumber,
      displayTime: s.displayTime,
      count: slotCounts[s.slotNumber] || 0
    })).sort((a, b) => b.count - a.count);

    return {
      month: monthStr,
      bookingMoneyCollected,
      otherIncomeTotal,
      totalRevenue,
      totalExpenses: totalExpensesMonth,
      netProfit: monthNetProfit,
      isLossMonth: isLoss,
      profitMargin,
      slotsBooked,
      occupancyRate,
      cancellationsCount,
      cancellationsAmount,
      dueAmountTotal,
      investorShares,
      ownersShare,
      dailyBreakdown,
      expensesByCategory,
      incomeBySource,
      popularSlotsRanking
    };
  }, [bookings, otherIncome, refunds, expenses, investors, payouts, pricing]);

  // Auth Operations
  const login = useCallback(async (phone: string, password = 'password123'): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setCurrentUser(data.user);
        saveCurrentUser(data.user);
        return { success: true, message: data.message };
      }
      if (!res.ok && data.error) {
        return { success: false, message: data.error };
      }
    } catch (e) {
      console.warn('Backend login error or offline, falling back to local state:', e);
    }

    // Fallback to local user lookup if API is offline
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const user = users.find(u => u.phone.replace(/[^0-9]/g, '') === cleanPhone);

    if (!user) {
      return { success: false, message: 'No account found with this phone number. Please sign up.' };
    }
    if (user.disabled) {
      return { success: false, message: 'Account is deactivated. Please contact Crossbar arena desk.' };
    }
    if (user.password && user.password !== password) {
      return { success: false, message: 'Incorrect password entered.' };
    }

    setCurrentUser(user);
    saveCurrentUser(user);
    return { success: true };
  }, [users]);

  const signup = useCallback(async (data: Partial<UserAccount>): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (res.ok && resData.success && resData.user) {
        setCurrentUser(resData.user);
        saveCurrentUser(resData.user);
        setUsers(prev => {
          const exists = prev.some(u => u.id === resData.user.id || u.phone === resData.user.phone);
          return exists ? prev : [...prev, resData.user];
        });
        return { success: true, message: resData.message };
      }
      if (!res.ok && resData.error) {
        return { success: false, message: resData.error };
      }
    } catch (e) {
      console.warn('Backend register error or offline, fallback to local state:', e);
    }

    // Fallback to local storage
    if (!data.phone || data.phone.length < 10) {
      return { success: false, message: 'Please enter a valid 11-digit Bangladeshi mobile number.' };
    }
    if (!data.name?.trim()) {
      return { success: false, message: 'Name is required.' };
    }

    const cleanPhone = data.phone.replace(/[^0-9]/g, '');
    const existing = users.find(u => u.phone.replace(/[^0-9]/g, '') === cleanPhone);
    if (existing) {
      return { success: false, message: 'An account already exists with this phone number. Please log in.' };
    }

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: data.name.trim(),
      phone: cleanPhone,
      password: data.password || 'password123',
      role: data.role || 'player',
      playingPosition: data.playingPosition || 'MID',
      email: data.email?.trim() || `${cleanPhone}@bookcrossbar.com`,
      createdAt: new Date().toISOString()
    };

    const updated = saveUser(newUser);
    setUsers(updated);
    setCurrentUser(newUser);
    saveCurrentUser(newUser);
    return { success: true };
  }, [users]);

  const logout = useCallback(() => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    // When logged out, become a Visitor
    const visitor: UserAccount = {
      id: 'usr-visitor',
      name: 'Visitor',
      phone: '',
      role: 'visitor',
      createdAt: new Date().toISOString()
    };
    setCurrentUser(visitor);
    saveCurrentUser(visitor);
  }, []);

  const switchDemoUser = useCallback((role: UserRole, specificId?: string) => {
    let target = users.find(u => u.role === role);
    if (specificId) {
      const found = users.find(u => u.id === specificId);
      if (found) target = found;
    }
    if (role === 'visitor') {
      const visitor: UserAccount = {
        id: 'usr-visitor',
        name: 'Visitor (Public)',
        phone: '',
        role: 'visitor',
        createdAt: new Date().toISOString()
      };
      setCurrentUser(visitor);
      saveCurrentUser(visitor);
      return;
    }
    if (target) {
      setCurrentUser(target);
      saveCurrentUser(target);
    }
  }, [users]);

  const resetPasswordSMS = useCallback(async (phone: string): Promise<{ success: boolean; otp?: string; message?: string }> => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const user = users.find(u => u.phone.replace(/[^0-9]/g, '') === cleanPhone);
    if (!user) {
      return { success: false, message: 'Mobile number not registered.' };
    }
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    const msg = `Crossbar Metro Arena: Your password reset security code is ${otp}. Valid for 5 minutes.`;

    const sms: SMSNotificationLog = {
      id: `sms-${Date.now()}`,
      recipientPhone: user.phone,
      message: msg,
      event: 'otp_reset',
      provider: 'SSLWireless',
      sentAt: new Date().toISOString(),
      status: 'delivered'
    };
    const updatedSms = logSMSNotification(sms);
    setSmsLogs(updatedSms);

    return {
      success: true,
      otp,
      message: `SMS code sent to +880 ${cleanPhone}. (Sandbox Code: ${otp})`
    };
  }, [users]);

  const handleUpdateUserRole = useCallback((userId: string, newRole: UserRole) => {
    const updated = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
    setUsers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cma_users_v3', JSON.stringify(updated));
    }
  }, [users]);

  const handleToggleUserDisabled = useCallback((userId: string) => {
    const updated = users.map(u => u.id === userId ? { ...u, disabled: !u.disabled } : u);
    setUsers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cma_users_v3', JSON.stringify(updated));
    }
  }, [users]);

  // SMS Notification Dispatch
  const sendSMSNotification = useCallback((phone: string, message: string, event: SMSNotificationLog['event']) => {
    const sms: SMSNotificationLog = {
      id: `sms-${Date.now()}`,
      recipientPhone: phone,
      message,
      event,
      provider: 'SSLWireless',
      sentAt: new Date().toISOString(),
      status: 'delivered'
    };
    const updated = logSMSNotification(sms);
    setSmsLogs(updated);
  }, []);

  // Booking operations
  const handleBookingSuccess = useCallback((newBooking: Booking) => {
    try {
      const updated = saveBooking(newBooking);
      setBookings(updated);
      setSlotHolds(getActiveSlotHolds());
      setActiveTicketPass(newBooking);

      // Automated SMS confirmation
      const smsText = `Crossbar Metro: Booking ${newBooking.bookingCode} confirmed for ${newBooking.date} (${newBooking.displayTime}). Paid: ৳${newBooking.advanceAmount.toLocaleString()}, Due: ৳${newBooking.dueAmount.toLocaleString()}. Uttara Metro Center.`;
      sendSMSNotification(newBooking.captainPhone, smsText, 'booking_confirmed');
    } catch (err: any) {
      alert(err.message || 'Error processing booking');
    }
  }, [sendSMSNotification]);

  const handlePlaceSlotHold = useCallback((courtId: string, date: string, slotNumber: number, teamName: string) => {
    const hold = placeSlotHold(courtId, date, slotNumber, teamName, pricing.holdMinutes || 10);
    setSlotHolds(getActiveSlotHolds());
    return hold;
  }, [pricing.holdMinutes]);

  const handleReleaseSlotHold = useCallback((courtId: string, date: string, slotNumber: number) => {
    releaseSlotHold(courtId, date, slotNumber);
    setSlotHolds(getActiveSlotHolds());
  }, []);

  const handleUpdateBookingStatus = useCallback((id: string, status: Booking['paymentStatus'], collectedCash?: number) => {
    const updated = updateBookingStatus(id, status, collectedCash);
    setBookings(updated);
  }, []);

  const handleCancelBooking = useCallback((id: string) => {
    const result = cancelBooking(id, true);
    setBookings(result.bookings);
    if (result.refund) {
      setRefunds(getStoredRefunds());
    }
    const target = bookings.find(b => b.id === id);
    if (target) {
      const msg = `Crossbar Metro: Booking ${target.bookingCode} on ${target.date} was cancelled. Advance paid (৳${target.advanceAmount}) sent to refund queue.`;
      sendSMSNotification(target.captainPhone, msg, 'booking_cancelled');
    }
  }, [bookings, sendSMSNotification]);

  const handleRecordRefund = useCallback((refundId: string, amount: number, method: RefundRecord['refundMethod'], transactionRef?: string) => {
    const current = getStoredRefunds();
    const updated = current.map(r => {
      if (r.id === refundId) {
        return {
          ...r,
          amount,
          refundMethod: method,
          status: 'completed' as const,
          refundedDate: new Date().toISOString().split('T')[0],
          transactionRef: transactionRef || `REF-${Date.now().toString().slice(-6)}`,
          recordedBy: currentUser?.name || 'Admin Abid'
        };
      }
      return r;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('cma_refunds_v3', JSON.stringify(updated));
    }
    setRefunds(updated);
  }, [currentUser]);

  const handleRecordPayout = useCallback((payout: PayoutRecord) => {
    const updated = savePayout(payout);
    setPayouts(updated);
  }, []);

  const handleAddOtherIncome = useCallback((income: OtherIncomeRecord) => {
    const updated = saveOtherIncome(income);
    setOtherIncome(updated);
  }, []);

  const handleSavePricing = useCallback((newConfig: PricingConfig) => {
    const updated = savePricing(newConfig);
    setPricing(updated);
  }, []);

  const handleAddExpense = useCallback((expense: ExpenseRecord) => {
    const updated = saveExpense(expense);
    setExpenses(updated);
  }, []);

  const handleDeleteExpense = useCallback((id: string) => {
    const updated = deleteExpense(id);
    setExpenses(updated);
  }, []);

  const handleSaveInvestors = useCallback((invs: InvestorRecord[]) => {
    const updated = saveInvestors(invs);
    setInvestors(updated);
  }, []);

  const handleSaveTeam = useCallback((team: PlayerTeam) => {
    const updated = saveTeam(team);
    setTeams(updated);
  }, []);

  const handleAddPlayerToTeam = useCallback((teamId: string, player: TeamMember) => {
    const updated = addPlayerToTeam(teamId, player);
    setTeams(updated);
  }, []);

  const handleSaveMatchResult = useCallback((result: MatchDayResult) => {
    const updated = saveMatchResult(result);
    setMatchResults(updated);
  }, []);

  const handleSaveShopProduct = useCallback((product: ShopProduct) => {
    const updated = saveShopProduct(product);
    setShopProducts(updated);
  }, []);

  const handleSaveShopReservation = useCallback((reservation: ShopReservation) => {
    const updated = saveShopReservation(reservation);
    setShopReservations(updated);
  }, []);

  const handleUpdateShopReservationStatus = useCallback((id: string, status: ShopReservation['status']) => {
    const updated = updateShopReservationStatus(id, status);
    setShopReservations(updated);
    setOtherIncome(getStoredOtherIncome());
    setShopProducts(getStoredShopProducts());
  }, []);

  const handleRegistrationSuccess = useCallback((newReg: TournamentRegistration) => {
    const updated = saveTournamentRegistration(newReg);
    setRegistrations(updated);
    setTournaments(getStoredTournaments());
  }, []);

  const handleAddChallenge = useCallback((newChallenge: CommunityMatchChallenge) => {
    const updated = saveChallenge(newChallenge);
    setChallenges(updated);
  }, []);

  const handleSavePhoto = useCallback((photo: GalleryPhoto) => {
    const updated = saveGalleryPhoto(photo);
    setGalleryPhotos(updated);
  }, []);

  const handleDeletePhoto = useCallback((id: string) => {
    const updated = deleteStoredGalleryPhoto(id);
    setGalleryPhotos(updated);
  }, []);

  const handleToggleFeaturedPhoto = useCallback((id: string) => {
    const current = getStoredGalleryPhotos();
    const target = current.find(p => p.id === id);
    if (target) {
      const updatedPhoto = { ...target, featured: !target.featured };
      const updated = saveGalleryPhoto(updatedPhoto);
      setGalleryPhotos(updated);
    }
  }, []);

  const handleSaveSiteSettings = useCallback((settings: SiteSettings) => {
    const updated = saveSiteSettings(settings);
    setSiteSettings(updated);
  }, []);

  // Cart operations
  const addToCart = useCallback((product: ShopProduct, selectedSize?: string, qty = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.selectedSize === selectedSize);
      if (existing) {
        return prev.map(item => item === existing ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prev, { product, selectedSize, quantity: qty }];
    });
    setShowCartDrawer(true);
  }, []);

  const removeFromCart = useCallback((productId: string, size?: string) => {
    setCartItems(prev => prev.filter(item => !(item.product.id === productId && item.selectedSize === size)));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Daily backup JSON export
  const exportDatabaseBackup = useCallback(() => {
    const fullBackup = {
      venue: 'Crossbar Metro Arena (bookcrossbar.com)',
      backupGeneratedAt: new Date().toISOString(),
      bookings,
      pricing,
      expenses,
      investors,
      payouts,
      refunds,
      otherIncome,
      teams,
      matchResults,
      shopProducts,
      shopReservations,
      tournaments,
      registrations,
      challenges,
      galleryPhotos,
      users,
      siteSettings,
      smsLogs
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `crossbar_metro_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [bookings, pricing, expenses, investors, payouts, refunds, otherIncome, teams, matchResults, shopProducts, shopReservations, tournaments, registrations, challenges, galleryPhotos, users, siteSettings, smsLogs]);

  const handleRestoreDatabase = useCallback((backupJson: any): boolean => {
    const ok = restoreDatabaseBackup(backupJson);
    if (ok) {
      setBookings(getStoredBookings());
      setPricing(getStoredPricing());
      setExpenses(getStoredExpenses());
      setInvestors(getStoredInvestors());
      setPayouts(getStoredPayouts());
      setRefunds(getStoredRefunds());
      setOtherIncome(getStoredOtherIncome());
      setTeams(getStoredTeams());
      setMatchResults(getStoredMatchResults());
      setShopProducts(getStoredShopProducts());
      setShopReservations(getStoredShopReservations());
      setTournaments(getStoredTournaments());
      setRegistrations(getStoredRegistrations());
      setChallenges(getStoredChallenges());
      setGalleryPhotos(getStoredGalleryPhotos());
      setUsers(getStoredUsers());
      setSiteSettings(getStoredSiteSettings());
    }
    return ok;
  }, []);

  return (
    <ArenaContext.Provider
      value={{
        bookings,
        slotHolds,
        pricing,
        expenses,
        investors,
        payouts,
        refunds,
        otherIncome,
        teams,
        matchResults,
        shopProducts,
        shopReservations,
        tournaments,
        registrations,
        challenges,
        galleryPhotos,
        users,
        currentUser,
        smsLogs,
        siteSettings,
        isInitialized,
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        showCartDrawer,
        setShowCartDrawer,
        grossRevenue,
        totalExpenses,
        netProfit,
        isLossMonth,
        calculateMonthlyFinance,
        activeTicketPass,
        setActiveTicketPass,
        showSquadModal,
        setShowSquadModal,
        showAdminModal,
        setShowAdminModal,
        showPassesDrawer,
        setShowPassesDrawer,
        showInstallModal,
        setShowInstallModal,
        showAuthModal,
        setShowAuthModal,
        authModalInitialTab,
        setAuthModalInitialTab,
        showSSLCommerzModal,
        setShowSSLCommerzModal,
        pendingBookingData,
        setPendingBookingData,
        showHandoverGuide,
        setShowHandoverGuide,
        login,
        signup,
        logout,
        switchDemoUser,
        resetPasswordSMS,
        handleUpdateUserRole,
        handleToggleUserDisabled,
        handleBookingSuccess,
        handlePlaceSlotHold,
        handleReleaseSlotHold,
        handleUpdateBookingStatus,
        handleCancelBooking,
        handleRecordRefund,
        handleRecordPayout,
        handleAddOtherIncome,
        handleSavePricing,
        handleAddExpense,
        handleDeleteExpense,
        handleSaveInvestors,
        handleSaveTeam,
        handleAddPlayerToTeam,
        handleSaveMatchResult,
        handleSaveShopProduct,
        handleSaveShopReservation,
        handleUpdateShopReservationStatus,
        handleRegistrationSuccess,
        handleAddChallenge,
        handleSavePhoto,
        handleDeletePhoto,
        handleToggleFeaturedPhoto,
        handleSaveSiteSettings,
        sendSMSNotification,
        exportDatabaseBackup,
        handleRestoreDatabase
      }}
    >
      {children}
    </ArenaContext.Provider>
  );
};

export const useArena = () => {
  const context = useContext(ArenaContext);
  if (!context) {
    throw new Error('useArena must be used within an ArenaProvider');
  }
  return context;
};
