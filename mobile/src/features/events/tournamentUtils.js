/**
 * Tournament availability rules (same as the website's TournamentSection).
 */
import { todayDhakaIso } from '@/lib/dateUtils';

export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 12;

/** Entry-fee payment choices, with the values the registrations API expects. */
export const PAYMENT_OPTIONS = [
    { value: 'bkash', title: 'bKash', sub: 'Send Money / Pay', color: '#E2136E' }, // bKash brand colour
    { value: 'nagad', title: 'Nagad', sub: 'Mobile Wallet', color: '#F7941D' }, // Nagad brand colour
    { value: 'pay_at_turf', title: 'Pay at Turf', sub: 'Cash at the desk', color: null },
    { value: 'bank', title: 'Bank Transfer', sub: 'EFT / Fast Pay', color: null }
];
export const paymentLabel = (value) => (PAYMENT_OPTIONS.find(o => o.value === value) || {}).title || String(value || '');

const isRegistrationOpen = (t, today) => ['open', 'fast_filling'].includes(t.status) && (!t.registrationDeadline || t.registrationDeadline >= today);

/** Tournament availability for a card: 'open' | 'full' | 'closed' */
export function tournamentAvailability(t, today = todayDhakaIso()) {
    const max = Number(t.maxTeams) || 0;
    const registered = Number(t.registeredCount) || 0;
    if (!isRegistrationOpen(t, today)) return 'closed';
    if (max > 0 && registered >= max) return 'full';
    return 'open';
}

/** Open tournaments first, then full / closed ones (kept visible with a badge). */
export function orderTournaments(tournaments, today = todayDhakaIso()) {
    const rank = { open: 0, full: 1, closed: 2 };
    return (tournaments || [])
        .map((t, index) => ({ t, index, availability: tournamentAvailability(t, today) }))
        .sort((a, b) => (rank[a.availability] - rank[b.availability]) || (a.index - b.index));
}

/** Status pill for a tournament card: { label, tone }. */
export function availabilityBadge(t, availability) {
    if (availability === 'full') return { label: 'Full', tone: 'danger' };
    if (availability === 'closed') return { label: 'Closed', tone: 'neutral' };
    if (t.status === 'fast_filling') return { label: 'Filling Fast', tone: 'warning' };
    return { label: 'Registration Open', tone: 'success' };
}

/** "1. Rahim (GK)\n2) Karim" -> ['Rahim (GK)', 'Karim'] : one player per line, list numbering removed. */
export const parsePlayers = (text) => String(text || '').split('\n').map(p => p.replace(/^\s*\d+[.)-]?\s*/, '').trim()).filter(Boolean);
