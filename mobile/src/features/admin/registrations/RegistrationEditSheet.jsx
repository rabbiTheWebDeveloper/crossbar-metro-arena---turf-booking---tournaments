import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { ClipboardCheck, Trash2 } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Sheet, Input, Select, Button, Notice, Row, confirm } from '@/components/ui';
import { formatDateTime } from '@/lib/dateUtils';
import { fonts } from '@/theme';
import { PAYMENT_METHOD_OPTIONS, STATUS_OPTIONS, registrationToForm, linesToPlayers } from './helpers';

/**
 * View / edit every detail of a tournament registration, or delete it.
 *   registration: the record being edited (kept by the parent while the sheet animates out)
 */
export function RegistrationEditSheet({ visible, onClose, registration }) {
    const { handleUpdateRegistration, handleDeleteRegistration } = useArena();
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const closeTimer = useRef(null);
    const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    // Load the form each time the sheet opens
    useEffect(() => {
        if (!visible || !registration) return;
        setForm(registrationToForm(registration));
        setError('');
        setSuccess('');
        setSaving(false);
        setDeleting(false);
    }, [visible, registration]);

    useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

    const busy = saving || deleting;
    const close = () => {
        if (busy) return;
        if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
        onClose();
    };

    const save = async () => {
        if (!registration || !form || busy) return;
        setError('');
        setSuccess('');
        if (!form.teamName.trim()) { setError('Team name is required.'); return; }
        if (!form.captainName.trim()) { setError('Captain name is required.'); return; }
        if (!form.captainPhone.trim()) { setError('Captain mobile is required.'); return; }
        setSaving(true);
        try {
            const playersList = linesToPlayers(form.playersText);
            await handleUpdateRegistration(registration.id, {
                teamName: form.teamName,
                captainName: form.captainName,
                captainPhone: form.captainPhone,
                captainEmail: form.captainEmail,
                jerseyColor: form.jerseyColor,
                playersList,
                playerCount: playersList.length || undefined,
                paymentMethod: form.paymentMethod,
                transactionId: form.transactionId,
                amount: Number(form.amount) || 0,
                notes: form.notes,
                status: form.status
            });
            setSuccess('Registration saved.');
            closeTimer.current = setTimeout(() => { closeTimer.current = null; onClose(); }, 600);
        } catch (err) {
            setError(err?.message || 'Could not save.');
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!registration || busy) return;
        const ok = await confirm('Delete registration?', `Delete registration of ${registration.teamName} for ${registration.tournamentTitle}? This cannot be undone.`, { confirmText: 'Delete', destructive: true });
        if (!ok) return;
        setError('');
        setDeleting(true);
        try {
            await handleDeleteRegistration(registration.id);
            setDeleting(false);
            onClose();
        } catch (err) {
            setDeleting(false);
            setError(err?.message || 'Could not delete the registration.');
        }
    };

    const submittedAt = registration ? (registration.createdAt || registration.registeredAt) : null;
    const listed = form ? linesToPlayers(form.playersText).length : 0;

    return (
        <Sheet
            visible={visible && !!form}
            onClose={close}
            dismissable={!busy}
            title="Registration details"
            subtitle={registration ? `${registration.tournamentTitle || ''} · submitted ${submittedAt ? formatDateTime(submittedAt) : '—'}` : undefined}
            icon={ClipboardCheck}
            footer={(
                <>
                    {error ? <Notice type="error" message={error} /> : null}
                    {success ? <Notice type="success" message={success} /> : null}
                    <Row>
                        <Button icon={Trash2} variant="danger" loading={deleting} disabled={saving} onPress={remove} accessibilityLabel="Delete registration" />
                        <Button title="Cancel" variant="secondary" disabled={busy} onPress={close} style={{ flex: 1 }} />
                        <Button title="Save changes" loading={saving} disabled={deleting} onPress={save} style={{ flex: 1.3 }} />
                    </Row>
                </>
            )}
        >
            {form ? (
                <>
                    <Input label="Team name" required value={form.teamName} onChangeText={v => set('teamName', v)} autoCapitalize="words" />
                    <Select label="Status" value={form.status} onChange={v => set('status', v)} options={STATUS_OPTIONS} />

                    <Input label="Captain name" required value={form.captainName} onChangeText={v => set('captainName', v)} autoCapitalize="words" />
                    <Input label="Captain mobile" required type="phone" value={form.captainPhone} onChangeText={v => set('captainPhone', v)} inputStyle={{ fontFamily: fonts.mono }} maxLength={16} />
                    <Input label="Captain email" type="email" value={form.captainEmail} onChangeText={v => set('captainEmail', v)} />

                    <Row align="flex-start">
                        <View style={{ flex: 1 }}>
                            <Input label="Jersey colour" value={form.jerseyColor} onChangeText={v => set('jerseyColor', v)} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Input label="Entry fee (৳)" type="number" value={form.amount} onChangeText={v => set('amount', v)} inputStyle={{ fontFamily: fonts.mono }} />
                        </View>
                    </Row>

                    <Select label="Payment method" value={form.paymentMethod} onChange={v => set('paymentMethod', v)} options={PAYMENT_METHOD_OPTIONS} />
                    <Input label="Transaction ID" value={form.transactionId} onChangeText={v => set('transactionId', v)} autoCapitalize="none" inputStyle={{ fontFamily: fonts.mono }} />

                    <Input
                        label={`Squad players (one per line) · ${listed} listed`}
                        multiline
                        value={form.playersText}
                        onChangeText={v => set('playersText', v)}
                        placeholder={'Player 1\nPlayer 2\n...'}
                        autoCapitalize="words"
                        inputStyle={{ fontFamily: fonts.mono, minHeight: 150 }}
                    />
                    <Input label="Admin notes" multiline value={form.notes} onChangeText={v => set('notes', v)} placeholder="Internal notes about this team" inputStyle={{ minHeight: 60 }} />
                </>
            ) : null}
        </Sheet>
    );
}
