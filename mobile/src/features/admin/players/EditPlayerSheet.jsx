import React, { useEffect, useRef, useState } from 'react';
import { UserCog } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Button, Field, Input, Notice, Row, Segmented, Select, Sheet, ToggleRow } from '@/components/ui';
import { formatDateTime } from '@/lib/dateUtils';
import { titleCase } from '@/lib/format';
import { ROLES, POSITIONS } from './constants';

const ROLE_OPTIONS = ROLES.map(r => ({ value: r, label: titleCase(r) }));

const formFor = (u) => ({
    name: u.name || '',
    phone: u.phone || '',
    email: u.email || '',
    playingPosition: u.playingPosition || 'MID',
    teamId: u.teamId || '',
    role: u.role || 'player',
    disabled: Boolean(u.disabled),
    newPassword: ''
});

/**
 * Edit a player account: name, login mobile, email, position, team, role, password reset, disable.
 *   user: the account being edited, or null when closed
 */
export function EditPlayerSheet({ user, onClose }) {
    const { handleAdminUpdateUser } = useArena();
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const closeTimer = useRef(null);

    // Keep the last account on screen while the sheet slides away
    const last = useRef(null);
    if (user) last.current = user;
    const editing = last.current;

    // Load the form each time the sheet opens for an account
    useEffect(() => {
        if (!user) return;
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setForm(formFor(user));
        setError('');
        setSuccess('');
    }, [user]);

    useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

    if (!editing || !form) return null;
    const set = (key) => (value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        if (saving) return;
        if (!form.name.trim()) { setError('Full name is required.'); return; }
        if (!form.phone.trim()) { setError('Mobile number is required.'); return; }
        setSaving(true);
        setError('');
        try {
            const patch = { ...form };
            if (!patch.newPassword) delete patch.newPassword;
            await handleAdminUpdateUser(editing.id, patch);
            setSuccess('Player profile saved.');
            closeTimer.current = setTimeout(onClose, 600);
        } catch (err) {
            setError(err?.message || 'Could not save.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Sheet
            visible={!!user}
            onClose={onClose}
            title="Edit player profile"
            subtitle={`ID ${editing.id} · joined ${editing.createdAt ? formatDateTime(editing.createdAt) : '—'}`}
            icon={UserCog}
            footer={(
                <Row>
                    <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
                    <Button title="Save changes" loading={saving} onPress={handleSave} style={{ flex: 1.4 }} />
                </Row>
            )}
        >
            <Input label="Full name" required value={form.name} onChangeText={set('name')} autoCapitalize="words" />
            <Input label="Mobile (login)" required type="phone" value={form.phone} onChangeText={set('phone')} maxLength={14} />
            <Input label="Email" type="email" value={form.email} onChangeText={set('email')} />
            <Field label="Playing position">
                <Segmented value={form.playingPosition} onChange={set('playingPosition')} options={POSITIONS} />
            </Field>
            <Input label="Team / club" value={form.teamId} onChangeText={set('teamId')} placeholder="optional" autoCapitalize="none" />
            <Select label="Role" value={form.role} onChange={set('role')} options={ROLE_OPTIONS} />
            <Input label="Reset password (optional)" value={form.newPassword} onChangeText={set('newPassword')} placeholder="min 6 characters" autoCapitalize="none" />
            <ToggleRow label="Account disabled" description="Cannot log in or book" value={form.disabled} onValueChange={(v) => set('disabled')(!!v)} />

            {error ? <Notice type="error" message={error} /> : null}
            {success ? <Notice type="success" message={success} /> : null}
        </Sheet>
    );
}
