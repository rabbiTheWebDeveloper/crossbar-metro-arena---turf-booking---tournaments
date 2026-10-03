'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Booking, TournamentRegistration, CommunityMatchChallenge, Tournament } from '../types';
import {
  getStoredBookings,
  saveBooking,
  updateBookingStatus,
  cancelBooking,
  getStoredTournaments,
  getStoredRegistrations,
  saveTournamentRegistration,
  getStoredChallenges,
  saveChallenge
} from '../utils/storage';
import { INITIAL_BOOKINGS, INITIAL_TOURNAMENTS, INITIAL_COMMUNITY_CHALLENGES } from '../data/initialData';

interface ArenaContextType {
  bookings: Booking[];
  tournaments: Tournament[];
  registrations: TournamentRegistration[];
  challenges: CommunityMatchChallenge[];
  isInitialized: boolean;
  activeTicketPass: Booking | null;
  setActiveTicketPass: (b: Booking | null) => void;
  showSquadModal: boolean;
  setShowSquadModal: (show: boolean) => void;
  showAdminModal: boolean;
  setShowAdminModal: (show: boolean) => void;
  showPassesDrawer: boolean;
  setShowPassesDrawer: (show: boolean) => void;
  handleBookingSuccess: (newBooking: Booking) => void;
  handleRegistrationSuccess: (newReg: TournamentRegistration) => void;
  handleAddChallenge: (newChallenge: CommunityMatchChallenge) => void;
  handleUpdateBookingStatus: (id: string, status: Booking['paymentStatus']) => void;
  handleCancelBooking: (id: string) => void;
  handleAddManualBooking: (manualBooking: Booking) => void;
}

const ArenaContext = createContext<ArenaContextType | undefined>(undefined);

export const ArenaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [tournaments, setTournaments] = useState<Tournament[]>(INITIAL_TOURNAMENTS);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [challenges, setChallenges] = useState<CommunityMatchChallenge[]>(INITIAL_COMMUNITY_CHALLENGES);
  const [isInitialized, setIsInitialized] = useState(false);

  // Modals state
  const [activeTicketPass, setActiveTicketPass] = useState<Booking | null>(null);
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPassesDrawer, setShowPassesDrawer] = useState(false);

  // Load real stored data in client mount
  useEffect(() => {
    setBookings(getStoredBookings());
    setTournaments(getStoredTournaments());
    setRegistrations(getStoredRegistrations());
    setChallenges(getStoredChallenges());
    setIsInitialized(true);
  }, []);

  const handleBookingSuccess = (newBooking: Booking) => {
    const updated = saveBooking(newBooking);
    setBookings(updated);
    setActiveTicketPass(newBooking);
  };

  const handleRegistrationSuccess = (newReg: TournamentRegistration) => {
    const updated = saveTournamentRegistration(newReg);
    setRegistrations(updated);
    setTournaments(getStoredTournaments());
  };

  const handleAddChallenge = (newChallenge: CommunityMatchChallenge) => {
    const updated = saveChallenge(newChallenge);
    setChallenges(updated);
  };

  const handleUpdateBookingStatus = (id: string, status: Booking['paymentStatus']) => {
    const updated = updateBookingStatus(id, status);
    setBookings(updated);
  };

  const handleCancelBooking = (id: string) => {
    const updated = cancelBooking(id);
    setBookings(updated);
  };

  const handleAddManualBooking = (manualBooking: Booking) => {
    const updated = saveBooking(manualBooking);
    setBookings(updated);
  };

  return (
    <ArenaContext.Provider
      value={{
        bookings,
        tournaments,
        registrations,
        challenges,
        isInitialized,
        activeTicketPass,
        setActiveTicketPass,
        showSquadModal,
        setShowSquadModal,
        showAdminModal,
        setShowAdminModal,
        showPassesDrawer,
        setShowPassesDrawer,
        handleBookingSuccess,
        handleRegistrationSuccess,
        handleAddChallenge,
        handleUpdateBookingStatus,
        handleCancelBooking,
        handleAddManualBooking
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
