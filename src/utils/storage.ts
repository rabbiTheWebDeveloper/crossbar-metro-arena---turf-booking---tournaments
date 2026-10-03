import { Booking, TournamentRegistration, CommunityMatchChallenge, Tournament } from '../types';
import { INITIAL_BOOKINGS, INITIAL_TOURNAMENTS, INITIAL_COMMUNITY_CHALLENGES } from '../data/initialData';

const STORAGE_KEYS = {
  BOOKINGS: 'cma_bookings_v1',
  TOURNAMENTS: 'cma_tournaments_v1',
  REGISTRATIONS: 'cma_tournament_registrations_v1',
  CHALLENGES: 'cma_challenges_v1',
  USER_SQUAD: 'cma_user_saved_squad_v1'
};

export const getStoredBookings = (): Booking[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return data ? JSON.parse(data) : INITIAL_BOOKINGS;
  } catch {
    return INITIAL_BOOKINGS;
  }
};

export const saveBooking = (newBooking: Booking): Booking[] => {
  const current = getStoredBookings();
  const updated = [newBooking, ...current];
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save booking', e);
  }
  return updated;
};

export const updateBookingStatus = (id: string, status: Booking['paymentStatus']): Booking[] => {
  const current = getStoredBookings();
  const updated = current.map(b => b.id === id ? { ...b, paymentStatus: status } : b);
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update booking status', e);
  }
  return updated;
};

export const cancelBooking = (id: string): Booking[] => {
  const current = getStoredBookings();
  const updated = current.filter(b => b.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to cancel booking', e);
  }
  return updated;
};

export const getStoredTournaments = (): Tournament[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
    return data ? JSON.parse(data) : INITIAL_TOURNAMENTS;
  } catch {
    return INITIAL_TOURNAMENTS;
  }
};

export const getStoredRegistrations = (): TournamentRegistration[] => {
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
  try {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(updated));

    // Also increment registeredCount in tournament
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
  return updated;
};

export const getStoredChallenges = (): CommunityMatchChallenge[] => {
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
  try {
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save challenge', e);
  }
  return updated;
};
