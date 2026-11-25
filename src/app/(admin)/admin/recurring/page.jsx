'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { toIsoLocal } from '@/lib/dateUtils';
import { useArena, todayDhaka } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { cleanPhone, isValidBdPhone } from '@/lib/phone';
import { formatMoney } from '@/data/finance';
import { Repeat, CalendarRange, CheckCircle2, AlertTriangle, XCircle, Loader2, Search, RefreshCw } from 'lucide-react';
export const dynamic = 'force-dynamic';

const WEEKDAYS = [
    { value: 6, label: 'Sat' },
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' }
];

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

const inputCls = 'w-full bg-[#080d12] border border-white/10 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition-colors';

export default function AdminRecurringBookingsPage() {
    const { pricing, showNotice, handleCreateRecurringBookings, handleCancelSeries, refreshBookings, isAdmin } = useArena();

    const todayStr = useMemo(() => todayDhaka(), []);

    // ---- Form state ----
    const [teamName, setTeamName] = useState('');
    const [captainName, setCaptainName] = useState('');
    const [captainPhone, setCaptainPhone] = useState('');
    const [weekdays, setWeekdays] = useState([5]);
    const [slotNumbers, setSlotNumbers] = useState([10]);
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(() => addMonths(todayStr, 1));
    const [paidMode, setPaidMode] = useState('none'); // none | advance | full | custom
    const [customPaid, setCustomPaid] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('pay_at_turf');
    const [priceMode, setPriceMode] = useState('auto'); // auto | custom
    const [customPrice, setCustomPrice] = useState('3000');
    const [matchType, setMatchType] = useState('friendly');
    const [notes, setNotes] = useState('');
    const [skipConflicts, setSkipConflicts] = useState(true);

    // ---- Preview / submit state ----
    const [preview, setPreview] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    // ---- Existing series ----
    const [series, setSeries] = useState([]);
    const [seriesLoading, setSeriesLoading] = useState(true);
    const [seriesSearch, setSeriesSearch] = useState('');
    const [cancellingId, setCancellingId] = useState('');

    const loadSeries = useCallback(async () => {
        setSeriesLoading(true);
        try {
            const res = await fetch('/api/bookings/bulk');
            const data = await res.json();
            if (res.ok && Array.isArray(data.series)) setSeries(data.series);
        } catch {
            // ignore
        } finally {
            setSeriesLoading(false);
        }
    }, []);

    useEffect(() => { loadSeries(); }, [loadSeries]);

    const invalidatePreview = () => {
        setPreview(null);
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

    const handlePaidModeChange = (nextMode) => {
        invalidatePreview();
        setPaidMode(nextMode);
        if (nextMode === 'none') {
            setPaymentMethod('pay_at_turf');
        } else if (paymentMethod === 'pay_at_turf') {
            setPaymentMethod('cash');
        }
    };

    const slotDefs = useMemo(() => {
        const prices = pricing?.slotPrices?.length ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION;
        return SCHEDULE_SLOTS_DEFINITION.map(def => ({ ...def, ...(prices.find(p => p.slotNumber === def.slotNumber) || {}) }));
    }, [pricing]);

    const paidPerSlot = useMemo(() => {
        if (paidMode === 'none') return 0;
        if (paidMode === 'advance') return Number(pricing?.advanceAmount) || 500;
        if (paidMode === 'full') return 9999999; // server clamps to each slot's price
        return Math.max(0, Number(customPaid) || 0);
    }, [paidMode, customPaid, pricing]);

    const buildPayload = (dryRun) => ({
        teamName: teamName.trim(),
        captainName: captainName.trim(),
        captainPhone: cleanPhone(captainPhone),
        weekdays,
        slotNumbers,
        startDate,
        endDate,
        paidPerSlot,
        paymentMethod: paidMode === 'none' ? 'pay_at_turf' : (paymentMethod === 'pay_at_turf' ? 'cash' : paymentMethod),
        pricePerSlot: priceMode === 'custom' ? Math.max(0, Number(customPrice) || 0) : undefined,
        matchType,
        notes: notes.trim(),
        skipConflicts,
        dryRun
    });

    const validateForm = () => {
        if (teamName.trim().length < 2) return 'Enter a team or club name (at least 2 characters).';
        if (captainName.trim().length < 2) return 'Enter the captain name (at least 2 characters).';
        if (!isValidBdPhone(captainPhone)) return 'Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).';
        if (slotNumbers.length === 0) return 'Pick at least one time slot.';
        if (!startDate || !endDate || endDate < startDate) return 'End date must be on or after the start date.';
        if (priceMode === 'custom' && (customPrice === '' || Number.isNaN(Number(customPrice)) || Number(customPrice) < 0)) {
            return 'Enter a valid package price per slot (0 or more).';
        }
        if (paidMode === 'custom' && (customPaid === '' || Number.isNaN(Number(customPaid)) || Number(customPaid) < 0)) {
            return 'Enter a valid collected amount per slot.';
        }
        return '';
    };

    const handlePreview = async () => {
        const v = validateForm();
        if (v) { setError(v); return null; }
        setError('');
        setResult(null);
        setIsChecking(true);
        try {
            const data = await handleCreateRecurringBookings(buildPayload(true));
            setPreview(data);
            return data;
        } catch (err) {
            setError(err.message || 'Could not check availability.');
            return null;
        } finally {
            setIsChecking(false);
        }
    };

    const canCreateFromPreview = Boolean(
        preview
        && (preview.summary?.bookable || 0) > 0
        && (skipConflicts || (preview.summary?.conflicts || 0) === 0)
    );

    const handleCreate = async () => {
        const v = validateForm();
        if (v) { setError(v); return; }

        let activePreview = preview;
        if (!activePreview) {
            activePreview = await handlePreview();
            return; // let admin review the preview before confirming creation
        }

        const count = activePreview.summary?.bookable || 0;
        const conflictsCount = activePreview.summary?.conflicts || 0;
        if (count === 0) {
            setError('There are 0 bookable slots in this range. Choose different slots or dates.');
            return;
        }
        if (conflictsCount > 0 && !skipConflicts) {
            setError(`${conflictsCount} slot${conflictsCount === 1 ? ' is' : 's are'} already booked. Tick "Skip already-booked slots" or adjust dates.`);
            return;
        }

        const summaryLines = [
            `Create ${count} booking${count === 1 ? '' : 's'} for ${teamName.trim()}?`,
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
            || s.seriesId?.toLowerCase().includes(q);
    });

    const presets = [
        { label: '1 week', apply: (s) => { const d = new Date(`${s}T00:00:00`); d.setDate(d.getDate() + 6); return toIsoLocal(d); } },
        { label: '1 month', apply: (s) => addMonths(s, 1) },
        { label: '3 months', apply: (s) => addMonths(s, 3) },
        { label: '6 months', apply: (s) => addMonths(s, 6) },
        { label: 'Full year', apply: (s) => addMonths(s, 12) }
    ];

    return (<div className="space-y-8 animate-fade-in font-sans">

      {/* Intro */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400 shrink-0">
          <Repeat className="w-5 h-5"/>
        </div>
        <div>
          <h2 className="text-lg font-black text-white font-display">Bulk &amp; Fixed-Slot Bookings</h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Book multiple dates and time slots in one go for regular teams or corporate packages. Pick the weekdays, slots, and date range;
            clashes are checked automatically before anything is saved.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* FORM */}
        <div className="xl:col-span-3 space-y-5 p-5 sm:p-6 rounded-3xl bg-[#0c131a] border border-white/10">

          {/* 1. Customer */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono font-bold tracking-widest text-lime-400 uppercase">1 · Customer</div>
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

          {/* 2. Weekdays */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono font-bold tracking-widest text-lime-400 uppercase">2 · Weekdays</div>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map(d => {
                const on = weekdays.includes(d.value);
                return (<button key={d.value} type="button" onClick={() => toggle(weekdays, setWeekdays, d.value)} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${on ? 'bg-lime-400 text-slate-950' : 'bg-white/5 border border-white/10 text-slate-300 hover:border-lime-400/40'}`}>
                  {d.label}
                </button>);
              })}
              <button type="button" onClick={() => { invalidatePreview(); setWeekdays(weekdays.length === 7 ? [] : [0, 1, 2, 3, 4, 5, 6]); }} className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-slate-400 hover:text-white cursor-pointer">
                {weekdays.length === 7 ? 'Clear' : 'Every day'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">No weekday selected = every day in the range.</p>
          </div>

          {/* 3. Slots */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-mono font-bold tracking-widest text-lime-400 uppercase">3 · Time slots</div>
              <span className="text-[11px] font-mono text-slate-500">{slotNumbers.length} selected</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {slotDefs.map(s => {
                const on = slotNumbers.includes(s.slotNumber);
                return (<button key={s.slotNumber} type="button" onClick={() => toggle(slotNumbers, setSlotNumbers, s.slotNumber)} className={`px-3 py-2 rounded-xl text-left transition-colors cursor-pointer border ${on ? 'bg-lime-400 text-slate-950 border-lime-400' : 'bg-white/5 border border-white/10 text-slate-300 hover:border-lime-400/40'}`}>
                  <div className="text-xs font-bold font-mono">{s.displayTime}</div>
                  <div className={`text-[11px] ${on ? 'text-slate-900' : 'text-slate-500'}`}>৳{s.weekdayPrice} · wknd ৳{s.weekendPrice}</div>
                </button>);
              })}
            </div>
          </div>

          {/* 4. Dates */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono font-bold tracking-widest text-lime-400 uppercase">4 · Date range</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="bulk-start" className="block text-slate-300 text-xs mb-1">From</label>
                <input id="bulk-start" type="date" value={startDate} min={todayStr} onChange={e => handleStartDateChange(e.target.value)} className={`${inputCls} font-mono`}/>
              </div>
              <div>
                <label htmlFor="bulk-end" className="block text-slate-300 text-xs mb-1">To (inclusive)</label>
                <input id="bulk-end" type="date" value={endDate} min={startDate || todayStr} onChange={e => { invalidatePreview(); setEndDate(e.target.value); }} className={`${inputCls} font-mono`}/>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map(p => (<button key={p.label} type="button" onClick={() => { invalidatePreview(); setEndDate(p.apply(startDate || todayStr)); }} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 border border-white/10 text-slate-300 hover:border-lime-400/40 cursor-pointer flex items-center gap-1">
                <CalendarRange className="w-3 h-3"/> {p.label}
              </button>))}
            </div>
          </div>

          {/* 5. Price & Payment */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono font-bold tracking-widest text-lime-400 uppercase">5 · Price &amp; payment</div>
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
            <button type="button" onClick={handlePreview} disabled={isChecking || isSubmitting} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
              {isChecking ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>} Check availability
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={isChecking || isSubmitting || (Boolean(preview) && !canCreateFromPreview)}
              className="flex-1 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-sm uppercase tracking-wider cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
              {preview ? `Create ${preview.summary?.bookable || 0} bookings` : 'Preview & create'}
            </button>
          </div>
        </div>

        {/* PREVIEW / RESULT */}
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

          <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/10 space-y-3 min-h-[220px]">
            <div className="text-[11px] font-mono font-bold tracking-widest text-slate-400 uppercase">Preview</div>
            {!preview ? (<p className="text-xs text-slate-500">Fill the form and press <strong className="text-slate-300">Check availability</strong> to see every date that will be booked, the price, collected/due totals, and any clashes.</p>) : (<>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 rounded-2xl bg-white/5"><div className="text-xl font-black text-white font-display">{preview.summary?.bookable || 0}</div><div className="text-[11px] text-slate-400">bookable slots</div></div>
                <div className="p-3 rounded-2xl bg-white/5"><div className="text-xl font-black text-amber-300 font-display">{preview.summary?.conflicts || 0}</div><div className="text-[11px] text-slate-400">already booked</div></div>
                <div className="p-3 rounded-2xl bg-white/5"><div className="text-lg font-black text-emerald-400 font-mono">{formatMoney(preview.summary?.totalValue || 0)}</div><div className="text-[11px] text-slate-400">total slot value</div></div>
                <div className="p-3 rounded-2xl bg-white/5">
                  <div className="text-sm font-black font-mono text-white">{formatMoney(preview.summary?.totalCollected || 0)}</div>
                  <div className="text-[11px] font-mono text-amber-300">due {formatMoney(preview.summary?.totalDue || 0)}</div>
                </div>
              </div>
              {preview.conflicts?.length > 0 && (<div className="space-y-1">
                <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">Clashes {skipConflicts ? '(will be skipped)' : '(blocking — tick skip to proceed)'}</div>
                <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                  {preview.conflicts.map(c => (<div key={`${c.date}-${c.slotNumber}`} className="text-[11px] font-mono text-slate-300 flex justify-between gap-2 p-1.5 rounded-lg bg-amber-400/5 border border-amber-400/10">
                    <span>{c.date} · {c.displayTime}</span><span className="text-amber-300 truncate">{c.bookedBy}</span>
                  </div>))}
                </div>
              </div>)}
              {preview.plan?.length > 0 && (<div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dates to book ({preview.plan.length})</div>
                <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-1">
                  {preview.plan.map(p => (<div key={`${p.date}-${p.slotNumber}`} className="text-[11px] font-mono text-slate-300 flex justify-between gap-2 p-1.5 rounded-lg bg-white/[0.03]">
                    <span>{p.date} <span className="text-slate-500">{p.dayName?.slice(0, 3)}</span> · {p.displayTime}</span>
                    <span className="text-emerald-400">{formatMoney(p.price)}</span>
                  </div>))}
                </div>
              </div>)}
            </>)}
          </div>
        </div>
      </div>

      {/* EXISTING SERIES */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-white font-display">Existing fixed-slot series</h3>
            <button type="button" onClick={loadSeries} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer" title="Refresh series" aria-label="Refresh series">
              <RefreshCw className={`w-3.5 h-3.5 ${seriesLoading ? 'animate-spin' : ''}`}/>
            </button>
          </div>
          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
            <input type="text" value={seriesSearch} onChange={e => setSeriesSearch(e.target.value)} placeholder="Search team, captain, phone..." className={`${inputCls} pl-9`}/>
          </div>
        </div>

        {seriesLoading ? (<div className="p-8 text-center text-xs text-slate-500">Loading…</div>) : filteredSeries.length === 0 ? (<div className="p-10 text-center rounded-2xl bg-[#0c131a] border border-white/10 text-slate-400 text-xs">No recurring series yet.</div>) : (<div className="space-y-2">
          {filteredSeries.map(s => {
            const finished = s.upcoming === 0;
            const busyUpcoming = cancellingId === `${s.seriesId}:upcoming`;
            const busyAll = cancellingId === `${s.seriesId}:all`;
            return (<div key={s.seriesId} className="p-4 rounded-2xl bg-[#0c131a] border border-white/5 hover:border-lime-400/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm">{s.teamName}</span>
                  <span className="text-xs text-slate-400">· {s.captainName} · <span className="font-mono">{s.captainPhone}</span></span>
                  <span className="text-[11px] font-mono text-slate-500">({s.seriesId})</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  <span>{s.firstDate} → {s.lastDate}</span>
                  <span>Slots {(s.slots || []).join(', ')}</span>
                  <span className="text-white">{s.active} active</span>
                  {s.cancelled > 0 && <span className="text-rose-400">{s.cancelled} cancelled</span>}
                  <span className={finished ? 'text-slate-500' : 'text-emerald-400'}>{s.upcoming} upcoming</span>
                  <span className="text-emerald-400">{formatMoney(s.collected)} of {formatMoney(s.totalValue)}</span>
                  {s.due > 0 && <span className="text-amber-300">due {formatMoney(s.due)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {finished ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-white/5 text-slate-400 border border-white/10">Finished</span>
                ) : (
                  <button type="button" disabled={busyUpcoming || busyAll} onClick={() => handleCancel(s, 'upcoming')} className="px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400 text-amber-300 hover:text-slate-950 text-xs font-bold border border-amber-400/20 transition-colors cursor-pointer disabled:opacity-50">
                    {busyUpcoming ? 'Cancelling…' : 'Cancel upcoming'}
                  </button>
                )}
                {isAdmin && s.active > 0 && (
                  <button type="button" disabled={busyUpcoming || busyAll} onClick={() => handleCancel(s, 'all')} className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50" title="Cancel entire series (Super Admin only)" aria-label={`Cancel entire series ${s.seriesId}`}>
                    {busyAll ? <Loader2 className="w-4 h-4 animate-spin"/> : <XCircle className="w-4 h-4"/>}
                  </button>
                )}
              </div>
            </div>);
          })}
        </div>)}
      </div>
    </div>);
}
