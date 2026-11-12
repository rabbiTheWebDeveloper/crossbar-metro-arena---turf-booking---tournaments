import { useMemo, useState } from 'react';
import { useArena } from '@/context/ArenaContext';
import { confirm } from '@/components/ui';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { todayDhakaIso } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/format';
import { addMonths } from './constants';

/**
 * State and actions of the "book multiple slots at once" form.
 *   onCreated(): called after a series was saved (reload the series list)
 *   onFeedback(): called whenever a preview, result or error appears (scroll it into view)
 */
export function useRecurringBooking({ onCreated, onFeedback } = {}) {
    const { pricing, handleCreateRecurringBookings } = useArena();
    const todayStr = todayDhakaIso();

    // ---- Form ----
    const [teamName, setTeamName] = useState('');
    const [captainName, setCaptainName] = useState('');
    const [captainPhone, setCaptainPhone] = useState('');
    const [weekdays, setWeekdaysState] = useState([5]);
    const [slotNumbers, setSlotNumbersState] = useState([10]);
    const [startDate, setStartDateState] = useState(todayStr);
    const [endDate, setEndDateState] = useState(addMonths(todayStr, 1));
    const [paidMode, setPaidMode] = useState('none'); // none | advance | full | custom
    const [customPaid, setCustomPaid] = useState('0');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [priceMode, setPriceModeState] = useState('auto'); // auto | custom
    const [customPrice, setCustomPriceState] = useState('3000');
    const [notes, setNotes] = useState('');
    const [skipConflicts, setSkipConflicts] = useState(true);

    // ---- Preview / submit ----
    const [preview, setPreview] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const notify = () => { if (onFeedback) onFeedback(); };

    // Anything that changes the plan invalidates the preview
    const toggleIn = (list, value) => (list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
    const toggleWeekday = (value) => { setPreview(null); setWeekdaysState(prev => toggleIn(prev, value)); };
    const toggleAllWeekdays = () => { setPreview(null); setWeekdaysState(prev => (prev.length === 7 ? [] : [0, 1, 2, 3, 4, 5, 6])); };
    const toggleSlot = (value) => { setPreview(null); setSlotNumbersState(prev => toggleIn(prev, value)); };
    const setStartDate = (iso) => { setPreview(null); setStartDateState(iso); };
    const setEndDate = (iso) => { setPreview(null); setEndDateState(iso); };
    const applyPreset = (months) => { setPreview(null); setEndDateState(addMonths(startDate, months)); };
    const setPriceMode = (mode) => { setPreview(null); setPriceModeState(mode); };
    const setCustomPrice = (value) => { setPreview(null); setCustomPriceState(value); };

    // The 12 slots with the admin's current prices
    const slotDefs = useMemo(() => {
        const prices = pricing?.slotPrices?.length ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION;
        return SCHEDULE_SLOTS_DEFINITION.map(def => ({ ...def, ...(prices.find(p => Number(p.slotNumber) === def.slotNumber) || {}) }));
    }, [pricing]);

    const advanceAmount = Number(pricing?.advanceAmount) || 500;
    const paidPerSlot = useMemo(() => {
        if (paidMode === 'none') return 0;
        if (paidMode === 'advance') return advanceAmount;
        if (paidMode === 'full') return 999999; // the server clamps it to the slot price
        return Math.max(0, Number(customPaid) || 0);
    }, [paidMode, customPaid, advanceAmount]);

    const buildPayload = (dryRun) => ({
        teamName: teamName.trim(),
        captainName: captainName.trim(),
        captainPhone: captainPhone.trim(),
        weekdays,
        slotNumbers,
        startDate,
        endDate,
        paidPerSlot,
        paymentMethod,
        pricePerSlot: priceMode === 'custom' ? Number(customPrice) || 0 : undefined,
        notes: notes.trim(),
        skipConflicts,
        dryRun
    });

    const validate = () => {
        if (!teamName.trim() || !captainName.trim() || !captainPhone.trim()) return 'Team name, captain name and mobile number are required.';
        if (!/^01[3-9]\d{8}$/.test(captainPhone.replace(/[^0-9]/g, '').replace(/^8801/, '01'))) return 'Enter a valid 11-digit mobile number (e.g. 01711223344).';
        if (slotNumbers.length === 0) return 'Pick at least one time slot.';
        if (!startDate || !endDate || endDate < startDate) return 'End date must be on or after the start date.';
        return '';
    };

    const handlePreview = async () => {
        if (isChecking || isSubmitting) return;
        const problem = validate();
        if (problem) { setError(problem); notify(); return; }
        setError('');
        setResult(null);
        setIsChecking(true);
        try {
            const data = await handleCreateRecurringBookings(buildPayload(true));
            setPreview(data);
        } catch (err) {
            setError(err?.message || 'Could not check availability.');
        } finally {
            setIsChecking(false);
            notify();
        }
    };

    const handleCreate = async () => {
        if (isChecking || isSubmitting) return;
        const problem = validate();
        if (problem) { setError(problem); notify(); return; }
        if (!preview) { await handlePreview(); return; }
        const count = preview.summary?.bookable || 0;
        const ok = await confirm(
            `Create ${count} bookings?`,
            `Create ${count} bookings for ${teamName.trim()}?\nTotal slot value ${formatMoney(preview.summary?.totalValue || 0)}.`,
            { confirmText: 'Create bookings' }
        );
        if (!ok) return;
        setError('');
        setIsSubmitting(true);
        try {
            const data = await handleCreateRecurringBookings(buildPayload(false));
            setResult(data);
            setPreview(null);
            setTeamName(''); setCaptainName(''); setCaptainPhone(''); setNotes('');
            if (onCreated) onCreated();
        } catch (err) {
            setError(err?.message || 'Failed to create bookings.');
            if (err?.data?.conflicts) setPreview({ summary: err.data.summary || {}, plan: [], conflicts: err.data.conflicts });
        } finally {
            setIsSubmitting(false);
            notify();
        }
    };

    return {
        todayStr, slotDefs, advanceAmount,
        teamName, setTeamName, captainName, setCaptainName, captainPhone, setCaptainPhone,
        weekdays, toggleWeekday, toggleAllWeekdays, slotNumbers, toggleSlot,
        startDate, setStartDate, endDate, setEndDate, applyPreset,
        priceMode, setPriceMode, customPrice, setCustomPrice,
        paidMode, setPaidMode, customPaid, setCustomPaid,
        paymentMethod, setPaymentMethod, notes, setNotes, skipConflicts, setSkipConflicts,
        preview, result, error, isChecking, isSubmitting, handlePreview, handleCreate
    };
}
