'use client';
import { toIsoLocal, parseLocalDate } from '@/lib/dateUtils';
import React, { useState, useMemo, useEffect } from 'react';
import { useArena, todayDhaka } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { XCircle, CalendarDays } from 'lucide-react';
export const dynamic = 'force-dynamic';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PHONE_RE = /^01[3-9]\d{8}$/;

const PILL = {
    cyan: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30',
    emerald: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
    slate: 'bg-slate-800/60 text-slate-300 border-white/10'
};
const DOT = { cyan: 'bg-cyan-400', emerald: 'bg-emerald-400', amber: 'bg-amber-400', rose: 'bg-rose-400', slate: 'bg-slate-400' };
const Pill = ({ color, label, pulse }) => (<span className={`px-3 py-1 rounded-full text-[12px] font-mono font-bold border flex items-center gap-1.5 ${PILL[color]}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${DOT[color]} ${pulse ? 'animate-pulse' : ''}`}></span>
    <span>{label}</span>
  </span>);
const statusPill = (b) => {
    if (b.played) return <Pill color="cyan" label="Played" />;
    if (b.paymentStatus === 'paid_full') return <Pill color="emerald" label="Paid" />;
    if (b.paymentStatus === 'paid_advance') return <Pill color="emerald" label="Advance paid" pulse />;
    if (b.paymentStatus === 'confirmed_unpaid') return <Pill color="amber" label="Unpaid" />;
    if (b.paymentStatus === 'needs_refund') return <Pill color="rose" label="Needs refund" />;
    if (b.paymentStatus === 'pending_payment') return <Pill color="slate" label="Payment in progress (hold)" pulse />;
    return <Pill color="slate" label={String(b.paymentStatus || '').replaceAll('_', ' ')} />;
};

export default function AdminSchedulePage() {
    const { bookings, pricing, handleBookingSuccess, handleUpdateBookingStatus, handleMarkPlayed, handleCancelBooking, showNotice, currentUser, isLoadingData } = useArena();
    const todayStr = useMemo(() => todayDhaka(), []);
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [busyId, setBusyId] = useState(null);

    const slotList = pricing?.slotPrices?.length === 12 ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION;
    const weekendDays = pricing?.weekendDays?.length ? pricing.weekendDays : ['Friday', 'Saturday'];

    // 14-day strip around today (6 before, 7 after)
    const dateStrip = useMemo(() => {
        const dates = [];
        const base = parseLocalDate(todayStr);
        for (let i = -6; i <= 7; i++) {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            const iso = toIsoLocal(d);
            dates.push({
                iso,
                dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                dayNum: d.getDate(),
                isToday: iso === todayStr,
                bookedCount: bookings.filter(b => b.date === iso && b.paymentStatus !== 'cancelled').length
            });
        }
        return dates;
    }, [bookings, todayStr]);
    const selectedInStrip = dateStrip.some(d => d.iso === selectedDate);

    // Slots for the selected date
    const scheduleSlots = useMemo(() => {
        const isWeekend = weekendDays.includes(DAY_NAMES[parseLocalDate(selectedDate).getDay()]);
        return slotList.map(def => {
            const b = bookings.find(item => item.date === selectedDate && Number(item.slotNumber) === Number(def.slotNumber) && item.paymentStatus !== 'cancelled');
            const price = Number(isWeekend ? def.weekendPrice : def.weekdayPrice) || 0;
            return { ...def, booking: b, price };
        });
    }, [bookings, selectedDate, slotList, weekendDays]);

    // Collect balance modal
    const [collectingBooking, setCollectingBooking] = useState(null);
    const [collectAmount, setCollectAmount] = useState(0);
    const [collectError, setCollectError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Quick walk-in modal
    const [walkinSlotDef, setWalkinSlotDef] = useState(null);
    const [walkinTeam, setWalkinTeam] = useState('');
    const [walkinCaptain, setWalkinCaptain] = useState('');
    const [walkinPhone, setWalkinPhone] = useState('');
    const [walkinPriceOverride, setWalkinPriceOverride] = useState('');
    const [walkinPaid, setWalkinPaid] = useState(0);
    const [walkinMethod, setWalkinMethod] = useState('cash');
    const [walkinNotes, setWalkinNotes] = useState('');
    const [walkinError, setWalkinError] = useState('');
    const [walkinSubmitting, setWalkinSubmitting] = useState(false);

    // Keep the list price in sync with the slot/date the modal is open for
    const walkinListPrice = useMemo(() => {
        if (!walkinSlotDef) return 0;
        const def = slotList.find(s => Number(s.slotNumber) === Number(walkinSlotDef.slotNumber)) || walkinSlotDef;
        const isWeekend = weekendDays.includes(DAY_NAMES[parseLocalDate(selectedDate).getDay()]);
        return Number(isWeekend ? def.weekendPrice : def.weekdayPrice) || 0;
    }, [walkinSlotDef, selectedDate, slotList, weekendDays]);
    useEffect(() => { if (walkinSlotDef) { setWalkinPriceOverride(''); setWalkinPaid(walkinListPrice); } }, [walkinListPrice, walkinSlotDef]);
    const walkinEffectivePrice = walkinPriceOverride === '' ? walkinListPrice : Math.max(0, Number(walkinPriceOverride) || 0);
    const walkinDue = Math.max(0, walkinEffectivePrice - (Number(walkinPaid) || 0));

    const handleOpenWalkin = (slot) => {
        setWalkinSlotDef(slot);
        setWalkinTeam('');
        setWalkinCaptain('');
        setWalkinPhone('');
        setWalkinNotes('');
        setWalkinMethod('cash');
        setWalkinError('');
    };

    const handleCreateWalkinSubmit = async (e) => {
        e.preventDefault();
        if (!walkinSlotDef || walkinSubmitting) return;
        setWalkinError('');
        const phone = walkinPhone.replace(/[^0-9]/g, '').replace(/^8801/, '01');
        if (!walkinTeam.trim() || !walkinCaptain.trim()) { setWalkinError('Team name and captain name are required.'); return; }
        if (!PHONE_RE.test(phone)) { setWalkinError('Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).'); return; }
        const collected = Math.max(0, Number(walkinPaid) || 0);
        if (collected > walkinEffectivePrice) { setWalkinError('Collected amount cannot exceed the slot price.'); return; }
        const payload = {
            date: selectedDate,
            slotNumber: Number(walkinSlotDef.slotNumber),
            captainName: walkinCaptain.trim(),
            captainPhone: phone,
            teamName: walkinTeam.trim(),
            advanceAmount: collected,
            paymentMethod: collected > 0 ? walkinMethod : 'pay_at_turf',
            notes: walkinNotes.trim() || `Counter walk-in recorded from Schedule by ${currentUser?.name || 'admin desk'}`,
            isWalkIn: true
        };
        if (walkinPriceOverride !== '' && Number(walkinPriceOverride) !== walkinListPrice) payload.courtPrice = walkinEffectivePrice;
        setWalkinSubmitting(true);
        const res = await handleBookingSuccess(payload);
        setWalkinSubmitting(false);
        if (res?.ok) setWalkinSlotDef(null);
        else setWalkinError(res?.error || 'Could not create the booking. The slot may already be taken.');
    };

    const openCollect = (b) => { setCollectingBooking(b); setCollectAmount(Number(b.dueAmount) || 0); setCollectError(''); };
    const submitCollect = async () => {
        if (!collectingBooking || isSubmitting) return;
        const amount = Number(collectAmount) || 0;
        const due = Number(collectingBooking.dueAmount) || 0;
        if (amount <= 0) { setCollectError('Enter an amount greater than zero.'); return; }
        if (amount > due) { setCollectError(`Cannot collect more than the due ৳${due.toLocaleString()}.`); return; }
        setIsSubmitting(true);
        const res = await handleUpdateBookingStatus(collectingBooking.id, undefined, amount);
        setIsSubmitting(false);
        if (res?.ok) { showNotice('success', `৳${amount.toLocaleString()} collected for ${collectingBooking.bookingCode}`); setCollectingBooking(null); }
        else setCollectError(res?.error || 'Could not record the payment.');
    };
    const settleInFull = async (b) => {
        if (busyId) return;
        if (!confirm(`Settle ${b.bookingCode} in full (collect the remaining ৳${(Number(b.dueAmount) || 0).toLocaleString()})?`)) return;
        setBusyId(b.id);
        const res = await handleUpdateBookingStatus(b.id, 'paid_full');
        setBusyId(null);
        if (res?.ok) showNotice('success', `${b.bookingCode} settled in full`);
    };
    const markPlayed = async (b) => {
        if (busyId) return;
        setBusyId(b.id);
        const res = await handleMarkPlayed(b.id, true);
        setBusyId(null);
        if (res?.ok) showNotice('success', `${b.bookingCode} marked as played`);
    };
    const cancelBooking = async (b) => {
        if (busyId) return;
        if (!confirm(`Cancel booking ${b.bookingCode} for ${b.captainName}?${Number(b.advanceAmount) > 0 ? ` ৳${Number(b.advanceAmount).toLocaleString()} will go to the refund queue.` : ''}`)) return;
        setBusyId(b.id);
        await handleCancelBooking(b.id);
        setBusyId(null);
    };

    return (<div className="space-y-6 animate-fade-in font-sans">

      {/* DATE STRIP + DATE PICKER */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none flex-1">
          {dateStrip.map(item => {
              const isSelected = selectedDate === item.iso;
              return (<button key={item.iso} type="button" onClick={() => setSelectedDate(item.iso)} className={`flex-1 min-w-[62px] sm:min-w-[70px] py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer ${isSelected
                      ? 'bg-lime-400 text-slate-950 font-black shadow-lg shadow-lime-400/20'
                      : 'bg-[#0c131a] border border-white/5 text-slate-300 hover:border-lime-400/30'}`}>
                <span className={`text-[11px] font-mono font-bold tracking-wider uppercase ${isSelected ? 'text-slate-950' : 'text-slate-400'}`}>
                  {item.isToday ? 'TODAY' : item.dayName}
                </span>
                <span className="text-base sm:text-lg font-black font-display my-0.5">
                  {item.dayNum}
                </span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                  {item.bookedCount} booked
                </span>
              </button>);
          })}
        </div>
        <div className="flex items-center gap-2 shrink-0 pb-2 lg:pb-0">
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0c131a] border border-white/10 text-xs text-slate-300">
            <CalendarDays className="w-4 h-4 text-lime-400"/>
            <input type="date" value={selectedDate} onChange={e => { if (e.target.value) setSelectedDate(e.target.value); }} className="bg-transparent text-white font-mono text-xs outline-none"/>
          </label>
          {!selectedInStrip && (<button type="button" onClick={() => setSelectedDate(todayStr)} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 font-bold cursor-pointer">
              Back to today
            </button>)}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span>Tap a free slot for a walk-in booking. On a booking, collect money, mark it played or cancel it.</span>
        <span className="font-mono text-slate-500">
          {parseLocalDate(selectedDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {weekendDays.includes(DAY_NAMES[parseLocalDate(selectedDate).getDay()]) && <span className="ml-1.5 text-lime-400">· weekend rate</span>}
        </span>
      </div>

      {/* 12 SLOTS SCHEDULE LIST */}
      <div className="space-y-2">
        {isLoadingData && bookings.length === 0 ? (Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-[#0c131a] border border-white/5 animate-pulse"/>))
        : scheduleSlots.map(slot => {
            const b = slot.booking;
            const isBooked = !!b;
            const isHold = b?.paymentStatus === 'pending_payment';
            const due = Number(b?.dueAmount) || 0;
            const isBusy = b && busyId === b.id;
            const cardClass = !isBooked
                ? 'bg-[#0c131a]/70 border-white/5 hover:border-lime-400/30'
                : b.played
                    ? 'bg-[#0a1118] border-cyan-500/20'
                    : isHold
                        ? 'bg-[#0c131a] border-white/10 border-dashed'
                        : b.paymentStatus === 'confirmed_unpaid'
                            ? 'bg-[#141108] border-amber-500/30'
                            : 'bg-[#0c1613] border-emerald-500/30';
            return (<div key={slot.slotNumber} className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${cardClass}`}>
              <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                <div className="w-16 sm:w-20 font-mono font-bold text-xs sm:text-sm text-white shrink-0">
                  {slot.startTime} {Number(slot.startTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                </div>

                <div className="min-w-0">
                  {!isBooked ? (<div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-300">
                        Not booked
                      </div>
                      <div className="text-[12px] font-mono text-slate-500">
                        ৳{slot.price.toLocaleString()}
                      </div>
                    </div>) : (<div>
                      <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-2">
                        <span>{b.captainName || 'Booked'}</span>
                        {b.teamName && (<span className="text-xs text-slate-400 font-normal truncate hidden sm:inline">
                            · {b.teamName}
                          </span>)}
                        {b.isRecurring && (<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">FIXED</span>)}
                      </div>
                      <div className="text-[12px] font-mono text-slate-400 mt-0.5">
                        <span className="text-slate-500">{b.bookingCode}</span> · ৳{(Number(b.advanceAmount) || 0).toLocaleString()} of ৳{(Number(b.totalPrice) || 0).toLocaleString()}
                        {due > 0 && !isHold ? (<span className="text-amber-400 font-bold ml-1.5">(Due ৳{due.toLocaleString()})</span>) : null}
                      </div>
                    </div>)}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isBooked ? (<button type="button" onClick={() => handleOpenWalkin(slot)} className="px-3 py-1.5 rounded-xl bg-lime-400/10 hover:bg-lime-400 text-lime-400 hover:text-slate-950 font-bold text-xs transition-colors cursor-pointer border border-lime-400/20">
                    + Book Walk-in
                  </button>) : (<div className="flex items-center gap-2">
                    {statusPill(b)}

                    {!isHold && due > 0 && (<button type="button" disabled={isBusy} onClick={() => openCollect(b)} className="px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400 text-amber-300 hover:text-slate-950 text-xs font-bold transition-colors cursor-pointer border border-amber-400/30 disabled:opacity-50" title="Record a partial or full payment">
                        Collect
                      </button>)}
                    {!isHold && due > 0 && (<button type="button" disabled={isBusy} onClick={() => settleInFull(b)} className="hidden md:inline-flex px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50" title="Collect the entire remaining due">
                        Settle in full
                      </button>)}
                    {!isHold && !b.played && (<button type="button" disabled={isBusy} onClick={() => markPlayed(b)} className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50" title="Mark match as played (payment unchanged)">
                        Mark Played
                      </button>)}

                    <button type="button" disabled={isBusy} onClick={() => cancelBooking(b)} className="p-1 text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-50" title="Cancel booking">
                      <XCircle className="w-4 h-4"/>
                    </button>
                  </div>)}
              </div>

            </div>);
        })}
      </div>

      {/* COLLECT BALANCE MODAL */}
      {collectingBooking && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white">Collect Due Balance</h3>
            <p className="text-xs text-slate-400">
              Team: <strong className="text-white">{collectingBooking.teamName}</strong> ({collectingBooking.captainName}) · {collectingBooking.bookingCode}
            </p>
            <p className="text-xs font-mono text-slate-300">
              Paid ৳{(Number(collectingBooking.advanceAmount) || 0).toLocaleString()} · Due <span className="text-amber-300 font-bold">৳{(Number(collectingBooking.dueAmount) || 0).toLocaleString()}</span>
            </p>
            <div>
              <label className="text-xs text-slate-300 block mb-1">Amount to Collect (৳)</label>
              <input type="number" min={1} max={Number(collectingBooking.dueAmount) || 0} value={collectAmount} onChange={e => { setCollectAmount(Number(e.target.value)); setCollectError(''); }} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm"/>
            </div>
            {collectError && (<div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">{collectError}</div>)}
            <div className="flex gap-2">
              <button type="button" disabled={isSubmitting} onClick={() => setCollectingBooking(null)} className="flex-1 py-2 bg-white/5 text-slate-300 font-bold rounded-xl text-xs disabled:opacity-50">
                Cancel
              </button>
              <button type="button" disabled={isSubmitting} onClick={submitCollect} className="flex-1 py-2 bg-lime-400 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-60">
                {isSubmitting ? 'Saving…' : 'Record payment'}
              </button>
            </div>
          </div>
        </div>)}

      {/* QUICK WALK-IN FROM SLOT MODAL */}
      {walkinSlotDef && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-lime-400/30 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white font-display">Book Walk-in Slot</h3>
                <p className="text-xs text-lime-400 font-mono">
                  {walkinSlotDef.displayTime} · {selectedDate} · list ৳{walkinListPrice.toLocaleString()}
                </p>
              </div>
              <button type="button" onClick={() => setWalkinSlotDef(null)} className="text-slate-400 hover:text-white" aria-label="Close">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWalkinSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Team Name *</label>
                <input type="text" required placeholder="e.g. Uttara Metro FC" value={walkinTeam} onChange={e => setWalkinTeam(e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"/>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Captain Name *</label>
                  <input type="text" required placeholder="Captain Name" value={walkinCaptain} onChange={e => setWalkinCaptain(e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"/>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Mobile Phone *</label>
                  <input type="tel" required placeholder="01711223344" value={walkinPhone} onChange={e => setWalkinPhone(e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Slot Price (৳)</label>
                  <input type="number" min={0} value={walkinPriceOverride === '' ? walkinListPrice : walkinPriceOverride} onChange={e => setWalkinPriceOverride(e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
                  <span className="text-[10px] text-slate-500">Change only for a counter deal</span>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Collected at Counter (৳)</label>
                  <input type="number" min={0} max={walkinEffectivePrice} value={walkinPaid} onChange={e => setWalkinPaid(Number(e.target.value))} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
                  <span className="text-[10px] text-slate-500">{walkinDue > 0 ? `Due at arena: ৳${walkinDue.toLocaleString()}` : 'Paid in full'}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Payment Method</label>
                <select value={walkinMethod} onChange={e => setWalkinMethod(e.target.value)} disabled={Number(walkinPaid) <= 0} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white disabled:opacity-50">
                  <option value="cash">Cash (Counter)</option>
                  <option value="bkash">bKash Merchant</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                  <option value="card">POS Card</option>
                </select>
                {Number(walkinPaid) <= 0 && (<span className="text-[10px] text-amber-300">Nothing collected: the booking will be saved as unpaid (pay at arena).</span>)}
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Notes (optional)</label>
                <input type="text" value={walkinNotes} onChange={e => setWalkinNotes(e.target.value)} placeholder="e.g. Regular Friday squad" className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"/>
              </div>

              {walkinError && (<div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">{walkinError}</div>)}

              <div className="flex gap-2 pt-2">
                <button type="button" disabled={walkinSubmitting} onClick={() => setWalkinSlotDef(null)} className="flex-1 py-2 rounded-xl bg-white/5 text-slate-300 font-bold disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={walkinSubmitting} className="flex-1 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black uppercase disabled:opacity-60">
                  {walkinSubmitting ? 'Saving…' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>)}

    </div>);
}
