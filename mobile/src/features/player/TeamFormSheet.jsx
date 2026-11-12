import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Users, Trash2 } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Sheet, Input, Button, Notice, Row, AppText, Divider, confirm } from '@/components/ui';
import { fonts } from '@/theme';
import { ColorSwatches } from './ColorSwatches';
import { DEFAULT_TEAM_COLOR } from './constants';

const DEFAULT_AREA = 'Uttara, Dhaka';

/**
 * Register a new squad, or edit / delete an existing one.
 *   team: the team being edited (omit to create)      onSaved(team): called after a successful save
 */
export function TeamFormSheet({ visible, onClose, team, onSaved }) {
    const { teams, currentUser, handleSaveTeam, handleUpdateTeam, handleDeleteTeam } = useArena();
    const isEdit = !!team;

    const [name, setName] = useState('');
    const [shortCode, setShortCode] = useState('');
    const [area, setArea] = useState(DEFAULT_AREA);
    const [homeColor, setHomeColor] = useState(DEFAULT_TEAM_COLOR);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Load the form each time the sheet opens (not while the user is typing)
    useEffect(() => {
        if (!visible) return;
        setName(team?.name || '');
        setShortCode(team?.shortCode || '');
        setArea(team ? (team.area || '') : DEFAULT_AREA);
        setHomeColor(team?.homeColor || DEFAULT_TEAM_COLOR);
        setError('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, team?.id]);

    const submit = async () => {
        if (submitting) return;
        setError('');
        const trimmed = name.trim();
        if (trimmed.length < 3) { setError('Team name must be at least 3 characters.'); return; }
        const clash = (teams || []).some(t => (!isEdit || t.id !== team.id) && String(t.name || '').toLowerCase() === trimmed.toLowerCase());
        if (clash) {
            setError(isEdit ? 'Another team already uses this name.' : 'A team with this name already exists. Team names must be unique.');
            return;
        }
        const code = (shortCode.trim() || trimmed.slice(0, 4)).toUpperCase();
        setSubmitting(true);
        const r = isEdit
            ? await handleUpdateTeam(team.id, { name: trimmed, shortCode: code, area: area.trim(), homeColor })
            : await handleSaveTeam({ name: trimmed, shortCode: code, area: area.trim() || DEFAULT_AREA, homeColor });
        setSubmitting(false);
        if (!r?.ok) {
            setError(r?.error || (isEdit ? 'Could not update the team.' : 'Could not register the team.'));
            return;
        }
        if (onSaved) onSaved(r.team);
        onClose();
    };

    const onDelete = async () => {
        if (!team || submitting) return;
        setError('');
        const ok = await confirm('Delete team?', `Delete ${team.name} and its squad roster? Teams with recorded matches cannot be deleted.`, { confirmText: 'Delete team', destructive: true });
        if (!ok) return;
        setSubmitting(true);
        const r = await handleDeleteTeam(team.id);
        setSubmitting(false);
        if (!r?.ok) { setError(r?.error || 'Could not delete the team.'); return; }
        onClose();
    };

    return (
        <Sheet
            visible={visible}
            onClose={onClose}
            title={isEdit ? 'Edit team details' : 'Register New Squad'}
            subtitle={isEdit ? team?.name : 'You can captain up to 3 teams.'}
            icon={Users}
            footer={(
                <Row>
                    <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
                    <Button
                        title={isEdit ? (submitting ? 'Saving…' : 'Save Changes') : (submitting ? 'Registering…' : 'Create Squad')}
                        loading={submitting}
                        onPress={submit}
                        style={{ flex: 1.4 }}
                    />
                </Row>
            )}
        >
            {error ? <Notice type="error" message={error} /> : null}
            <Input label="Squad Name (unique)" required placeholder="e.g. Metro Velocity 7s" value={name} onChangeText={setName} maxLength={60} autoCapitalize="words" />
            <Row align="flex-start">
                <View style={{ flex: 1 }}>
                    <Input label="Short Code" placeholder="e.g. MV7" value={shortCode} onChangeText={setShortCode} maxLength={5} autoCapitalize="characters" inputStyle={{ fontFamily: fonts.mono }} />
                </View>
                <View style={{ flex: 1.6 }}>
                    <Input label="Area / Locality" placeholder="e.g. Sector 17, Uttara" value={area} onChangeText={setArea} maxLength={60} autoCapitalize="words" />
                </View>
            </Row>
            <ColorSwatches label="Team Jersey Colour" value={homeColor} onChange={setHomeColor} />
            {isEdit ? (
                <>
                    <Divider style={{ marginVertical: 0 }} />
                    <Button title="Delete team" icon={Trash2} variant="danger" size="sm" onPress={onDelete} style={{ alignSelf: 'flex-start' }} />
                </>
            ) : (
                <AppText size="xs" tone="muted">
                    Captain: <AppText size="xs" weight="800">{currentUser?.name || ''}</AppText> · <AppText size="xs" mono>{currentUser?.phone || ''}</AppText> (taken from your account)
                </AppText>
            )}
        </Sheet>
    );
}
