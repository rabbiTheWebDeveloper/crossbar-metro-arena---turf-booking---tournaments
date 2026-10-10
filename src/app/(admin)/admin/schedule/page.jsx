'use client';
import React, { useState, useMemo } from 'react';
import { useArena } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { XCircle } from 'lucide-react';
export const dynamic = 'force-dynamic';
export default function AdminSchedulePage() {
    const { bookings, pricing, handleBookingSuccess, handleUpdateBookingStatus, handleCancelBooking } = useArena();
    const todayStr = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);
    const [selectedDate, setSelectedDate] = useState(todayStr);
    // Generate 14-day strip around today (matching screenshot: SUN 4 ... TODAY 10 ... FRI 16)
    const dateStrip = useMemo(() => {
        const dates = [];
        const base = new Date();
        // 6 days before to 7 days after
        for (let i = -6; i <= 7; i++) {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
            const dayNum = d.getDate();
            const isToday = iso === todayStr;
            // Count booked slots for this date
            const count = bookings.filter(b => b.date === iso && b.paymentStatus !== 'cancelled').length;
            dates.push({
                iso,
                dayName,
                dayNum,
                isToday,
                bookedCount: count
            });
        }
        return dates;
    }, [bookings, todayStr]);
    // Slots for the selected date
    const scheduleSlots = useMemo(() => {
        const isWeekend = new Date(selectedDate).getDay() === 5 || new Date(selectedDate).getDay() === 6;
        return SCHEDULE_SLOTS_DEFINITION.map(def => {
            const b = bookings.find(item => item.date === selectedDate && item.slotNumber === def.slotNumber && item.paymentStatus !== 'cancelled');
            const adminSlot = pricing.slotPrices.find(s => s.slotNumber === def.slotNumber);
            const price = adminSlot ? (isWeekend ? adminSlot.weekendPrice : adminSlot.weekdayPrice) : def.weekdayPrice;
            return {
                ...def,
                booking: b,
                price
            };
        });
    }, [bookings, selectedDate, pricing.slotPrices]);
    // Collect balance modal
    const [collectingBooking, setCollectingBooking] = useState(null);
    const [collectAmount, setCollectAmount] = useState(0);
    // Quick Walkin modal
    const [walkinSlotDef, setWalkinSlotDef] = useState(null);
    const [walkinTeam, setWalkinTeam] = useState('');
    const [walkinCaptain, setWalkinCaptain] = useState('');
    const [walkinPhone, setWalkinPhone] = useState('');
    const [walkinPaid, setWalkinPaid] = useState(3000);
    const handleOpenWalkin = (slot) => {
        setWalkinSlotDef(slot);
        setWalkinPaid(slot.price);
        setWalkinTeam('');
        setWalkinCaptain('');
        setWalkinPhone('');
    };
    const handleCreateWalkinSubmit = (e) => {
        e.preventDefault();
        if (!walkinSlotDef || !walkinTeam.trim() || !walkinCaptain.trim() || !walkinPhone.trim())
            return;
        const isFull = walkinPaid >= walkinSlotDef.price;
        const due = Math.max(0, walkinSlotDef.price - walkinPaid);
        const newBooking = {
            id: `walkin-${Date.now()}`,
            bookingCode: `CMA-W${Math.floor(1000 + Math.random() * 9000)}`,
            courtId: 'main-turf',
            courtName: 'Crossbar Metro Arena (Main Turf)',
            date: selectedDate,
            slotNumber: walkinSlotDef.slotNumber,
            startTime: walkinSlotDef.startTime,
            endTime: walkinSlotDef.endTime,
            displayTime: walkinSlotDef.displayTime,
            captainName: walkinCaptain.trim(),
            captainPhone: walkinPhone.trim(),
            teamName: walkinTeam.trim(),
            playerCount: 14,
            matchType: 'friendly',
            addOns: [],
            courtPrice: walkinSlotDef.price,
            addOnsPrice: 0,
            totalPrice: walkinSlotDef.price,
            paymentType: isFull ? 'full_payment' : 'advance_500',
            advanceAmount: walkinPaid,
            dueAmount: due,
            paymentMethod: 'cash',
            paymentStatus: isFull ? 'paid_full' : 'paid_advance',
            isWalkIn: true,
            notes: 'Counter Walk-In Recorded from Schedule',
            createdAt: new Date().toISOString()
        };
        handleBookingSuccess(newBooking);
        setWalkinSlotDef(null);
    };
    return (<div className="space-y-6 animate-fade-in font-sans">
      
      {/* 14-DAY STRIP SELECTOR (MATCHING SCREENSHOT 2) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {dateStrip.map(item => {
            const isSelected = selectedDate === item.iso;
            return (<button key={item.iso} type="button" onClick={() => setSelectedDate(item.iso)} className={`flex-1 min-w-[62px] sm:min-w-[70px] py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer ${isSelected
                    ? 'bg-lime-400 text-slate-950 font-black shadow-lg shadow-lime-400/20'
                    : 'bg-[#0c131a] border border-white/5 text-slate-300 hover:border-lime-400/30'}`}>
              <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${isSelected ? 'text-slate-950' : 'text-slate-400'}`}>
                {item.isToday ? 'TODAY' : item.dayName}
              </span>
              <span className="text-base sm:text-lg font-black font-display my-0.5">
                {item.dayNum}
              </span>
              <span className={`text-[9px] font-mono ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                {item.bookedCount} booked
              </span>
            </button>);
        })}
      </div>

      {/* SUBTITLE INSTRUCTION (MATCHING SCREENSHOT 2) */}
      <div className="text-xs text-slate-400">
        Tap a free slot for a walk-in booking or to block it. Tap a booking to collect money, mark played or cancel.
      </div>

      {/* 12 SLOTS SCHEDULE LIST (MATCHING SCREENSHOT 2) */}
      <div className="space-y-2">
        {scheduleSlots.map(slot => {
            const b = slot.booking;
            const isBooked = !!b;
            const isPlayed = b?.paymentStatus === 'paid_full';
            const isConfirmed = b?.paymentStatus === 'paid_advance';
            return (<div key={slot.slotNumber} className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${!isBooked
                    ? 'bg-[#0c131a]/70 border-white/5 hover:border-lime-400/30'
                    : isPlayed
                        ? 'bg-[#0a1118] border-cyan-500/20'
                        : 'bg-[#0c1613] border-emerald-500/30'}`}>
              {/* Left Time & Slot Info */}
              <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                <div className="w-16 sm:w-20 font-mono font-bold text-xs sm:text-sm text-white shrink-0">
                  {slot.startTime} {Number(slot.startTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                </div>

                <div className="min-w-0">
                  {!isBooked ? (<div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-300">
                        Not booked
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        ৳{slot.price.toLocaleString()}
                      </div>
                    </div>) : (<div>
                      <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-2">
                        <span>{b.captainName}</span>
                        {b.teamName && (<span className="text-xs text-slate-400 font-normal truncate hidden sm:inline">
                            · {b.teamName}
                          </span>)}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        ৳{(b.advanceAmount || b.courtPrice).toLocaleString()} of ৳{b.totalPrice.toLocaleString()}
                        {b.dueAmount && b.dueAmount > 0 ? (<span className="text-amber-400 font-bold ml-1.5">(Due ৳{b.dueAmount.toLocaleString()})</span>) : null}
                      </div>
                    </div>)}
                </div>
              </div>

              {/* Right Status Pill & Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {!isBooked ? (<button type="button" onClick={() => handleOpenWalkin(slot)} className="px-3 py-1.5 rounded-xl bg-lime-400/10 hover:bg-lime-400 text-lime-400 hover:text-slate-950 font-bold text-xs transition-colors cursor-pointer border border-lime-400/20">
                    + Book Walk-in
                  </button>) : (<div className="flex items-center gap-2">
                    {/* Status Pill (matching screenshot style) */}
                    {isPlayed ? (<span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        <span>Played</span>
                      </span>) : (<span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Confirmed</span>
                      </span>)}

                    {/* Quick collect button if due */}
                    {b.dueAmount && b.dueAmount > 0 ? (<button type="button" onClick={() => {
                            setCollectingBooking(b);
                            setCollectAmount(b.dueAmount || 0);
                        }} className="px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400 text-amber-300 hover:text-slate-950 text-xs font-bold transition-colors cursor-pointer border border-amber-400/30">
                        Collect
                      </button>) : !isPlayed ? (<button type="button" onClick={() => handleUpdateBookingStatus(b.id, 'paid_full')} className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer" title="Mark match as played">
                        Mark Played
                      </button>) : null}

                    <button type="button" onClick={() => {
                        if (confirm(`Cancel booking for ${b.captainName}?`)) {
                            handleCancelBooking(b.id);
                        }
                    }} className="p-1 text-slate-500 hover:text-rose-400 transition-colors" title="Cancel booking">
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
            <h3 className="text-base font-bold text-white">Collect Pitch Due Balance</h3>
            <p className="text-xs text-slate-400">
              Team: <strong className="text-white">{collectingBooking.teamName}</strong> ({collectingBooking.captainName})
            </p>
            <div>
              <label className="text-xs text-slate-300 block mb-1">Amount to Collect (৳)</label>
              <input type="number" value={collectAmount} onChange={e => setCollectAmount(Number(e.target.value))} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm"/>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCollectingBooking(null)} className="flex-1 py-2 bg-white/5 text-slate-300 font-bold rounded-xl text-xs">
                Cancel
              </button>
              <button type="button" onClick={() => {
                handleUpdateBookingStatus(collectingBooking.id, 'paid_full', collectAmount);
                setCollectingBooking(null);
            }} className="flex-1 py-2 bg-lime-400 text-slate-950 font-bold rounded-xl text-xs">
                Confirm Paid
              </button>
            </div>
          </div>
        </div>)}

      {/* QUICK WALKIN FROM SLOT MODAL */}
      {walkinSlotDef && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-lime-400/30 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white font-display">Book Walk-in Slot</h3>
                <p className="text-xs text-lime-400 font-mono">
                  {walkinSlotDef.displayTime} · {selectedDate}
                </p>
              </div>
              <button type="button" onClick={() => setWalkinSlotDef(null)} className="text-slate-400 hover:text-white">
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

              <div>
                <label className="block text-slate-300 mb-1">Amount Paid at Counter (৳)</label>
                <input type="number" value={walkinPaid} onChange={e => setWalkinPaid(Number(e.target.value))} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setWalkinSlotDef(null)} className="flex-1 py-2 rounded-xl bg-white/5 text-slate-300 font-bold">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black uppercase">
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>)}

    </div>);
}
