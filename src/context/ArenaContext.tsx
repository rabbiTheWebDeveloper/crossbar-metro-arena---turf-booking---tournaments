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
  TeamMember
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
  getStoredShopReservations,
  saveShopReservation,
  updateShopReservationStatus,
  getActiveSlotHolds,
  placeSlotHold,
  releaseSlotHold,
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
  INITIAL_MATCH_RESULTS
} from '../data/initialData';

interface ArenaContextType {
  bookings: Booking[];
  slotHolds: ActiveSlotHold[];
  pricing: PricingConfig;
  expenses: ExpenseRecord[];
  investors: InvestorRecord[];
  teams: PlayerTeam[];
  matchResults: MatchDayResult[];
  shopReservations: ShopReservation[];
  tournaments: Tournament[];
  registrations: TournamentRegistration[];
  challenges: CommunityMatchChallenge[];
  isInitialized: boolean;

  // Financial computations
  grossRevenue: number;
  totalExpenses: number;
  netProfit: number;
  isLossMonth: boolean;

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

  // Operations
  handleBookingSuccess: (newBooking: Booking) => void;
  handlePlaceSlotHold: (courtId: string, date: string, slotNumber: number, teamName: string) => ActiveSlotHold;
  handleReleaseSlotHold: (courtId: string, date: string, slotNumber: number) => void;
  handleUpdateBookingStatus: (id: string, status: Booking['paymentStatus'], collectedCash?: number) => void;
  handleCancelBooking: (id: string) => void;
  handleSavePricing: (newConfig: PricingConfig) => void;
  handleAddExpense: (expense: ExpenseRecord) => void;
  handleDeleteExpense: (id: string) => void;
  handleSaveInvestors: (investors: InvestorRecord[]) => void;
  handleSaveTeam: (team: PlayerTeam) => void;
  handleAddPlayerToTeam: (teamId: string, player: TeamMember) => void;
  handleSaveMatchResult: (result: MatchDayResult) => void;
  handleSaveShopReservation: (reservation: ShopReservation) => void;
  handleUpdateShopReservationStatus: (id: string, status: ShopReservation['status']) => void;
  handleRegistrationSuccess: (newReg: TournamentRegistration) => void;
  handleAddChallenge: (newChallenge: CommunityMatchChallenge) => void;
  exportDatabaseBackup: () => void;
}

const ArenaContext = createContext<ArenaContextType | undefined>(undefined);

export const ArenaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [slotHolds, setSlotHolds] = useState<ActiveSlotHold[]>([]);
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES);
  const [investors, setInvestors] = useState<InvestorRecord[]>(INITIAL_INVESTORS);
  const [teams, setTeams] = useState<PlayerTeam[]>(INITIAL_TEAMS);
  const [matchResults, setMatchResults] = useState<MatchDayResult[]>(INITIAL_MATCH_RESULTS);
  const [shopReservations, setShopReservations] = useState<ShopReservation[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>(INITIAL_TOURNAMENTS);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [challenges, setChallenges] = useState<CommunityMatchChallenge[]>(INITIAL_COMMUNITY_CHALLENGES);
  const [isInitialized, setIsInitialized] = useState(false);

  // Modals state
  const [activeTicketPass, setActiveTicketPass] = useState<Booking | null>(null);
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPassesDrawer, setShowPassesDrawer] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Load client data
  useEffect(() => {
    setBookings(getStoredBookings());
    setSlotHolds(getActiveSlotHolds());
    setPricing(getStoredPricing());
    setExpenses(getStoredExpenses());
    setInvestors(getStoredInvestors());
    setTeams(getStoredTeams());
    setMatchResults(getStoredMatchResults());
    setShopReservations(getStoredShopReservations());
    setTournaments(getStoredTournaments());
    setRegistrations(getStoredRegistrations());
    setChallenges(getStoredChallenges());
    setIsInitialized(true);
  }, []);

  // 10-minute hold ticker: check every 10 seconds to auto-release expired holds
  useEffect(() => {
    const timer = setInterval(() => {
      const active = getActiveSlotHolds();
      setSlotHolds(active);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Financial calculations: Income - Expenses = Net Profit
  const grossRevenue = useMemo(() => {
    return bookings.reduce((sum, b) => {
      if (b.paymentStatus === 'paid_full') return sum + b.totalPrice;
      if (b.paymentStatus === 'paid_advance') return sum + (b.advanceAmount || 500);
      return sum;
    }, 0);
  }, [bookings]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const netProfit = useMemo(() => {
    return grossRevenue - totalExpenses;
  }, [grossRevenue, totalExpenses]);

  const isLossMonth = useMemo(() => {
    return netProfit <= 0;
  }, [netProfit]);

  // Operations
  const handleBookingSuccess = useCallback((newBooking: Booking) => {
    const updated = saveBooking(newBooking);
    setBookings(updated);
    setSlotHolds(getActiveSlotHolds());
    setActiveTicketPass(newBooking);
  }, []);

  const handlePlaceSlotHold = useCallback((courtId: string, date: string, slotNumber: number, teamName: string) => {
    const hold = placeSlotHold(courtId, date, slotNumber, teamName);
    setSlotHolds(getActiveSlotHolds());
    return hold;
  }, []);

  const handleReleaseSlotHold = useCallback((courtId: string, date: string, slotNumber: number) => {
    releaseSlotHold(courtId, date, slotNumber);
    setSlotHolds(getActiveSlotHolds());
  }, []);

  const handleUpdateBookingStatus = useCallback((id: string, status: Booking['paymentStatus'], collectedCash?: number) => {
    const updated = updateBookingStatus(id, status, collectedCash);
    setBookings(updated);
  }, []);

  const handleCancelBooking = useCallback((id: string) => {
    const updated = cancelBooking(id);
    setBookings(updated);
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

  const handleSaveShopReservation = useCallback((reservation: ShopReservation) => {
    const updated = saveShopReservation(reservation);
    setShopReservations(updated);
  }, []);

  const handleUpdateShopReservationStatus = useCallback((id: string, status: ShopReservation['status']) => {
    const updated = updateShopReservationStatus(id, status);
    setShopReservations(updated);
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

  // Daily backup JSON export
  const exportDatabaseBackup = useCallback(() => {
    const fullBackup = {
      venue: 'Crossbar Metro Arena (bookcrossbar.com)',
      backupGeneratedAt: new Date().toISOString(),
      bookings,
      pricing,
      expenses,
      investors,
      teams,
      matchResults,
      shopReservations,
      tournaments,
      registrations
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `crossbar_metro_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [bookings, pricing, expenses, investors, teams, matchResults, shopReservations, tournaments, registrations]);

  return (
    <ArenaContext.Provider
      value={{
        bookings,
        slotHolds,
        pricing,
        expenses,
        investors,
        teams,
        matchResults,
        shopReservations,
        tournaments,
        registrations,
        challenges,
        isInitialized,
        grossRevenue,
        totalExpenses,
        netProfit,
        isLossMonth,
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
        handleBookingSuccess,
        handlePlaceSlotHold,
        handleReleaseSlotHold,
        handleUpdateBookingStatus,
        handleCancelBooking,
        handleSavePricing,
        handleAddExpense,
        handleDeleteExpense,
        handleSaveInvestors,
        handleSaveTeam,
        handleAddPlayerToTeam,
        handleSaveMatchResult,
        handleSaveShopReservation,
        handleUpdateShopReservationStatus,
        handleRegistrationSuccess,
        handleAddChallenge,
        exportDatabaseBackup
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
