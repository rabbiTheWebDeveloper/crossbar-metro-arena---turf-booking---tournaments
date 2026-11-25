'use client';
import React, { useState, useEffect } from 'react';
import { useArena } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { Clock, Save, CheckCircle2, ShieldCheck, Award } from 'lucide-react';
export const dynamic = 'force-dynamic';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const nonNeg = (v) => Math.max(0, Number(v) || 0);
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
/** "18:30" -> "06:30 PM" */
const to12 = (hhmm) => {
    const [h, m] = String(hhmm || '00:00').split(':').map(Number);
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
const displayRange = (start, end) => `${to12(start)} – ${to12(end)}`;

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
    /** Kick-off / final-whistle time of a slot; the label shown to customers follows automatically. */
    const handleUpdateTime = (slotNum, field, val) => {
        touch();
        setSlotPrices(prev => prev.map(item => {
            if (item.slotNumber !== slotNum) return item;
            const next = { ...item, [field]: val };
            if (HHMM_RE.test(next.startTime) && HHMM_RE.test(next.endTime)) next.displayTime = displayRange(next.startTime, next.endTime);
            return next;
        }));
    };
    const toggleWeekendDay = (day) => {
        touch();
        setWeekendDays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setError('');
        const priceFields = ['weekdayPrice', 'weekendPrice', 'weekdayActualPrice', 'weekendActualPrice'];
        const badSlot = slotPrices.find(s => priceFields.some(f => Number(s[f] || 0) < 0 || Number.isNaN(Number(s[f] || 0))));
        if (badSlot) { setError(`Slot ${badSlot.slotNumber}: prices must be numbers of ৳0 or more.`); return; }
        const badTime = slotPrices.find(s => !HHMM_RE.test(String(s.startTime || '')) || !HHMM_RE.test(String(s.endTime || '')));
        if (badTime) { setError(`Slot ${badTime.slotNumber}: enter a start and end time.`); return; }
        // An "actual" price below the offer price would show customers a price rise as a discount
        const upsideDown = slotPrices.find(s => (nonNeg(s.weekdayActualPrice) > 0 && nonNeg(s.weekdayActualPrice) < nonNeg(s.weekdayPrice)) || (nonNeg(s.weekendActualPrice) > 0 && nonNeg(s.weekendActualPrice) < nonNeg(s.weekendPrice)));
        if (upsideDown) { setError(`Slot ${upsideDown.slotNumber}: the actual price is lower than the offer price. Set it to 0 (no offer) or raise it.`); return; }
        if ([advanceAmount, holdMinutes, bookingWindowDays, cancellationHours].some(v => Number.isNaN(Number(v)) || Number(v) < 0)) { setError('Rules must be numbers of 0 or more.'); return; }
        if (holdMinutes < 1) { setError('Slot hold must be at least 1 minute.'); return; }
        if (bookingWindowDays < 1) { setError('Booking window must be at least 1 day.'); return; }
        setIsSubmitting(true);
        const res = await handleSavePricing({
            slotPrices: slotPrices.map(s => ({
                ...s,
                displayTime: displayRange(s.startTime, s.endTime),
                weekdayPrice: nonNeg(s.weekdayPrice),
                weekendPrice: nonNeg(s.weekendPrice),
                weekdayActualPrice: nonNeg(s.weekdayActualPrice),
                weekendActualPrice: nonNeg(s.weekendActualPrice)
            })),
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
    // Biggest saving on the list, shown to customers as "up to ৳X off"
    const maxDiscount = slotPrices.reduce((max, s) => Math.max(max, nonNeg(s.weekdayActualPrice) - nonNeg(s.weekdayPrice), nonNeg(s.weekendActualPrice) - nonNeg(s.weekendPrice)), 0);

    return (<div className="space-y-6 animate-fade-in font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white font-display">
Slot Pricing (Actual &amp; Offer) &amp; Turf Rules
          </h2>
          <p className="text-xs text-slate-400">
            Set the kick-off times and, for weekdays and weekends, the actual price and the offer price of all 12 slots. Customers pay the offer price.
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
              <span>12 Slot Schedule &amp; Price List (per 90 minutes)</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Weekday: {weekdayLabel} · Weekend: {weekendLabel}</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#080d12] border border-white/5 text-[12px] text-slate-400 leading-relaxed">
            <strong className="text-slate-200">Offer price</strong> is what the customer is charged. <strong className="text-slate-200">Actual price</strong> is the regular rate: when it is higher, the booking pages show it struck through next to the offer price. Set the actual price to 0 (or equal to the offer price) to end the offer for that slot.
            {maxDiscount > 0
                ? <span className="block mt-1 text-lime-300 font-semibold">Launch offer is live: customers see &quot;up to ৳{maxDiscount.toLocaleString()} off&quot;.</span>
                : <span className="block mt-1 text-slate-500">No offer is running: only one price is shown per slot.</span>}
            <span className="block mt-1 text-slate-500">Changing a time applies to new bookings; existing bookings keep the time they were made for.</span>
          </div>

          {/* MOBILE / TABLET APP CARDS FOR 12 SLOTS */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
            {slotPrices.map(slot => (
              <div key={slot.slotNumber} className="p-3.5 rounded-2xl bg-[#080d12] border border-white/10 space-y-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-lime-400/15 border border-lime-400/30 text-lime-300 font-mono font-bold text-[11px]">
                      Slot {slot.slotNumber}
                    </span>
                    <span className="text-[11px] uppercase text-slate-400 font-semibold">{slot.period}</span>
                  </div>
                  <span className="font-mono text-[11px] text-white font-bold">{slot.displayTime}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">Start</label>
                    <input type="time" step={900} value={slot.startTime} onChange={e => handleUpdateTime(slot.slotNumber, 'startTime', e.target.value)} aria-label={`Slot ${slot.slotNumber} start time`} className="w-full bg-[#0c131a] border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs [color-scheme:dark]"/>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">End</label>
                    <input type="time" step={900} value={slot.endTime === '24:00' ? '00:00' : slot.endTime} onChange={e => handleUpdateTime(slot.slotNumber, 'endTime', e.target.value)} aria-label={`Slot ${slot.slotNumber} end time`} className="w-full bg-[#0c131a] border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs [color-scheme:dark]"/>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] font-mono">
                  <div>
                    <label className="block text-[10px] font-sans text-slate-400 mb-1">Weekday Actual (৳)</label>
                    <input type="number" min={0} step={50} value={slot.weekdayActualPrice ?? 0} onChange={e => handleUpdatePrice(slot.slotNumber, 'weekdayActualPrice', Number(e.target.value))} className="w-full bg-[#0c131a] border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-300 text-xs"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-sans text-lime-300 font-bold mb-1">Weekday Offer (৳)</label>
                    <input type="number" min={0} step={50} value={slot.weekdayPrice} onChange={e => handleUpdatePrice(slot.slotNumber, 'weekdayPrice', Number(e.target.value))} className="w-full bg-[#0c131a] border border-lime-400/35 rounded-xl px-2.5 py-1.5 text-lime-400 font-bold text-xs"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-sans text-slate-400 mb-1">Weekend Actual (৳)</label>
                    <input type="number" min={0} step={50} value={slot.weekendActualPrice ?? 0} onChange={e => handleUpdatePrice(slot.slotNumber, 'weekendActualPrice', Number(e.target.value))} className="w-full bg-[#0c131a] border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-300 text-xs"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-sans text-lime-300 font-bold mb-1">Weekend Offer (৳)</label>
                    <input type="number" min={0} step={50} value={slot.weekendPrice} onChange={e => handleUpdatePrice(slot.slotNumber, 'weekendPrice', Number(e.target.value))} className="w-full bg-[#0c131a] border border-lime-400/35 rounded-xl px-2.5 py-1.5 text-lime-400 font-bold text-xs"/>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-500 uppercase border-b border-white/5">
                <tr>
                  <th className="py-2.5 px-3">Slot</th>
                  <th className="py-2.5 px-3">Start</th>
                  <th className="py-2.5 px-3">End</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Weekday Actual (৳)</th>
                  <th className="py-2.5 px-3 text-lime-300">Weekday Offer (৳)</th>
                  <th className="py-2.5 px-3">Weekend Actual (৳)</th>
                  <th className="py-2.5 px-3 text-lime-300">Weekend Offer (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {slotPrices.map(slot => (<tr key={slot.slotNumber} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-bold text-white font-sans">
                      Slot {slot.slotNumber}
                    </td>
                    <td className="py-2 px-3">
                      <input type="time" step={900} value={slot.startTime} onChange={e => handleUpdateTime(slot.slotNumber, 'startTime', e.target.value)} aria-label={`Slot ${slot.slotNumber} start time`} className="bg-[#080d12] border border-white/10 rounded-lg px-2 py-1 text-white font-mono text-xs [color-scheme:dark]"/>
                    </td>
                    <td className="py-2 px-3">
                      <input type="time" step={900} value={slot.endTime === '24:00' ? '00:00' : slot.endTime} onChange={e => handleUpdateTime(slot.slotNumber, 'endTime', e.target.value)} aria-label={`Slot ${slot.slotNumber} end time`} className="bg-[#080d12] border border-white/10 rounded-lg px-2 py-1 text-white font-mono text-xs [color-scheme:dark]"/>
                      <div className="text-[10px] text-slate-500 font-sans mt-0.5 whitespace-nowrap">{slot.displayTime}</div>
                    </td>
                    <td className="py-2 px-3 uppercase text-[11px] text-slate-400 font-sans">
                      {slot.period}
                    </td>
                    <td className="py-2 px-3">
                      <input type="number" min={0} step={50} value={slot.weekdayActualPrice ?? 0} onChange={e => handleUpdatePrice(slot.slotNumber, 'weekdayActualPrice', Number(e.target.value))} aria-label={`Slot ${slot.slotNumber} weekday actual price`} className="w-24 bg-[#080d12] border border-white/10 rounded-lg px-2.5 py-1 text-slate-300 font-mono text-xs"/>
                    </td>
                    <td className="py-2 px-3">
                      <input type="number" min={0} step={50} value={slot.weekdayPrice} onChange={e => handleUpdatePrice(slot.slotNumber, 'weekdayPrice', Number(e.target.value))} aria-label={`Slot ${slot.slotNumber} weekday offer price`} className="w-24 bg-[#080d12] border border-lime-400/30 rounded-lg px-2.5 py-1 text-lime-400 font-bold font-mono text-xs"/>
                    </td>
                    <td className="py-2 px-3">
                      <input type="number" min={0} step={50} value={slot.weekendActualPrice ?? 0} onChange={e => handleUpdatePrice(slot.slotNumber, 'weekendActualPrice', Number(e.target.value))} aria-label={`Slot ${slot.slotNumber} weekend actual price`} className="w-24 bg-[#080d12] border border-white/10 rounded-lg px-2.5 py-1 text-slate-300 font-mono text-xs"/>
                    </td>
                    <td className="py-2 px-3">
                      <input type="number" min={0} step={50} value={slot.weekendPrice} onChange={e => handleUpdatePrice(slot.slotNumber, 'weekendPrice', Number(e.target.value))} aria-label={`Slot ${slot.slotNumber} weekend offer price`} className="w-24 bg-[#080d12] border border-lime-400/30 rounded-lg px-2.5 py-1 text-lime-400 font-bold font-mono text-xs"/>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>

        {error && (<div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{error}</div>)}

        {/* Save button (sticky above mobile app dock when dirty) */}
        <div className={`flex items-center justify-between sm:justify-end gap-3 ${dirty ? 'sticky bottom-[4.75rem] md:bottom-3 z-20 p-3 rounded-2xl bg-[#0c131a]/95 border border-amber-400/30 backdrop-blur-md shadow-2xl' : ''}`}>
          {dirty && !isSubmitting ? <span className="text-[11px] text-amber-300 font-mono">Unsaved changes</span> : <span className="sm:hidden" />}
          <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto justify-center px-6 py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-lime-400/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
            <Save className="w-4 h-4"/>
            <span>{isSubmitting ? 'Saving…' : 'Save Price List & Rules'}</span>
          </button>
        </div>

      </form>)}

    </div>);
}
