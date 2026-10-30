import { Team } from '@/models/Team';

const norm = (s) => String(s || '').trim().toLowerCase();

async function findTeam(id, name) {
    if (id && /^[0-9a-fA-F]{24}$/.test(id)) {
        const t = await Team.findById(id);
        if (t) return t;
    }
    if (!name) return null;
    return Team.findOne({ name: new RegExp(`^${String(name).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
}

function applyToTeam(team, { gf, ga }, dir) {
    const s = team.stats || {};
    const won = gf > ga, drawn = gf === ga;
    s.played = Math.max(0, (s.played || 0) + dir);
    s.won = Math.max(0, (s.won || 0) + (won ? dir : 0));
    s.drawn = Math.max(0, (s.drawn || 0) + (drawn ? dir : 0));
    s.lost = Math.max(0, (s.lost || 0) + (!won && !drawn ? dir : 0));
    s.gf = Math.max(0, (s.gf || 0) + gf * dir);
    s.ga = Math.max(0, (s.ga || 0) + ga * dir);
    s.points = Math.max(0, (s.points || 0) + (won ? 3 : drawn ? 1 : 0) * dir);
    const letter = won ? 'W' : drawn ? 'D' : 'L';
    if (dir > 0) s.form = [...(s.form || []), letter].slice(-5);
    else if (Array.isArray(s.form) && s.form.length && s.form[s.form.length - 1] === letter) s.form = s.form.slice(0, -1);
    team.stats = s;
    team.markModified('stats');
}

function creditScorers(team, result, dir) {
    if (!team || !Array.isArray(team.players)) return;
    const scorerNames = (result.scorers || []).filter(sc => norm(sc.teamName) === norm(team.name)).map(sc => norm(sc.playerName));
    for (const p of team.players) {
        const goals = scorerNames.filter(n => n === norm(p.name)).length;
        if (goals) p.goals = Math.max(0, (p.goals || 0) + goals * dir);
        p.matchesPlayed = Math.max(0, (p.matchesPlayed || 0) + dir);
    }
    team.markModified('players');
}

/**
 * Apply (dir = +1) or reverse (dir = -1) a published match result on both teams' stats and
 * the roster players' goal tallies. Teams that are not registered are skipped silently.
 */
export async function applyResultToStandings(result, dir = 1) {
    const home = await findTeam(result.homeTeamId, result.homeTeam);
    const away = await findTeam(result.awayTeamId, result.awayTeam);
    const hs = Number(result.homeScore || 0), as = Number(result.awayScore || 0);
    if (home) { applyToTeam(home, { gf: hs, ga: as }, dir); creditScorers(home, result, dir); await home.save(); }
    if (away && (!home || String(away._id) !== String(home._id))) { applyToTeam(away, { gf: as, ga: hs }, dir); creditScorers(away, result, dir); await away.save(); }
    return { home: !!home, away: !!away };
}

/** Apply or reverse standings when a result moves in or out of "published". Mutates the document (call save() after). */
export async function syncStandings(result) {
    const nowPublished = result.status === 'published';
    if (nowPublished && !result.standingsApplied) {
        await applyResultToStandings(result, 1);
        result.standingsApplied = true;
    } else if (!nowPublished && result.standingsApplied) {
        await applyResultToStandings(result, -1);
        result.standingsApplied = false;
    }
}
