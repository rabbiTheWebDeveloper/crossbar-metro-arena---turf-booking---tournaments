'use client';
import React, { useState, useEffect } from 'react';
import { useArena } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import RecordAuditMeta from '@/components/admin/RecordAuditMeta';
import { Clock, Save, CheckCircle2, ShieldCheck, Award, Plus, Pencil, Trash2, Sparkles, Eye, EyeOff, X, RotateCcw, Loader2 } from 'lucide-react';
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
    const {
        pricing,
        bookingAddOns = [],
        handleSavePricing,
        handleCreateBookingAddOn,
        handleUpdateBookingAddOn,
        handleDeleteBookingAddOn,
        handleRestoreDefaultBookingAddOns,
        isLoadingData,
        isAdmin
    } = useArena();
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

    // Optional Turf Equipment Add-Ons modal & delete confirmation state
    const [addonModal, setAddonModal] = useState(null); // { mode: 'create'|'edit', id, name, price, description, enabled }
    const [addonFormError, setAddonFormError] = useState('');
    const [addonBusy, setAddonBusy] = useState(false);
    const [deleteAddonTarget, setDeleteAddonTarget] = useState(null);
    const [deleteAddonError, setDeleteAddonError] = useState('');

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

    // ---- Optional Turf Equipment Add-Ons CRUD (dedicated BookingAddOn model via /api/booking-addons) ----
    const openCreateAddon = () => {
        setAddonFormError('');
        setAddonModal({ mode: 'create', id: '', name: '', price: 200, description: '', enabled: true });
    };

    const openEditAddon = (addon) => {
        setAddonFormError('');
        setAddonModal({
            mode: 'edit',
            id: addon.id,
            name: addon.name || '',
            price: Number(addon.price) || 0,
            description: addon.description || '',
            enabled: addon.enabled !== false
        });
    };

    const handleAddonModalSubmit = async (e) => {
        e.preventDefault();
        if (!addonModal || addonBusy) return;
        setAddonFormError('');
        const name = String(addonModal.name || '').trim().replace(/\s+/g, ' ');
        const description = String(addonModal.description || '').trim().replace(/\s+/g, ' ');
        const price = Number(addonModal.price);

        if (name.length < 2) { setAddonFormError('Enter an add-on title (at least 2 characters).'); return; }
        if (!Number.isFinite(price) || price < 0 || price > 100000) { setAddonFormError('Price must be between ৳0 and ৳100,000.'); return; }

        const payload = { name, description, price: Math.round(price), enabled: Boolean(addonModal.enabled) };

        setAddonBusy(true);
        const res = addonModal.mode === 'edit' && addonModal.id
            ? await handleUpdateBookingAddOn(addonModal.id, payload)
            : await handleCreateBookingAddOn(payload);
        setAddonBusy(false);
        if (!res?.ok) {
            setAddonFormError(res?.error || 'Could not save equipment add-on.');
            return;
        }
        setAddonModal(null);
    };

    const handleToggleAddonEnabled = async (addon) => {
        if (addonBusy) return;
        setAddonBusy(true);
        await handleUpdateBookingAddOn(addon.id, { enabled: addon.enabled === false });
        setAddonBusy(false);
    };

    const handleRestoreDefaultAddOns = async () => {
        if (addonBusy) return;
        setAddonBusy(true);
        await handleRestoreDefaultBookingAddOns();
        setAddonBusy(false);
    };

    const handleConfirmDeleteAddon = async () => {
        if (!deleteAddonTarget || addonBusy) return;
        setDeleteAddonError('');
        setAddonBusy(true);
        const res = await handleDeleteBookingAddOn(deleteAddonTarget.id);
        setAddonBusy(false);
        if (!res?.ok) {
            setDeleteAddonError(res?.error || 'Could not delete equipment add-on.');
            return;
        }
        setDeleteAddonTarget(null);
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
            Slot Pricing, Rules &amp; Turf Equipment Add-Ons
          </h2>
          <p className="text-xs text-slate-400">
            Configure the 12 daily slot rates, booking hold rules, and Optional Turf Equipment Add-Ons shown on the public website checkout.
          </p>
          {pricing && <RecordAuditMeta record={pricing} compact className="mt-1.5" fallbackCreatedBy="Admin" />}
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

        {/* OPTIONAL TURF EQUIPMENT ADD-ONS MANAGER */}
        <div id="addons" className="p-5 rounded-3xl bg-[#0c131a] border border-emerald-500/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-lime-400"/>
                <span>Optional Turf Equipment Add-Ons</span>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {bookingAddOns.filter(a => a.enabled !== false).length} live on website
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Customers see and select these optional extras during online slot booking (e.g. Certified Referee, Team Bibs, Match Ball, Water Pack). Changes go live immediately.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {bookingAddOns.length === 0 && (
                <button
                  type="button"
                  disabled={addonBusy}
                  onClick={handleRestoreDefaultAddOns}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-400"/>
                  <span>Restore Defaults</span>
                </button>
              )}
              <button
                type="button"
                disabled={addonBusy || bookingAddOns.length >= 30}
                onClick={openCreateAddon}
                className="px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 shadow-md shadow-lime-400/15 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4 stroke-[3]"/>
                <span>Add Add-On</span>
              </button>
            </div>
          </div>

          {bookingAddOns.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#080d12] border border-white/10 text-center space-y-2 text-xs text-slate-400">
              <p className="font-bold text-white">No turf equipment add-ons configured</p>
              <p>The &quot;Optional Turf Equipment Add-Ons&quot; step is currently hidden on public booking checkout. Click &quot;Add Add-On&quot; or &quot;Restore Defaults&quot; to publish items.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bookingAddOns.map(addon => {
                const active = addon.enabled !== false;
                return (
                  <div
                    key={addon.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      active
                        ? 'bg-[#080d12] border-white/10 hover:border-emerald-400/35'
                        : 'bg-[#080d12]/60 border-white/5 opacity-65'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{addon.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                            active
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-white/5 text-slate-400 border-white/10'
                          }`}>
                            {active ? 'Live' : 'Hidden'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {addon.description || 'Optional match-day turf add-on'}
                        </p>
                        <RecordAuditMeta record={addon} compact className="mt-1.5" fallbackCreatedBy="Admin" />
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-mono font-black text-lime-400">
                          +৳{Number(addon.price || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-end gap-1.5 text-xs">
                      <button
                        type="button"
                        disabled={addonBusy}
                        onClick={() => handleToggleAddonEnabled(addon)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-slate-300 hover:text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title={active ? 'Hide from public booking form' : 'Show on public booking form'}
                      >
                        {active ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5 text-emerald-400"/>}
                        <span>{active ? 'Hide' : 'Show'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={addonBusy}
                        onClick={() => openEditAddon(addon)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Pencil className="w-3.5 h-3.5 text-lime-400"/>
                        <span>Edit</span>
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          disabled={addonBusy}
                          onClick={() => { setDeleteAddonError(''); setDeleteAddonTarget(addon); }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Delete add-on (Super Admin only)"
                        >
                          <Trash2 className="w-3.5 h-3.5"/>
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Save button (sticky above mobile app dock when dirty) */}
        <div className={`flex items-center justify-between sm:justify-end gap-3 ${dirty ? 'sticky bottom-[4.75rem] md:bottom-3 z-20 p-3 rounded-2xl bg-[#0c131a]/95 border border-amber-400/30 backdrop-blur-md shadow-2xl' : ''}`}>
          {dirty && !isSubmitting ? <span className="text-[11px] text-amber-300 font-mono">Unsaved changes</span> : <span className="sm:hidden" />}
          <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto justify-center px-6 py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-lime-400/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
            <Save className="w-4 h-4"/>
            <span>{isSubmitting ? 'Saving…' : 'Save Price List & Rules'}</span>
          </button>
        </div>

      </form>)}

      {/* ADD / EDIT EQUIPMENT ADD-ON MODAL */}
      {addonModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="addon-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget && !addonBusy) setAddonModal(null); }}
        >
          <div className="bg-[#0c131a] border-t sm:border border-lime-400/30 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6 max-w-md w-full space-y-4 shadow-2xl text-xs">
            <div className="sm:hidden w-10 h-1 rounded-full bg-white/15 mx-auto -mt-1 mb-1"/>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 id="addon-modal-title" className="text-base font-bold text-white font-display">
                {addonModal.mode === 'edit' ? 'Edit Turf Equipment Add-On' : 'Add Turf Equipment Add-On'}
              </h3>
              <button
                type="button"
                disabled={addonBusy}
                onClick={() => setAddonModal(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>

            <form onSubmit={handleAddonModalSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="addon-name" className="block text-slate-300 font-semibold mb-1">
                  Add-On Name <span className="text-lime-400">*</span>
                </label>
                <input
                  id="addon-name"
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g. Certified Match Referee"
                  value={addonModal.name}
                  onChange={e => setAddonModal(m => ({ ...m, name: e.target.value }))}
                  className="w-full bg-[#080d12] border border-white/10 focus:border-lime-400/60 rounded-xl px-3 py-2.5 text-white outline-none"
                />
              </div>

              <div>
                <label htmlFor="addon-price" className="block text-slate-300 font-semibold mb-1">
                  Extra Charge (৳) <span className="text-lime-400">*</span>
                </label>
                <input
                  id="addon-price"
                  type="number"
                  required
                  min={0}
                  max={100000}
                  step={10}
                  value={addonModal.price}
                  onChange={e => setAddonModal(m => ({ ...m, price: e.target.value }))}
                  className="w-full bg-[#080d12] border border-white/10 focus:border-lime-400/60 rounded-xl px-3 py-2.5 text-white font-mono outline-none"
                />
              </div>

              <div>
                <label htmlFor="addon-desc" className="block text-slate-300 font-semibold mb-1">
                  Subtitle / Description
                </label>
                <input
                  id="addon-desc"
                  type="text"
                  maxLength={200}
                  placeholder="e.g. Official referee for 90 minutes match"
                  value={addonModal.description}
                  onChange={e => setAddonModal(m => ({ ...m, description: e.target.value }))}
                  className="w-full bg-[#080d12] border border-white/10 focus:border-lime-400/60 rounded-xl px-3 py-2.5 text-white outline-none"
                />
              </div>

              <label className="p-3 rounded-xl bg-[#080d12] border border-white/10 flex items-center justify-between gap-3 cursor-pointer select-none">
                <div>
                  <div className="font-semibold text-white">Show on public website</div>
                  <div className="text-[11px] text-slate-400">Customers can select this add-on during online booking</div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(addonModal.enabled)}
                  onChange={e => setAddonModal(m => ({ ...m, enabled: e.target.checked }))}
                  className="w-4 h-4 accent-lime-400 cursor-pointer shrink-0"
                />
              </label>

              {addonFormError && (
                <p role="alert" className="text-rose-400 text-xs">{addonFormError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={addonBusy}
                  onClick={() => setAddonModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addonBusy}
                  className="flex-1 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black uppercase tracking-wider inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {addonBusy && <Loader2 className="w-3.5 h-3.5 animate-spin"/>}
                  <span>{addonBusy ? 'Saving…' : addonModal.mode === 'edit' ? 'Update Add-On' : 'Add Add-On'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleteAddonTarget)}
        badge="Delete Turf Add-On · Super Admin"
        title="Are you sure you want to delete this turf equipment add-on?"
        itemName={deleteAddonTarget ? `${deleteAddonTarget.name} (+৳${Number(deleteAddonTarget.price || 0).toLocaleString()})` : ''}
        description="This permanently removes the add-on from the public booking checkout. Existing bookings that already included it are unaffected."
        loading={addonBusy}
        error={deleteAddonError}
        onCancel={() => { if (!addonBusy) setDeleteAddonTarget(null); }}
        onConfirm={handleConfirmDeleteAddon}
      />

    </div>);
}
