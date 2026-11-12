import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Trophy, Trash2, Plus } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { Sheet, Input, Select, DateField, Segmented, Stepper, Button, Notice, Row, AppText, Mono, Label, Field, Badge } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { todayDhakaIso, isIsoDate } from '@/lib/dateUtils';
import { MATCH_TYPES, EVENT_TYPES, statusLabel } from './matchdayUtils';

const OTHER_TEAM = '__other__';

/**
 * "Post Match Result & Events" form for captains (the website's player-portal form).
 * The home side must be one of the captain's own teams; the server decides whether the result
 * is published straight away or waits for arena desk approval.
 */
export function SubmitResultSheet({ visible, onClose }) {
    const { teams, myTeams, pricing, isVisitor, promptLogin, handleSaveMatchResult } = useArena();
    const today = todayDhakaIso();
    const slotOptions = useMemo(
        () => (Array.isArray(pricing?.slotPrices) && pricing.slotPrices.length === 12 ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION),
        [pricing?.slotPrices]
    );
    const otherTeams = useMemo(() => (teams || []).filter(t => !myTeams.some(m => m.id === t.id)), [teams, myTeams]);

    const [matchDate, setMatchDate] = useState(today);
    const [slotDisplay, setSlotDisplay] = useState(SCHEDULE_SLOTS_DEFINITION[9].displayTime);
    const [matchType, setMatchType] = useState(MATCH_TYPES[0]);
    const [homeTeamId, setHomeTeamId] = useState('');
    const [awayTeamId, setAwayTeamId] = useState('');
    const [awayFreeText, setAwayFreeText] = useState('');
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [events, setEvents] = useState([]);
    const [eventSide, setEventSide] = useState('home');
    const [eventType, setEventType] = useState('goal');
    const [eventPlayer, setEventPlayer] = useState('');
    const [eventMinute, setEventMinute] = useState('1');
    const [motm, setMotm] = useState('');
    const [matchReport, setMatchReport] = useState('');
    const [error, setError] = useState('');
    const [done, setDone] = useState(null); // { published } after a successful submission
    const [submitting, setSubmitting] = useState(false);

    // Keep the home side on one of the captain's teams
    useEffect(() => {
        if (!myTeams.some(t => t.id === homeTeamId)) setHomeTeamId(myTeams[0]?.id || '');
    }, [myTeams, homeTeamId]);

    // Each time the sheet opens: clear messages and repair values that are no longer valid
    useEffect(() => {
        if (!visible) return;
        setError('');
        setDone(null);
        setMatchDate(prev => (isIsoDate(prev) && prev <= today ? prev : today));
        setSlotDisplay(prev => (slotOptions.some(s => s.displayTime === prev) ? prev : (slotOptions[9]?.displayTime || slotOptions[0]?.displayTime || prev)));
    }, [visible, today, slotOptions]);

    const homeTeam = myTeams.find(t => t.id === homeTeamId) || null;
    const homeName = homeTeam?.name || '';
    const awayName = awayTeamId === OTHER_TEAM ? awayFreeText.trim() : (otherTeams.find(t => t.id === awayTeamId)?.name || '');
    const approveFirst = !!pricing?.approveResultsFirst;

    const addEvent = () => {
        const name = eventPlayer.trim();
        if (!name) return;
        setEvents(prev => [...prev, { id: `ev-${Date.now()}-${prev.length}`, side: eventSide, type: eventType, playerName: name, minute: Math.max(0, Math.min(120, Number(eventMinute) || 0)) }]);
        setEventPlayer('');
    };

    const submit = async () => {
        if (submitting) return;
        if (isVisitor) { onClose(); promptLogin('login'); return; }
        setError('');
        if (!homeName) { setError('Select one of your teams as the home side.'); return; }
        if (!awayName) { setError('Select or type the opponent team.'); return; }
        if (awayName.toLowerCase() === homeName.toLowerCase()) { setError('Home and away team must be different.'); return; }
        if (!isIsoDate(matchDate) || matchDate > today) { setError('The match date cannot be in the future.'); return; }
        const hs = Number(homeScore), as = Number(awayScore);
        if (Number.isNaN(hs) || Number.isNaN(as) || hs < 0 || as < 0 || hs > 50 || as > 50) { setError('Scores must be between 0 and 50.'); return; }
        setSubmitting(true);
        const r = await handleSaveMatchResult({
            date: matchDate,
            slotDisplay,
            homeTeam: homeName,
            awayTeam: awayName,
            homeTeamId: homeTeam?.id || undefined,
            awayTeamId: awayTeamId && awayTeamId !== OTHER_TEAM ? awayTeamId : undefined,
            homeScore: hs,
            awayScore: as,
            events: events.map(({ side, type, playerName, minute }) => ({ side, type, playerName, minute })),
            playerOfTheMatch: motm.trim(),
            matchReport: matchReport.trim(),
            matchType
        });
        setSubmitting(false);
        if (!r || !r.ok) { setError((r && r.error) || 'Could not submit the result.'); return; }
        setDone({ published: r.matchResult?.status === 'published' });
        setEvents([]); setMotm(''); setMatchReport(''); setHomeScore(0); setAwayScore(0);
    };

    const footer = done ? (
        <Row>
            <Button title="Post another" variant="secondary" onPress={() => setDone(null)} style={{ flex: 1 }} />
            <Button title="Done" onPress={onClose} style={{ flex: 1 }} />
        </Row>
    ) : (
        <Row>
            <Button title="Cancel" variant="secondary" onPress={onClose} disabled={submitting} style={{ flex: 1 }} />
            <Button title={submitting ? 'Submitting…' : (approveFirst ? 'Submit Result for Approval' : 'Publish Match Result')} loading={submitting} onPress={submit} style={{ flex: 2 }} />
        </Row>
    );

    return (
        <Sheet visible={visible} onClose={onClose} dismissable={!submitting} title="Post Match Result & Events" icon={Trophy} full footer={footer}>
            {done ? (
                <Notice
                    type="success"
                    title={done.published ? 'Match result published' : 'Result submitted'}
                    message={done.published
                        ? 'Match result published. It is now live on the Match Day page and the league table has been updated.'
                        : 'Result submitted and waiting for the arena desk to approve it. It will appear on the Match Day page once approved.'}
                />
            ) : (
                <>
                    <AppText size="xs" tone="muted">
                        {`Captains submit scores, scorers with minutes, cards and player of the match. ${approveFirst ? 'Results are checked by the arena desk before they go live.' : 'Published results update the Match Day leaderboard immediately.'}`}
                    </AppText>

                    <DateField label="Match date" required value={matchDate} onChange={setMatchDate} maxDate={today} />
                    <Select
                        label="Kickoff slot"
                        required
                        value={slotDisplay}
                        onChange={setSlotDisplay}
                        options={slotOptions.map(s => ({ value: s.displayTime, label: `Slot #${s.slotNumber} (${s.displayTime})` }))}
                    />
                    <Select label="Match type" value={matchType} onChange={setMatchType} options={MATCH_TYPES} />

                    <View style={styles.box}>
                        <Select label="Home team (your team)" required value={homeTeamId} onChange={setHomeTeamId} options={myTeams.map(t => ({ value: t.id, label: t.name }))} placeholder="Select your team…" />
                        <Field label="Home score">
                            <Stepper value={homeScore} onChange={setHomeScore} min={0} max={50} />
                        </Field>
                    </View>

                    <View style={styles.box}>
                        <Select
                            label="Opponent team"
                            required
                            searchable
                            value={awayTeamId}
                            onChange={setAwayTeamId}
                            placeholder="Select opponent…"
                            options={[...otherTeams.map(t => ({ value: t.id, label: t.name })), { value: OTHER_TEAM, label: 'Other (not registered yet)' }]}
                        />
                        {awayTeamId === OTHER_TEAM ? (
                            <Input maxLength={60} placeholder="Opponent team name" value={awayFreeText} onChangeText={setAwayFreeText} autoCapitalize="words" />
                        ) : null}
                        <Field label="Opponent score">
                            <Stepper value={awayScore} onChange={setAwayScore} min={0} max={50} />
                        </Field>
                    </View>

                    <View style={styles.box}>
                        <Row justify="space-between">
                            <Label tone="brand">Match Events & Goal Scorers</Label>
                            <AppText size="xs" tone="muted">{`${events.length} events logged`}</AppText>
                        </Row>
                        <Segmented
                            size="sm"
                            value={eventSide}
                            onChange={setEventSide}
                            options={[
                                { value: 'home', label: `Home (${(homeName || 'Home').slice(0, 12)})` },
                                { value: 'away', label: `Away (${(awayName || 'Away').slice(0, 12)})` }
                            ]}
                        />
                        <Select label="Event" value={eventType} onChange={setEventType} options={EVENT_TYPES} />
                        <Row align="flex-end">
                            <View style={{ flex: 1 }}>
                                <Input label="Player name" maxLength={40} placeholder="Player name" value={eventPlayer} onChangeText={setEventPlayer} autoCapitalize="words" />
                            </View>
                            <View style={{ width: 84 }}>
                                <Input label="Minute" type="number" maxLength={3} placeholder="Minute" value={eventMinute} onChangeText={setEventMinute} />
                            </View>
                        </Row>
                        <Button title="Add Event" icon={Plus} variant="outline" size="sm" onPress={addEvent} disabled={!eventPlayer.trim()} />
                        {events.map((ev, i) => (
                            <Row key={ev.id} style={styles.event}>
                                <View style={{ flex: 1, gap: 2 }}>
                                    <AppText size="sm" weight="800" numberOfLines={1}>{ev.playerName}</AppText>
                                    <Row gap={6} wrap>
                                        <AppText size="xs" tone="muted">{`(${ev.side === 'home' ? (homeName || 'Home') : (awayName || 'Away')})`}</AppText>
                                        <Badge label={statusLabel(ev.type)} />
                                    </Row>
                                </View>
                                <Mono size="sm" tone="brand">{`${ev.minute}'`}</Mono>
                                <Pressable onPress={() => setEvents(prev => prev.filter((_, idx) => idx !== i))} hitSlop={10} accessibilityRole="button" accessibilityLabel="Remove event">
                                    <Trash2 size={16} color={colors.textDim} />
                                </Pressable>
                            </Row>
                        ))}
                    </View>

                    <Input label="Player of the match" maxLength={60} placeholder="e.g. Siam Chowdhury" value={motm} onChangeText={setMotm} autoCapitalize="words" />
                    <Input label="Match report / summary" multiline maxLength={2000} placeholder="Short report on match highlights..." value={matchReport} onChangeText={setMatchReport} />
                    {error ? <Notice type="error" message={error} /> : null}
                </>
            )}
        </Sheet>
    );
}

const styles = StyleSheet.create({
    box: { gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    event: { padding: spacing.sm + 2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input }
});
