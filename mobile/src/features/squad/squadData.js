/**
 * Static data + pure helpers for the squad builder (formats, kits, sample lineups, share text).
 * Player positions are percentages of the pitch: x from the left touchline, y from the top.
 */

export const DEFAULT_TEAM_NAME = 'Uttara Metro Squad';
export const DEFAULT_MATCH_TAG = 'Crossbar Metro Arena Kickoff ⚽';
export const DEFAULT_FORMAT = '7v7';
export const DEFAULT_KIT = 'volt';

export const TEAM_NAME_MAX = 60;
export const MATCH_TAG_MAX = 120;
export const PLAYER_NAME_MAX = 40;

/** Each format has one formation, a pitch template (GK first, then defence, midfield, attack) and a sample squad. */
export const FORMATS = {
    '7v7': {
        label: '7 vs 7',
        formation: '2-3-1',
        sample: [
            { id: 'p1', role: 'GK', name: 'Tanvir', number: 1, x: 50, y: 88 },
            { id: 'p2', role: 'CB', name: 'Samiul (C)', number: 4, x: 30, y: 70 },
            { id: 'p3', role: 'CB', name: 'Rayhan', number: 5, x: 70, y: 70 },
            { id: 'p4', role: 'CM', name: 'Fahim', number: 8, x: 50, y: 50 },
            { id: 'p5', role: 'LM', name: 'Arafat', number: 11, x: 20, y: 40 },
            { id: 'p6', role: 'RM', name: 'Siam', number: 7, x: 80, y: 40 },
            { id: 'p7', role: 'ST', name: 'Shakil', number: 9, x: 50, y: 20 }
        ]
    },
    '5v5': {
        label: '5 vs 5',
        formation: '1-2-1',
        sample: [
            { id: 'p1', role: 'GK', name: 'Tanvir', number: 1, x: 50, y: 88 },
            { id: 'p2', role: 'CB', name: 'Samiul (C)', number: 4, x: 35, y: 68 },
            { id: 'p3', role: 'CB', name: 'Rayhan', number: 5, x: 65, y: 68 },
            { id: 'p4', role: 'CM', name: 'Fahim', number: 8, x: 50, y: 45 },
            { id: 'p5', role: 'ST', name: 'Shakil', number: 9, x: 50, y: 22 }
        ]
    }
};

export const FORMAT_OPTIONS = Object.keys(FORMATS).map(key => ({ value: key, label: FORMATS[key].label }));

/** Kit themes: marker fill, number colour and ring colour. */
export const KIT_STYLES = {
    volt: { bg: '#00E676', text: '#000000', border: '#ffffff', label: 'Crossbar Volt' },
    black: { bg: '#0f172a', text: '#34d399', border: '#10b981', label: 'Stealth Black' },
    red: { bg: '#e11d48', text: '#ffffff', border: '#fb7185', label: 'Crimson Fury' },
    blue: { bg: '#0ea5e9', text: '#ffffff', border: '#7dd3fc', label: 'Metro Blue' }
};
export const KIT_KEYS = Object.keys(KIT_STYLES);

const POS_ORDER = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

export const formatOf = (format) => FORMATS[format] || FORMATS[DEFAULT_FORMAT];

/** Jersey numbers are 0..99. */
export const clampNumber = (value) => Math.max(0, Math.min(99, Math.round(Number(value) || 0)));

/** Fresh copy of the sample lineup for a format. */
export const samplePlayers = (format) => formatOf(format).sample.map(p => ({ ...p }));

/**
 * Build pitch markers from a registered team roster: GK first, then DEF / MID / FWD, placed on the
 * format's template. Returns [] when the roster has no named players.
 */
export function seedFromRoster(roster, format) {
    const template = formatOf(format).sample;
    const sorted = (Array.isArray(roster) ? roster : [])
        .filter(p => p && p.name)
        .slice()
        .sort((a, b) => (POS_ORDER[a.position] ?? 9) - (POS_ORDER[b.position] ?? 9));
    return sorted.slice(0, template.length).map((p, i) => ({
        id: `rp-${i}-${String(p.id || '')}`,
        role: p.position || template[i].role,
        name: String(p.role === 'Captain' ? `${p.name} (C)` : p.name).slice(0, PLAYER_NAME_MAX),
        number: clampNumber(Number(p.number) || i + 1),
        x: template[i].x,
        y: template[i].y
    }));
}

/** The lineup as WhatsApp-formatted text (same wording as the website). */
export function buildShareText({ teamName, matchTag, format, formation, players }) {
    let text = `⚽ *${String(teamName || '').toUpperCase()} - MATCH SQUAD* ⚽\n`;
    text += '🏟️ *Venue:* Crossbar Metro Arena, Uttara Sector 17, Dhaka\n';
    text += `🔥 *Note:* ${matchTag || ''}\n\n`;
    text += `*Starting Lineup (${format} - ${formation}):*\n`;
    (players || []).forEach(p => { text += `• #${p.number} ${p.name} (${p.role})\n`; });
    text += '\nTag your squad & meet at Crossbar Metro Arena! 🏗️ ⚽ 🔥';
    return text;
}

const isPlayer = (p) => !!p && typeof p === 'object' && typeof p.name === 'string' && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y));

/**
 * Validate a squad read from device storage. Returns a clean squad object, or null when the
 * stored value is missing / unusable (the builder then starts from its defaults).
 */
export function sanitizeSquad(stored) {
    if (!stored || typeof stored !== 'object' || !Array.isArray(stored.players)) return null;
    const format = FORMATS[stored.format] ? stored.format : DEFAULT_FORMAT;
    const players = stored.players.filter(isPlayer).slice(0, 11).map((p, i) => ({
        id: String(p.id || `p${i + 1}`),
        role: String(p.role || ''),
        name: String(p.name).slice(0, PLAYER_NAME_MAX),
        number: clampNumber(p.number),
        x: Math.max(0, Math.min(100, Number(p.x))),
        y: Math.max(0, Math.min(100, Number(p.y)))
    }));
    if (players.length === 0) return null;
    return {
        teamName: String(stored.teamName ?? DEFAULT_TEAM_NAME).slice(0, TEAM_NAME_MAX),
        matchTag: String(stored.matchTag ?? DEFAULT_MATCH_TAG).slice(0, MATCH_TAG_MAX),
        format,
        formation: formatOf(format).formation,
        kitColor: KIT_STYLES[stored.kitColor] ? stored.kitColor : DEFAULT_KIT,
        players,
        source: stored.source === 'roster' ? 'roster' : 'sample',
        sourceTeam: stored.source === 'roster' ? String(stored.sourceTeam || '') : ''
    };
}
