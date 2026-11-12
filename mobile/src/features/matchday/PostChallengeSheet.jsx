import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Swords } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { Sheet, Input, Select, DateField, Button, Notice, Row, AppText, Chip } from '@/components/ui';
import { todayDhakaIso, isIsoDate } from '@/lib/dateUtils';
import { LEVELS, FORMATS, LOOKING_FOR, COST_SHARES } from './matchdayUtils';

/**
 * "Post Squad Match Challenge" form (signed-in players). The server takes the captain's name and
 * number from the session; the number is only revealed to the captain who accepts.
 *   onPosted(challenge): called after the challenge went live
 */
export function PostChallengeSheet({ visible, onClose, onPosted }) {
    const { currentUser, pricing, myTeams, handleAddChallenge, showNotice } = useArena();
    const today = todayDhakaIso();
    const slotOptions = useMemo(
        () => (pricing?.slotPrices?.length === 12 ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION).map(s => s.displayTime),
        [pricing?.slotPrices]
    );

    const [teamName, setTeamName] = useState('');
    const [matchDate, setMatchDate] = useState(today);
    const [timeSlot, setTimeSlot] = useState(SCHEDULE_SLOTS_DEFINITION[9]?.displayTime || SCHEDULE_SLOTS_DEFINITION[0].displayTime);
    const [format, setFormat] = useState(FORMATS[0]);
    const [level, setLevel] = useState('Casual');
    const [lookingFor, setLookingFor] = useState(LOOKING_FOR[0]);
    const [costShare, setCostShare] = useState(COST_SHARES[0]);
    const [notes, setNotes] = useState('');
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Each time the sheet opens: clear the error and repair values that are no longer valid
    useEffect(() => {
        if (!visible) return;
        setFormError('');
        setMatchDate(prev => (isIsoDate(prev) && prev >= today ? prev : today));
        setTimeSlot(prev => (slotOptions.includes(prev) ? prev : (slotOptions[9] || slotOptions[0] || '')));
    }, [visible, today, slotOptions]);

    const submit = async () => {
        if (isSubmitting) return;
        if (!teamName.trim()) { setFormError('Please enter your squad name.'); return; }
        if (!isIsoDate(matchDate) || matchDate < today) { setFormError('Pick a match date from today onwards.'); return; }
        if (!timeSlot) { setFormError('Pick a time slot.'); return; }
        setFormError('');
        setIsSubmitting(true);
        const res = await handleAddChallenge({ teamName: teamName.trim(), date: matchDate, timeSlot, format, level, lookingFor, costShare, notes: notes.trim() });
        setIsSubmitting(false);
        if (res && res.ok) {
            setTeamName(''); setNotes('');
            onClose();
            showNotice('success', 'Your challenge is live. Other captains can now accept it.');
            if (onPosted) onPosted(res.challenge);
        } else {
            if (res && res.status === 401) { onClose(); return; } // the context already sent the user to the login screen
            setFormError((res && res.error) || 'Could not post the challenge. Please try again.');
        }
    };

    return (
        <Sheet
            visible={visible}
            onClose={onClose}
            dismissable={!isSubmitting}
            title="Post Squad Match Challenge"
            subtitle={`Posting as ${currentUser?.name || 'your account'}. Your number is shared only with the captain who accepts.`}
            icon={Swords}
            footer={(
                <Row>
                    <Button title="Cancel" variant="secondary" onPress={onClose} disabled={isSubmitting} style={{ flex: 1 }} />
                    <Button title={isSubmitting ? 'Posting...' : 'Post Challenge'} loading={isSubmitting} onPress={submit} style={{ flex: 2 }} />
                </Row>
            )}
        >
            <Input label="Squad name" required maxLength={60} placeholder="e.g. Uttara Strikers" value={teamName} onChangeText={setTeamName} autoCapitalize="words" />
            {myTeams.length > 0 ? (
                <Row wrap gap={6}>
                    <AppText size="xs" tone="dim">Your teams:</AppText>
                    {myTeams.map(t => (
                        <Chip key={t.id} label={t.name} selected={teamName.trim().toLowerCase() === String(t.name || '').toLowerCase()} onPress={() => setTeamName(t.name || '')} />
                    ))}
                </Row>
            ) : null}

            <DateField label="Match date" required value={matchDate} onChange={setMatchDate} minDate={today} />
            <Select label="Time slot" required title="Time slot" value={timeSlot} onChange={setTimeSlot} options={slotOptions} />

            <Row align="flex-start">
                <View style={{ flex: 1 }}>
                    <Select label="Format" value={format} onChange={setFormat} options={FORMATS} />
                </View>
                <View style={{ flex: 1 }}>
                    <Select label="Level" value={level} onChange={setLevel} options={LEVELS} />
                </View>
            </Row>
            <Row align="flex-start">
                <View style={{ flex: 1 }}>
                    <Select label="Looking for" value={lookingFor} onChange={setLookingFor} options={LOOKING_FOR} />
                </View>
                <View style={{ flex: 1 }}>
                    <Select label="Turf fee" value={costShare} onChange={setCostShare} options={COST_SHARES} />
                </View>
            </Row>

            <Input label="Notes / playing style" maxLength={300} value={notes} onChangeText={setNotes} placeholder="e.g. Friendly passing game, looking for a competitive 7s squad" />
            {formError ? <Notice type="error" message={formError} /> : null}
        </Sheet>
    );
}
