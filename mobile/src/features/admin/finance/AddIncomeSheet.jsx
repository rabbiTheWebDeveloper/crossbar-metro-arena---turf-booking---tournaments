import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Banknote } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Sheet, Input, Select, DateField, Button, Notice, Row } from '@/components/ui';
import { INCOME_SOURCES } from '@/data/finance';

const SOURCE_OPTIONS = INCOME_SOURCES.map(s => ({ value: s.key, label: s.label }));
const blankForm = (date) => ({ title: '', source: INCOME_SOURCES[0].key, amount: '', date, notes: '' });

/**
 * "Record Income" form (admin) for money that is not a turf booking: shop sales, event fees,
 * sponsorship… POST /api/other-income through `handleAddOtherIncome`.
 *   defaultDate: date preselected each time the sheet opens
 */
export function AddIncomeSheet({ visible, onClose, defaultDate }) {
    const { handleAddOtherIncome } = useArena();
    const [form, setForm] = useState(() => blankForm(defaultDate));
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    // Start from a clean form each time the sheet opens
    useEffect(() => {
        if (!visible) return;
        setForm(blankForm(defaultDate));
        setError('');
    }, [visible, defaultDate]);

    const setField = (key) => (value) => setForm(f => ({ ...f, [key]: value }));
    const close = () => { if (!saving) onClose(); };

    const submit = async () => {
        if (saving) return;
        setError('');
        const amount = Number(form.amount);
        if (!form.title.trim() || !amount || amount <= 0 || !form.date) { setError('Description, a positive amount and a date are required.'); return; }
        setSaving(true);
        const result = await handleAddOtherIncome({ source: form.source, title: form.title.trim(), amount, date: form.date, notes: form.notes.trim() });
        setSaving(false);
        if (!result.ok) { setError(result.error || 'Could not record the income.'); return; }
        onClose();
    };

    return (
        <Sheet
            visible={visible}
            onClose={close}
            dismissable={!saving}
            title="Record Income"
            icon={Banknote}
            footer={(
                <Row>
                    <Button title="Cancel" variant="secondary" disabled={saving} onPress={close} style={{ flex: 1 }} />
                    <Button title={saving ? 'Saving…' : 'Save income'} loading={saving} onPress={submit} style={{ flex: 1.4 }} />
                </Row>
            )}
        >
            <Input label="Income description" required placeholder="e.g. Counter grip socks sales" value={form.title} onChangeText={setField('title')} maxLength={120} />
            <Row align="flex-start">
                <View style={{ flex: 1 }}>
                    <Select label="Source" value={form.source} onChange={setField('source')} options={SOURCE_OPTIONS} />
                </View>
                <View style={{ flex: 1 }}>
                    <Input label="Amount (৳)" required type="number" value={form.amount} onChangeText={setField('amount')} placeholder="0" />
                </View>
            </Row>
            <DateField label="Date" required value={form.date} onChange={setField('date')} />
            <Input label="Notes" value={form.notes} onChangeText={setField('notes')} maxLength={300} />
            {error ? <Notice type="error" message={error} /> : null}
        </Sheet>
    );
}
