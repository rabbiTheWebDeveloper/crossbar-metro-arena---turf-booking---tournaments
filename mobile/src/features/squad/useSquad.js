import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useArena } from '@/context/ArenaContext';
import { STORAGE_KEYS, readJson, writeJson } from '@/lib/storage';
import {
    DEFAULT_TEAM_NAME, DEFAULT_MATCH_TAG, DEFAULT_FORMAT, DEFAULT_KIT, KIT_STYLES, FORMATS,
    TEAM_NAME_MAX, MATCH_TAG_MAX, PLAYER_NAME_MAX,
    formatOf, samplePlayers, seedFromRoster, sanitizeSquad, clampNumber
} from './squadData';

const hasRoster = (team) => !!team && (team.players || []).some(p => p && p.name);

/** Starting squad: the user's registered roster when there is one, otherwise the sample lineup. */
function defaultSquad(team, format = DEFAULT_FORMAT) {
    const roster = hasRoster(team) ? seedFromRoster(team.players, format) : [];
    const fromRoster = roster.length > 0;
    return {
        teamName: String(team?.name || DEFAULT_TEAM_NAME).slice(0, TEAM_NAME_MAX),
        matchTag: DEFAULT_MATCH_TAG,
        format,
        formation: formatOf(format).formation,
        kitColor: DEFAULT_KIT,
        players: fromRoster ? roster : samplePlayers(format),
        source: fromRoster ? 'roster' : 'sample',
        sourceTeam: fromRoster ? String(team.name || '') : ''
    };
}

/**
 * State of the squad builder, saved on the device (STORAGE_KEYS.SQUAD) once the user changes it.
 *
 * Returns the squad fields (teamName, matchTag, format, formation, kitColor, players, source,
 * sourceTeam) plus:
 *   loaded            false until device storage has been read
 *   myTeam            the signed-in user's team (or null)
 *   canLoadRoster     myTeam has named players that can seed the pitch
 *   isCustomLineup    players differ from the untouched default for the current format
 *   setTeamName / setMatchTag / setKitColor / changeFormat / savePlayer / loadRoster / reset
 */
export function useSquad() {
    const { myTeams } = useArena();
    const myTeam = useMemo(() => {
        const list = Array.isArray(myTeams) ? myTeams : [];
        return list.find(hasRoster) || list[0] || null;
    }, [myTeams]);
    const canLoadRoster = hasRoster(myTeam);

    const [squad, setSquad] = useState(() => defaultSquad(myTeam));
    const [loaded, setLoaded] = useState(false);
    const hadStored = useRef(false); // a saved squad existed on this device
    const touched = useRef(false); // the user changed something in this session
    const teamRef = useRef(myTeam);
    teamRef.current = myTeam;

    // Restore the saved squad (once)
    useEffect(() => {
        let cancelled = false;
        readJson(STORAGE_KEYS.SQUAD, null).then(stored => {
            if (cancelled) return;
            const clean = sanitizeSquad(stored);
            if (clean) {
                hadStored.current = true;
                setSquad(clean);
            } else {
                setSquad(defaultSquad(teamRef.current));
            }
            setLoaded(true);
        });
        return () => { cancelled = true; };
    }, []);

    // Teams may arrive after the screen opens: seed from the roster while nothing was edited yet
    useEffect(() => {
        if (!loaded || hadStored.current || touched.current || !myTeam) return;
        setSquad(defaultSquad(myTeam));
    }, [loaded, myTeam]);

    // Persist every change the user makes
    useEffect(() => {
        if (loaded && touched.current) writeJson(STORAGE_KEYS.SQUAD, squad);
    }, [loaded, squad]);

    const update = useCallback((patch) => {
        touched.current = true;
        setSquad(prev => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
    }, []);

    const setTeamName = useCallback((text) => update({ teamName: String(text).slice(0, TEAM_NAME_MAX) }), [update]);
    const setMatchTag = useCallback((text) => update({ matchTag: String(text).slice(0, MATCH_TAG_MAX) }), [update]);
    const setKitColor = useCallback((key) => { if (KIT_STYLES[key]) update({ kitColor: key }); }, [update]);

    /** Switching format lays out a fresh lineup for it (roster-seeded when the squad came from a roster). */
    const changeFormat = useCallback((format) => {
        if (!FORMATS[format]) return;
        update(prev => {
            if (prev.format === format) return {};
            const roster = prev.source === 'roster' && hasRoster(teamRef.current) ? seedFromRoster(teamRef.current.players, format) : [];
            const fromRoster = roster.length > 0;
            return {
                format,
                formation: formatOf(format).formation,
                players: fromRoster ? roster : samplePlayers(format),
                source: fromRoster ? 'roster' : 'sample',
                sourceTeam: fromRoster ? prev.sourceTeam : ''
            };
        });
    }, [update]);

    const savePlayer = useCallback((playerId, name, number) => {
        update(prev => ({
            players: prev.players.map(p => (p.id === playerId
                ? { ...p, name: String(name || '').trim().slice(0, PLAYER_NAME_MAX) || p.name, number: clampNumber(number) }
                : p))
        }));
    }, [update]);

    /** Replace the lineup with the user's registered roster (keeps format, kit and match tag). */
    const loadRoster = useCallback(() => {
        const team = teamRef.current;
        if (!hasRoster(team)) return false;
        update(prev => {
            const seeded = defaultSquad(team, prev.format);
            return { teamName: seeded.teamName, players: seeded.players, source: seeded.source, sourceTeam: seeded.sourceTeam };
        });
        return true;
    }, [update]);

    /** Back to the sample squad and default details. */
    const reset = useCallback(() => update(defaultSquad(null)), [update]);

    const isCustomLineup = useMemo(() => {
        const base = squad.source === 'roster' && hasRoster(myTeam) ? seedFromRoster(myTeam.players, squad.format) : samplePlayers(squad.format);
        return JSON.stringify(base) !== JSON.stringify(squad.players);
    }, [squad.players, squad.source, squad.format, myTeam]);

    return { ...squad, loaded, myTeam, canLoadRoster, isCustomLineup, setTeamName, setMatchTag, setKitColor, changeFormat, savePlayer, loadRoster, reset };
}
