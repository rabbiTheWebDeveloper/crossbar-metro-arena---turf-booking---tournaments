'use client';
import React, { useState, useEffect } from 'react';
import { useArena } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { Clock, Save, CheckCircle2, ShieldCheck, Award } from 'lucide-react';
export const dynamic = 'force-dynamic';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const nonNeg = (v) => Math.max(0, Number(v) || 0);

export default function AdminSlotPricingPage() {
    const { pricing, handleSavePricing, isLoadingData } = useArena();
    const [slotPrices, setSlotPrices] = useState(SCHEDULE_SLOTS_DEFINITION);
    const [advanceAmount, setAdvanceAmount] = useState(500);
    const [holdMinutes, setHoldMinutes] = useState(10);
    const [bookingWindowDays, setBookingWindowDays] = useState(60);
    const [cancellationHours, setCancellationHours] = useState(24);
    const [weekendDays, setWeekendDays] = useState(['Friday', 'Saturday']);
    const [approveResultsFirst, setApproveResultsFirst] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Sync the form from the server-loaded pricing (not just once on mount)
    useEffect(() => {
        if (!pricing) return;
        setSlotPrices(Array.isArray(pricing.slotPrices) && pricing.slotPrices.length === 12 ? pricing.slotPrices.map(s => ({ ...s })) : SCHEDULE_SLOTS_DEFINITION);
        setAdvanceAmount(nonNeg(pricing.advanceAmount ?? 500));
        setHoldMinutes(nonNeg(pricing.holdMinutes ?? 10));
        setBookingWindowDays(nonNeg(pricing.bookingWindowDays ?? 60));
        setCancellationHours(nonNeg(pricing.cancellationHours ?? 24));
        setWeekendDays(Array.isArray(pricing.weekendDays) && pricing.weekendDays.length ? pricing.weekendDays : ['Friday', 'Saturday']);
        setApproveResultsFirst(!!pricing.approveResultsFirst);
        setDirty(false);
    }, [pricing]);

    const touch = () => { setDirty(true); setSavedSuccess(false); setError(''); };

    const handleUpdatePrice = (slotNum, field, val) => {
        touch();
        setSlotPrices(prev => prev.map(item => (item.slotNumber === slotNum ? { ...item, [field]: val } : item)));
    };
    const toggleWeekendDay = (day) => {
        touch();
        setWeekendDays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setError('');
        const badSlot = slotPrices.find(s => Number(s.weekdayPrice) < 0 || Number(s.weekendPrice) < 0 || Number.isNaN(Number(s.weekdayPrice)) || Number.isNaN(Number(s.weekendPrice)));
        if (badSlot) { setError(`Slot ${badSlot.slotNumber}: prices must be numbers of ৳0 or more.`); return; }
        if ([advanceAmount, holdMinutes, bookingWindowDays, cancellationHours].some(v => Number.isNaN(Number(v)) || Number(v) < 0)) { setError('Rules must be numbers of 0 or more.'); return; }
        if (holdMinutes < 1) { setError('Slot hold must be at least 1 minute.'); return; }
        if (bookingWindowDays < 1) { setError('Booking window must be at least 1 day.'); return; }
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
            setTimeout(() => setSavedSuccess(false), 3000);
        } else {
            setError(res?.error || 'Could not save pricing.');
        }
    };

    const weekdayLabel = DAY_NAMES.filter(d => !weekendDays.includes(d)).map(d => d.slice(0, 3)).join(', ') || 'none';
    const weekendLabel = weekendDays.map(d => d.slice(0, 3)).join(', ') || 'none';

    return (<div className="space-y-6 animate-fade-in font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white font-display">
            24 Slot Pricing Matrix &amp; Turf Rules
          </h2>
          <p className="text-xs text-slate-400">
            Customize morning, prime evening, and weekend rates for all 12 operational slots.
          </p>
        </div>

        {savedSuccess && (<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-300 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-lime-400"/>
            <span>Saved</span>
          </div>)}
      </div>

      {isLoadingData ? (<div className="space-y-4 animate-pulse">
          <div className="h-32 rounded-3xl bg-[#0c131a] border border-white/5"/>
          <div className="h-96 rounded-3xl bg-[#0c131a] border border-white/5"/>
        </div>) : (
      <form onSubmit={handleSave} className="space-y-6">

        {/* Arena Rules & Policy Settings */}
        <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-lime-400"/>
            <span>Booking Rules &amp; Hold Timeouts</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Advance Booking Deposit (৳)</label>
              <input type="number" min={0} value={advanceAmount} onChange={e => { touch(); setAdvanceAmount(Number(e.target.value)); }} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
              <span className="text-[11px] text-slate-500">Online advance payment</span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Slot Hold Lock (Minutes)</label>
              <input type="number" min={1} value={holdMinutes} onChange={e => { touch(); setHoldMinutes(Number(e.target.value)); }} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
              <span className="text-[11px] text-slate-500">Gateway holds expire after this</span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Booking Window (Days)</label>
              <input type="number" min={1} value={bookingWindowDays} onChange={e => { touch(); setBookingWindowDays(Number(e.target.value)); }} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
              <span className="text-[11px] text-slate-500">How far ahead players can book</span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Cancellation Cutoff (Hours)</label>
              <input type="number" min={0} value={cancellationHours} onChange={e => { touch(); setCancellationHours(Number(e.target.value)); }} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
              <span className="text-[11px] text-slate-500">Online cancellation closes this many hours before kick-off</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-2xl bg-[#080d12] border border-white/5">
              <div className="font-semibold text-slate-300 mb-2">Weekend days (weekend price applies)</div>
              <div className="flex flex-wrap gap-2">
                {DAY_NAMES.map(day => {
                    const on = weekendDays.includes(day);
                    return (<label key={day} className={`px-2.5 py-1.5 rounded-lg border cursor-pointer select-none font-mono text-[11px] transition-colors ${on ? 'bg-lime-400/15 border-lime-400/40 text-lime-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}>
                        <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleWeekendDay(day)}/>
                        {day.slice(0, 3)}
                      </label>);
                })}
              </div>
              <div className="text-[11px] text-slate-500 mt-2">Weekday: {weekdayLabel} · Weekend: {weekendLabel}</div>
            </div>

            <label className="p-3 rounded-2xl bg-[#080d12] border border-white/5 flex items-start justify-between gap-3 cursor-pointer">
              <div>
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-lime-400"/>
                  <span>Approve match results before publishing</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  When on, captain-submitted scorelines wait in &quot;Match results&quot; for your approval before they update the league table. When off, they publish immediately.
                </div>
              </div>
              <input type="checkbox" checked={approveResultsFirst} onChange={e => { touch(); setApproveResultsFirst(e.target.checked); }} className="w-4 h-4 mt-0.5 accent-lime-400 cursor-pointer shrink-0"/>
            </label>
          </div>
        </div>

        {/* 24-Slot Pricing Table */}
        <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-lime-400"/>
              <span>12 Slot Schedule Matrix (All 24 Rates)</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Weekday: {weekdayLabel} · Weekend: {weekendLabel}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-500 uppercase border-b border-white/5">
                <tr>
                  <th className="py-2.5 px-3">Slot</th>
                  <th className="py-2.5 px-3">Time Window</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Weekday Price (৳)</th>
                  <th className="py-2.5 px-3">Weekend Price (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {slotPrices.map(slot => (<tr key={slot.slotNumber} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-bold text-white font-sans">
                      Slot {slot.slotNumber}
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      {slot.displayTime}
                    </td>
                    <td className="py-2 px-3 uppercase text-[11px] text-slate-400 font-sans">
                      {slot.period}
                    </td>
                    <td className="py-2 px-3">
                      <input type="number" min={0} value={slot.weekdayPrice} onChange={e => handleUpdatePrice(slot.slotNumber, 'weekdayPrice', Number(e.target.value))} className="w-28 bg-[#080d12] border border-white/10 rounded-lg px-2.5 py-1 text-white font-mono text-xs"/>
                    </td>
                    <td className="py-2 px-3">
                      <input type="number" min={0} value={slot.weekendPrice} onChange={e => handleUpdatePrice(slot.slotNumber, 'weekendPrice', Number(e.target.value))} className="w-28 bg-[#080d12] border border-white/10 rounded-lg px-2.5 py-1 text-lime-400 font-bold font-mono text-xs"/>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>

        {error && (<div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{error}</div>)}

        {/* Save button */}
        <div className="flex items-center justify-end gap-3">
          {dirty && !isSubmitting && <span className="text-[11px] text-amber-300 font-mono">Unsaved changes</span>}
          <button type="submit" disabled={isSubmitting} className="px-6 py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-lime-400/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
            <Save className="w-4 h-4"/>
            <span>{isSubmitting ? 'Saving…' : 'Save 24-Slot Matrix & Rules'}</span>
          </button>
        </div>

      </form>)}

    </div>);
}
