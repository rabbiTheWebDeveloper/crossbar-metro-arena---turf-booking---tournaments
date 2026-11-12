import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, XCircle } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { AppText, Button, Input, Notice, Row, Select, Sheet } from '@/components/ui';
import { formatMoney, REFUND_METHODS, paymentMethodLabel } from '@/data/finance';

const METHOD_OPTIONS = REFUND_METHODS.map(m => ({ value: m, label: paymentMethodLabel(m) }));
const EMPTY_FORM = { amount: '', method: 'bkash', trxId: '', note: '' };

/**
 * Process (record the money sent) or reject a refund claim.
 *   request: { refund, mode: 'complete' | 'reject' } | null
 */
export function RefundSheet({ request, onClose }) {
    const { handleRecordRefund } = useArena();
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Keep the last request on screen while the sheet slides away
    const last = useRef(null);
    if (request) last.current = request;
    const shown = last.current;

    // Reset the form each time the sheet opens for a claim
    useEffect(() => {
        if (!request) return;
        const { refund } = request;
        setFormError('');
        setForm({ amount: String(refund.amount ?? ''), method: REFUND_METHODS.includes(refund.refundMethod) ? refund.refundMethod : 'bkash', trxId: '', note: '' });
    }, [request]);

    if (!shown) return null;
    const { refund, mode } = shown;
    const rejecting = mode === 'reject';

    const submit = async () => {
        if (isSubmitting) return;
        setFormError('');
        if (rejecting) {
            setIsSubmitting(true);
            const result = await handleRecordRefund(refund.id, refund.amount, refund.refundMethod || 'bkash', form.note.trim(), 'rejected');
            setIsSubmitting(false);
            if (!result?.ok) { setFormError(result?.error || 'Could not reject the refund.'); return; }
            onClose();
            return;
        }
        const amount = Number(form.amount);
        if (!amount || amount <= 0) { setFormError('Enter the amount actually refunded.'); return; }
        if (amount > Number(refund.amount)) { setFormError(`Amount cannot exceed the claimed ${formatMoney(refund.amount)}.`); return; }
        if (!form.trxId.trim()) { setFormError('A transaction reference is required for a completed refund.'); return; }
        setIsSubmitting(true);
        const result = await handleRecordRefund(refund.id, amount, form.method, form.trxId.trim(), 'completed');
        setIsSubmitting(false);
        if (!result?.ok) { setFormError(result?.error || 'Could not record the refund.'); return; }
        onClose();
    };

    return (
        <Sheet
            visible={!!request}
            onClose={onClose}
            title={rejecting ? 'Reject refund claim' : 'Record processed refund'}
            icon={rejecting ? XCircle : ShieldCheck}
            footer={(
                <Row>
                    <Button title="Cancel" variant="secondary" disabled={isSubmitting} onPress={onClose} style={{ flex: 1 }} />
                    <Button
                        title={isSubmitting ? 'Saving…' : (rejecting ? 'Reject claim' : 'Confirm refunded')}
                        variant={rejecting ? 'dangerSolid' : 'primary'}
                        loading={isSubmitting}
                        onPress={submit}
                        style={{ flex: 1.4 }}
                    />
                </Row>
            )}
        >
            <AppText size="sm" tone="muted">
                {`${refund.bookingCode} · ${refund.customerName} (${refund.customerPhone}) · claimed ${formatMoney(refund.amount)}`}
            </AppText>

            {rejecting ? (
                <Input label="Reason for rejection (optional)" placeholder="e.g. cancelled inside the 24h window" value={form.note} onChangeText={(t) => setForm(f => ({ ...f, note: t }))} />
            ) : (
                <>
                    <Input
                        label="Amount refunded (৳)"
                        required
                        type="number"
                        value={form.amount}
                        onChangeText={(t) => setForm(f => ({ ...f, amount: t.replace(/[^0-9.]/g, '') }))}
                        hint="Lower the amount for a partial refund."
                    />
                    <Select label="Method" required value={form.method} onChange={(v) => setForm(f => ({ ...f, method: v }))} options={METHOD_OPTIONS} />
                    <Input label="Transaction reference" required placeholder="Gateway TrxID or voucher number" value={form.trxId} onChangeText={(t) => setForm(f => ({ ...f, trxId: t }))} autoCapitalize="none" />
                </>
            )}

            {formError ? <Notice type="error" message={formError} /> : null}
        </Sheet>
    );
}
