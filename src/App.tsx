import React, { useState, useEffect } from 'react';
import { Booking, TournamentRegistration, CommunityMatchChallenge, Tournament } from './types';
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
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { BookingSection } from './components/BookingSection';
import { TournamentSection } from './components/TournamentSection';
import { MatchTrackerSection } from './components/MatchTrackerSection';
import { VenueLocationSection } from './components/VenueLocationSection';
import { Footer } from './components/Footer';
import { TicketPassModal } from './components/TicketPassModal';
import { SquadBuilderModal } from './components/SquadBuilderModal';
import { ArenaManagerModal } from './components/ArenaManagerModal';
import { MyPassesDrawer } from './components/MyPassesDrawer';

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [challenges, setChallenges] = useState<CommunityMatchChallenge[]>([]);

  // Modals
  const [activeTicketPass, setActiveTicketPass] = useState<Booking | null>(null);
  const [showSquadBuilder, setShowSquadBuilder] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPassesDrawer, setShowPassesDrawer] = useState(false);

  // Initialize from storage
  useEffect(() => {
    setBookings(getStoredBookings());
    setTournaments(getStoredTournaments());
    setRegistrations(getStoredRegistrations());
    setChallenges(getStoredChallenges());
  }, []);

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    if (sectionId === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBookingSuccess = (newBooking: Booking) => {
    const updated = saveBooking(newBooking);
    setBookings(updated);
    setActiveTicketPass(newBooking);
  };

  const handleRegistrationSuccess = (newReg: TournamentRegistration) => {
    const updated = saveTournamentRegistration(newReg);
    setRegistrations(updated);
    // Refresh tournaments count
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
    <div className="min-h-screen bg-[#070b0e] text-slate-100 flex flex-col font-sans">
      {/* Navigation */}
      <Navbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        userBookings={bookings}
        onOpenMyBookings={() => setShowPassesDrawer(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenSquadBuilder={() => setShowSquadBuilder(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Banner & Launch Status */}
        <HeroBanner
          onBookClick={() => handleNavigate('booking')}
          onTagSquadClick={() => setShowSquadBuilder(true)}
          onTournamentsClick={() => handleNavigate('tournaments')}
        />

        {/* Real-time Court Slot Booking Engine */}
        <BookingSection
          bookings={bookings}
          onBookingSuccess={handleBookingSuccess}
        />

        {/* Tournaments & Championships */}
        <TournamentSection
          tournaments={tournaments}
          onRegistrationSuccess={handleRegistrationSuccess}
        />

        {/* Matchday Center: Upcoming Fixtures & Squad Match Challenges */}
        <MatchTrackerSection
          bookings={bookings}
          challenges={challenges}
          onAddChallenge={handleAddChallenge}
          onBookSlotClick={() => handleNavigate('booking')}
        />

        {/* Location, Metro Connection & Amenities */}
        <VenueLocationSection onBookSlotClick={() => handleNavigate('booking')} />
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenSquadBuilder={() => setShowSquadBuilder(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
      />

      {/* MODAL 1: Digital Ticket Pass */}
      {activeTicketPass && (
        <TicketPassModal
          booking={activeTicketPass}
          onClose={() => setActiveTicketPass(null)}
        />
      )}

      {/* MODAL 2: Tag Your Match Squad / Lineup Builder */}
      {showSquadBuilder && (
        <SquadBuilderModal
          onClose={() => setShowSquadBuilder(false)}
        />
      )}

      {/* MODAL 3: Arena Manager & Staff Dashboard */}
      {showAdminModal && (
        <ArenaManagerModal
          bookings={bookings}
          registrations={registrations}
          onClose={() => setShowAdminModal(false)}
          onUpdateBookingStatus={handleUpdateBookingStatus}
          onCancelBooking={handleCancelBooking}
          onAddManualBooking={handleAddManualBooking}
        />
      )}

      {/* DRAWER: My Match Passes */}
      {showPassesDrawer && (
        <MyPassesDrawer
          bookings={bookings}
          onClose={() => setShowPassesDrawer(false)}
          onSelectBooking={(b) => {
            setShowPassesDrawer(false);
            setActiveTicketPass(b);
          }}
          onBookMore={() => handleNavigate('booking')}
        />
      )}
    </div>
  );
}
