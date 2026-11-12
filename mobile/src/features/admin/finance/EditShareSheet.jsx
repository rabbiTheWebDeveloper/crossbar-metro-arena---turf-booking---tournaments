import React, { useEffect, useState } from 'react';
import { Percent } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Sheet, Input, Button, Notice, Row } from '@/components/ui';

/**
 * Edit a partner's equity share (the website asks through a browser prompt).
 * PUT /api/investors/:id { sharePercentage } through `handleUpdateInvestor`; the server rejects
 * a value that would push the active partners above 100% in total.
 *   investor: partner being edited (null = sheet closed)
 */
export function EditShareSheet({ investor, onClose }) {
    const { handleUpdateInvestor } = useArena();
    const [value, setValue] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const investorId = investor?.id || '';
    const currentShare = investor?.sharePercentage ?? 0;

    useEffect(() => {
        if (!investorId) return;
        setValue(String(currentShare));
        setError('');
    }, [investorId, currentShare]);

    const close = () => { if (!saving) onClose(); };

    const submit = async () => {
        if (!investor || saving) return;
        setError('');
        const p = Number(value);
        if (value.trim() === '' || Number.isNaN(p) || p < 0 || p > 100) { setError('Share must be a number between 0 and 100.'); return; }
        setSaving(true);
        const result = await handleUpdateInvestor(investor.id, { sharePercentage: p });
        setSaving(false);
        if (result.ok) onClose();
        else setError(result.error || 'Could not update the share.');
    };

    return (
        <Sheet
            visible={Boolean(investor)}
            onClose={close}
            dismissable={!saving}
            title="Edit equity share"
            icon={Percent}
            footer={(
                <Row>
                    <Button title="Cancel" variant="secondary" disabled={saving} onPress={close} style={{ flex: 1 }} />
                    <Button title={saving ? 'Saving…' : 'Save share'} loading={saving} onPress={submit} style={{ flex: 1.4 }} />
                </Row>
            )}
        >
            <Input
                label={investor ? `Equity share percentage for ${investor.name} (0–100)` : 'Equity share percentage (0–100)'}
                type="number"
                value={value}
                onChangeText={setValue}
                autoFocus
                selectTextOnFocus
            />
            {error ? <Notice type="error" message={error} /> : null}
        </Sheet>
    );
}
