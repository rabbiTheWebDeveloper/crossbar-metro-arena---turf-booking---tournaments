'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { toIsoLocal, parseLocalDate } from '@/lib/dateUtils';
import { useArena, todayDhaka } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { cleanPhone, isValidBdPhone } from '@/lib/phone';
import { formatMoney } from '@/data/finance';
import { buildBulkSeriesInvoice, buildBookingInvoice } from '@/lib/invoice';
import RecordAuditMeta from '@/components/admin/RecordAuditMeta';
import {
    Repeat, CalendarRange, Calendar, Clock, CheckCircle2, AlertTriangle, XCircle,
    Loader2, Search, RefreshCw, Pencil, Plus, Trash2, ChevronDown, ChevronUp,
    FileText, Download, X
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS = [
    { value: 6, short: 'Sat', full: 'Saturday' },
    { value: 0, short: 'Sun', full: 'Sunday' },
    { value: 1, short: 'Mon', full: 'Monday' },
    { value: 2, short: 'Tue', full: 'Tuesday' },
    { value: 3, short: 'Wed', full: 'Wednesday' },
    { value: 4, short: 'Thu', full: 'Thursday' },
    { value: 5, short: 'Fri', full: 'Friday' }
];

const dayNameOf = (iso) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return '';
    return DAY_NAMES[parseLocalDate(iso).getDay()] || '';
};

const fmtPrettyDate = (iso) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return iso || '—';
    return parseLocalDate(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Inclusive month range helper without end-of-month overflow (e.g. Jan 31 + 1m -> Feb 28). */
const addMonths = (iso, months) => {
    const [y, m, d] = String(iso || todayDhaka()).split('-').map(Number);
    const targetMonthIndex = (m - 1) + months;
    const lastDayOfTarget = new Date(y, targetMonthIndex + 1, 0).getDate();
    const clampedDay = Math.min(d, lastDayOfTarget);
    const date = new Date(y, targetMonthIndex, clampedDay);
    date.setDate(date.getDate() - 1);
    const result = toIsoLocal(date);
    return result < iso ? iso : result;
};

/** Count dates per weekday (0..6) in [startDate..endDate]. */
const countWeekdaysInRange = (startIso, endIso) => {
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    if (!startIso || !endIso || endIso < startIso) return counts;
    const start = parseLocalDate(startIso);
    const end = parseLocalDate(endIso);
    if ((end - start) / 86400000 > 800) return counts;
    const cur = new Date(start);
    while (cur <= end) {
        counts[cur.getDay()] += 1;
        cur.setDate(cur.getDate() + 1);
    }
    return counts;
};

const inputCls = 'w-full bg-[#080d12] border border-white/10 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none transition-colors';

export default function AdminRecurringBookingsPage() {
    const {
        pricing,
        siteSettings,
        showNotice,
        openInvoice,
        downloadInvoice,
        handleCreateRecurringBookings,
        handleUpdateSeriesSchedule,
        handleRescheduleBooking,
        handleCancelSeries,
        refreshBookings,
        isAdmin
    } = useArena();

    const todayStr = useMemo(() => todayDhaka(), []);

    // ---- Create Bulk Booking Form State ----
    const [scheduleMode, setScheduleMode] = useState('recurring'); // 'recurring' (Date range + Weekdays) | 'specific' (Hand-picked dates)
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(() => addMonths(todayStr, 1));
    const [weekdays, setWeekdays] = useState([5]); // Friday default
    const [specificDates, setSpecificDates] = useState([todayStr]);
    const [newSpecificDate, setNewSpecificDate] = useState(todayStr);
    const [slotPeriodFilter, setSlotPeriodFilter] = useState('all'); // all | morning | afternoon | evening
    const [slotNumbers, setSlotNumbers] = useState([10]);

    const [teamName, setTeamName] = useState('');
    const [captainName, setCaptainName] = useState('');
    const [captainPhone, setCaptainPhone] = useState('');
    const [paidMode, setPaidMode] = useState('none'); // none | advance | full | custom
    const [customPaid, setCustomPaid] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('pay_at_turf');
    const [priceMode, setPriceMode] = useState('auto'); // auto | custom
    const [customPrice, setCustomPrice] = useState('3000');
    const [matchType, setMatchType] = useState('friendly');
    const [notes, setNotes] = useState('');
    const [skipConflicts, setSkipConflicts] = useState(true);

    // ---- Interactive Preview & Per-Row Date/Day/Time Overrides ----
    const [preview, setPreview] = useState(null);
    const [editableSessions, setEditableSessions] = useState(null); // [{ date, slotNumber }] when customized in preview
    const [sessionsDirty, setSessionsDirty] = useState(false);
    const [extraSessionDate, setExtraSessionDate] = useState(todayStr);
    const [extraSessionSlot, setExtraSessionSlot] = useState(10);
    const [isChecking, setIsChecking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    // ---- Existing Series State ----
    const [series, setSeries] = useState([]);
    const [seriesLoading, setSeriesLoading] = useState(true);
    const [seriesSearch, setSeriesSearch] = useState('');
    const [expandedSeriesId, setExpandedSeriesId] = useState('');
    const [cancellingId, setCancellingId] = useState('');

    // ---- Edit Existing Series Schedule Modal (`PATCH /api/bookings/bulk`) ----
    const [editSeriesModal, setEditSeriesModal] = useState(null);
    const [editSeriesPreview, setEditSeriesPreview] = useState(null);
    const [editSeriesChecking, setEditSeriesChecking] = useState(false);
    const [editSeriesSaving, setEditSeriesSaving] = useState(false);
    const [editSeriesError, setEditSeriesError] = useState('');

    // ---- Edit Individual Session Date & Time Modal (`PATCH /api/bookings/[id]`) ----
    const [editBookingModal, setEditBookingModal] = useState(null); // { id, bookingCode, teamName, date, slotNumber, courtPrice, keepPrice }
    const [editBookingSaving, setEditBookingSaving] = useState(false);
    const [editBookingError, setEditBookingError] = useState('');

    const loadSeries = useCallback(async () => {
        setSeriesLoading(true);
        try {
            const res = await fetch('/api/bookings/bulk', { credentials: 'include' });
            const data = await res.json();
            if (res.ok && Array.isArray(data.series)) setSeries(data.series);
        } catch {
            // ignore
        } finally {
            setSeriesLoading(false);
        }
    }, []);

    useEffect(() => { loadSeries(); }, [loadSeries]);

    const slotDefs = useMemo(() => {
        const prices = pricing?.slotPrices?.length ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION;
        return SCHEDULE_SLOTS_DEFINITION.map(def => ({ ...def, ...(prices.find(p => p.slotNumber === def.slotNumber) || {}) }));
    }, [pricing]);

    const visibleSlotDefs = useMemo(
        () => (slotPeriodFilter === 'all' ? slotDefs : slotDefs.filter(s => s.period === slotPeriodFilter)),
        [slotDefs, slotPeriodFilter]
    );

    const weekdayCounts = useMemo(() => countWeekdaysInRange(startDate, endDate), [startDate, endDate]);

    const estimatedDatesCount = useMemo(() => {
        if (scheduleMode === 'specific') return specificDates.length;
        if (weekdays.length === 0) return Object.values(weekdayCounts).reduce((s, c) => s + c, 0);
        return weekdays.reduce((s, d) => s + (weekdayCounts[d] || 0), 0);
    }, [scheduleMode, specificDates.length, weekdays, weekdayCounts]);

    const estimatedTotalSessions = estimatedDatesCount * slotNumbers.length;

    const invalidatePreview = () => {
        setPreview(null);
        setEditableSessions(null);
        setSessionsDirty(false);
        setError('');
    };

    const toggle = (list, setList, value) => {
        invalidatePreview();
        setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
    };

    const handleStartDateChange = (nextStart) => {
        invalidatePreview();
        setStartDate(nextStart);
        if (nextStart && endDate && nextStart > endDate) {
            setEndDate(nextStart);
        }
    };

    const addSpecificDate = () => {
        if (!newSpecificDate) return;
        invalidatePreview();
        setSpecificDates(prev => (prev.includes(newSpecificDate) ? prev : [...prev, newSpecificDate].sort()));
    };

    const removeSpecificDate = (iso) => {
        invalidatePreview();
        setSpecificDates(prev => prev.filter(d => d !== iso));
    };

    const handlePaidModeChange = (nextMode) => {
        invalidatePreview();
        setPaidMode(nextMode);
        if (nextMode === 'none') {
            setPaymentMethod('pay_at_turf');
        } else if (paymentMethod === 'pay_at_turf') {
            setPaymentMethod('cash');
        }
    };

    const paidPerSlot = useMemo(() => {
        if (paidMode === 'none') return 0;
        if (paidMode === 'advance') return Number(pricing?.advanceAmount) || 500;
        if (paidMode === 'full') return 9999999; // server clamps to each slot's price
        return Math.max(0, Number(customPaid) || 0);
    }, [paidMode, customPaid, pricing]);

    const buildPayload = (dryRun, customSessionsOverride = null) => {
        const useSessions = customSessionsOverride || editableSessions;
        const base = {
            teamName: teamName.trim(),
            captainName: captainName.trim(),
            captainPhone: cleanPhone(captainPhone),
            paidPerSlot,
            paymentMethod: paidMode === 'none' ? 'pay_at_turf' : (paymentMethod === 'pay_at_turf' ? 'cash' : paymentMethod),
            pricePerSlot: priceMode === 'custom' ? Math.max(0, Number(customPrice) || 0) : undefined,
            matchType,
            notes: notes.trim(),
            skipConflicts,
            dryRun
        };
        if (Array.isArray(useSessions) && useSessions.length > 0) {
            return {
                ...base,
                startDate: useSessions[0].date,
                endDate: useSessions[useSessions.length - 1].date,
                sessions: useSessions
            };
        }
        if (scheduleMode === 'specific') {
            return {
                ...base,
                startDate: specificDates[0] || todayStr,
                endDate: specificDates[specificDates.length - 1] || todayStr,
                specificDates,
                slotNumbers
            };
        }
        return {
            ...base,
            weekdays,
            slotNumbers,
            startDate,
            endDate
        };
    };

    const validateForm = () => {
        if (teamName.trim().length < 2) return 'Enter a team or club name (at least 2 characters).';
        if (captainName.trim().length < 2) return 'Enter the captain name (at least 2 characters).';
        if (!isValidBdPhone(captainPhone)) return 'Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).';
        if (!editableSessions) {
            if (slotNumbers.length === 0) return 'Pick at least one kickoff time slot.';
            if (scheduleMode === 'specific') {
                if (specificDates.length === 0) return 'Add at least one match date.';
            } else {
                if (!startDate || !endDate || endDate < startDate) return 'End date must be on or after the start date.';
                if (estimatedDatesCount === 0) return 'No calendar dates match the selected weekday(s) inside that date range.';
            }
        } else if (editableSessions.length === 0) {
            return 'All preview sessions were removed. Add a date/slot or re-check the schedule.';
        }
        if (priceMode === 'custom' && (customPrice === '' || Number.isNaN(Number(customPrice)) || Number(customPrice) < 0)) {
            return 'Enter a valid package price per slot (0 or more).';
        }
        if (paidMode === 'custom' && (customPaid === '' || Number.isNaN(Number(customPaid)) || Number(customPaid) < 0)) {
            return 'Enter a valid collected amount per slot.';
        }
        return '';
    };

    const runPreviewCheck = async (sessionsOverride = null) => {
        const v = validateForm();
        if (v) { setError(v); return null; }
        setError('');
        setResult(null);
        setIsChecking(true);
        try {
            const data = await handleCreateRecurringBookings(buildPayload(true, sessionsOverride));
            setPreview(data);
            const combined = [
                ...(data.plan || []).map(p => ({ date: p.date, slotNumber: Number(p.slotNumber) })),
                ...(skipConflicts ? [] : (data.conflicts || []).map(c => ({ date: c.date, slotNumber: Number(c.slotNumber) })))
            ].sort((a, b) => (a.date === b.date ? a.slotNumber - b.slotNumber : a.date.localeCompare(b.date)));
            setEditableSessions(combined);
            setSessionsDirty(false);
            return data;
        } catch (err) {
            setError(err.message || 'Could not check availability.');
            return null;
        } finally {
            setIsChecking(false);
        }
    };

    // Per-row Date / Time editing right inside Preview!
    const updatePreviewSession = (idx, field, value) => {
        setEditableSessions(prev => {
            const list = Array.isArray(prev) ? [...prev] : [];
            if (!list[idx]) return list;
            list[idx] = { ...list[idx], [field]: field === 'slotNumber' ? Number(value) : value };
            return list;
        });
        setSessionsDirty(true);
    };

    const removePreviewSession = (idx) => {
        setEditableSessions(prev => (Array.isArray(prev) ? prev.filter((_, i) => i !== idx) : prev));
        setSessionsDirty(true);
    };

    const addExtraPreviewSession = () => {
        if (!extraSessionDate) return;
        setEditableSessions(prev => {
            const list = Array.isArray(prev) ? [...prev] : [];
            const exists = list.some(s => s.date === extraSessionDate && Number(s.slotNumber) === Number(extraSessionSlot));
            if (exists) return list;
            return [...list, { date: extraSessionDate, slotNumber: Number(extraSessionSlot) }]
                .sort((a, b) => (a.date === b.date ? a.slotNumber - b.slotNumber : a.date.localeCompare(b.date)));
        });
        setSessionsDirty(true);
    };

    const canCreateFromPreview = Boolean(
        preview
        && !sessionsDirty
        && (preview.summary?.bookable || 0) > 0
        && (skipConflicts || (preview.summary?.conflicts || 0) === 0)
    );

    const handleCreate = async () => {
        const v = validateForm();
        if (v) { setError(v); return; }

        let activePreview = preview;
        if (!activePreview || sessionsDirty) {
            activePreview = await runPreviewCheck(editableSessions);
            return; // let admin confirm the freshly verified Date/Day/Time list
        }

        const count = activePreview.summary?.bookable || 0;
        const conflictsCount = activePreview.summary?.conflicts || 0;
        if (count === 0) {
            setError('There are 0 bookable slots in this schedule. Adjust the Date, Day, or Time Slot.');
            return;
        }
        if (conflictsCount > 0 && !skipConflicts) {
            setError(`${conflictsCount} slot(s) are already booked. Tick "Skip already-booked slots" or edit the clashing Date/Time in Preview.`);
            return;
        }

        const summaryLines = [
            `Create ${count} booking${count === 1 ? '' : 's'} for ${teamName.trim()}?`,
            `Dates: ${activePreview.summary?.firstDate} → ${activePreview.summary?.lastDate}`,
            `Total value: ${formatMoney(activePreview.summary?.totalValue || 0)}`,
            `Collected now: ${formatMoney(activePreview.summary?.totalCollected || 0)} · Due: ${formatMoney(activePreview.summary?.totalDue || 0)}`
        ];
        if (!confirm(summaryLines.join('\n'))) return;

        setError('');
        setIsSubmitting(true);
        try {
            const data = await handleCreateRecurringBookings(buildPayload(false));
            setResult(data);
            setPreview(null);
            setEditableSessions(null);
            setSessionsDirty(false);
            setTeamName('');
            setCaptainName('');
            setCaptainPhone('');
            setNotes('');
            loadSeries();
        } catch (err) {
            setError(err.message || 'Failed to create bookings.');
            if (err.data?.conflicts) {
                setPreview({ summary: err.data.summary, plan: [], conflicts: err.data.conflicts });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // ---- Edit Existing Series Schedule Modal (`PATCH /api/bookings/bulk`) ----
    const openEditSeries = (s) => {
        const upcomingRows = (s.bookings || []).filter(b => b.paymentStatus !== 'cancelled' && !b.played && b.date >= todayStr);
        const activeRows = (s.bookings || []).filter(b => b.paymentStatus !== 'cancelled' && !b.played);
        const seedRows = upcomingRows.length > 0 ? upcomingRows : activeRows;
        const first = seedRows[0]?.date || s.firstDate || todayStr;
        const last = seedRows[seedRows.length - 1]?.date || s.lastDate || first;
        const seedSlots = s.slots?.length ? s.slots : [10];
        const seedWeekdays = s.weekdays?.length ? s.weekdays : [5];

        setEditSeriesModal({
            seriesId: s.seriesId,
            scope: upcomingRows.length > 0 ? 'upcoming' : 'all',
            teamName: s.teamName || '',
            captainName: s.captainName || '',
            captainPhone: s.captainPhone || '',
            startDate: first,
            endDate: last,
            weekdays: seedWeekdays,
            slotNumbers: seedSlots,
            priceMode: 'auto',
            pricePerSlot: seedRows[0]?.courtPrice || 3000,
            skipConflicts: true,
            notes: s.notes || ''
        });
        setEditSeriesPreview(null);
        setEditSeriesError('');
    };

    const runEditSeriesPreview = async () => {
        if (!editSeriesModal) return null;
        if (!editSeriesModal.startDate || !editSeriesModal.endDate || editSeriesModal.endDate < editSeriesModal.startDate) {
            setEditSeriesError('End date must be on or after the start date.');
            return null;
        }
        if (editSeriesModal.slotNumbers.length === 0) {
            setEditSeriesError('Select at least one kickoff time slot.');
            return null;
        }
        setEditSeriesError('');
        setEditSeriesChecking(true);
        try {
            const data = await handleUpdateSeriesSchedule({
                seriesId: editSeriesModal.seriesId,
                scope: editSeriesModal.scope,
                teamName: editSeriesModal.teamName,
                captainName: editSeriesModal.captainName,
                captainPhone: cleanPhone(editSeriesModal.captainPhone),
                startDate: editSeriesModal.startDate,
                endDate: editSeriesModal.endDate,
                weekdays: editSeriesModal.weekdays,
                slotNumbers: editSeriesModal.slotNumbers,
                pricePerSlot: editSeriesModal.priceMode === 'custom' ? Number(editSeriesModal.pricePerSlot) || 0 : undefined,
                notes: editSeriesModal.notes,
                skipConflicts: editSeriesModal.skipConflicts,
                dryRun: true
            });
            setEditSeriesPreview(data);
            return data;
        } catch (err) {
            setEditSeriesError(err.message || 'Could not preview series schedule.');
            return null;
        } finally {
            setEditSeriesChecking(false);
        }
    };

    const submitEditSeries = async (e) => {
        e.preventDefault();
        if (!editSeriesModal || editSeriesSaving) return;
        let activePrev = editSeriesPreview;
        if (!activePrev) {
            activePrev = await runEditSeriesPreview();
            return;
        }
        if ((activePrev.summary?.bookable || 0) === 0) {
            setEditSeriesError('0 bookable slots in the new schedule. Pick another Date, Day, or Time.');
            return;
        }
        setEditSeriesSaving(true);
        setEditSeriesError('');
        try {
            await handleUpdateSeriesSchedule({
                seriesId: editSeriesModal.seriesId,
                scope: editSeriesModal.scope,
                teamName: editSeriesModal.teamName,
                captainName: editSeriesModal.captainName,
                captainPhone: cleanPhone(editSeriesModal.captainPhone),
                startDate: editSeriesModal.startDate,
                endDate: editSeriesModal.endDate,
                weekdays: editSeriesModal.weekdays,
                slotNumbers: editSeriesModal.slotNumbers,
                pricePerSlot: editSeriesModal.priceMode === 'custom' ? Number(editSeriesModal.pricePerSlot) || 0 : undefined,
                notes: editSeriesModal.notes,
                skipConflicts: editSeriesModal.skipConflicts,
                dryRun: false
            });
            setEditSeriesModal(null);
            setEditSeriesPreview(null);
            await loadSeries();
        } catch (err) {
            setEditSeriesError(err.message || 'Could not update series schedule.');
        } finally {
            setEditSeriesSaving(false);
        }
    };

    // ---- Edit Individual Session Date & Time Modal (`PATCH /api/bookings/[id]`) ----
    const openEditSingleBooking = (b) => {
        setEditBookingError('');
        setEditBookingModal({
            id: b.id,
            bookingCode: b.bookingCode,
            teamName: b.teamName,
            date: b.date,
            slotNumber: Number(b.slotNumber),
            courtPrice: Number(b.courtPrice ?? b.totalPrice) || 0,
            keepPrice: true
        });
    };

    const submitEditSingleBooking = async (e) => {
        e.preventDefault();
        if (!editBookingModal || editBookingSaving) return;
        setEditBookingError('');
        setEditBookingSaving(true);
        const res = await handleRescheduleBooking(editBookingModal.id, {
            date: editBookingModal.date,
            slotNumber: Number(editBookingModal.slotNumber),
            keepPrice: editBookingModal.keepPrice,
            ...(editBookingModal.keepPrice ? { courtPrice: Number(editBookingModal.courtPrice) || 0 } : {})
        });
        setEditBookingSaving(false);
        if (!res?.ok) {
            setEditBookingError(res?.error || 'Could not reschedule this slot.');
            return;
        }
        setEditBookingModal(null);
        loadSeries();
    };

    const handleCancel = async (s, scope) => {
        const label = scope === 'all' ? 'ALL bookings (including past dates)' : 'all upcoming bookings';
        if (!confirm(`Cancel ${label} in series ${s.seriesId} for ${s.teamName}?`)) return;
        setCancellingId(`${s.seriesId}:${scope}`);
        try {
            await handleCancelSeries(s.seriesId, scope);
            loadSeries();
            refreshBookings();
        } catch (err) {
            showNotice('error', err.message || 'Could not cancel the series.');
        } finally {
            setCancellingId('');
        }
    };

    const filteredSeries = series.filter(s => {
        const q = seriesSearch.trim().toLowerCase();
        return !q
            || s.teamName?.toLowerCase().includes(q)
            || s.captainName?.toLowerCase().includes(q)
            || s.captainPhone?.includes(q)
            || s.seriesId?.toLowerCase().includes(q)
            || (s.weekdayNames || []).some(d => d.toLowerCase().includes(q));
    });

    const presets = [
        { label: '1 week', apply: (s) => { const d = new Date(`${s}T00:00:00`); d.setDate(d.getDate() + 6); return toIsoLocal(d); } },
        { label: '1 month', apply: (s) => addMonths(s, 1) },
        { label: '3 months', apply: (s) => addMonths(s, 3) },
        { label: '6 months', apply: (s) => addMonths(s, 6) },
        { label: 'Full year', apply: (s) => addMonths(s, 12) }
    ];

    const selectedWeekdaySummary = scheduleMode === 'specific'
        ? `${specificDates.length} specific date${specificDates.length === 1 ? '' : 's'}`
        : weekdays.length === 0 || weekdays.length === 7
            ? 'Every day of the week'
            : WEEKDAYS.filter(w => weekdays.includes(w.value)).map(w => w.full).join(', ');

    const selectedTimeSummary = slotNumbers
        .slice()
        .sort((a, b) => a - b)
        .map(sn => slotDefs.find(d => d.slotNumber === sn)?.displayTime || `Slot #${sn}`)
        .join(' · ');

    return (<div className="space-y-8 animate-fade-in font-sans">

      {/* Intro */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400 shrink-0">
          <Repeat className="w-5 h-5"/>
        </div>
        <div>
          <h2 className="text-lg font-black text-white font-display">Bulk &amp; Fixed-Slot Bookings (Date · Day · Time)</h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Schedule weekly recurring slots or custom multi-date packages. Pick exact <strong className="text-slate-200">Dates</strong>, <strong className="text-slate-200">Days of the week</strong>, and <strong className="text-slate-200">Kickoff Times</strong>, customize individual sessions in Preview, or reschedule existing series anytime.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* FORM */}
        <div className="xl:col-span-3 space-y-5 p-5 sm:p-6 rounded-3xl bg-[#0c131a] border border-white/10">

          {/* 1. DATE SELECTION (Recurring Range vs Specific Dates) */}
          <div className="space-y-3 p-4 rounded-2xl bg-[#080d12]/80 border border-lime-400/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-[11px] font-mono font-bold tracking-widest text-lime-400 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5"/>
                <span>1 · Match Dates</span>
              </div>
              <div className="inline-flex p-1 rounded-xl bg-[#0c131a] border border-white/10 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => { invalidatePreview(); setScheduleMode('recurring'); }}
                  className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${scheduleMode === 'recurring' ? 'bg-lime-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                >
                  Date Range + Days
                </button>
                <button
                  type="button"
                  onClick={() => { invalidatePreview(); setScheduleMode('specific'); }}
                  className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${scheduleMode === 'specific' ? 'bg-lime-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                >
                  Specific Dates ({specificDates.length})
                </button>
              </div>
            </div>

            {scheduleMode === 'recurring' ? (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="bulk-start" className="block text-slate-300 text-xs font-semibold mb-1">
                      Start Date <span className="text-emerald-400 font-mono text-[11px]">({dayNameOf(startDate).slice(0, 3)})</span>
                    </label>
                    <input id="bulk-start" type="date" value={startDate} min={todayStr} onChange={e => handleStartDateChange(e.target.value)} className={`${inputCls} font-mono [color-scheme:dark]`}/>
                  </div>
                  <div>
                    <label htmlFor="bulk-end" className="block text-slate-300 text-xs font-semibold mb-1">
                      End Date (Inclusive) <span className="text-emerald-400 font-mono text-[11px]">({dayNameOf(endDate).slice(0, 3)})</span>
                    </label>
                    <input id="bulk-end" type="date" value={endDate} min={startDate || todayStr} onChange={e => { invalidatePreview(); setEndDate(e.target.value); }} className={`${inputCls} font-mono [color-scheme:dark]`}/>
                  </div>
                </div>
                <div className="app-tab-strip sm:flex-wrap">
                  {presets.map(p => (<button key={p.label} type="button" onClick={() => { invalidatePreview(); setEndDate(p.apply(startDate || todayStr)); }} className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 border border-white/10 text-slate-300 hover:border-lime-400/40 cursor-pointer flex items-center gap-1">
                    <CalendarRange className="w-3 h-3 text-lime-400"/> {p.label}
                  </button>))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <input
                      type="date"
                      value={newSpecificDate}
                      min={todayStr}
                      onChange={e => setNewSpecificDate(e.target.value)}
                      className={`${inputCls} font-mono [color-scheme:dark]`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addSpecificDate}
                    className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]"/>
                    <span>Add {newSpecificDate ? `${dayNameOf(newSpecificDate).slice(0, 3)} ${fmtPrettyDate(newSpecificDate)}` : 'Date'}</span>
                  </button>
                </div>
                {specificDates.length === 0 ? (
                  <p className="text-[11px] text-amber-300">No dates added yet. Pick a date above and tap Add.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {specificDates.map(iso => (
                      <span key={iso} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-lime-400/15 border border-lime-400/35 text-lime-200 text-xs font-mono">
                        <strong className="text-lime-400">{dayNameOf(iso).slice(0, 3)}</strong>
                        <span>{iso}</span>
                        <button type="button" onClick={() => removeSpecificDate(iso)} className="text-slate-400 hover:text-rose-300 cursor-pointer" aria-label={`Remove ${iso}`}>
                          <X className="w-3.5 h-3.5"/>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. DAYS OF THE WEEK (Recurring Mode) */}
          {scheduleMode === 'recurring' && (
            <div className="space-y-2.5 p-4 rounded-2xl bg-[#080d12]/80 border border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] font-mono font-bold tracking-widest text-lime-400 uppercase">
                  2 · Days of the Week
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => { invalidatePreview(); setWeekdays([5, 6]); }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold cursor-pointer"
                  >
                    Fri &amp; Sat
                  </button>
                  <button
                    type="button"
                    onClick={() => { invalidatePreview(); setWeekdays([0, 1, 2, 3, 4]); }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold cursor-pointer"
                  >
                    Sun–Thu
                  </button>
                  <button
                    type="button"
                    onClick={() => { invalidatePreview(); setWeekdays(weekdays.length === 7 ? [] : [0, 1, 2, 3, 4, 5, 6]); }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold cursor-pointer"
                  >
                    {weekdays.length === 7 ? 'Clear' : 'Every Day'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                {WEEKDAYS.map(d => {
                  const on = weekdays.includes(d.value);
                  const count = weekdayCounts[d.value] || 0;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggle(weekdays, setWeekdays, d.value)}
                      className={`px-2.5 py-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                        on
                          ? 'bg-lime-400 text-slate-950 border-lime-400 shadow-md shadow-lime-400/15'
                          : 'bg-[#0c131a] border-white/10 text-slate-300 hover:border-lime-400/40'
                      }`}
                    >
                      <div className="text-xs font-black">{d.full}</div>
                      <div className={`text-[10.5px] font-mono mt-0.5 ${on ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                        {count} {count === 1 ? 'date' : 'dates'}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500">
                Tap one or multiple days (e.g. Tuesday &amp; Friday). Leaving all unselected books every day in the date range.
              </p>
            </div>
          )}

          {/* 3. KICKOFF TIME SLOTS */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-[#080d12]/80 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-[11px] font-mono font-bold tracking-widest text-lime-400 uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5"/>
                <span>{scheduleMode === 'recurring' ? '3' : '2'} · Kickoff Time Slots ({slotNumbers.length} selected)</span>
              </div>
              <div className="flex flex-wrap gap-1 text-[11px]">
                {[
                  ['all', 'All (12)'],
                  ['morning', 'Morning'],
                  ['afternoon', 'Afternoon'],
                  ['evening', 'Evening / Night']
                ].map(([k, lbl]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSlotPeriodFilter(k)}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                      slotPeriodFilter === k ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35' : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {visibleSlotDefs.map(s => {
                const on = slotNumbers.includes(s.slotNumber);
                return (
                  <button
                    key={s.slotNumber}
                    type="button"
                    onClick={() => toggle(slotNumbers, setSlotNumbers, s.slotNumber)}
                    className={`px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                      on
                        ? 'bg-lime-400 text-slate-950 border-lime-400 shadow-md shadow-lime-400/15'
                        : 'bg-[#0c131a] border-white/10 text-slate-300 hover:border-lime-400/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[10px] font-mono uppercase font-bold ${on ? 'text-slate-900' : 'text-emerald-400'}`}>
                        Slot #{s.slotNumber} · {s.period}
                      </span>
                    </div>
                    <div className="text-xs font-black font-mono mt-0.5">{s.displayTime}</div>
                    <div className={`text-[10.5px] font-mono mt-0.5 ${on ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                      Wkday ৳{s.weekdayPrice} · Wknd ৳{s.weekendPrice}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LIVE SCHEDULE SUMMARY BANNER */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/25 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Date Span</div>
              <div className="font-mono font-bold text-white mt-0.5">
                {scheduleMode === 'specific'
                  ? (specificDates.length ? `${specificDates[0]} → ${specificDates[specificDates.length - 1]}` : 'No dates')
                  : `${startDate} → ${endDate}`}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Selected Day(s)</div>
              <div className="font-bold text-white mt-0.5 truncate" title={selectedWeekdaySummary}>{selectedWeekdaySummary}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Time &amp; Total Sessions</div>
              <div className="font-bold text-lime-300 mt-0.5 truncate" title={selectedTimeSummary}>
                {estimatedTotalSessions} slot{estimatedTotalSessions === 1 ? '' : 's'} · {selectedTimeSummary || 'Pick a slot'}
              </div>
            </div>
          </div>

          {/* 4. CUSTOMER DETAILS */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono font-bold tracking-widest text-lime-400 uppercase">
              {scheduleMode === 'recurring' ? '4' : '3'} · Team &amp; Captain
            </div>
            <div>
              <label htmlFor="bulk-team" className="block text-slate-300 text-xs mb-1">Team / Club name *</label>
              <input id="bulk-team" type="text" value={teamName} onChange={e => { setError(''); setTeamName(e.target.value); }} placeholder="e.g. Uttara Veterans FC" className={inputCls}/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="bulk-captain" className="block text-slate-300 text-xs mb-1">Captain name *</label>
                <input id="bulk-captain" type="text" value={captainName} onChange={e => { setError(''); setCaptainName(e.target.value); }} placeholder="Captain" className={inputCls}/>
              </div>
              <div>
                <label htmlFor="bulk-phone" className="block text-slate-300 text-xs mb-1">Mobile *</label>
                <input id="bulk-phone" type="tel" value={captainPhone} onChange={e => { setError(''); setCaptainPhone(e.target.value); }} placeholder="01711223344" className={`${inputCls} font-mono`}/>
              </div>
            </div>
          </div>

          {/* 5. PRICE & PAYMENT */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono font-bold tracking-widest text-lime-400 uppercase">
              {scheduleMode === 'recurring' ? '5' : '4'} · Price &amp; Payment
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="bulk-price-mode" className="block text-slate-300 text-xs mb-1">Price per slot</label>
                <select id="bulk-price-mode" value={priceMode} onChange={e => { invalidatePreview(); setPriceMode(e.target.value); }} className={inputCls}>
                  <option value="auto">Use slot pricing (weekday / weekend)</option>
                  <option value="custom">Fixed package price per slot</option>
                </select>
                {priceMode === 'custom' && (<input type="number" min={0} value={customPrice} onChange={e => { invalidatePreview(); setCustomPrice(e.target.value); }} className={`${inputCls} font-mono mt-2`} placeholder="৳ per slot"/>)}
              </div>
              <div>
                <label htmlFor="bulk-paid-mode" className="block text-slate-300 text-xs mb-1">Already collected per slot</label>
                <select id="bulk-paid-mode" value={paidMode} onChange={e => handlePaidModeChange(e.target.value)} className={inputCls}>
                  <option value="none">Nothing yet (pay at turf)</option>
                  <option value="advance">Advance ৳{pricing?.advanceAmount || 500} each</option>
                  <option value="full">Full price each</option>
                  <option value="custom">Custom amount each</option>
                </select>
                {paidMode === 'custom' && (<input type="number" min={0} value={customPaid} onChange={e => { invalidatePreview(); setCustomPaid(e.target.value); }} className={`${inputCls} font-mono mt-2`} placeholder="৳ collected per slot"/>)}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="bulk-method" className="block text-slate-300 text-xs mb-1">Payment method</label>
                <select id="bulk-method" value={paymentMethod} disabled={paidMode === 'none'} onChange={e => setPaymentMethod(e.target.value)} className={`${inputCls} disabled:opacity-60`}>
                  {paidMode === 'none' ? (
                    <option value="pay_at_turf">Pay at turf</option>
                  ) : (<>
                    <option value="cash">Cash (counter)</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="rocket">Rocket</option>
                    <option value="upay">Upay</option>
                    <option value="card">Card / POS</option>
                    <option value="bank">Bank transfer</option>
                  </>)}
                </select>
              </div>
              <div>
                <label htmlFor="bulk-match-type" className="block text-slate-300 text-xs mb-1">Match type</label>
                <select id="bulk-match-type" value={matchType} onChange={e => setMatchType(e.target.value)} className={inputCls}>
                  <option value="friendly">Friendly</option>
                  <option value="competitive">Competitive</option>
                  <option value="practice">Practice</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>
              <div>
                <label htmlFor="bulk-notes" className="block text-slate-300 text-xs mb-1">Notes (optional)</label>
                <input id="bulk-notes" type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Monthly contract" className={inputCls}/>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input type="checkbox" checked={skipConflicts} onChange={e => { setSkipConflicts(e.target.checked); setError(''); }} className="accent-lime-400 w-4 h-4"/>
              Skip already-booked slots and create the rest
            </label>
          </div>

          {error && (<div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-px"/> <span>{error}</span>
          </div>)}

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button type="button" onClick={() => runPreviewCheck(null)} disabled={isChecking || isSubmitting} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs sm:text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
              {isChecking ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
              <span>Check Schedule Availability</span>
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={isChecking || isSubmitting || (Boolean(preview) && !sessionsDirty && !canCreateFromPreview)}
              className="flex-1 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
              <span>
                {sessionsDirty
                  ? 'Re-Verify Edited Dates & Times'
                  : preview
                    ? `Confirm ${preview.summary?.bookable || 0} Bookings`
                    : 'Preview & Create'}
              </span>
            </button>
          </div>
        </div>

        {/* INTERACTIVE EDITABLE PREVIEW / RESULT */}
        <div className="xl:col-span-2 space-y-4">
          {result && (<div role="status" className="p-5 rounded-3xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm"><CheckCircle2 className="w-4 h-4"/> {result.message}</div>
            <div className="text-xs text-slate-300 font-mono">Series ID: <span className="text-white">{result.seriesId}</span></div>
            <div className="text-xs text-slate-400 font-mono">
              {result.summary?.firstDate} → {result.summary?.lastDate} · {result.summary?.created} created · {result.summary?.conflicts || 0} skipped
            </div>
            <div className="text-xs font-mono text-slate-300">
              Value <strong className="text-white">{formatMoney(result.summary?.totalValue)}</strong> · Collected <strong className="text-emerald-400">{formatMoney(result.summary?.totalCollected)}</strong> · Due <strong className="text-amber-300">{formatMoney(result.summary?.totalDue)}</strong>
            </div>
          </div>)}

          <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/10 space-y-3.5 min-h-[260px]">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-mono font-bold tracking-widest text-lime-400 uppercase">
                Editable Schedule Preview
              </div>
              {editableSessions && (
                <button
                  type="button"
                  onClick={() => runPreviewCheck(editableSessions)}
                  disabled={isChecking}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 ${
                    sessionsDirty
                      ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`}/>
                  <span>{sessionsDirty ? 'Re-check Edited Rows' : 'Refresh'}</span>
                </button>
              )}
            </div>

            {!preview ? (
              <p className="text-xs text-slate-500 leading-relaxed">
                Pick your <strong className="text-slate-300">Dates</strong>, <strong className="text-slate-300">Days</strong>, and <strong className="text-slate-300">Time Slots</strong>, then press <strong className="text-slate-200">Check Schedule Availability</strong>. You can then edit any individual row&rsquo;s Date or Time Slot right here before creating the series!
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 rounded-2xl bg-white/5">
                    <div className="text-xl font-black text-white font-display">{preview.summary?.bookable || 0}</div>
                    <div className="text-[11px] text-slate-400">bookable slots</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5">
                    <div className="text-xl font-black text-amber-300 font-display">{preview.summary?.conflicts || 0}</div>
                    <div className="text-[11px] text-slate-400">already booked</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5">
                    <div className="text-lg font-black text-emerald-400 font-mono">{formatMoney(preview.summary?.totalValue || 0)}</div>
                    <div className="text-[11px] text-slate-400">total slot value</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5">
                    <div className="text-sm font-black font-mono text-white">{formatMoney(preview.summary?.totalCollected || 0)}</div>
                    <div className="text-[11px] font-mono text-amber-300">due {formatMoney(preview.summary?.totalDue || 0)}</div>
                  </div>
                </div>

                {preview.conflicts?.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                      Clashes {skipConflicts ? '(automatically skipped)' : '(blocking — edit below or tick skip)'}
                    </div>
                    <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1">
                      {preview.conflicts.map(c => (
                        <div key={`${c.date}-${c.slotNumber}`} className="text-[11px] font-mono text-slate-300 flex justify-between gap-2 p-2 rounded-xl bg-amber-400/10 border border-amber-400/25">
                          <span>{c.date} ({c.dayName?.slice(0, 3)}) · {c.displayTime}</span>
                          <span className="text-amber-300 truncate">{c.bookedBy}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Per-Row Editable Date, Day & Time List */}
                {Array.isArray(editableSessions) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-300 uppercase tracking-wider">
                        Sessions ({editableSessions.length}) — Edit Date or Time per row
                      </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-1.5 pr-0.5">
                      {editableSessions.map((sess, idx) => {
                        const matchedPlan = (preview.plan || []).find(p => p.date === sess.date && Number(p.slotNumber) === Number(sess.slotNumber));
                        const dName = dayNameOf(sess.date);
                        return (
                          <div key={`${idx}-${sess.date}-${sess.slotNumber}`} className="p-2 rounded-xl bg-[#080d12] border border-white/10 space-y-1.5 text-[11px]">
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="px-1.5 py-0.5 rounded bg-lime-400/15 border border-lime-400/30 text-lime-300 font-mono font-bold uppercase text-[10px]">
                                  {dName ? dName.slice(0, 3) : 'DAY'}
                                </span>
                                <input
                                  type="date"
                                  value={sess.date}
                                  min={todayStr}
                                  onChange={e => updatePreviewSession(idx, 'date', e.target.value)}
                                  aria-label={`Session ${idx + 1} date`}
                                  className="bg-[#0c131a] border border-white/10 rounded-lg px-2 py-1 text-white font-mono text-[11px] [color-scheme:dark]"
                                />
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {matchedPlan && !sessionsDirty && (
                                  <span className="font-mono font-bold text-emerald-400">{formatMoney(matchedPlan.price)}</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removePreviewSession(idx)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                  title="Remove this date/slot"
                                  aria-label="Remove session"
                                >
                                  <Trash2 className="w-3.5 h-3.5"/>
                                </button>
                              </div>
                            </div>

                            <select
                              value={sess.slotNumber}
                              onChange={e => updatePreviewSession(idx, 'slotNumber', Number(e.target.value))}
                              aria-label={`Session ${idx + 1} time slot`}
                              className="w-full bg-[#0c131a] border border-white/10 rounded-lg px-2 py-1 text-slate-200 font-mono text-[11px] outline-none"
                            >
                              {slotDefs.map(sd => (
                                <option key={sd.slotNumber} value={sd.slotNumber}>
                                  Slot #{sd.slotNumber} · {sd.displayTime}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Extra Single Session Row */}
                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      <div className="text-[10.5px] font-mono uppercase text-slate-400">Add extra date / time to this batch</div>
                      <div className="flex flex-wrap gap-1.5">
                        <input
                          type="date"
                          value={extraSessionDate}
                          min={todayStr}
                          onChange={e => setExtraSessionDate(e.target.value)}
                          className="bg-[#080d12] border border-white/10 rounded-lg px-2 py-1.5 text-white font-mono text-[11px] [color-scheme:dark]"
                        />
                        <select
                          value={extraSessionSlot}
                          onChange={e => setExtraSessionSlot(Number(e.target.value))}
                          className="flex-1 min-w-[140px] bg-[#080d12] border border-white/10 rounded-lg px-2 py-1.5 text-white font-mono text-[11px]"
                        >
                          {slotDefs.map(sd => (
                            <option key={sd.slotNumber} value={sd.slotNumber}>
                              #{sd.slotNumber} · {sd.displayTime}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={addExtraPreviewSession}
                          className="px-2.5 py-1.5 rounded-lg bg-lime-400/15 hover:bg-lime-400 text-lime-300 hover:text-slate-950 border border-lime-400/30 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3"/> Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* EXISTING FIXED-SLOT SERIES (WITH DATE, DAY, TIME, INVOICE & RESCHEDULE) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-white font-display">Existing Bulk &amp; Fixed-Slot Series</h3>
            <button type="button" onClick={loadSeries} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer" title="Refresh series" aria-label="Refresh series">
              <RefreshCw className={`w-3.5 h-3.5 ${seriesLoading ? 'animate-spin' : ''}`}/>
            </button>
          </div>
          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
            <input type="text" value={seriesSearch} onChange={e => setSeriesSearch(e.target.value)} placeholder="Search team, captain, phone, day..." className={`${inputCls} pl-9`}/>
          </div>
        </div>

        {seriesLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading series schedules…</div>
        ) : filteredSeries.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-[#0c131a] border border-white/10 text-slate-400 text-xs">No recurring series yet.</div>
        ) : (
          <div className="space-y-3">
            {filteredSeries.map(s => {
              const finished = s.upcoming === 0;
              const busyUpcoming = cancellingId === `${s.seriesId}:upcoming`;
              const busyAll = cancellingId === `${s.seriesId}:all`;
              const isExpanded = expandedSeriesId === s.seriesId;
              const dayBadges = Array.isArray(s.weekdayNames) && s.weekdayNames.length
                  ? s.weekdayNames
                  : ['Custom'];
              const timeBadges = Array.isArray(s.slotDetails) && s.slotDetails.length
                  ? s.slotDetails.map(sd => `#${sd.slotNumber} · ${sd.displayTime}`)
                  : (s.slots || []).map(sn => `Slot #${sn}`);

              return (
                <div key={s.seriesId} className="rounded-2xl bg-[#0c131a] border border-white/10 hover:border-lime-400/30 transition-all overflow-hidden">
                  <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                    <div className="min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{s.teamName}</span>
                        <span className="text-xs text-slate-400">· {s.captainName} · <span className="font-mono">{s.captainPhone}</span></span>
                        <span className="text-[11px] font-mono text-slate-500">({s.seriesId})</span>
                      </div>

                      {/* Clear Date + Day + Time Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 font-mono text-white">
                          <Calendar className="w-3 h-3 text-lime-400"/>
                          <span>{s.firstDate} → {s.lastDate}</span>
                        </span>
                        {dayBadges.map(day => (
                          <span key={day} className="px-2 py-1 rounded-lg bg-lime-400/15 border border-lime-400/30 text-lime-300 font-bold">
                            {day}
                          </span>
                        ))}
                        {timeBadges.map(tb => (
                          <span key={tb} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold">
                            <Clock className="w-3 h-3"/>
                            <span>{tb}</span>
                          </span>
                        ))}
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                        <span className="text-white font-bold">{s.active} active</span>
                        {s.cancelled > 0 && <span className="text-rose-400">{s.cancelled} cancelled</span>}
                        <span className={finished ? 'text-slate-500' : 'text-emerald-400'}>{s.upcoming} upcoming</span>
                        <span className="text-emerald-400">Paid {formatMoney(s.collected)} of {formatMoney(s.totalValue)}</span>
                        {s.due > 0 && <span className="text-amber-300 font-bold">Due {formatMoney(s.due)}</span>}
                      </div>

                      <RecordAuditMeta record={s} compact fallbackCreatedBy="Admin Desk" />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedSeriesId(isExpanded ? '' : s.seriesId)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-lime-400"/> : <ChevronDown className="w-3.5 h-3.5 text-lime-400"/>}
                        <span>Dates ({(s.bookings || []).length})</span>
                      </button>

                      {s.active > 0 && (
                        <button
                          type="button"
                          onClick={() => openEditSeries(s)}
                          className="px-2.5 py-1.5 rounded-lg bg-lime-400/15 hover:bg-lime-400 text-lime-300 hover:text-slate-950 border border-lime-400/30 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Edit series Date range, Days of week & Time slots"
                        >
                          <Pencil className="w-3.5 h-3.5"/>
                          <span>Edit Date / Day / Time</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openInvoice(buildBulkSeriesInvoice(s, siteSettings))}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        title="Preview Bulk Series Invoice"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-400"/>
                        <span>Invoice</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadInvoice(buildBulkSeriesInvoice(s, siteSettings))}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-lime-400 text-slate-300 hover:text-slate-950 border border-white/10 cursor-pointer"
                        title="Download Series Schedule Invoice PDF"
                        aria-label="Download Series Invoice PDF"
                      >
                        <Download className="w-3.5 h-3.5"/>
                      </button>

                      {finished ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-white/5 text-slate-400 border border-white/10">Finished</span>
                      ) : (
                        <button type="button" disabled={busyUpcoming || busyAll} onClick={() => handleCancel(s, 'upcoming')} className="px-2.5 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400 text-amber-300 hover:text-slate-950 text-xs font-bold border border-amber-400/20 transition-colors cursor-pointer disabled:opacity-50">
                          {busyUpcoming ? 'Cancelling…' : 'Cancel upcoming'}
                        </button>
                      )}

                      {isAdmin && s.active > 0 && (
                        <button type="button" disabled={busyUpcoming || busyAll} onClick={() => handleCancel(s, 'all')} className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50" title="Cancel entire series (Super Admin only)" aria-label={`Cancel entire series ${s.seriesId}`}>
                          {busyAll ? <Loader2 className="w-4 h-4 animate-spin"/> : <XCircle className="w-4 h-4"/>}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Per-Session Date · Day · Time Breakdown */}
                  {isExpanded && Array.isArray(s.bookings) && (
                    <div className="border-t border-white/10 bg-[#080d12] p-4 space-y-2">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                        Individual Sessions in {s.seriesId} — Tap &ldquo;Edit Date/Time&rdquo; to reschedule a single match
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {s.bookings.map(b => {
                          const isCanc = b.paymentStatus === 'cancelled';
                          return (
                            <div key={b.id} className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs ${isCanc ? 'bg-white/[0.01] border-white/5 opacity-55' : 'bg-[#0c131a] border-white/10'}`}>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-1.5 py-0.5 rounded bg-lime-400/15 text-lime-300 font-mono font-bold text-[10.5px]">
                                    {(b.dayName || dayNameOf(b.date)).slice(0, 3).toUpperCase()}
                                  </span>
                                  <span className="font-mono font-bold text-white">{b.date}</span>
                                  <span className="font-mono text-emerald-300">{b.displayTime}</span>
                                </div>
                                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                  {b.bookingCode} · {formatMoney(b.totalPrice)}
                                  {isCanc ? <span className="text-rose-400"> · Cancelled</span> : b.played ? <span className="text-cyan-300"> · Played</span> : null}
                                </div>
                                <RecordAuditMeta record={b} compact className="mt-1" fallbackCreatedBy="Admin Desk" />
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {!isCanc && (
                                  <button
                                    type="button"
                                    onClick={() => openInvoice(buildBookingInvoice(b, siteSettings))}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                                    title="Session Invoice"
                                    aria-label="Session Invoice"
                                  >
                                    <FileText className="w-3.5 h-3.5"/>
                                  </button>
                                )}
                                {!isCanc && !b.played && (
                                  <button
                                    type="button"
                                    onClick={() => openEditSingleBooking(b)}
                                    className="px-2.5 py-1 rounded-lg bg-lime-400/15 hover:bg-lime-400 text-lime-300 hover:text-slate-950 border border-lime-400/30 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Pencil className="w-3 h-3"/>
                                    <span>Edit Date/Time</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT SERIES SCHEDULE MODAL (DATE RANGE, WEEKDAYS & TIME SLOTS) */}
      {editSeriesModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget && !editSeriesSaving) setEditSeriesModal(null); }}
        >
          <div className="bg-[#0c131a] border-t sm:border border-lime-400/30 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6 max-w-2xl w-full max-h-[92dvh] overflow-y-auto custom-scrollbar space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Edit Bulk Series Date, Day &amp; Time ({editSeriesModal.seriesId})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Change the date range, days of the week, or kickoff time slots. Collected payments carry over automatically.
                </p>
              </div>
              <button type="button" onClick={() => setEditSeriesModal(null)} className="p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <form onSubmit={submitEditSeries} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Reschedule Scope</label>
                  <select
                    value={editSeriesModal.scope}
                    onChange={e => { setEditSeriesPreview(null); setEditSeriesModal(m => ({ ...m, scope: e.target.value })); }}
                    className={inputCls}
                  >
                    <option value="upcoming">Upcoming unplayed slots</option>
                    <option value="all">All unplayed slots in series</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date ({dayNameOf(editSeriesModal.startDate).slice(0, 3)})</label>
                  <input
                    type="date"
                    required
                    value={editSeriesModal.startDate}
                    onChange={e => {
                      const v = e.target.value;
                      setEditSeriesPreview(null);
                      setEditSeriesModal(m => ({ ...m, startDate: v, endDate: m.endDate < v ? v : m.endDate }));
                    }}
                    className={`${inputCls} font-mono [color-scheme:dark]`}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Date ({dayNameOf(editSeriesModal.endDate).slice(0, 3)})</label>
                  <input
                    type="date"
                    required
                    min={editSeriesModal.startDate}
                    value={editSeriesModal.endDate}
                    onChange={e => { setEditSeriesPreview(null); setEditSeriesModal(m => ({ ...m, endDate: e.target.value })); }}
                    className={`${inputCls} font-mono [color-scheme:dark]`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Days of the Week</label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map(d => {
                    const on = editSeriesModal.weekdays.includes(d.value);
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => {
                          setEditSeriesPreview(null);
                          setEditSeriesModal(m => ({
                            ...m,
                            weekdays: m.weekdays.includes(d.value) ? m.weekdays.filter(x => x !== d.value) : [...m.weekdays, d.value]
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer border ${
                          on ? 'bg-lime-400 text-slate-950 border-lime-400' : 'bg-[#080d12] border-white/10 text-slate-300'
                        }`}
                      >
                        {d.full}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Kickoff Time Slots</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {slotDefs.map(s => {
                    const on = editSeriesModal.slotNumbers.includes(s.slotNumber);
                    return (
                      <button
                        key={s.slotNumber}
                        type="button"
                        onClick={() => {
                          setEditSeriesPreview(null);
                          setEditSeriesModal(m => ({
                            ...m,
                            slotNumbers: m.slotNumbers.includes(s.slotNumber)
                              ? m.slotNumbers.filter(x => x !== s.slotNumber)
                              : [...m.slotNumbers, s.slotNumber]
                          }));
                        }}
                        className={`px-2.5 py-2 rounded-xl text-left font-mono cursor-pointer border ${
                          on ? 'bg-lime-400 text-slate-950 border-lime-400 font-black' : 'bg-[#080d12] border-white/10 text-slate-300'
                        }`}
                      >
                        <div className="text-[10px]">Slot #{s.slotNumber}</div>
                        <div className="text-[11px] font-bold">{s.displayTime}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Team Name</label>
                  <input type="text" required value={editSeriesModal.teamName} onChange={e => setEditSeriesModal(m => ({ ...m, teamName: e.target.value }))} className={inputCls}/>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Captain Name</label>
                  <input type="text" required value={editSeriesModal.captainName} onChange={e => setEditSeriesModal(m => ({ ...m, captainName: e.target.value }))} className={inputCls}/>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Captain Mobile</label>
                  <input type="tel" required value={editSeriesModal.captainPhone} onChange={e => setEditSeriesModal(m => ({ ...m, captainPhone: e.target.value }))} className={`${inputCls} font-mono`}/>
                </div>
              </div>

              {editSeriesPreview && (
                <div className="p-3.5 rounded-2xl bg-[#080d12] border border-emerald-500/30 space-y-2">
                  <div className="font-bold text-emerald-300">
                    New Schedule Preview: {editSeriesPreview.summary?.bookable || 0} bookable session(s)
                    {editSeriesPreview.summary?.conflicts > 0 ? ` · ${editSeriesPreview.summary.conflicts} clash(es)` : ''}
                  </div>
                  <div className="text-[11px] font-mono text-slate-300">
                    {editSeriesPreview.summary?.firstDate} → {editSeriesPreview.summary?.lastDate} · Value {formatMoney(editSeriesPreview.summary?.totalValue)} · Carried Paid {formatMoney(editSeriesPreview.summary?.totalCollected)} · Due {formatMoney(editSeriesPreview.summary?.totalDue)}
                  </div>
                  <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                    {(editSeriesPreview.plan || []).map(p => (
                      <div key={`${p.date}-${p.slotNumber}`} className="text-[11px] font-mono text-slate-300 flex justify-between px-2 py-1 rounded bg-white/[0.03]">
                        <span>{p.date} ({p.dayName?.slice(0, 3)}) · {p.displayTime}</span>
                        <span className="text-emerald-400">{formatMoney(p.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editSeriesError && <p role="alert" className="text-rose-400">{editSeriesError}</p>}

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  disabled={editSeriesChecking || editSeriesSaving}
                  onClick={runEditSeriesPreview}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  {editSeriesChecking ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
                  <span>Preview New Schedule</span>
                </button>
                <button
                  type="submit"
                  disabled={editSeriesChecking || editSeriesSaving}
                  className="flex-1 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black uppercase tracking-wider cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  {editSeriesSaving && <Loader2 className="w-4 h-4 animate-spin"/>}
                  <span>{editSeriesPreview ? `Save ${editSeriesPreview.summary?.bookable || 0} Sessions` : 'Preview & Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SINGLE SESSION DATE & TIME MODAL */}
      {editBookingModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget && !editBookingSaving) setEditBookingModal(null); }}
        >
          <div className="bg-[#0c131a] border-t sm:border border-lime-400/30 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6 max-w-md w-full space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white font-display">Reschedule Session Date &amp; Time</h3>
                <p className="text-[11px] text-slate-400 font-mono">{editBookingModal.bookingCode} · {editBookingModal.teamName}</p>
              </div>
              <button type="button" onClick={() => setEditBookingModal(null)} className="p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <form onSubmit={submitEditSingleBooking} className="space-y-3.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  New Match Date <span className="text-lime-400 font-mono">({dayNameOf(editBookingModal.date) || 'Select date'})</span>
                </label>
                <input
                  type="date"
                  required
                  value={editBookingModal.date}
                  onChange={e => setEditBookingModal(m => ({ ...m, date: e.target.value }))}
                  className={`${inputCls} font-mono [color-scheme:dark]`}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Kickoff Time Slot</label>
                <select
                  value={editBookingModal.slotNumber}
                  onChange={e => setEditBookingModal(m => ({ ...m, slotNumber: Number(e.target.value) }))}
                  className={`${inputCls} font-mono`}
                >
                  {slotDefs.map(sd => (
                    <option key={sd.slotNumber} value={sd.slotNumber}>
                      Slot #{sd.slotNumber} · {sd.displayTime} (৳{sd.weekdayPrice} / ৳{sd.weekendPrice})
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editBookingModal.keepPrice}
                  onChange={e => setEditBookingModal(m => ({ ...m, keepPrice: e.target.checked }))}
                  className="accent-lime-400 w-4 h-4"
                />
                <span>Keep package slot price ({formatMoney(editBookingModal.courtPrice)})</span>
              </label>

              {editBookingError && <p role="alert" className="text-rose-400">{editBookingError}</p>}

              <div className="flex gap-2 pt-1">
                <button type="button" disabled={editBookingSaving} onClick={() => setEditBookingModal(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={editBookingSaving} className="flex-1 py-2.5 rounded-xl bg-lime-400 text-slate-950 font-black uppercase tracking-wider cursor-pointer inline-flex items-center justify-center gap-1.5">
                  {editBookingSaving && <Loader2 className="w-3.5 h-3.5 animate-spin"/>}
                  <span>Save Date &amp; Time</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>);
}
