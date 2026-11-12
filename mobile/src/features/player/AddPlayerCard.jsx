import React, { useState } from 'react';
import { View } from 'react-native';
import { UserPlus } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Card, Input, Select, Button, Notice, Row, Label } from '@/components/ui';
import { fonts, spacing } from '@/theme';
import { POSITION_OPTIONS, SQUAD_ROLES, MAX_SQUAD_SIZE } from './constants';

const clampJersey = (raw) => Math.max(0, Math.min(99, Math.round(Number(raw) || 0)));

/** "Add Player to Squad" form for the selected team (captain only). */
export function AddPlayerCard({ team }) {
    const { handleAddPlayerToTeam } = useArena();
    const [playerName, setPlayerName] = useState('');
    const [playerNumber, setPlayerNumber] = useState('7');
    const [playerPosition, setPlayerPosition] = useState('MID');
    const [playerRole, setPlayerRole] = useState('Player');
    const [playerPhone, setPlayerPhone] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submit = async () => {
        if (!team || submitting) return;
        setError('');
        const name = playerName.trim();
        if (name.length < 2) { setError('Player name must be at least 2 characters.'); return; }
        const roster = team.players || [];
        if (roster.some(p => String(p?.name || '').trim().toLowerCase() === name.toLowerCase())) { setError(`${name} is already in the squad.`); return; }
        const num = clampJersey(playerNumber);
        if (num && roster.some(p => Number(p?.number) === num)) { setError(`Jersey #${num} is already taken in this squad.`); return; }
        if (roster.length >= MAX_SQUAD_SIZE) { setError(`A squad can have at most ${MAX_SQUAD_SIZE} players.`); return; }
        setSubmitting(true);
        const r = await handleAddPlayerToTeam(team.id, { name, number: num, position: playerPosition, role: playerRole, phone: playerPhone.trim() || undefined });
        setSubmitting(false);
        if (!r?.ok) { setError(r?.error || 'Could not add the player.'); return; }
        setPlayerName('');
        setPlayerPhone('');
        setPlayerRole('Player');
        // Suggest the next free jersey number
        const used = new Set((r.team?.players || []).map(p => Number(p?.number)));
        let next = num + 1;
        while (used.has(next) && next < 99) next += 1;
        setPlayerNumber(String(Math.min(99, next)));
    };

    return (
        <Card style={{ gap: spacing.md }}>
            <Label tone="default">+ Add Player to Squad</Label>
            {error ? <Notice type="error" message={error} /> : null}
            <Row align="flex-start">
                <View style={{ flex: 2 }}>
                    <Input label="Player name" required placeholder="Player name" value={playerName} onChangeText={setPlayerName} maxLength={40} autoCapitalize="words" />
                </View>
                <View style={{ flex: 1 }}>
                    <Input label="Jersey #" type="number" placeholder="7" value={playerNumber} onChangeText={(t) => setPlayerNumber(t.replace(/[^0-9]/g, ''))} maxLength={2} inputStyle={{ fontFamily: fonts.mono }} />
                </View>
            </Row>
            <Row align="flex-start">
                <View style={{ flex: 1 }}>
                    <Select label="Position" title="Position" value={playerPosition} onChange={setPlayerPosition} options={POSITION_OPTIONS} />
                </View>
                <View style={{ flex: 1 }}>
                    <Select label="Role" title="Squad role" value={playerRole} onChange={setPlayerRole} options={SQUAD_ROLES} />
                </View>
            </Row>
            <Input label="Mobile (optional)" type="phone" placeholder="01XXXXXXXXX" value={playerPhone} onChangeText={setPlayerPhone} maxLength={16} inputStyle={{ fontFamily: fonts.mono }} />
            <Button title={submitting ? 'Adding…' : 'Add Player to Roster'} icon={UserPlus} loading={submitting} onPress={submit} />
        </Card>
    );
}
