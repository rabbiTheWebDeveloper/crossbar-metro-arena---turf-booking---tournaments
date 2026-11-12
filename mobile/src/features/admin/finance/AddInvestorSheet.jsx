import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { UserPlus } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Sheet, Input, Button, Notice, Row, AppText } from '@/components/ui';
import { trimNumber } from './helpers';

export const MAX_PARTNERS = 10;
const emptyInvestor = { name: '', phone: '', email: '', sharePercentage: '', capitalInvested: '' };

/**
 * "Add Equity Partner" form (admin). Saves through `handleSaveInvestors` (POST /api/investors
 * with the full partner list plus the new record, as the website does).
 *   availablePct: share still unallocated among active partners (shown as guidance)
 */
export function AddInvestorSheet({ visible, onClose, availablePct = 0 }) {
    const { investors, handleSaveInvestors } = useArena();
    const [form, setForm] = useState(emptyInvestor);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    // The typed values survive a cancelled sheet (as on the website); only the error is cleared
    useEffect(() => {
        if (visible) setError('');
    }, [visible]);

    const setField = (key) => (value) => setForm(f => ({ ...f, [key]: value }));
    const close = () => { if (!saving) onClose(); };

    const submit = async () => {
        if (saving) return;
        setError('');
        const share = Number(form.sharePercentage);
        if (!form.name.trim() || !form.phone.trim()) { setError('Name and phone are required.'); return; }
        if (form.sharePercentage.trim() === '' || Number.isNaN(share) || share < 0 || share > 100) { setError('Share must be between 0 and 100.'); return; }
        if (investors.length >= MAX_PARTNERS) { setError(`Maximum ${MAX_PARTNERS} partners allowed.`); return; }
        setSaving(true);
        const result = await handleSaveInvestors([
            ...investors,
            { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), sharePercentage: share, capitalInvested: Number(form.capitalInvested) || 0 }
        ]);
        setSaving(false);
        if (!result.ok) { setError(result.error || 'Could not save the partner.'); return; }
        setForm(emptyInvestor);
        onClose();
    };

    return (
        <Sheet
            visible={visible}
            onClose={close}
            dismissable={!saving}
            title="Add Equity Partner"
            icon={UserPlus}
            footer={(
                <Row>
                    <Button title="Cancel" variant="secondary" disabled={saving} onPress={close} style={{ flex: 1 }} />
                    <Button title={saving ? 'Saving…' : 'Save partner'} loading={saving} onPress={submit} style={{ flex: 1.4 }} />
                </Row>
            )}
        >
            <AppText size="xs" tone="muted">
                {`Active shares cannot exceed 100% in total (${trimNumber(availablePct)}% available). Maximum ${MAX_PARTNERS} partners.`}
            </AppText>
            <Input label="Full name" required value={form.name} onChangeText={setField('name')} autoCapitalize="words" maxLength={80} />
            <Input
                label="Mobile phone"
                required
                type="phone"
                placeholder="01XXXXXXXXX"
                value={form.phone}
                onChangeText={setField('phone')}
                maxLength={14}
                hint="If the partner signs in with this phone number, the portal links automatically."
            />
            <Input label="Email" type="email" value={form.email} onChangeText={setField('email')} />
            <Row align="flex-start">
                <View style={{ flex: 1 }}>
                    <Input label="Share %" required type="number" value={form.sharePercentage} onChangeText={setField('sharePercentage')} />
                </View>
                <View style={{ flex: 1 }}>
                    <Input label="Capital (৳)" type="number" value={form.capitalInvested} onChangeText={setField('capitalInvested')} />
                </View>
            </Row>
            {error ? <Notice type="error" message={error} /> : null}
        </Sheet>
    );
}
