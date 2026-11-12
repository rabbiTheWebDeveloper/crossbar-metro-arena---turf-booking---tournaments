import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Megaphone } from 'lucide-react-native';
import { useArena, todayDhaka } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { Card, Row, Input, Select, DateField, Button, Badge, Notice, AppText, SectionHeader, Divider, confirm } from '@/components/ui';
import { spacing } from '@/theme';
import { formatIsoDate } from '@/lib/dateUtils';
import { titleCase } from '@/lib/format';
import { useSlotOptions } from './hooks';
import { LEVELS, CHALLENGE_FORMATS, LOOKING_FOR_OPTIONS, COST_SHARE_OPTIONS, CHALLENGE_STATUS_TONE } from './constants';

const PAGE_SIZE = 8;

/**
 * "Find an Opponent": post an opponent-wanted challenge on the public Match Day board and manage
 * the challenges this captain has posted.
 *   onCreateTeam: jump to the Teams section with the "register squad" form open
 */
export function ChallengesSection({ onCreateTeam }) {
    const { myTeams, myChallenges, handleAddChallenge, handleUpdateChallenge, handleDeleteChallenge } = useArena();
    const slotOptions = useSlotOptions();
    const today = todayDhaka();
    const hasTeam = myTeams.length > 0;

    const [teamId, setTeamId] = useState('');
    const [date, setDate] = useState(today);
    const [slot, setSlot] = useState(SCHEDULE_SLOTS_DEFINITION[9].displayTime);
    const [format, setFormat] = useState(CHALLENGE_FORMATS[0]);
    const [lookingFor, setLookingFor] = useState('Opponent Team');
    const [costShare, setCostShare] = useState('50/50 Split');
    const [level, setLevel] = useState('Semi-Pro');
    const [note, setNote] = useState('');
    const [message, setMessage] = useState(null); // { type, text }
    const [submitting, setSubmitting] = useState(false);
    const [busyId, setBusyId] = useState('');
    const [shown, setShown] = useState(PAGE_SIZE);

    useEffect(() => {
        if (!myTeams.some(t => t.id === teamId)) setTeamId(myTeams[0]?.id || '');
    }, [myTeams, teamId]);

    const slotChoices = useMemo(() => slotOptions.map(s => ({ value: s.displayTime, label: `Slot #${s.slotNumber} (${s.displayTime})` })), [slotOptions]);
    const challenges = myChallenges || [];

    const handleSubmit = async () => {
        if (submitting) return;
        setMessage(null);
        const team = myTeams.find(t => t.id === teamId);
        if (!team) { setMessage({ type: 'error', text: 'Register a team first, then post a challenge for it.' }); return; }
        if (!date || date < today) { setMessage({ type: 'error', text: 'Pick a date from today onwards.' }); return; }
        setSubmitting(true);
        const r = await handleAddChallenge({ teamName: team.name, date, timeSlot: slot, format, level, lookingFor, costShare, notes: note.trim() });
        setSubmitting(false);
        if (!r?.ok) { setMessage({ type: 'error', text: r?.error || 'Could not post the challenge.' }); return; }
        setMessage({ type: 'success', text: 'Challenge posted. It is now visible on the public Match Day board.' });
        setNote('');
    };

    const onCloseChallenge = async (c) => {
        if (busyId) return;
        setBusyId(c.id);
        await handleUpdateChallenge(c.id, { status: 'closed' });
        setBusyId('');
    };

    const onDeleteChallenge = async (c) => {
        if (busyId) return;
        const ok = await confirm('Delete challenge?', `Delete the challenge for ${c.teamName} on ${formatIsoDate(c.date)}?`, { confirmText: 'Delete', destructive: true });
        if (!ok) return;
        setBusyId(c.id);
        await handleDeleteChallenge(c.id);
        setBusyId('');
    };

    return (
        <>
            <Card style={{ gap: spacing.md }}>
                <SectionHeader
                    title="Post an Opponent-Wanted Challenge"
                    subtitle="Post your squad's preferred date and slot to challenge other squads on the public Match Day board."
                    style={{ marginBottom: 0 }}
                />

                {!hasTeam ? (
                    <Notice type="info" message="You need a registered team before you can post a challenge.">
                        <Button title="Create a Team" size="sm" onPress={onCreateTeam} style={{ alignSelf: 'flex-start', marginTop: spacing.sm }} />
                    </Notice>
                ) : (
                    <>
                        <Select label="Your Team" required title="Your team" value={teamId} onChange={setTeamId} options={myTeams.map(t => ({ value: t.id, label: t.name }))} />
                        <DateField label="Match Date" required value={date} onChange={setDate} minDate={today} />
                        <Select label="Preferred Slot" required title="Preferred slot" value={slot} onChange={setSlot} options={slotChoices} />
                        <Row align="flex-start">
                            <View style={{ flex: 1 }}>
                                <Select label="Level" title="Level" value={level} onChange={setLevel} options={LEVELS} />
                            </View>
                            <View style={{ flex: 1.4 }}>
                                <Select label="Format" title="Format" value={format} onChange={setFormat} options={CHALLENGE_FORMATS} />
                            </View>
                        </Row>
                        <Select label="Looking For" title="Looking for" value={lookingFor} onChange={setLookingFor} options={LOOKING_FOR_OPTIONS} />
                        <Select label="Cost Sharing" title="Cost sharing" value={costShare} onChange={setCostShare} options={COST_SHARE_OPTIONS} />
                        <Input label="Squad Message" multiline placeholder="e.g. Good passing 7s squad looking for a fast, friendly match..." value={note} onChangeText={setNote} maxLength={300} />
                        {message ? <Notice type={message.type} message={message.text} /> : null}
                        <Button title={submitting ? 'Posting…' : 'Post Challenge on Match Day Board'} icon={Megaphone} block loading={submitting} onPress={handleSubmit} />
                    </>
                )}
            </Card>

            <Card style={{ gap: spacing.md }}>
                <SectionHeader title={`My Challenges (${challenges.length})`} style={{ marginBottom: 0 }} />
                {challenges.length === 0 ? (
                    <AppText size="sm" tone="muted">You have not posted any challenges yet.</AppText>
                ) : challenges.slice(0, shown).map((c, i) => {
                    const acceptedBy = c.matchedTeamName || c.matchedCaptainName;
                    return (
                        <View key={c.id} style={{ gap: spacing.sm }}>
                            {i > 0 ? <Divider style={{ marginVertical: 0 }} /> : null}
                            <Row gap={8} wrap>
                                <Badge tone={CHALLENGE_STATUS_TONE[c.status] || 'neutral'} label={titleCase(c.status)} />
                                <AppText size="xs" tone="muted">{`${formatIsoDate(c.date)} · ${c.timeSlot || ''}`}</AppText>
                            </Row>
                            <AppText size="md" weight="800">
                                {c.teamName}<AppText size="sm" tone="muted">{` · ${c.format || ''} · ${c.level || ''}`}</AppText>
                            </AppText>
                            {c.status === 'matched' && acceptedBy ? (
                                <AppText size="xs" tone="info">
                                    {`Accepted by ${acceptedBy}${c.matchedCaptainName && c.matchedTeamName ? ` (${c.matchedCaptainName})` : ''}${c.matchedPhone ? ` · ${c.matchedPhone}` : ''}`}
                                </AppText>
                            ) : null}
                            {c.notes ? <AppText size="xs" tone="muted" numberOfLines={2}>{c.notes}</AppText> : null}
                            <Row gap={8}>
                                {c.status === 'open' ? (
                                    <Button title="Close" variant="secondary" size="sm" disabled={busyId === c.id} onPress={() => onCloseChallenge(c)} />
                                ) : null}
                                <Button title="Delete" variant="danger" size="sm" disabled={busyId === c.id} onPress={() => onDeleteChallenge(c)} />
                            </Row>
                        </View>
                    );
                })}
                {challenges.length > shown ? (
                    <Button title={`Show more (${challenges.length - shown})`} variant="secondary" size="sm" onPress={() => setShown(n => n + PAGE_SIZE)} />
                ) : null}
            </Card>
        </>
    );
}
