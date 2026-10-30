'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { COURTS, SCHEDULE_SLOTS_DEFINITION } from '../data/initialData';
import { useArena, todayDhaka } from '../context/ArenaContext';
import { Calendar, Clock, Sparkles, Timer, ArrowRight, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { BookingModal } from './BookingModal';
import {
    parseLocalDate, toIsoLocal, addDaysIso, isWeekendDate, weekendDaysLabel,
    nowDhakaMinutes, timeToMinutes
} from '../lib/dateUtils';

const ACTIVE_STATUSES = ['pending_payment', 'confirmed_unpaid', 'paid_advance', 'paid_full', 'needs_refund'];

/**
 * Public 12-slot availability grid + date pickers.
 * Availability always comes from the context `bookings` (server rows); the `bookings` prop
 * is kept only for backwards compatibility with callers that still pass it.
 */
export const BookingSection = ({ hideHeading = false }) => {
    const { bookings: contextBookings, pricing, slotHolds, currentUser, refreshBookings, showNotice } = useArena();
    const bookings = contextBookings || [];
    const primaryCourt = COURTS[0];

    // Booking window (Dhaka calendar)
    const todayStr = useMemo(() => todayDhaka(), []);
    const windowDays = Number(pricing.bookingWindowDays) > 0 ? Number(pricing.bookingWindowDays) : 60;
    const maxDateStr = useMemo(() => addDaysIso(todayStr, windowDays), [todayStr, windowDays]);
    const weekendLabel = weekendDaysLabel(pricing.weekendDays);

    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);
    const [refreshCountdown, setRefreshCountdown] = useState(60);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const d = parseLocalDate(todayDhaka());
        return { year: d.getFullYear(), month: d.getMonth() };
    });
    // Re-render once a minute so "time passed" flips over without a reload
    const [clockTick, setClockTick] = useState(0);

    const selectDate = useCallback((iso) => {
        if (!iso || iso < todayStr || iso > maxDateStr) return;
        setSelectedDate(iso);
        const d = parseLocalDate(iso);
        setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() });
    }, [todayStr, maxDateStr]);

    const doRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try { await refreshBookings(); } finally {
            setIsRefreshing(false);
            setRefreshCountdown(60);
        }
    }, [refreshBookings]);

    // 60-second auto-refresh of real availability
    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshCountdown(prev => {
                if (prev <= 1) {
                    refreshBookings().catch(() => { /* ignore */ });
                    return 60;
                }
                return prev - 1;
            });
            const minute = Math.floor(Date.now() / 60000);
            setClockTick(prev => (prev === minute ? prev : minute));
        }, 1000);
        return () => clearInterval(interval);
    }, [refreshBookings]);

    // Quick picker for the next 7 days
    const next7Days = useMemo(() => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const iso = addDaysIso(todayStr, i);
            const d = parseLocalDate(iso);
            dates.push({
                iso,
                dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNum: d.getDate(),
                monthName: d.toLocaleDateString('en-US', { month: 'short' }),
                isWeekend: isWeekendDate(iso, pricing.weekendDays),
                disabled: iso > maxDateStr
            });
        }
        return dates;
    }, [todayStr, maxDateStr, pricing.weekendDays]);

    const isWeekendSelected = useMemo(() => isWeekendDate(selectedDate, pricing.weekendDays), [selectedDate, pricing.weekendDays]);

    // Month calendar with per-day availability colour (counts every active booking incl. holds)
    const daysInMonthGrid = useMemo(() => {
        const { year, month } = calendarMonth;
        const firstDayIndex = new Date(year, month, 1).getDay();
        const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let d = 1; d <= daysInCurrentMonth; d++) {
            const iso = toIsoLocal(new Date(year, month, d));
            const bookedCount = bookings.filter(b => b.date === iso && ACTIVE_STATUSES.includes(b.paymentStatus)).length;
            const freeSlots = Math.max(0, 12 - bookedCount);
            const statusColor = freeSlots === 0 ? 'full' : freeSlots <= 6 ? 'few' : 'many';
            days.push({ dayNum: d, iso, freeSlots, statusColor, disabled: iso < todayStr || iso > maxDateStr });
        }
        return { firstDayIndex, days };
    }, [calendarMonth, bookings, todayStr, maxDateStr]);

    const monthBounds = useMemo(() => {
        const first = parseLocalDate(todayStr);
        const last = parseLocalDate(maxDateStr);
        return {
            min: first.getFullYear() * 12 + first.getMonth(),
            max: last.getFullYear() * 12 + last.getMonth()
        };
    }, [todayStr, maxDateStr]);
    const currentMonthIndex = calendarMonth.year * 12 + calendarMonth.month;
    const canGoPrev = currentMonthIndex > monthBounds.min;
    const canGoNext = currentMonthIndex < monthBounds.max;
    const shiftMonth = (delta) => {
        const next = currentMonthIndex + delta;
        if (next < monthBounds.min || next > monthBounds.max) return;
        setCalendarMonth({ year: Math.floor(next / 12), month: next % 12 });
    };

    // The 12 slots for the chosen day
    const slots = useMemo(() => {
        const now = Date.now();
        const nowMins = nowDhakaMinutes();
        const isPastDate = selectedDate < todayStr;
        const isToday = selectedDate === todayStr;
        const defs = Array.isArray(pricing.slotPrices) && pricing.slotPrices.length === 12 ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION;
        return defs.map((def) => {
            const price = isWeekendSelected ? Number(def.weekendPrice) : Number(def.weekdayPrice);
            const existingBooking = bookings.find(b => b.date === selectedDate && Number(b.slotNumber) === Number(def.slotNumber) && ACTIVE_STATUSES.includes(b.paymentStatus));
            const slotKey = `${selectedDate}_${def.slotNumber}`;
            const activeHold = slotHolds.find(h => h.slotKey === slotKey && h.expiresAt > now);
            const isPassed = isPastDate || (isToday && nowMins >= timeToMinutes(def.startTime));

            let status = 'available';
            let bookedTeam;
            let bookingId;
            let holdExpiresAt;
            if (existingBooking && existingBooking.paymentStatus === 'pending_payment') {
                status = 'on_hold';
                bookingId = existingBooking.id;
            } else if (existingBooking) {
                status = 'booked';
                bookedTeam = existingBooking.teamName;
                bookingId = existingBooking.id;
            } else if (isPassed) {
                status = 'time_passed';
            } else if (activeHold) {
                status = 'on_hold';
                bookedTeam = activeHold.teamName;
                holdExpiresAt = activeHold.expiresAt;
            }
            return {
                id: `slot-${selectedDate}-${def.slotNumber}`,
                slotNumber: def.slotNumber,
                courtId: primaryCourt.id,
                startTime: def.startTime,
                endTime: def.endTime,
                displayTime: def.displayTime,
                durationMinutes: 90,
                period: def.period,
                price,
                weekdayPrice: Number(def.weekdayPrice),
                weekendPrice: Number(def.weekendPrice),
                isPeak: def.period === 'evening',
                status,
                bookedTeam,
                bookingId,
                holdExpiresAt
            };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, todayStr, isWeekendSelected, pricing.slotPrices, bookings, slotHolds, primaryCourt.id, clockTick]);

    const filteredSlots = useMemo(() => (selectedPeriod === 'all' ? slots : slots.filter(s => s.period === selectedPeriod)), [slots, selectedPeriod]);
    const availableCount = slots.filter(s => s.status === 'available').length;

    const handleSlotClick = (slot) => {
        if (slot.status !== 'available') return;
        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'investor')) {
            showNotice('info', `${currentUser.role === 'admin' ? 'Admins' : 'Investors'} cannot book online from this account. Admins add bookings from the Schedule tab instead.`);
            return;
        }
        setSelectedSlotForBooking(slot);
    };

    return (<section id="booking-section" className="relative py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Section Heading */}
        {!hideHeading && (<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">
                <Sparkles className="w-3.5 h-3.5"/>
                <span>Live Turf Slot Availability</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-display">
                Book a Slot · <span className="text-emerald-400">Fixed 90 Mins</span>
              </h2>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl">
                12 fixed slots daily from 6:00 AM to 12:00 AM Midnight. No double bookings. Secure online with a ৳{Number(pricing.advanceAmount || 500).toLocaleString()} advance or full payment via bKash / Nagad / Cards.
              </p>
            </div>
          </div>)}

        {/* Refresh indicator (always visible so the grid can be refreshed on every page) */}
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-3 bg-slate-900/80 border border-white/10 px-4 py-2 rounded-2xl text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`}/>
              <span>Refreshes in:</span>
              <span className="font-mono font-bold text-emerald-400">{refreshCountdown}s</span>
            </div>
            <button type="button" onClick={doRefresh} disabled={isRefreshing} className="text-[12px] font-bold text-slate-400 hover:text-white underline cursor-pointer disabled:opacity-50">
              Refresh Now
            </button>
          </div>
        </div>

        {/* 1. DATE PICKER CONTROLS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Quick Date Picker (Next 7 Days)
                </span>
                <span className="text-xs text-emerald-400 font-semibold">
                  {isWeekendSelected ? `Weekend pricing (${weekendLabel})` : 'Regular weekday rates'}
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {next7Days.map((d, i) => {
                    const isSelected = selectedDate === d.iso;
                    return (<button key={d.iso} type="button" disabled={d.disabled} onClick={() => selectDate(d.iso)} title={i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : undefined} className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${isSelected
                        ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-lg shadow-emerald-500/25 scale-[1.02]'
                        : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'}`}>
                      <span className="text-[12px] font-bold uppercase">{d.dayName}</span>
                      <span className="text-lg font-black font-display leading-tight">{d.dayNum}</span>
                      <span className="text-[11px] opacity-80">{d.monthName}</span>
                      {d.isWeekend && !isSelected && (<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1"></span>)}
                    </button>);
                })}
              </div>
            </div>

            {/* Date input (kept in sync with the booking window) */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Calendar className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
                <input type="date" value={selectedDate} min={todayStr} max={maxDateStr} onChange={e => selectDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"/>
              </div>
              <button type="button" onClick={() => selectDate(todayStr)} className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition-colors cursor-pointer">
                Jump to Today
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Bookings open up to {windowDays} days ahead (until {maxDateStr}).
            </p>
          </div>

          {/* Month Calendar */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => shiftMonth(-1)} disabled={!canGoPrev} aria-label="Previous month" className="p-1 rounded-lg text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                  <ChevronLeft className="w-4 h-4"/>
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-white min-w-[110px] text-center">
                  {new Date(calendarMonth.year, calendarMonth.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button type="button" onClick={() => shiftMonth(1)} disabled={!canGoNext} aria-label="Next month" className="p-1 rounded-lg text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                  <ChevronRight className="w-4 h-4"/>
                </button>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Many
                </span>
                <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> Few
                </span>
                <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Full
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500 mb-1">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: daysInMonthGrid.firstDayIndex }).map((_, idx) => (<div key={`empty-${idx}`} className="h-7"></div>))}
              {daysInMonthGrid.days.map(d => {
                  const isSelected = selectedDate === d.iso;
                  const dotColor = d.statusColor === 'many' ? 'bg-emerald-400' : d.statusColor === 'few' ? 'bg-amber-400' : 'bg-rose-500';
                  return (<button key={d.iso} type="button" disabled={d.disabled} onClick={() => selectDate(d.iso)} className={`h-7 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed ${isSelected
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'text-slate-300 hover:bg-white/10'}`}>
                    <span className="text-[12px] leading-none">{d.dayNum}</span>
                    {!d.disabled && <span className={`w-1 h-1 rounded-full ${dotColor} mt-0.5`}></span>}
                  </button>);
              })}
            </div>
          </div>
        </div>

        {/* 2. PERIOD TABS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 text-xs font-bold overflow-x-auto">
            {[
                { id: 'all', label: 'All 12 Slots' },
                { id: 'morning', label: 'Morning (Slots 1-4)' },
                { id: 'afternoon', label: 'Afternoon (Slots 5-8)' },
                { id: 'evening', label: 'Night Prime (Slots 9-12)' }
            ].map(tab => (<button key={tab.id} type="button" onClick={() => setSelectedPeriod(tab.id)} className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${selectedPeriod === tab.id
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'}`}>
                {tab.label}
              </button>))}
          </div>

          <div className="text-xs text-slate-300">
            Selected: <strong className="text-white">{selectedDate}</strong> · <span className="text-emerald-400 font-bold">{availableCount} Free Slots</span>
          </div>
        </div>

        {/* 3. THE 12 SLOTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSlots.map(slot => {
              const isAvail = slot.status === 'available';
              const isHold = slot.status === 'on_hold';
              const isBooked = slot.status === 'booked';
              const isPassed = slot.status === 'time_passed';
              return (<div key={slot.id} className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between ${isAvail
                  ? 'bg-slate-900/80 border-emerald-500/30 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-0.5'
                  : isHold
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : isBooked
                          ? 'bg-slate-950/70 border-white/10 opacity-85'
                          : 'bg-black/40 border-white/5 opacity-60'}`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Slot #{slot.slotNumber}
                    </span>
                    <span className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full ${isAvail
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isHold
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : isBooked
                                ? 'bg-slate-800 text-slate-300'
                                : 'bg-white/5 text-slate-500'}`}>
                      {isAvail ? 'Available' : isHold ? 'On hold' : isBooked ? 'Booked' : 'Time passed'}
                    </span>
                  </div>

                  <div className="text-base font-black text-white font-display tracking-wide">
                    {slot.displayTime}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-emerald-400"/>
                    <span>90-Minute Match</span>
                  </div>

                  {isBooked && (<div className="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                      <div className="text-[11px] uppercase text-slate-400 font-semibold">Booked by Squad:</div>
                      <div className="text-white font-bold truncate mt-0.5">
                        {slot.bookedTeam || 'Confirmed Squad'}
                      </div>
                    </div>)}

                  {isHold && (<div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                      <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                        <Timer className="w-3 h-3"/>
                        <span>Payment in progress</span>
                      </div>
                      <div className="text-[12px] mt-0.5 font-medium">The slot frees up automatically if the payment is not completed.</div>
                    </div>)}

                  {isPassed && (<div className="mt-3 p-2 rounded-xl bg-white/5 text-slate-500 text-xs">
                      Kickoff time passed.
                    </div>)}
                </div>

                <div className="pt-5 mt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                      {isWeekendSelected ? `Weekend rate (${weekendLabel})` : 'Weekday rate'}
                    </div>
                    <div className="text-lg font-black text-emerald-400 font-mono">
                      ৳{Number(slot.price || 0).toLocaleString()}
                    </div>
                  </div>

                  {isAvail ? (<button type="button" onClick={() => handleSlotClick(slot)} className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1 cursor-pointer">
                      <span>Book Slot</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]"/>
                    </button>) : (<span className="text-xs font-semibold text-slate-500">
                      {isBooked ? 'Reserved' : isHold ? 'In checkout' : 'Unavailable'}
                    </span>)}
                </div>
              </div>);
          })}
        </div>

      </div>

      {selectedSlotForBooking && (<BookingModal court={primaryCourt} slot={selectedSlotForBooking} selectedDate={selectedDate} onClose={() => setSelectedSlotForBooking(null)}/>)}
    </section>);
};
