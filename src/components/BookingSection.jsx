'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { COURTS, SCHEDULE_SLOTS_DEFINITION } from '../data/initialData';
import { useArena } from '../context/ArenaContext';
import { Calendar, Clock, Sparkles, Timer, ArrowRight, RefreshCw } from 'lucide-react';
import { BookingModal } from './BookingModal';
export const BookingSection = ({ bookings, onBookingSuccess, hideHeading = false }) => {
    const { pricing, slotHolds, currentUser, setShowAuthModal, setPendingBookingData, setShowSSLCommerzModal } = useArena();
    // Primary Single Ground
    const primaryCourt = COURTS[0];
    // 60-day calendar calculation
    const today = useMemo(() => new Date(), []);
    const todayStr = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);
    const [refreshCountdown, setRefreshCountdown] = useState(60);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchDateInput, setSearchDateInput] = useState('');
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const d = new Date();
        return { year: d.getFullYear(), month: d.getMonth() };
    });
    // 60-second auto-refresh timer (Section 3 requirement)
    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshCountdown(prev => {
                if (prev <= 1) {
                    setIsRefreshing(true);
                    setTimeout(() => setIsRefreshing(false), 500);
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    const handleManualRefresh = () => {
        setIsRefreshing(true);
        setRefreshCountdown(60);
        setTimeout(() => setIsRefreshing(false), 400);
    };
    // Quick picker for next 7 days (Section 3 requirement)
    const next7Days = useMemo(() => {
        const dates = [];
        const base = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = d.toLocaleDateString('en-US', { day: 'numeric' });
            const monthName = d.toLocaleDateString('en-US', { month: 'short' });
            const isWeekend = d.getDay() === 5 || d.getDay() === 6; // Friday & Saturday
            dates.push({
                iso,
                label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${dayName}, ${dayNum} ${monthName}`,
                dayName,
                dayNum,
                monthName,
                isWeekend
            });
        }
        return dates;
    }, []);
    // Determine if selected date is weekend based on admin pricing rules
    const isWeekendSelected = useMemo(() => {
        const d = new Date(selectedDate);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const weekendList = pricing.weekendDays || ['Friday', 'Saturday'];
        return weekendList.includes(dayName);
    }, [selectedDate, pricing.weekendDays]);
    // Compute availability count for each day to generate Month Calendar colors (many / few / full)
    const daysInMonthGrid = useMemo(() => {
        const { year, month } = calendarMonth;
        const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
        const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let d = 1; d <= daysInCurrentMonth; d++) {
            const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            // Count booked slots for this date
            const bookedCount = bookings.filter(b => b.date === iso && b.paymentStatus !== 'cancelled').length;
            const freeSlots = Math.max(0, 12 - bookedCount);
            // Color category: many (> 6 free), few (1 - 6 free), full (0 free)
            let statusColor = 'many';
            if (freeSlots === 0)
                statusColor = 'full';
            else if (freeSlots <= 6)
                statusColor = 'few';
            days.push({
                dayNum: d,
                iso,
                freeSlots,
                statusColor
            });
        }
        return { firstDayIndex, days };
    }, [calendarMonth, bookings]);
    // 12 slots for the chosen day computed from 24 pricing matrix + slot holds + double booking rules
    const slots = useMemo(() => {
        const now = Date.now();
        const currentDate = new Date();
        const currentHour = currentDate.getHours();
        const currentMin = currentDate.getMinutes();
        const isToday = selectedDate === todayStr;
        return SCHEDULE_SLOTS_DEFINITION.map((def) => {
            // Find matching price in admin's slotPrices matrix
            const adminSlot = pricing.slotPrices.find(s => s.slotNumber === def.slotNumber);
            const slotPrice = adminSlot
                ? (isWeekendSelected ? adminSlot.weekendPrice : adminSlot.weekdayPrice)
                : (isWeekendSelected ? def.weekendPrice : def.weekdayPrice);
            // Check existing booking (Rule 1: no double booking guaranteed)
            const existingBooking = bookings.find(b => b.date === selectedDate && b.slotNumber === def.slotNumber && b.paymentStatus !== 'cancelled');
            // Check active 10-minute hold
            const slotKey = `${selectedDate}_${def.slotNumber}`;
            const activeHold = slotHolds.find(h => h.slotKey === slotKey && h.expiresAt > now);
            // Check if time has already passed today
            const [startH, startM] = def.startTime.split(':').map(Number);
            const isPastToday = isToday && (currentHour > startH || (currentHour === startH && currentMin >= startM));
            let status = 'available';
            let bookedBy = undefined;
            let bookedTeam = undefined;
            let bookingId = undefined;
            let holdExpiresAt = undefined;
            if (existingBooking) {
                status = 'booked';
                bookedBy = existingBooking.captainName;
                bookedTeam = existingBooking.teamName;
                bookingId = existingBooking.id;
            }
            else if (activeHold) {
                status = 'holding';
                bookedTeam = activeHold.teamName;
                holdExpiresAt = activeHold.expiresAt;
            }
            else if (isPastToday) {
                status = 'time_passed';
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
                price: slotPrice,
                weekdayPrice: def.weekdayPrice,
                weekendPrice: def.weekendPrice,
                isPeak: def.period === 'evening',
                status,
                bookedBy,
                bookedTeam,
                bookingId,
                holdExpiresAt
            };
        });
    }, [selectedDate, todayStr, isWeekendSelected, pricing.slotPrices, bookings, slotHolds, primaryCourt.id]);
    const filteredSlots = useMemo(() => {
        if (selectedPeriod === 'all')
            return slots;
        return slots.filter(s => s.period === selectedPeriod);
    }, [slots, selectedPeriod]);
    const availableCount = slots.filter(s => s.status === 'available').length;
    const handleSlotClick = (slot) => {
        if (slot.status !== 'available')
            return;
        // Guard rule: Investor or admin cannot book online from their account
        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'investor')) {
            alert(`Notice: ${currentUser.role === 'admin' ? 'Admins' : 'Investors'} cannot book online from this account. Admins add bookings from the Schedule tab instead, or switch to a Player account.`);
            return;
        }
        setSelectedSlotForBooking(slot);
    };
    const handleDateSearch = (e) => {
        e.preventDefault();
        if (!searchDateInput)
            return;
        setSelectedDate(searchDateInput);
    };
    return (<section id="booking-section" className="relative py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Heading */}
        {!hideHeading && (<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">
                <Sparkles className="w-3.5 h-3.5"/>
                <span>24/7 Live Turf Slot Engine</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-display">
                Book a Slot · <span className="text-emerald-400">Fixed 90 Mins</span>
              </h2>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl">
                12 fixed slots daily from 6:00 AM to 12:00 AM Midnight. No double bookings. Secure online with ৳500 advance or full payment via bKash / Nagad / Cards.
              </p>
            </div>

            {/* 60s Refresh Indicator */}
            <div className="flex items-center gap-3 self-start md:self-auto bg-slate-900/80 border border-white/10 px-4 py-2 rounded-2xl text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`}/>
                <span>Refreshes in:</span>
                <span className="font-mono font-bold text-emerald-400">{refreshCountdown}s</span>
              </div>
              <button type="button" onClick={handleManualRefresh} className="text-[11px] font-bold text-slate-400 hover:text-white underline cursor-pointer">
                Refresh Now
              </button>
            </div>
          </div>)}

        {/* 1. DATE PICKER CONTROLS: QUICK 7-DAYS + DATE SEARCH + MONTH CALENDAR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Quick 7-Day Buttons & Date Search Box */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Quick 7 Days Row */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Quick Date Picker (Next 7 Days)
                </span>
                <span className="text-xs text-emerald-400 font-semibold">
                  {isWeekendSelected ? 'Weekend Surcharge Active (Fri/Sat)' : 'Regular Weekday Rates'}
                </span>
              </div>
              
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {next7Days.map(d => {
            const isSelected = selectedDate === d.iso;
            return (<button key={d.iso} type="button" onClick={() => setSelectedDate(d.iso)} className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${isSelected
                    ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-lg shadow-emerald-500/25 scale-[1.02]'
                    : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'}`}>
                      <span className="text-[11px] font-bold uppercase">{d.dayName}</span>
                      <span className="text-lg font-black font-display leading-tight">{d.dayNum}</span>
                      <span className="text-[10px] opacity-80">{d.monthName}</span>
                      {d.isWeekend && !isSelected && (<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1"></span>)}
                    </button>);
        })}
              </div>
            </div>

            {/* Date Search Box (Section 3 requirement) */}
            <form onSubmit={handleDateSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Calendar className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
                <input type="date" value={selectedDate} min={todayStr} onChange={e => setSelectedDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"/>
              </div>
              <button type="button" onClick={() => setSelectedDate(todayStr)} className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition-colors cursor-pointer">
                Jump to Today
              </button>
            </form>
          </div>

          {/* Month Calendar with Colour Coding (Section 3 requirement) */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                {new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-2 text-[10px]">
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

            {/* Mini Calendar Weekday Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 mb-1">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>

            {/* Mini Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: daysInMonthGrid.firstDayIndex }).map((_, idx) => (<div key={`empty-${idx}`} className="h-7"></div>))}
              {daysInMonthGrid.days.map(d => {
            const isSelected = selectedDate === d.iso;
            const dotColor = d.statusColor === 'many' ? 'bg-emerald-400' : d.statusColor === 'few' ? 'bg-amber-400' : 'bg-rose-500';
            return (<button key={d.iso} type="button" onClick={() => setSelectedDate(d.iso)} className={`h-7 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${isSelected
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'text-slate-300 hover:bg-white/10'}`}>
                    <span className="text-[11px] leading-none">{d.dayNum}</span>
                    <span className={`w-1 h-1 rounded-full ${dotColor} mt-0.5`}></span>
                  </button>);
        })}
            </div>
          </div>
        </div>

        {/* 2. PERIOD TABS: ALL / MORNING / AFTERNOON / NIGHT */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 text-xs font-bold overflow-x-auto">
            {[
            { id: 'all', label: 'All 12 Slots', count: slots.length },
            { id: 'morning', label: 'Morning (Slots 1-4)', count: slots.filter(s => s.period === 'morning').length },
            { id: 'afternoon', label: 'Afternoon (Slots 5-8)', count: slots.filter(s => s.period === 'afternoon').length },
            { id: 'evening', label: 'Night Prime (Slots 9-12)', count: slots.filter(s => s.period === 'evening').length },
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

        {/* 3. THE 12 SLOTS GRID (Section 3 & 4 requirement) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSlots.map(slot => {
            const isAvail = slot.status === 'available';
            const isHold = slot.status === 'holding';
            const isBooked = slot.status === 'booked';
            const isBlocked = slot.status === 'blocked';
            const isPassed = slot.status === 'time_passed';
            return (<div key={slot.id} className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between ${isAvail
                    ? 'bg-slate-900/80 border-emerald-500/30 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-0.5'
                    : isHold
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : isBooked
                            ? 'bg-slate-950/70 border-white/10 opacity-85'
                            : 'bg-black/40 border-white/5 opacity-60'}`}>
                {/* Slot Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Slot #{slot.slotNumber}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${isAvail
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : isHold
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                        : isBooked
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-white/5 text-slate-500'}`}>
                      {isAvail ? 'Available' : isHold ? 'On Hold' : isBooked ? 'Booked' : isBlocked ? 'Blocked' : 'Time Passed'}
                    </span>
                  </div>

                  <div className="text-base font-black text-white font-display tracking-wide">
                    {slot.displayTime}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-emerald-400"/>
                    <span>90-Minute Match</span>
                  </div>

                  {/* Status Banner / Booked Team Name */}
                  {isBooked && (<div className="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                      <div className="text-[10px] uppercase text-slate-400 font-semibold">Booked by Squad:</div>
                      <div className="text-white font-bold truncate mt-0.5">
                        {slot.bookedTeam || 'Confirmed Squad'}
                      </div>
                    </div>)}

                  {isHold && (<div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        <Timer className="w-3 h-3"/>
                        <span>Holding for Payment</span>
                      </div>
                      <div className="text-[11px] mt-0.5 font-medium">Slot frees if payment is not finished.</div>
                    </div>)}

                  {isBlocked && (<div className="mt-3 p-2 rounded-xl bg-rose-500/10 text-rose-300 text-xs">
                      Slot blocked by arena desk.
                    </div>)}

                  {isPassed && (<div className="mt-3 p-2 rounded-xl bg-white/5 text-slate-500 text-xs">
                      Kickoff time passed.
                    </div>)}
                </div>

                {/* Slot Footer: Price & CTA */}
                <div className="pt-5 mt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                      {isWeekendSelected ? 'Weekend Rate' : 'Weekday Rate'}
                    </div>
                    <div className="text-lg font-black text-emerald-400 font-mono">
                      ৳{slot.price.toLocaleString()}
                    </div>
                  </div>

                  {isAvail ? (<button type="button" onClick={() => handleSlotClick(slot)} className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1 cursor-pointer">
                      <span>Book Slot</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]"/>
                    </button>) : (<span className="text-xs font-semibold text-slate-500">
                      {isBooked ? 'Reserved' : isHold ? 'In Checkout' : 'Unavailable'}
                    </span>)}
                </div>
              </div>);
        })}
        </div>

      </div>

      {/* Booking Checkout Modal */}
      {selectedSlotForBooking && (<BookingModal court={primaryCourt} slot={selectedSlotForBooking} selectedDate={selectedDate} onClose={() => setSelectedSlotForBooking(null)} onBookingConfirmed={(b) => {
                setSelectedSlotForBooking(null);
                onBookingSuccess(b);
            }}/>)}
    </section>);
};
