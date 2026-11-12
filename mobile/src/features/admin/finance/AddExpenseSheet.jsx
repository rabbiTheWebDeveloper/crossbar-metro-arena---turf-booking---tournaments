import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Receipt } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Sheet, Input, Select, DateField, Button, Notice, Row } from '@/components/ui';
import { EXPENSE_CATEGORIES } from '@/data/finance';

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map(c => ({ value: c.key, label: c.label }));
const blankForm = (date) => ({ title: '', category: EXPENSE_CATEGORIES[0].key, amount: '', date, receiptNote: '' });

/**
 * "Add Expense Record" form (admin). POST /api/expenses through `handleAddExpense`.
 *   defaultDate: date preselected each time the sheet opens
 */
export function AddExpenseSheet({ visible, onClose, defaultDate }) {
    const { handleAddExpense } = useArena();
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
        if (!form.title.trim() || !amount || amount <= 0 || !form.date) { setError('Title, a positive amount and a date are required.'); return; }
        setSaving(true);
        const result = await handleAddExpense({ title: form.title.trim(), category: form.category, amount, date: form.date, receiptNote: form.receiptNote.trim() });
        setSaving(false);
        if (!result.ok) { setError(result.error || 'Could not save the expense.'); return; }
        onClose();
    };

    return (
        <Sheet
            visible={visible}
            onClose={close}
            dismissable={!saving}
            title="Add Expense Record"
            icon={Receipt}
            footer={(
                <Row>
                    <Button title="Cancel" variant="secondary" disabled={saving} onPress={close} style={{ flex: 1 }} />
                    <Button title={saving ? 'Saving…' : 'Save expense'} loading={saving} onPress={submit} style={{ flex: 1.4 }} />
                </Row>
            )}
        >
            <Input label="Expense title" required placeholder="e.g. Floodlight generator fuel" value={form.title} onChangeText={setField('title')} maxLength={120} />
            <Row align="flex-start">
                <View style={{ flex: 1 }}>
                    <Select label="Category" value={form.category} onChange={setField('category')} options={CATEGORY_OPTIONS} />
                </View>
                <View style={{ flex: 1 }}>
                    <Input label="Amount (৳)" required type="number" value={form.amount} onChangeText={setField('amount')} placeholder="0" />
                </View>
            </Row>
            <DateField label="Date" required value={form.date} onChange={setField('date')} />
            <Input label="Receipt / voucher no." value={form.receiptNote} onChangeText={setField('receiptNote')} maxLength={300} />
            {error ? <Notice type="error" message={error} /> : null}
        </Sheet>
    );
}
