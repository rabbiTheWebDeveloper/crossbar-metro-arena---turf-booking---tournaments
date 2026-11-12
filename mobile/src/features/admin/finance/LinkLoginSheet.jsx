import React, { useEffect, useMemo, useState } from 'react';
import { Link2 } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Sheet, Select, Button, Notice, Row, AppText } from '@/components/ui';

/**
 * "Link login account" (admin): choose which user account opens a partner's investor portal.
 * PUT /api/investors/:id { userId } through `handleUpdateInvestor` ('' unlinks; the portal then
 * matches by phone number only).
 *   investor: partner being linked (null = sheet closed)
 */
export function LinkLoginSheet({ investor, onClose }) {
    const { users, handleUpdateInvestor } = useArena();
    const [userId, setUserId] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const investorId = investor?.id || '';
    const linkedUserId = investor?.userId || '';

    useEffect(() => {
        if (!investorId) return;
        setUserId(linkedUserId);
        setError('');
    }, [investorId, linkedUserId]);

    const investorUsers = useMemo(() => (users || []).filter(u => u.role === 'investor'), [users]);

    const options = useMemo(() => {
        const list = [
            { value: '', label: '— Not linked (match by phone only) —' },
            ...investorUsers.map(u => ({ value: u.id, label: `${u.name} · ${u.phone}` }))
        ];
        // Keep the currently linked account visible even if its role is no longer "investor"
        if (linkedUserId && !list.some(o => o.value === linkedUserId)) {
            const current = (users || []).find(u => u.id === linkedUserId);
            list.push({ value: linkedUserId, label: current ? `${current.name} · ${current.phone}` : linkedUserId, description: 'Currently linked (not an investor-role account)' });
        }
        return list;
    }, [investorUsers, users, linkedUserId]);

    const close = () => { if (!saving) onClose(); };

    const submit = async () => {
        if (!investor || saving) return;
        setError('');
        setSaving(true);
        const result = await handleUpdateInvestor(investor.id, { userId });
        setSaving(false);
        if (result.ok) onClose();
        else setError(result.error || 'Could not save the link.');
    };

    return (
        <Sheet
            visible={Boolean(investor)}
            onClose={close}
            dismissable={!saving}
            title="Link login account"
            icon={Link2}
            footer={(
                <Row>
                    <Button title="Cancel" variant="secondary" disabled={saving} onPress={close} style={{ flex: 1 }} />
                    <Button title={saving ? 'Saving…' : 'Save link'} loading={saving} onPress={submit} style={{ flex: 1.4 }} />
                </Row>
            )}
        >
            <AppText size="sm" tone="muted">
                {'Choose which login sees '}
                <AppText size="sm" weight="800">{investor ? investor.name : ''}</AppText>
                {'\'s portal. Only accounts with the investor role are listed; change a user\'s role under Players first.'}
            </AppText>
            <Select label="Login account" title="Link login account" value={userId} onChange={setUserId} options={options} searchable={options.length > 8} />
            {investorUsers.length === 0 ? <Notice type="warning" message="No user accounts have the investor role yet." /> : null}
            {error ? <Notice type="error" message={error} /> : null}
        </Sheet>
    );
}
