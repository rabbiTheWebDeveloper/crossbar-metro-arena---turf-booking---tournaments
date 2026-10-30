import { cleanPhone } from './apiAuth';

export function sanitizePlayer(p) {
    if (!p || !p.name || String(p.name).trim().length < 2) return null;
    return {
        id: p.id && String(p.id).length < 40 ? String(p.id) : `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: String(p.name).trim().slice(0, 40),
        number: Math.min(99, Math.max(0, Number(p.number) || 0)),
        position: ['GK', 'DEF', 'MID', 'FWD'].includes(p.position) ? p.position : 'MID',
        role: String(p.role || 'Player').slice(0, 20),
        phone: cleanPhone(p.phone || ''),
        goals: Number(p.goals) || 0,
        matchesPlayed: Number(p.matchesPlayed) || 0
    };
}

/** Is this user the captain of the team (or an admin)? */
export function canManageTeam(user, team) {
    if (!user || !team) return false;
    if (user.role === 'admin') return true;
    return cleanPhone(user.phone) !== '' && cleanPhone(user.phone) === cleanPhone(team.captainPhone);
}
