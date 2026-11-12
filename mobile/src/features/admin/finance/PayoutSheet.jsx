import React, { useEffect, useState } from 'react';
import { HandCoins } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Sheet, Input, Select, DateField, Button, Notice, Row, AppText, confirm } from '@/components/ui';
import { todayDhakaIso } from '@/lib/dateUtils';
import { formatMoney, formatMonth, PAYOUT_METHODS, paymentMethodLabel } from '@/data/finance';

const METHOD_OPTIONS = PAYOUT_METHODS.map(m => ({ value: m, label: paymentMethodLabel(m) }));

/**
 * "Record Investor Payout" form (admin). POST /api/payouts through `handleRecordPayout`.
 * The server answers 409 when the partner was already paid for that month; the admin is then
 * asked whether to record another payment (`allowDuplicate`).
 *   investor: partner being paid (null = sheet closed)
 *   share: the partner's entry of finance.investorShares for `month` (may be undefined)
 *   month: `YYYY-MM` the payout belongs to
 */
export function PayoutSheet({ investor, share, month, onClose }) {
    const { handleRecordPayout } = useArena();
    const [form, setForm] = useState({ amount: '', datePaid: todayDhakaIso(), paymentMethod: 'bank_transfer', transactionNote: '' });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const investorId = investor?.id || '';
    const balance = share ? share.balance : 0;

    // Prefill the outstanding balance each time the sheet opens for a partner
    useEffect(() => {
        if (!investorId) return;
        setError('');
        setForm({ amount: balance > 0 ? String(balance) : '', datePaid: todayDhakaIso(), paymentMethod: 'bank_transfer', transactionNote: '' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [investorId]);

    const setField = (key) => (value) => setForm(f => ({ ...f, [key]: value }));
    const close = () => { if (!saving) onClose(); };

    const submit = async () => {
        if (!investor || saving) return;
        setError('');
        const amount = Number(form.amount);
        if (!amount || amount <= 0) { setError('Enter a payout amount greater than zero.'); return; }
        const payload = { investorId: investor.id, month, amount, datePaid: form.datePaid, paymentMethod: form.paymentMethod, transactionNote: form.transactionNote.trim() };
        setSaving(true);
        let result = await handleRecordPayout(payload);
        if (!result.ok && result.status === 409) {
            const again = await confirm(
                'Already paid this month',
                `${formatMoney(result.paidSoFar)} has already been paid to ${investor.name} for ${formatMonth(month)}. Record another ${formatMoney(amount)} for the same month?`,
                { confirmText: 'Record another' }
            );
            if (again) result = await handleRecordPayout({ ...payload, allowDuplicate: true });
            else { setSaving(false); return; }
        }
        setSaving(false);
        if (!result.ok) { setError(result.error || 'Could not record the payout.'); return; }
        onClose();
    };

    return (
        <Sheet
            visible={Boolean(investor)}
            onClose={close}
            dismissable={!saving}
            title="Record Investor Payout"
            subtitle={investor ? `${investor.name} (${investor.sharePercentage}%) · ${formatMonth(month)}` : undefined}
            icon={HandCoins}
            footer={(
                <Row>
                    <Button title="Cancel" variant="secondary" disabled={saving} onPress={close} style={{ flex: 1 }} />
                    <Button title={saving ? 'Recording…' : 'Confirm payout'} loading={saving} onPress={submit} style={{ flex: 1.4 }} />
                </Row>
            )}
        >
            {share ? (
                <AppText size="xs" mono tone="muted">
                    {`share ${formatMoney(share.shareAmount)} · paid ${formatMoney(share.paidAmount)} · owed ${formatMoney(share.balance)}`}
                </AppText>
            ) : null}
            <Input label="Payout amount (৳)" required type="number" placeholder="0" value={form.amount} onChangeText={setField('amount')} />
            <DateField label="Date paid" value={form.datePaid} onChange={setField('datePaid')} />
            <Select label="Method" value={form.paymentMethod} onChange={setField('paymentMethod')} options={METHOD_OPTIONS} />
            <Input label="Transaction note" placeholder="e.g. bKash TrxID 8H3K…" value={form.transactionNote} onChangeText={setField('transactionNote')} maxLength={200} />
            {error ? <Notice type="error" message={error} /> : null}
        </Sheet>
    );
}
