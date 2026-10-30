'use client';
import { toIsoLocal } from '@/lib/dateUtils';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useArena } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { Repeat, CalendarRange, CheckCircle2, AlertTriangle, XCircle, Loader2, Search } from 'lucide-react';
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


const addMonths = (iso, months) => {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1 + months, d);
    date.setDate(date.getDate() - 1); // inclusive range: 1 month from 1 Nov = 30 Nov
    return toIsoLocal(date);
};

const inputCls = 'w-full bg-[#080d12] border border-white/10 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition-colors';

export default function AdminRecurringBookingsPage() {
    const { pricing, handleCreateRecurringBookings, handleCancelSeries, refreshBookings } = useArena();

    const todayStr = useMemo(() => toIsoLocal(new Date()), []);

    // ---- Form state ----
    const [teamName, setTeamName] = useState('');
    const [captainName, setCaptainName] = useState('');
    const [captainPhone, setCaptainPhone] = useState('');
    const [weekdays, setWeekdays] = useState([5]);
    const [slotNumbers, setSlotNumbers] = useState([10]);
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(addMonths(todayStr, 1));
    const [paidMode, setPaidMode] = useState('none'); // none | advance | full | custom
    const [customPaid, setCustomPaid] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [priceMode, setPriceMode] = useState('auto'); // auto | custom
    const [customPrice, setCustomPrice] = useState(3000);
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

    const toggle = (list, setList, value) => {
        setPreview(null);
        setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
    };

    const slotDefs = useMemo(() => {
        const prices = pricing?.slotPrices?.length ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION;
        return SCHEDULE_SLOTS_DEFINITION.map(def => ({ ...def, ...(prices.find(p => p.slotNumber === def.slotNumber) || {}) }));
    }, [pricing]);

    const paidPerSlot = useMemo(() => {
        if (paidMode === 'none') return 0;
        if (paidMode === 'advance') return pricing?.advanceAmount || 500;
        if (paidMode === 'full') return 999999; // server clamps to slot price
        return Math.max(0, Number(customPaid) || 0);
    }, [paidMode, customPaid, pricing]);

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
        pricePerSlot: priceMode === 'custom' ? Number(customPrice) : undefined,
        notes: notes.trim(),
        skipConflicts,
        dryRun
    });

    const validate = () => {
        if (!teamName.trim() || !captainName.trim() || !captainPhone.trim()) return 'Team name, captain name and mobile number are required.';
        if (!/^01[3-9]\d{8}$/.test(captainPhone.replace(/[^0-9]/g, ''))) return 'Enter a valid 11-digit mobile number (e.g. 01711223344).';
        if (slotNumbers.length === 0) return 'Pick at least one time slot.';
        if (!startDate || !endDate || endDate < startDate) return 'End date must be on or after the start date.';
        return '';
    };

    const handlePreview = async () => {
        const v = validate();
        if (v) { setError(v); return; }
        setError('');
        setResult(null);
        setIsChecking(true);
        try {
            const data = await handleCreateRecurringBookings(buildPayload(true));
            setPreview(data);
        } catch (err) {
            setError(err.message || 'Could not check availability.');
        } finally {
            setIsChecking(false);
        }
    };

    const handleCreate = async () => {
        const v = validate();
        if (v) { setError(v); return; }
        if (!preview) { await handlePreview(); return; }
        const count = preview.summary?.bookable || 0;
        if (!confirm(`Create ${count} bookings for ${teamName.trim()}?\nTotal slot value ৳${(preview.summary?.totalValue || 0).toLocaleString()}.`)) return;
        setError('');
        setIsSubmitting(true);
        try {
            const data = await handleCreateRecurringBookings(buildPayload(false));
            setResult(data);
            setPreview(null);
            setTeamName(''); setCaptainName(''); setCaptainPhone(''); setNotes('');
            loadSeries();
        } catch (err) {
            setError(err.message || 'Failed to create bookings.');
            if (err.data?.conflicts) setPreview({ summary: err.data.summary, plan: [], conflicts: err.data.conflicts });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async (s, scope) => {
        const label = scope === 'all' ? 'ALL bookings (including past dates)' : 'all upcoming bookings';
        if (!confirm(`Cancel ${label} in series ${s.seriesId} for ${s.teamName}?`)) return;
        try {
            const data = await handleCancelSeries(s.seriesId, scope);
            alert(data.message || 'Series cancelled');
            loadSeries();
            refreshBookings();
        } catch (err) {
            alert(err.message);
        }
    };

    const filteredSeries = series.filter(s => {
        const q = seriesSearch.toLowerCase();
        return !q || s.teamName?.toLowerCase().includes(q) || s.captainName?.toLowerCase().includes(q) || s.captainPhone?.includes(q) || s.seriesId?.toLowerCase().includes(q);
    });

    const presets = [
        { label: '1 month', months: 1 },
        { label: '3 months', months: 3 },
        { label: '6 months', months: 6 },
        { label: 'Full year', months: 12 }
    ];

    return (<div className="space-y-8 animate-fade-in font-sans">

      {/* Intro */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400 shrink-0">
          <Repeat className="w-5 h-5"/>
        </div>
        <div>
          <h2 className="text-lg font-black text-white font-display">Book multiple slots at once</h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            For regular customers who take the same weekly slot for a month or the whole year. Pick the weekdays, the time slots and a date range;
            every matching date is booked in one go. Already-booked slots are detected before anything is saved.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* FORM */}
        <div className="xl:col-span-3 space-y-5 p-5 sm:p-6 rounded-3xl bg-[#0c131a] border border-white/10">

          {/* Customer */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono font-bold tracking-widest text-lime-400 uppercase">1 · Customer</div>
            <div>
              <label className="block text-slate-300 text-xs mb-1">Team / Club name *</label>
              <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g. Uttara Veterans FC" className={inputCls}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 text-xs mb-1">Captain name *</label>
                <input type="text" value={captainName} onChange={e => setCaptainName(e.target.value)} placeholder="Captain" className={inputCls}/>
              </div>
              <div>
                <label className="block text-slate-300 text-xs mb-1">Mobile *</label>
                <input type="tel" value={captainPhone} onChange={e => setCaptainPhone(e.target.value)} placeholder="01711223344" className={`${inputCls} font-mono`}/>
              </div>
            </div>
          </div>

          {/* Weekdays */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono font-bold tracking-widest text-lime-400 uppercase">2 · Weekdays</div>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map(d => {
                const on = weekdays.includes(d.value);
                return (<button key={d.value} type="button" onClick={() => toggle(weekdays, setWeekdays, d.value)} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${on ? 'bg-lime-400 text-slate-950' : 'bg-white/5 border border-white/10 text-slate-300 hover:border-lime-400/40'}`}>
                  {d.label}
                </button>);
              })}
              <button type="button" onClick={() => { setPreview(null); setWeekdays(weekdays.length === 7 ? [] : [0, 1, 2, 3, 4, 5, 6]); }} className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-slate-400 hover:text-white cursor-pointer">
                {weekdays.length === 7 ? 'Clear' : 'Every day'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">No weekday selected = every day in the range.</p>
          </div>

          {/* Slots */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono font-bold tracking-widest text-lime-400 uppercase">3 · Time slots</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {slotDefs.map(s => {
                const on = slotNumbers.includes(s.slotNumber);
                return (<button key={s.slotNumber} type="button" onClick={() => toggle(slotNumbers, setSlotNumbers, s.slotNumber)} className={`px-3 py-2 rounded-xl text-left transition-colors cursor-pointer border ${on ? 'bg-lime-400 text-slate-950 border-lime-400' : 'bg-white/5 border-white/10 text-slate-300 hover:border-lime-400/40'}`}>
                  <div className="text-xs font-bold font-mono">{s.displayTime}</div>
                  <div className={`text-[11px] ${on ? 'text-slate-900' : 'text-slate-500'}`}>৳{s.weekdayPrice} · wknd ৳{s.weekendPrice}</div>
                </button>);
              })}
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono font-bold tracking-widest text-lime-400 uppercase">4 · Date range</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 text-xs mb-1">From</label>
                <input type="date" value={startDate} min={todayStr} onChange={e => { setPreview(null); setStartDate(e.target.value); }} className={`${inputCls} font-mono`}/>
              </div>
              <div>
                <label className="block text-slate-300 text-xs mb-1">To (inclusive)</label>
                <input type="date" value={endDate} min={startDate} onChange={e => { setPreview(null); setEndDate(e.target.value); }} className={`${inputCls} font-mono`}/>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map(p => (<button key={p.label} type="button" onClick={() => { setPreview(null); setEndDate(addMonths(startDate, p.months)); }} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 border border-white/10 text-slate-300 hover:border-lime-400/40 cursor-pointer flex items-center gap-1">
                <CalendarRange className="w-3 h-3"/> {p.label}
              </button>))}
            </div>
          </div>

          {/* Payment */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono font-bold tracking-widest text-lime-400 uppercase">5 · Price & payment</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 text-xs mb-1">Price per slot</label>
                <select value={priceMode} onChange={e => { setPreview(null); setPriceMode(e.target.value); }} className={inputCls}>
                  <option value="auto">Use slot pricing (weekday / weekend)</option>
                  <option value="custom">Fixed package price per slot</option>
                </select>
                {priceMode === 'custom' && (<input type="number" min={0} value={customPrice} onChange={e => { setPreview(null); setCustomPrice(e.target.value); }} className={`${inputCls} font-mono mt-2`} placeholder="৳ per slot"/>)}
              </div>
              <div>
                <label className="block text-slate-300 text-xs mb-1">Already collected per slot</label>
                <select value={paidMode} onChange={e => setPaidMode(e.target.value)} className={inputCls}>
                  <option value="none">Nothing yet (pay at turf)</option>
                  <option value="advance">Advance ৳{pricing?.advanceAmount || 500} each</option>
                  <option value="full">Full price each</option>
                  <option value="custom">Custom amount each</option>
                </select>
                {paidMode === 'custom' && (<input type="number" min={0} value={customPaid} onChange={e => setCustomPaid(e.target.value)} className={`${inputCls} font-mono mt-2`} placeholder="৳ collected per slot"/>)}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 text-xs mb-1">Payment method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={inputCls}>
                  <option value="cash">Cash (counter)</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                  <option value="card">Card / POS</option>
                  <option value="pay_at_turf">Pay at turf</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-xs mb-1">Notes (optional)</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Yearly contract, paid monthly" className={inputCls}/>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={skipConflicts} onChange={e => setSkipConflicts(e.target.checked)} className="accent-lime-400 w-4 h-4"/>
              Skip already-booked slots and create the rest
            </label>
          </div>

          {error && (<div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0"/> <span>{error}</span>
          </div>)}

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button type="button" onClick={handlePreview} disabled={isChecking || isSubmitting} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
              {isChecking ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>} Check availability
            </button>
            <button type="button" onClick={handleCreate} disabled={isChecking || isSubmitting} className="flex-1 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-sm uppercase tracking-wider cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
              {preview ? `Create ${preview.summary?.bookable || 0} bookings` : 'Create bookings'}
            </button>
          </div>
        </div>

        {/* PREVIEW / RESULT */}
        <div className="xl:col-span-2 space-y-4">
          {result && (<div className="p-5 rounded-3xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm"><CheckCircle2 className="w-4 h-4"/> {result.message}</div>
            <div className="text-xs text-slate-300 font-mono">Series ID: <span className="text-white">{result.seriesId}</span></div>
            <div className="text-xs text-slate-400">{result.summary?.firstDate} → {result.summary?.lastDate} · {result.summary?.created} created · {result.summary?.conflicts} skipped · value ৳{(result.summary?.totalValue || 0).toLocaleString()}</div>
          </div>)}

          <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/10 space-y-3 min-h-[200px]">
            <div className="text-[11px] font-mono font-bold tracking-widest text-slate-400 uppercase">Preview</div>
            {!preview ? (<p className="text-xs text-slate-500">Fill the form and press <strong className="text-slate-300">Check availability</strong> to see every date that will be booked, the price of each, and any clashes.</p>) : (<>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 rounded-2xl bg-white/5"><div className="text-xl font-black text-white font-display">{preview.summary.bookable}</div><div className="text-[11px] text-slate-400">bookable slots</div></div>
                <div className="p-3 rounded-2xl bg-white/5"><div className="text-xl font-black text-amber-300 font-display">{preview.summary.conflicts}</div><div className="text-[11px] text-slate-400">already booked</div></div>
                <div className="p-3 rounded-2xl bg-white/5"><div className="text-xl font-black text-white font-display">{preview.summary.dates}</div><div className="text-[11px] text-slate-400">match days</div></div>
                <div className="p-3 rounded-2xl bg-white/5"><div className="text-xl font-black text-emerald-400 font-display">৳{(preview.summary.totalValue || 0).toLocaleString()}</div><div className="text-[11px] text-slate-400">total slot value</div></div>
              </div>
              {preview.conflicts?.length > 0 && (<div className="space-y-1">
                <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">Clashes {skipConflicts ? '(will be skipped)' : '(blocking)'}</div>
                <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                  {preview.conflicts.map(c => (<div key={`${c.date}-${c.slotNumber}`} className="text-[11px] font-mono text-slate-300 flex justify-between gap-2 p-1.5 rounded-lg bg-amber-400/5 border border-amber-400/10">
                    <span>{c.date} · {c.displayTime}</span><span className="text-amber-300 truncate">{c.bookedBy}</span>
                  </div>))}
                </div>
              </div>)}
              {preview.plan?.length > 0 && (<div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dates to book</div>
                <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-1">
                  {preview.plan.map(p => (<div key={`${p.date}-${p.slotNumber}`} className="text-[11px] font-mono text-slate-300 flex justify-between gap-2 p-1.5 rounded-lg bg-white/[0.03]">
                    <span>{p.date} <span className="text-slate-500">{p.dayName.slice(0, 3)}</span> · {p.displayTime}</span><span className="text-emerald-400">৳{p.price.toLocaleString()}</span>
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
          <h3 className="text-base font-black text-white font-display">Existing fixed-slot series</h3>
          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
            <input type="text" value={seriesSearch} onChange={e => setSeriesSearch(e.target.value)} placeholder="Search team, captain, phone..." className={`${inputCls} pl-9`}/>
          </div>
        </div>

        {seriesLoading ? (<div className="p-8 text-center text-xs text-slate-500">Loading…</div>) : filteredSeries.length === 0 ? (<div className="p-10 text-center rounded-2xl bg-[#0c131a] border border-white/10 text-slate-400 text-xs">No recurring series yet.</div>) : (<div className="space-y-2">
          {filteredSeries.map(s => {
            const finished = s.upcoming === 0;
            return (<div key={s.seriesId} className="p-4 rounded-2xl bg-[#0c131a] border border-white/5 hover:border-lime-400/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm">{s.teamName}</span>
                  <span className="text-xs text-slate-400">· {s.captainName} · <span className="font-mono">{s.captainPhone}</span></span>
                  <span className="text-[11px] font-mono text-slate-500">({s.seriesId})</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  <span>{s.firstDate} → {s.lastDate}</span>
                  <span>Slots {s.slots.join(', ')}</span>
                  <span className="text-white">{s.active} active</span>
                  <span className={finished ? 'text-slate-500' : 'text-emerald-400'}>{s.upcoming} upcoming</span>
                  <span className="text-emerald-400">৳{(s.collected || 0).toLocaleString()} of ৳{(s.totalValue || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {finished ? (<span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-white/5 text-slate-400 border border-white/10">Finished</span>) : (<button type="button" onClick={() => handleCancel(s, 'upcoming')} className="px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400 text-amber-300 hover:text-slate-950 text-xs font-bold border border-amber-400/20 transition-colors cursor-pointer">
                  Cancel upcoming
                </button>)}
                <button type="button" onClick={() => handleCancel(s, 'all')} className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer" title="Cancel entire series">
                  <XCircle className="w-4 h-4"/>
                </button>
              </div>
            </div>);
          })}
        </div>)}
      </div>
    </div>);
}
