/**
 * Shared constants and pure helpers for the Match Day screens (results, standings, fixtures,
 * squad challenges). Mirrors the logic of the website's ResultsClient / MatchTrackerSection.
 */
import { Linking } from 'react-native';
import { todayDhakaIso } from '@/lib/dateUtils';
import { cleanPhone } from '@/lib/phone';

export const CONFIRMED_STATES = ['confirmed_unpaid', 'paid_advance', 'paid_full'];

// Challenge form options (same values the website posts)
export const LEVELS = ['Casual', 'Semi-Pro', 'Competitive', 'Pro'];
export const FORMATS = ['7 vs 7 Friendly Match', '5 vs 5 Friendly Match', '6 vs 6 Friendly Match'];
export const LOOKING_FOR = ['Opponent Team', '1-2 Players Needed', 'Goalkeeper Needed'];
export const COST_SHARES = ['50/50 Split', 'We pay the slot', 'Opponent pays the slot'];

// Result form options
export const MATCH_TYPES = ['7v7 Friendly', '7v7 League Match', '5v5 Friendly', 'Tournament Match'];
export const EVENT_TYPES = [
    { value: 'goal', label: 'Goal' },
    { value: 'assist', label: 'Assist' },
    { value: 'own_goal', label: 'Own Goal' },
    { value: 'yellow', label: 'Yellow Card' },
    { value: 'red', label: 'Red Card' }
];

/** Badge tones for result / challenge statuses. */
export const RESULT_STATUS_TONE = { published: 'success', pending_approval: 'warning', rejected: 'danger' };
export const CHALLENGE_STATUS_TONE = { open: 'success', matched: 'info', closed: 'neutral' };

/** "pending_approval" -> "pending approval" */
export const statusLabel = (s) => String(s || '').replace(/_/g, ' ');

/** Upcoming confirmed fixtures (today onwards, ascending). Only team name and time are public. */
export function upcomingFixtures(bookings, today = todayDhakaIso()) {
    return (bookings || [])
        .filter(b => b && CONFIRMED_STATES.includes(b.paymentStatus) && String(b.date || '') >= today)
        .sort((a, b) => {
            if (a.date === b.date) return (Number(a.slotNumber) || 0) - (Number(b.slotNumber) || 0);
            return String(a.date) < String(b.date) ? -1 : 1;
        });
}

/** Only published results are public (older records have no status at all). */
export const isPublishedResult = (m) => !!m && (!m.status || m.status === 'published');

const stat = (team, key) => Number(team?.stats?.[key]) || 0;

/** League order: points, then goal difference, then goals scored. */
export function sortStandings(teams) {
    return [...(teams || [])].sort((a, b) => {
        if (stat(b, 'points') !== stat(a, 'points')) return stat(b, 'points') - stat(a, 'points');
        const gdA = stat(a, 'gf') - stat(a, 'ga');
        const gdB = stat(b, 'gf') - stat(b, 'ga');
        if (gdB !== gdA) return gdB - gdA;
        return stat(b, 'gf') - stat(a, 'gf');
    });
}

/**
 * Golden Boot list.
 *   period 'all_time': roster goal totals
 *   period 'this_month': goals logged in results dated in `monthStr` (YYYY-MM)
 * Every entry carries `goalsCount` for the selected period.
 */
export function buildTopScorers(teams, matchResults, period, monthStr) {
    const allPlayers = (teams || []).flatMap(t => (t?.players || []).map(p => ({ ...p, teamName: t.name, teamColor: t.homeColor })));
    if (period === 'this_month') {
        const monthGoals = {};
        (matchResults || [])
            .filter(m => isPublishedResult(m) && String(m.date || '').startsWith(monthStr))
            .forEach(m => (m.scorers || []).forEach(s => {
                if (s && s.playerName) monthGoals[s.playerName] = (monthGoals[s.playerName] || 0) + 1;
            }));
        return allPlayers
            .map(p => ({ ...p, goalsCount: monthGoals[p.name] || 0 }))
            .filter(p => p.goalsCount > 0)
            .sort((a, b) => b.goalsCount - a.goalsCount);
    }
    return allPlayers
        .map(p => ({ ...p, goalsCount: Number(p.goals) || 0 }))
        .filter(p => p.goalsCount > 0)
        .sort((a, b) => b.goalsCount - a.goalsCount);
}

/** True for a complete Bangladeshi mobile number (public listings mask the middle digits). */
export const isFullPhone = (raw) => /^01[3-9]\d{8}$/.test(cleanPhone(raw));

export const telLink = (phone) => `tel:${cleanPhone(phone)}`;

export const whatsappLink = (phone, text) => `https://wa.me/88${cleanPhone(phone)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** Opens an external link (dialler, WhatsApp, browser); `onFail` runs when nothing can handle it. */
export function openLink(url, onFail) {
    if (!url) return;
    Linking.openURL(url).catch(() => { if (onFail) onFail(); });
}
