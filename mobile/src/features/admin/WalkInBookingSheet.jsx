import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { Sheet, Input, Select, DateField, Button, Notice, Row, AppText } from '@/components/ui';
import { todayDhakaIso, isWeekendDate } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/format';

const PHONE_RE = /^01[3-9]\d{8}$/;
const METHODS = [
    { value: 'cash', label: 'Cash (Counter)' },
    { value: 'bkash', label: 'bKash Merchant' },
    { value: 'nagad', label: 'Nagad' },
    { value: 'rocket', label: 'Rocket' },
    { value: 'card', label: 'POS Card' }
];

/**
 * Counter / walk-in booking form (admin). The server prices the slot unless a counter deal price
 * is entered; the cash collected decides the payment status.
 *   initialDate / initialSlot: preselect a slot (e.g. when opened from the schedule grid)
 */
export function WalkInBookingSheet({ visible, onClose, initialDate, initialSlot }) {
    const { pricing, handleBookingSuccess, currentUser } = useArena();
    const slotList = pricing?.slotPrices?.length === 12 ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION;

    const [date, setDate] = useState(todayDhakaIso());
    const [slotNum, setSlotNum] = useState(10);
    const [team, setTeam] = useState('');
    const [captain, setCaptain] = useState('');
    const [phone, setPhone] = useState('');
    const [priceOverride, setPriceOverride] = useState(''); // '' = use list price
    const [paid, setPaid] = useState('0');
    const [method, setMethod] = useState('cash');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Reset the form each time the sheet opens
    useEffect(() => {
        if (!visible) return;
        setDate(initialDate || todayDhakaIso());
        setSlotNum(Number(initialSlot) || 10);
        setTeam(''); setCaptain(''); setPhone(''); setNotes(''); setPriceOverride(''); setError(''); setMethod('cash');
    }, [visible, initialDate, initialSlot]);

    // List price follows the admin pricing matrix + weekend rule
    const listPrice = useMemo(() => {
        const def = slotList.find(s => Number(s.slotNumber) === Number(slotNum)) || slotList[0];
        if (!def) return 0;
        return Number(isWeekendDate(date, pricing?.weekendDays) ? def.weekendPrice : def.weekdayPrice) || 0;
    }, [slotList, slotNum, date, pricing?.weekendDays]);

    useEffect(() => {
        setPriceOverride('');
        setPaid(String(listPrice));
    }, [listPrice]);

    const effectivePrice = priceOverride === '' ? listPrice : Math.max(0, Number(priceOverride) || 0);
    const collected = Math.max(0, Number(paid) || 0);
    const due = Math.max(0, effectivePrice - collected);

    const submit = async () => {
        if (submitting) return;
        setError('');
        const cleanPhone = phone.replace(/[^0-9]/g, '').replace(/^8801/, '01');
        if (!team.trim() || !captain.trim()) { setError('Team name and captain name are required.'); return; }
        if (!PHONE_RE.test(cleanPhone)) { setError('Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).'); return; }
        if (collected > effectivePrice) { setError('Collected amount cannot exceed the slot price.'); return; }
        const payload = {
            date,
            slotNumber: Number(slotNum),
            captainName: captain.trim(),
            captainPhone: cleanPhone,
            teamName: team.trim(),
            advanceAmount: collected,
            paymentMethod: collected > 0 ? method : 'pay_at_turf',
            notes: notes.trim() || `Counter walk-in recorded by ${currentUser?.name || 'admin desk'}`,
            isWalkIn: true
        };
        if (priceOverride !== '' && Number(priceOverride) !== listPrice) payload.courtPrice = effectivePrice;
        setSubmitting(true);
        const res = await handleBookingSuccess(payload);
        setSubmitting(false);
        if (res?.ok) onClose();
        else setError(res?.error || 'Could not create the booking. The slot may already be taken.');
    };

    return (
        <Sheet
            visible={visible}
            onClose={onClose}
            title="Create walk-in booking"
            subtitle="Record a counter booking. Price follows the slot matrix."
            icon={Calendar}
            footer={(
                <Row>
                    <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
                    <Button title={submitting ? 'Saving…' : 'Confirm walk-in'} loading={submitting} onPress={submit} style={{ flex: 1.4 }} />
                </Row>
            )}
        >
            <DateField label="Date" value={date} onChange={setDate} />
            <Select label="Slot" value={slotNum} onChange={(v) => setSlotNum(Number(v))} options={slotList.map(s => ({ value: s.slotNumber, label: `#${s.slotNumber} · ${s.displayTime}` }))} />
            <Input label="Team name" required placeholder="e.g. Uttara Strikers" value={team} onChangeText={setTeam} autoCapitalize="words" />
            <Input label="Captain name" required placeholder="e.g. Rafiqul" value={captain} onChangeText={setCaptain} autoCapitalize="words" />
            <Input label="Mobile phone" required type="phone" placeholder="01711223344" value={phone} onChangeText={setPhone} maxLength={14} />
            <Row align="flex-start">
                <View style={{ flex: 1 }}>
                    <Input label={`Slot price (list ${formatMoney(listPrice)})`} type="number" value={priceOverride === '' ? String(listPrice) : priceOverride} onChangeText={setPriceOverride} hint="Change only for a counter deal" />
                </View>
                <View style={{ flex: 1 }}>
                    <Input label="Collected (৳)" type="number" value={paid} onChangeText={setPaid} hint={due > 0 ? `Due at arena: ${formatMoney(due)}` : 'Paid in full'} />
                </View>
            </Row>
            <Select label="Payment method" value={method} onChange={setMethod} options={METHODS} disabled={collected <= 0} hint={collected <= 0 ? 'Nothing collected: the booking will be saved as "pay at arena".' : undefined} />
            <Input label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="e.g. Regular Friday squad" />
            {error ? <Notice type="error" message={error} /> : null}
            <AppText size="xs" tone="dim">The digital pass opens automatically once the booking is saved.</AppText>
        </Sheet>
    );
}
