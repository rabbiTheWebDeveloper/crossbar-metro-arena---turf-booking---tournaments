'use client';

import React, { useState, useMemo } from 'react';
import { Court, TimeSlot, Booking } from '../types';
import { COURTS, SCHEDULE_SLOTS_DEFINITION } from '../data/initialData';
import { useArena } from '../context/ArenaContext';
import {
  Calendar,
  Clock,
  Sun,
  Moon,
  Sparkles,
  Shield,
  ChevronRight,
  Check,
  AlertCircle,
  Timer,
  Lock,
  Layers,
  Flame,
  ArrowRight
} from 'lucide-react';
import { BookingModal } from './BookingModal';

interface BookingSectionProps {
  bookings: Booking[];
  onBookingSuccess: (booking: Booking) => void;
  hideHeading?: boolean;
}

export const BookingSection: React.FC<BookingSectionProps> = ({
  bookings,
  onBookingSuccess,
  hideHeading = false
}) => {
  const { pricing, slotHolds } = useArena();
  const [selectedCourtId, setSelectedCourtId] = useState<string>('pitch-alpha');

  // 60-day calendar calculation
  const today = useMemo(() => new Date(), []);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().split('T')[0];
  }, []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

  // Generate 60 days list for easy horizontal browsing
  const calendarDates = useMemo(() => {
    const dates = [];
    const base = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.toLocaleDateString('en-US', { day: '2-digit' });
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const isWeekend = d.getDay() === 5 || d.getDay() === 6; // Friday/Saturday in Dhaka
      dates.push({
        iso,
        dayName: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : dayName,
        dayNum,
        monthName,
        isWeekend
      });
    }
    return dates;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<TimeSlot | null>(null);

  const selectedCourt = COURTS.find(c => c.id === selectedCourtId) || COURTS[0];

  // Determine if selected date is weekend (Friday or Saturday)
  const isWeekendSelected = useMemo(() => {
    const d = new Date(selectedDate);
    const day = d.getDay();
    return day === 5 || day === 6;
  }, [selectedDate]);

  // Compute exactly 12 slots for selected court & date based on 90-minute schedule
  const slots: TimeSlot[] = useMemo(() => {
    const now = Date.now();

    return SCHEDULE_SLOTS_DEFINITION.map((def) => {
      // Base dynamic price calculation from admin pricing
      let basePrice = 2000;
      if (def.period === 'morning') basePrice = pricing.morningSlotPrice;
      else if (def.period === 'afternoon') basePrice = pricing.afternoonSlotPrice;
      else if (def.period === 'evening') basePrice = pricing.eveningSlotPrice;

      // Pitch multiplier: Pitch Bravo (5v5) is cheaper; Full Arena is higher
      if (selectedCourt.id === 'pitch-bravo') {
        basePrice = Math.round(basePrice * 0.85);
      } else if (selectedCourt.id === 'full-arena') {
        basePrice = Math.round(basePrice * 1.6);
      }

      // Weekend surcharge (Friday & Saturday in Dhaka)
      const slotPrice = isWeekendSelected ? basePrice + pricing.weekendSurcharge : basePrice;

      // Strict no double booking: check if already booked
      const existingBooking = bookings.find(
        b => b.courtId === selectedCourt.id && b.date === selectedDate && (b.slotNumber === def.slotNumber || b.startTime === def.startTime)
      );

      // Check active 10-minute hold
      const slotKey = `${selectedCourt.id}_${selectedDate}_${def.slotNumber}`;
      const activeHold = slotHolds.find(h => h.slotKey === slotKey && h.expiresAt > now);

      let status: TimeSlot['status'] = 'available';
      let bookedBy: string | undefined = undefined;
      let bookingId: string | undefined = undefined;
      let holdExpiresAt: number | undefined = undefined;

      if (existingBooking) {
        status = 'booked';
        bookedBy = existingBooking.teamName;
        bookingId = existingBooking.bookingCode;
      } else if (activeHold) {
        status = 'holding';
        bookedBy = `${activeHold.teamName} (In Checkout)`;
        holdExpiresAt = activeHold.expiresAt;
      }

      return {
        id: `slot-${selectedCourt.id}-${selectedDate}-${def.slotNumber}`,
        slotNumber: def.slotNumber,
        courtId: selectedCourt.id,
        startTime: def.startTime,
        endTime: def.endTime,
        displayTime: def.displayTime,
        durationMinutes: 90,
        period: def.period,
        price: slotPrice,
        isPeak: def.period === 'evening' || isWeekendSelected,
        status,
        bookedBy,
        bookingId,
        holdExpiresAt
      };
    });
  }, [selectedCourt.id, selectedDate, pricing, isWeekendSelected, bookings, slotHolds]);

  // Filter slots by selected period
  const filteredSlots = useMemo(() => {
    if (selectedPeriod === 'all') return slots;
    return slots.filter(s => s.period === selectedPeriod);
  }, [slots, selectedPeriod]);

  // Slot counts
  const availableCount = slots.filter(s => s.status === 'available').length;
  const bookedCount = slots.filter(s => s.status === 'booked').length;
  const holdingCount = slots.filter(s => s.status === 'holding').length;

  return (
    <section id="booking" className="relative py-12 md:py-16 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!hideHeading && (
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide uppercase mb-3">
              <Clock className="w-3.5 h-3.5" />
              <span>Official Match Booking Engine · 12 Daily 90-Min Slots</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-display">
              Reserve Your <span className="text-emerald-400">Floodlit Turf Slot</span>
            </h2>
            <p className="mt-2 text-slate-300 text-sm sm:text-base">
              12 slots daily (06:00 AM to 12:00 AM Midnight), 90 minutes each. Pick any date up to 60 days ahead. Pay online with bKash, Nagad or card with just a <strong className="text-emerald-400">৳500 advance</strong> or full payment.
            </p>
          </div>
        )}

        {/* 1. Court Selector */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Step 1: Select Pitch Specification</span>
            </label>
            <span className="text-xs text-emerald-400/90 font-medium">
              Floodlit · Metro Viaduct View
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {COURTS.map((court) => {
              const isSelected = selectedCourtId === court.id;
              return (
                <button
                  key={court.id}
                  type="button"
                  onClick={() => setSelectedCourtId(court.id)}
                  className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-b from-emerald-950/70 to-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                      : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        {court.code} · {court.format}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white mt-1.5 font-display">
                        {court.name}
                      </h3>
                    </div>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-1 mb-2">
                    {court.tagline}
                  </p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                    <span className="text-slate-400">{court.dimensions}</span>
                    <span className="font-bold text-emerald-400">90 Min Sessions</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 60-Day Calendar Browser */}
        <div className="mb-8 p-4 sm:p-6 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Step 2: Choose Date (60-Day Advance Booking Window)</span>
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                {isWeekendSelected ? (
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Weekend Rate Active (Friday & Saturday)
                  </span>
                ) : (
                  <span>Weekday Standard Rates (Sunday – Thursday)</span>
                )}
              </p>
            </div>

            {/* Direct date input for rapid 60-day jumping */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">Jump to Date:</span>
              <input
                type="date"
                min={todayStr}
                max={maxDate}
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Horizontal scrollable date pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-emerald-500/20">
            {calendarDates.slice(0, 28).map((d) => {
              const isSelected = selectedDate === d.iso;
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setSelectedDate(d.iso)}
                  className={`shrink-0 flex flex-col items-center justify-center min-w-[70px] py-2.5 px-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                      : d.isWeekend
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-slate-950' : 'text-slate-400'}`}>
                    {d.dayName}
                  </span>
                  <span className="text-lg font-black leading-none my-1 font-mono">
                    {d.dayNum}
                  </span>
                  <span className={`text-[10px] ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                    {d.monthName}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Scroll right for more dates or use date picker for dates up to 60 days ahead</span>
            <span className="text-emerald-400 font-semibold">{selectedDate}</span>
          </div>
        </div>

        {/* 3. Slot Schedule (12 Slots x 90 Mins) */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight font-display">
                12 Daily Slots (90 Mins Each · 06:00 AM – 12:00 AM)
              </h3>
            </div>

            {/* Filter pills & legend */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 text-xs">
                {(['all', 'morning', 'afternoon', 'evening'] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-2.5 py-1 rounded capitalize transition-colors cursor-pointer text-xs font-medium ${
                      selectedPeriod === period
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {period === 'evening' ? 'Evening Prime' : period}
                  </button>
                ))}
              </div>

              {/* Status tally */}
              <div className="hidden lg:flex items-center gap-3 text-xs text-slate-300 ml-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{availableCount} Available</span>
                </span>
                {holdingCount > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span>{holdingCount} In Payment</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                  <span>{bookedCount} Booked</span>
                </span>
              </div>
            </div>
          </div>

          {/* 12 Slots Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredSlots.map((slot) => {
              const isAvailable = slot.status === 'available';
              const isHolding = slot.status === 'holding';
              const isBooked = slot.status === 'booked';

              return (
                <div
                  key={slot.id}
                  className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isAvailable
                      ? 'bg-slate-900/70 border-white/10 hover:border-emerald-500/60 hover:bg-slate-900/90 shadow-sm'
                      : isHolding
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                      : 'bg-slate-950/60 border-white/5 opacity-70'
                  }`}
                >
                  <div>
                    {/* Top Row: Slot # & Period */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                        Slot #{slot.slotNumber} · 90 Min
                      </span>
                      {slot.period === 'evening' ? (
                        <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1">
                          <Moon className="w-3 h-3" /> Floodlight Prime
                        </span>
                      ) : slot.period === 'morning' ? (
                        <span className="text-[10px] font-semibold text-sky-400 flex items-center gap-1">
                          <Sun className="w-3 h-3" /> Morning Fresh
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">
                          Afternoon
                        </span>
                      )}
                    </div>

                    {/* Time */}
                    <div className="font-mono text-base font-bold text-white mb-1">
                      {slot.displayTime}
                    </div>

                    {/* Price & Advance Note */}
                    <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-white/10">
                      <div>
                        <span className="text-xl font-black text-emerald-400 font-mono">
                          ৳{slot.price.toLocaleString()}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          Pay ৳500 adv or full
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div>
                        {isAvailable && (
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            Free Slot
                          </span>
                        )}
                        {isHolding && (
                          <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                            <Timer className="w-3 h-3 animate-spin" /> Held 10 Min
                          </span>
                        )}
                        {isBooked && (
                          <span className="text-[11px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> {slot.bookedBy || 'Reserved'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="mt-3 pt-2">
                    {isAvailable ? (
                      <button
                        type="button"
                        onClick={() => setSelectedSlotForBooking(slot)}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                      >
                        <span>Book Slot Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : isHolding ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2 px-3 rounded-xl bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20 cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        <Timer className="w-3.5 h-3.5" />
                        <span>Held for Payment</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2 px-3 rounded-xl bg-white/5 text-slate-500 text-xs font-medium cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Unavailable · One Slot, One Team</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature note banner */}
        <div className="mt-8 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Crossbar Metro Arena Guarantee:</strong> Strict no double-booking policy. 10-minute hold protects your slot during checkout. Pay online securely with bKash, Nagad, or Card.
            </span>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="font-semibold text-emerald-400">Need Help?</span>
            <a
              href="https://wa.me/8801796337133?text=Hi%20Crossbar%2C%20I%20have%20a%20question%20about%20booking"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold"
            >
              WhatsApp Turf Support
            </a>
          </div>
        </div>
      </div>

      {/* Booking Checkout Modal */}
      {selectedSlotForBooking && (
        <BookingModal
          court={selectedCourt}
          slot={selectedSlotForBooking}
          selectedDate={selectedDate}
          onClose={() => setSelectedSlotForBooking(null)}
          onBookingConfirmed={(b) => {
            onBookingSuccess(b);
            setSelectedSlotForBooking(null);
          }}
        />
      )}
    </section>
  );
};
