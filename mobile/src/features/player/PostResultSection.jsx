import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Plus, Trash2, Send } from 'lucide-react-native';
import { useArena, todayDhaka } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { Card, Row, Field, Input, Select, Segmented, Stepper, DateField, Button, IconButton, Badge, Notice, AppText, Label, Mono, SectionHeader, Divider, confirm } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/theme';
import { formatIsoDate } from '@/lib/dateUtils';
import { titleCase } from '@/lib/format';
import { useSlotOptions } from './hooks';
import { MATCH_TYPES, EVENT_TYPES, OTHER_TEAM, RESULT_STATUS_TONE } from './constants';

const PAGE_SIZE = 8;

/**
 * "Post Match Result" (captains only): score, scorers with minutes, cards, player of the match
 * and a short report, plus the list of results this captain has submitted.
 */
export function PostResultSection({ otherTeams }) {
    const { myTeams, myMatchResults, pricing, handleSaveMatchResult, handleDeleteMatchResult } = useArena();
    const slotOptions = useSlotOptions();
    const today = todayDhaka();

    const [matchDate, setMatchDate] = useState(today);
    const [slotDisplay, setSlotDisplay] = useState(SCHEDULE_SLOTS_DEFINITION[9].displayTime);
    const [matchType, setMatchType] = useState(MATCH_TYPES[0]);
    const [homeTeamId, setHomeTeamId] = useState('');
    const [awayTeamId, setAwayTeamId] = useState('');
    const [awayFreeText, setAwayFreeText] = useState('');
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [matchEvents, setMatchEvents] = useState([]);
    const [eventSide, setEventSide] = useState('home');
    const [eventType, setEventType] = useState('goal');
    const [eventPlayer, setEventPlayer] = useState('');
    const [eventMinute, setEventMinute] = useState('1');
    const [motm, setMotm] = useState('');
    const [matchReport, setMatchReport] = useState('');
    const [message, setMessage] = useState(null); // { type, text }
    const [submitting, setSubmitting] = useState(false);
    const [withdrawingId, setWithdrawingId] = useState('');
    const [shown, setShown] = useState(PAGE_SIZE);

    useEffect(() => {
        if (!myTeams.some(t => t.id === homeTeamId)) setHomeTeamId(myTeams[0]?.id || '');
    }, [myTeams, homeTeamId]);

    const homeTeam = myTeams.find(t => t.id === homeTeamId) || null;
    const homeName = homeTeam?.name || '';
    const awayName = awayTeamId === OTHER_TEAM ? awayFreeText.trim() : (otherTeams.find(t => t.id === awayTeamId)?.name || '');

    const slotChoices = useMemo(() => slotOptions.map(s => ({ value: s.displayTime, label: `Slot #${s.slotNumber} (${s.displayTime})` })), [slotOptions]);
    const opponentChoices = useMemo(() => [
        ...otherTeams.map(t => ({ value: t.id, label: t.name })),
        { value: OTHER_TEAM, label: 'Other (not registered yet)' }
    ], [otherTeams]);
    const eventTypeLabel = (type) => EVENT_TYPES.find(e => e.value === type)?.label || titleCase(type);
    const results = myMatchResults || [];
    const approveFirst = !!pricing?.approveResultsFirst;

    const handleAddEvent = () => {
        const name = eventPlayer.trim();
        if (!name) return;
        setMatchEvents(prev => [...prev, { id: `ev-${Date.now()}`, side: eventSide, type: eventType, playerName: name, minute: Math.max(0, Math.min(120, Number(eventMinute) || 0)) }]);
        setEventPlayer('');
    };

    const fail = (text) => setMessage({ type: 'error', text });

    const handleSubmit = async () => {
        if (submitting) return;
        setMessage(null);
        if (!homeName) { fail('Select one of your teams as the home side.'); return; }
        if (!awayName) { fail('Select or type the opponent team.'); return; }
        if (awayName.toLowerCase() === homeName.toLowerCase()) { fail('Home and away team must be different.'); return; }
        if (!matchDate || matchDate > today) { fail('The match date cannot be in the future.'); return; }
        const hs = Number(homeScore);
        const as = Number(awayScore);
        if (Number.isNaN(hs) || Number.isNaN(as) || hs < 0 || as < 0 || hs > 50 || as > 50) { fail('Scores must be between 0 and 50.'); return; }
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
            events: matchEvents.map(({ side, type, playerName, minute }) => ({ side, type, playerName, minute })),
            playerOfTheMatch: motm.trim(),
            matchReport: matchReport.trim(),
            matchType
        });
        setSubmitting(false);
        if (!r?.ok) { fail(r?.error || 'Could not submit the result.'); return; }
        const published = r.matchResult?.status === 'published';
        setMessage({
            type: 'success',
            text: published
                ? 'Match result published. It is now live on the Match Day page and the league table has been updated.'
                : 'Result submitted and waiting for the arena desk to approve it. It will appear on the Match Day page once approved.'
        });
        setMatchEvents([]);
        setMotm('');
        setMatchReport('');
        setHomeScore(0);
        setAwayScore(0);
    };

    const onWithdrawResult = async (m) => {
        if (withdrawingId) return;
        const ok = await confirm('Withdraw result?', `Withdraw the submitted result ${m.homeTeam} ${m.homeScore}–${m.awayScore} ${m.awayTeam}?`, { confirmText: 'Withdraw', destructive: true });
        if (!ok) return;
        setWithdrawingId(m.id);
        await handleDeleteMatchResult(m.id);
        setWithdrawingId('');
    };

    return (
        <>
            <Card style={{ gap: spacing.md }}>
                <SectionHeader
                    title="Post Match Result & Events"
                    subtitle={`Captains submit scores, scorers with minutes, cards and player of the match. ${approveFirst ? 'Results are checked by the arena desk before they go live.' : 'Published results update the Match Day leaderboard immediately.'}`}
                    style={{ marginBottom: 0 }}
                />

                <DateField label="Match Date" required value={matchDate} onChange={setMatchDate} maxDate={today} />
                <Select label="Kickoff Slot" required title="Kickoff slot" value={slotDisplay} onChange={setSlotDisplay} options={slotChoices} />
                <Select label="Match Type" title="Match type" value={matchType} onChange={setMatchType} options={MATCH_TYPES} />

                <View style={styles.block}>
                    <Select label="Home Team (your team)" required title="Home team" value={homeTeamId} onChange={setHomeTeamId} options={myTeams.map(t => ({ value: t.id, label: t.name }))} />
                    <Field label="Home Score">
                        <Stepper value={homeScore} onChange={setHomeScore} min={0} max={50} />
                    </Field>
                </View>

                <View style={styles.block}>
                    <Select label="Opponent Team" required title="Opponent team" placeholder="Select opponent…" value={awayTeamId} onChange={setAwayTeamId} options={opponentChoices} searchable />
                    {awayTeamId === OTHER_TEAM ? (
                        <Input placeholder="Opponent team name" value={awayFreeText} onChangeText={setAwayFreeText} maxLength={60} autoCapitalize="words" />
                    ) : null}
                    <Field label="Opponent Score">
                        <Stepper value={awayScore} onChange={setAwayScore} min={0} max={50} />
                    </Field>
                </View>

                <View style={styles.block}>
                    <Row justify="space-between">
                        <Label tone="brand" style={{ flex: 1 }}>Match Events & Goal Scorers</Label>
                        <AppText size="xs" tone="muted">{`${matchEvents.length} events logged`}</AppText>
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
                    <Row align="flex-start">
                        <View style={{ flex: 1.5 }}>
                            <Select label="Event" title="Event type" value={eventType} onChange={setEventType} options={EVENT_TYPES} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Input label="Minute" type="number" placeholder="Minute" value={eventMinute} onChangeText={(t) => setEventMinute(t.replace(/[^0-9]/g, ''))} maxLength={3} inputStyle={{ fontFamily: fonts.mono }} />
                        </View>
                    </Row>
                    <Input label="Player name" placeholder="Player name" value={eventPlayer} onChangeText={setEventPlayer} maxLength={40} autoCapitalize="words" returnKeyType="done" onSubmitEditing={handleAddEvent} />
                    <Button title="Add Event" icon={Plus} variant="outline" size="sm" disabled={!eventPlayer.trim()} onPress={handleAddEvent} />

                    {matchEvents.length > 0 ? (
                        <View style={{ gap: 6 }}>
                            {matchEvents.map((ev, i) => (
                                <Row key={ev.id} justify="space-between" style={styles.eventRow}>
                                    <View style={{ flex: 1, gap: 2 }}>
                                        <AppText size="sm" weight="800" numberOfLines={1}>{ev.playerName}</AppText>
                                        <Row gap={6} wrap>
                                            <AppText size="xs" tone="muted" numberOfLines={1}>{`(${ev.side === 'home' ? homeName : awayName})`}</AppText>
                                            <Badge label={eventTypeLabel(ev.type)} />
                                        </Row>
                                    </View>
                                    <Mono size="sm" tone="brand">{`${ev.minute}'`}</Mono>
                                    <IconButton
                                        icon={Trash2}
                                        size={30}
                                        iconSize={14}
                                        tone={colors.textMuted}
                                        bg="transparent"
                                        border="transparent"
                                        onPress={() => setMatchEvents(prev => prev.filter((_, idx) => idx !== i))}
                                        accessibilityLabel="Remove event"
                                    />
                                </Row>
                            ))}
                        </View>
                    ) : null}
                </View>

                <Input label="Player of the Match" placeholder="e.g. Siam Chowdhury" value={motm} onChangeText={setMotm} maxLength={60} autoCapitalize="words" />
                <Input label="Match Report / Summary" multiline placeholder="Short report on match highlights..." value={matchReport} onChangeText={setMatchReport} maxLength={2000} />

                {message ? <Notice type={message.type} message={message.text} /> : null}
                <Button
                    title={submitting ? 'Submitting…' : (approveFirst ? 'Submit Result for Approval' : 'Publish Match Result')}
                    icon={Send}
                    size="lg"
                    block
                    loading={submitting}
                    onPress={handleSubmit}
                />
            </Card>

            <Card style={{ gap: spacing.md }}>
                <SectionHeader title={`My Submitted Results (${results.length})`} style={{ marginBottom: 0 }} />
                {results.length === 0 ? (
                    <AppText size="sm" tone="muted">You have not submitted any results yet.</AppText>
                ) : results.slice(0, shown).map((m, i) => (
                    <View key={m.id} style={{ gap: spacing.sm }}>
                        {i > 0 ? <Divider style={{ marginVertical: 0 }} /> : null}
                        <Row gap={8} wrap>
                            <Badge tone={RESULT_STATUS_TONE[m.status] || 'neutral'} label={titleCase(m.status)} />
                            <AppText size="xs" tone="muted">{`${formatIsoDate(m.date)} · ${m.slotDisplay || ''}`}</AppText>
                        </Row>
                        <AppText size="md" weight="800">
                            {`${m.homeTeam} `}<AppText size="md" mono weight="900" tone="brand">{`${m.homeScore}–${m.awayScore}`}</AppText>{` ${m.awayTeam}`}
                        </AppText>
                        {m.playerOfTheMatch ? <AppText size="xs" tone="muted">{`MOTM: ${m.playerOfTheMatch}`}</AppText> : null}
                        {m.status === 'pending_approval' ? (
                            <Button
                                title={withdrawingId === m.id ? 'Withdrawing…' : 'Withdraw'}
                                variant="danger"
                                size="sm"
                                loading={withdrawingId === m.id}
                                onPress={() => onWithdrawResult(m)}
                                style={{ alignSelf: 'flex-start' }}
                            />
                        ) : null}
                    </View>
                ))}
                {results.length > shown ? (
                    <Button title={`Show more (${results.length - shown})`} variant="secondary" size="sm" onPress={() => setShown(n => n + PAGE_SIZE)} />
                ) : null}
            </Card>
        </>
    );
}

const styles = StyleSheet.create({
    block: { gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    eventRow: { paddingVertical: 6, paddingLeft: spacing.md, paddingRight: 4, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input }
});
