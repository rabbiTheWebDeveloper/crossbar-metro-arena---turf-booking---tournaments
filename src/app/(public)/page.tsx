'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useArena } from '../../context/ArenaContext';
import { HeroBanner } from '../../components/HeroBanner';
import { BookingSection } from '../../components/BookingSection';
import { TournamentSection } from '../../components/TournamentSection';
import { MatchTrackerSection } from '../../components/MatchTrackerSection';
import { VenueLocationSection } from '../../components/VenueLocationSection';

export default function ArenaHomePage() {
  const router = useRouter();
  const {
    bookings,
    tournaments,
    challenges,
    handleBookingSuccess,
    handleRegistrationSuccess,
    handleAddChallenge,
    setShowSquadModal
  } = useArena();

  return (
    <>
      {/* Hero Banner & Launch Status */}
      <HeroBanner
        onBookClick={() => router.push('/booking')}
        onTagSquadClick={() => setShowSquadModal(true)}
        onTournamentsClick={() => router.push('/tournaments')}
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
        onBookSlotClick={() => router.push('/booking')}
      />

      {/* Location, Metro Connection & Amenities */}
      <VenueLocationSection onBookSlotClick={() => router.push('/booking')} />
    </>
  );
}
