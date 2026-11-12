import React, { useState } from 'react';
import { View } from 'react-native';
import { Shirt } from 'lucide-react-native';
import { Sheet, Input, Button, Row } from '@/components/ui';
import { PLAYER_NAME_MAX, clampNumber } from './squadData';

/**
 * Editor for one pitch marker: player name and jersey number (0-99).
 *   player: the marker being edited (null closes the sheet)
 *   onSave(playerId, name, number) / onClose()
 */
export function PlayerEditSheet({ player, onSave, onClose }) {
    const [editName, setEditName] = useState('');
    const [editNumber, setEditNumber] = useState('10');
    // Keep showing the last player while the sheet slides away
    const [shown, setShown] = useState(player);
    if (player && player !== shown) setShown(player);

    // Load the marker's values each time the sheet opens (during render, so stale text never flashes)
    const [openId, setOpenId] = useState(null);
    const playerId = player ? player.id : null;
    if (playerId !== openId) {
        setOpenId(playerId);
        if (player) {
            setEditName(String(player.name || ''));
            setEditNumber(String(player.number ?? ''));
        }
    }

    const current = player || shown;
    const save = () => {
        if (!player) return;
        onSave(player.id, editName, clampNumber(editNumber));
        onClose();
    };

    return (
        <Sheet
            visible={!!player}
            onClose={onClose}
            title="Edit Player Details"
            subtitle={current?.role ? `Editing player position · ${current.role}` : 'Editing player position'}
            icon={Shirt}
            footer={(
                <Row>
                    <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
                    <Button title="Save Player" onPress={save} style={{ flex: 1.4 }} />
                </Row>
            )}
        >
            <Row align="flex-start">
                <View style={{ flex: 2 }}>
                    <Input label="Player Name" placeholder="Player Name" value={editName} onChangeText={setEditName} maxLength={PLAYER_NAME_MAX} autoCapitalize="words" returnKeyType="done" onSubmitEditing={save} />
                </View>
                <View style={{ flex: 1 }}>
                    <Input label="Number" type="number" placeholder="No." value={editNumber} onChangeText={(t) => setEditNumber(t.replace(/[^0-9]/g, '').slice(0, 2))} maxLength={2} returnKeyType="done" onSubmitEditing={save} />
                </View>
            </Row>
        </Sheet>
    );
}
