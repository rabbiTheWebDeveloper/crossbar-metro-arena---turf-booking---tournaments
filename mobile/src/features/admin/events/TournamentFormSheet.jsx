import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Sheet, Input, DateField, Button, Notice, Row, AppText } from '@/components/ui';
import { ImageUrlField } from '../content/ImageUrlField';
import { SuggestInput } from '../content/SuggestInput';
import { CATEGORY_OPTIONS, FORMAT_OPTIONS, emptyTournamentForm, tournamentToForm, buildTournamentPayload } from './helpers';

/**
 * Create / edit tournament form.
 *   tournament: the tournament being edited, or null to create a new one
 */
export function TournamentFormSheet({ visible, onClose, tournament }) {
    const { handleSaveTournament } = useArena();
    const [form, setForm] = useState(emptyTournamentForm());
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
    const editing = tournament || null;

    // Load the form each time the sheet opens
    useEffect(() => {
        if (!visible) return;
        setForm(tournament ? tournamentToForm(tournament) : emptyTournamentForm());
        setError('');
        setSubmitting(false);
    }, [visible, tournament]);

    const close = () => { if (!submitting) onClose(); };

    const submit = async () => {
        if (submitting) return;
        setError('');
        const built = buildTournamentPayload(form, editing);
        if (built.error) { setError(built.error); return; }
        setSubmitting(true);
        const res = await handleSaveTournament(built.payload);
        setSubmitting(false);
        if (res?.ok) onClose();
        else setError(res?.error || 'Could not save the tournament.');
    };

    return (
        <Sheet
            visible={visible}
            onClose={close}
            dismissable={!submitting}
            title={editing ? 'Edit Tournament' : 'Create Tournament'}
            subtitle={editing ? 'Update the fixture details.' : 'Add a new competitive championship fixture. It opens for registration immediately.'}
            icon={Trophy}
            footer={(
                <>
                    {error ? <Notice type="error" message={error} /> : null}
                    <Row>
                        <Button title="Cancel" variant="secondary" disabled={submitting} onPress={close} style={{ flex: 1 }} />
                        <Button title={submitting ? 'Saving…' : (editing ? 'Save Changes' : 'Publish Tournament')} loading={submitting} onPress={submit} style={{ flex: 1.4 }} />
                    </Row>
                </>
            )}
        >
            {editing ? (
                <AppText size="xs" tone="warning">
                    Note: the server currently saves changes to title, dates, entry fee, prize pool and max teams on existing tournaments. Other fields apply on creation.
                </AppText>
            ) : null}

            <Input label="Title" required placeholder="e.g. Winter Cup" value={form.title} onChangeText={v => set('title', v)} autoCapitalize="words" />
            <Input label="Edition" placeholder="e.g. Season 3" value={form.edition} onChangeText={v => set('edition', v)} autoCapitalize="words" />

            <SuggestInput label="Category" value={form.category} onChangeText={v => set('category', v)} options={CATEGORY_OPTIONS} />
            <SuggestInput label="Format" value={form.format} onChangeText={v => set('format', v)} options={FORMAT_OPTIONS} />

            <Input label="Tournament Dates" required placeholder="e.g. Nov 20 – Nov 22" value={form.dates} onChangeText={v => set('dates', v)} />
            <DateField label="Registration Deadline" value={form.registrationDeadline} onChange={v => set('registrationDeadline', v)} clearable />

            <Row align="flex-start">
                <View style={{ flex: 1 }}>
                    <Input label="Entry Fee (৳)" required type="number" value={form.entryFee} onChangeText={v => set('entryFee', v)} />
                </View>
                <View style={{ flex: 1 }}>
                    <Input label="Prize Pool (৳)" type="number" value={form.prizePool} onChangeText={v => set('prizePool', v)} />
                </View>
            </Row>
            <Input label="Max Teams" type="number" value={form.maxTeams} onChangeText={v => set('maxTeams', v)} />

            <Input label="First Prize" placeholder="e.g. ৳20,000 + Trophy" value={form.firstPrize} onChangeText={v => set('firstPrize', v)} />
            <Input label="Runner-up Prize" placeholder="e.g. ৳10,000" value={form.runnerUpPrize} onChangeText={v => set('runnerUpPrize', v)} />

            <ImageUrlField label="Banner Image URL" placeholder="https://... (ImageKit / Cloudinary)" value={form.bannerUrl} onChangeText={v => set('bannerUrl', v)} aspectRatio={3} />

            <Input label="Highlights" hint="One per line" multiline value={form.highlights} onChangeText={v => set('highlights', v)} placeholder={'Floodlit night matches\nCertified referees\nLive scoreboard'} />
            <Input label="Rules" hint="One per line" multiline value={form.rules} onChangeText={v => set('rules', v)} placeholder={'Squad of 7–12 players\n2 × 15 minute halves\nRolling substitutions'} />
        </Sheet>
    );
}
