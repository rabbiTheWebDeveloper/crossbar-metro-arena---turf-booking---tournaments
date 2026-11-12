import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Save, CheckCircle2 } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { AdminScreen } from '@/features/admin/AdminScreen';
import { RulesCard } from '@/features/admin/slot-pricing/RulesCard';
import { PriceMatrix } from '@/features/admin/slot-pricing/PriceMatrix';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { AppText, Badge, Button, Heading, Loading, Notice, Row } from '@/components/ui';
import { DAY_NAMES } from '@/lib/dateUtils';

const nonNeg = (v) => Math.max(0, Number(v) || 0);
const DEFAULT_RULES = { advanceAmount: '500', holdMinutes: '10', bookingWindowDays: '60', cancellationHours: '24' };

/** 24-rate slot pricing matrix and the booking rules (advance, hold, window, cancellation, weekend days). */
export default function AdminSlotPricingScreen() {
    const { pricing, handleSavePricing, isLoadingData, isInitialized } = useArena();
    const [slotPrices, setSlotPrices] = useState(SCHEDULE_SLOTS_DEFINITION);
    const [rules, setRules] = useState(DEFAULT_RULES);
    const [weekendDays, setWeekendDays] = useState(['Friday', 'Saturday']);
    const [approveResultsFirst, setApproveResultsFirst] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const savedTimer = useRef(null);

    // Sync the form from the server-loaded pricing (not just once on mount)
    useEffect(() => {
        if (!pricing) return;
        setSlotPrices(Array.isArray(pricing.slotPrices) && pricing.slotPrices.length === 12 ? pricing.slotPrices.map(s => ({ ...s })) : SCHEDULE_SLOTS_DEFINITION);
        setRules({
            advanceAmount: String(nonNeg(pricing.advanceAmount ?? 500)),
            holdMinutes: String(nonNeg(pricing.holdMinutes ?? 10)),
            bookingWindowDays: String(nonNeg(pricing.bookingWindowDays ?? 60)),
            cancellationHours: String(nonNeg(pricing.cancellationHours ?? 24))
        });
        setWeekendDays(Array.isArray(pricing.weekendDays) && pricing.weekendDays.length ? pricing.weekendDays : ['Friday', 'Saturday']);
        setApproveResultsFirst(!!pricing.approveResultsFirst);
        setDirty(false);
    }, [pricing]);

    useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current); }, []);

    const touch = () => { setDirty(true); setSavedSuccess(false); setError(''); };
    const updatePrice = (slotNumber, field, value) => {
        touch();
        setSlotPrices(prev => prev.map(item => (item.slotNumber === slotNumber ? { ...item, [field]: value } : item)));
    };
    const updateRule = (key, value) => { touch(); setRules(prev => ({ ...prev, [key]: value })); };
    const toggleWeekendDay = (day) => {
        touch();
        setWeekendDays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]));
    };

    const handleSave = async () => {
        if (isSubmitting) return;
        setError('');
        const badSlot = slotPrices.find(s => Number(s.weekdayPrice) < 0 || Number(s.weekendPrice) < 0 || Number.isNaN(Number(s.weekdayPrice)) || Number.isNaN(Number(s.weekendPrice)));
        if (badSlot) { setError(`Slot ${badSlot.slotNumber}: prices must be numbers of ৳0 or more.`); return; }
        const { advanceAmount, holdMinutes, bookingWindowDays, cancellationHours } = rules;
        if ([advanceAmount, holdMinutes, bookingWindowDays, cancellationHours].some(v => Number.isNaN(Number(v)) || Number(v) < 0)) { setError('Rules must be numbers of 0 or more.'); return; }
        if (Number(holdMinutes) < 1) { setError('Slot hold must be at least 1 minute.'); return; }
        if (Number(bookingWindowDays) < 1) { setError('Booking window must be at least 1 day.'); return; }
        setIsSubmitting(true);
        const res = await handleSavePricing({
            slotPrices: slotPrices.map(s => ({ ...s, weekdayPrice: nonNeg(s.weekdayPrice), weekendPrice: nonNeg(s.weekendPrice) })),
            advanceAmount: nonNeg(advanceAmount),
            holdMinutes: nonNeg(holdMinutes),
            bookingWindowDays: nonNeg(bookingWindowDays),
            cancellationHours: nonNeg(cancellationHours),
            weekendDays,
            approveResultsFirst
        });
        setIsSubmitting(false);
        if (res?.ok) {
            setSavedSuccess(true);
            setDirty(false);
            if (savedTimer.current) clearTimeout(savedTimer.current);
            savedTimer.current = setTimeout(() => setSavedSuccess(false), 3000);
        } else {
            setError(res?.error || 'Could not save pricing.');
        }
    };

    const weekdayLabel = DAY_NAMES.filter(d => !weekendDays.includes(d)).map(d => d.slice(0, 3)).join(', ') || 'none';
    const weekendLabel = weekendDays.map(d => d.slice(0, 3)).join(', ') || 'none';
    const loading = isLoadingData && !isInitialized;

    const footer = loading ? null : (
        <View style={{ gap: 6 }}>
            {error ? <Notice type="error" message={error} /> : null}
            {dirty && !isSubmitting ? <AppText size="xs" tone="warning" mono center>Unsaved changes</AppText> : null}
            <Button title={isSubmitting ? 'Saving…' : 'Save 24-slot matrix & rules'} icon={Save} loading={isSubmitting} onPress={handleSave} />
        </View>
    );

    return (
        // Pull-to-refresh reloads the pricing and would overwrite edits, so it is off while there are unsaved changes
        <AdminScreen title="Slot pricing" subtitle="Price matrix and booking rules" footer={footer} refreshable={!dirty}>
            <Row justify="space-between" align="flex-start">
                <View style={{ flex: 1, gap: 2 }}>
                    <Heading level={3}>{'24 slot pricing matrix & turf rules'}</Heading>
                    <AppText size="sm" tone="muted">Customize morning, prime evening, and weekend rates for all 12 operational slots.</AppText>
                </View>
                {savedSuccess ? <Badge label="Saved" tone="success" icon={CheckCircle2} /> : null}
            </Row>

            {loading ? <Loading label="Loading pricing…" /> : (
                <>
                    <RulesCard
                        rules={rules}
                        onRuleChange={updateRule}
                        weekendDays={weekendDays}
                        onToggleWeekendDay={toggleWeekendDay}
                        weekdayLabel={weekdayLabel}
                        weekendLabel={weekendLabel}
                        approveResultsFirst={approveResultsFirst}
                        onApproveChange={(v) => { touch(); setApproveResultsFirst(!!v); }}
                    />
                    <PriceMatrix slotPrices={slotPrices} onChange={updatePrice} weekdayLabel={weekdayLabel} weekendLabel={weekendLabel} />
                </>
            )}
        </AdminScreen>
    );
}
