'use client';

import React, { useState, useMemo } from 'react';
import { Court, TimeSlot, Booking } from '../types';
import { COURTS } from '../data/initialData';
import { Calendar, Clock, Sun, Moon, Sparkles, Shield, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { BookingModal } from './BookingModal';

interface BookingSectionProps {
  bookings: Booking[];
  onBookingSuccess: (booking: Booking) => void;
}

export const BookingSection: React.FC<BookingSectionProps> = ({
  bookings,
  onBookingSuccess
}) => {
  const [selectedCourtId, setSelectedCourtId] = useState<string>('pitch-alpha');

  // Next 14 dates generator starting from today/tomorrow
  const dateOptions = useMemo(() => {
    const dates = [];
    const base = new Date();
    // Start from today
    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.toLocaleDateString('en-US', { day: '2-digit' });
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      dates.push({
        iso,
        dayName: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : dayName,
        dayNum,
        monthName,
        isWeekend: d.getDay() === 5 || d.getDay() === 6 // Friday/Saturday in BD
      });
    }
    return dates;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].iso);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'morning' | 'afternoon' | 'prime_night' | 'late_night'>('all');

  // Modal state
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<TimeSlot | null>(null);

  const selectedCourt = COURTS.find(c => c.id === selectedCourtId) || COURTS[0];

  // Generate 1-hour slots from 06:00 to 02:00 next day
  const slots: TimeSlot[] = useMemo(() => {
    const rawSlots: { start: number; end: number; period: TimeSlot['period'] }[] = [
      // Morning
      { start: 6, end: 7, period: 'morning' },
      { start: 7, end: 8, period: 'morning' },
      { start: 8, end: 9, period: 'morning' },
      { start: 9, end: 10, period: 'morning' },
      { start: 10, end: 11, period: 'morning' },
      { start: 11, end: 12, period: 'morning' },
      // Afternoon
      { start: 12, end: 13, period: 'afternoon' },
      { start: 13, end: 14, period: 'afternoon' },
      { start: 14, end: 15, period: 'afternoon' },
      { start: 15, end: 16, period: 'afternoon' },
      { start: 16, end: 17, period: 'afternoon' },
      { start: 17, end: 18, period: 'afternoon' },
      // Floodlight Prime Night
      { start: 18, end: 19, period: 'prime_night' },
      { start: 19, end: 20, period: 'prime_night' },
      { start: 20, end: 21, period: 'prime_night' },
      { start: 21, end: 22, period: 'prime_night' },
      { start: 22, end: 23, period: 'prime_night' },
      // Late Night
      { start: 23, end: 24, period: 'late_night' },
      { start: 0, end: 1, period: 'late_night' },
      { start: 1, end: 2, period: 'late_night' }
    ];

    const formatHour = (h: number) => {
      const isPm = h >= 12 && h < 24;
      const num = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${String(num).padStart(2, '0')}:00 ${isPm ? 'PM' : 'AM'}`;
    };

    return rawSlots.map((s, idx) => {
      const startTimeStr = `${String(s.start).padStart(2, '0')}:00`;
      const endTimeStr = `${String(s.end).padStart(2, '0')}:00`;
      const displayTime = `${formatHour(s.start)} - ${formatHour(s.end)}`;
      const isPeak = s.period === 'prime_night' || s.period === 'late_night';
      const price = isPeak ? selectedCourt.nightPrice : selectedCourt.dayPrice;

      // Check if slot is already booked in our store for this court and date
      const existingBooking = bookings.find(
        b => b.courtId === selectedCourt.id && b.date === selectedDate && b.startTime === startTimeStr
      );

      let status: TimeSlot['status'] = 'available';
      let bookedBy: string | undefined = undefined;
      let bookingId: string | undefined = undefined;

      if (existingBooking) {
        status = 'booked';
        bookedBy = existingBooking.teamName;
        bookingId = existingBooking.id;
      }

      return {
        id: `slot-${selectedCourt.id}-${selectedDate}-${idx}`,
        courtId: selectedCourt.id,
        startTime: startTimeStr,
        endTime: endTimeStr,
        displayTime,
        period: s.period,
        price,
        isPeak,
        status,
        bookedBy,
        bookingId
      };
    });
  }, [selectedCourt, selectedDate, bookings]);

  // Filtered slots by selected period
  const filteredSlots = useMemo(() => {
    if (selectedPeriod === 'all') return slots;
    return slots.filter(s => s.period === selectedPeriod);
  }, [slots, selectedPeriod]);

  const availableCount = filteredSlots.filter(s => s.status === 'available').length;

  return (
    <section id="booking" className="py-12 md:py-20 bg-[#090e13] border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Clock className="w-3.5 h-3.5" />
            <span>Real-Time Slot Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display uppercase tracking-tight">
            Reserve Your Playing Slot
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            Select your preferred pitch, date, and hourly slot. Instant confirmation pass generated on booking.
          </p>
        </div>

        {/* Step 1: Court Selector */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Step 1: Choose Pitch Arena</span>
            <span className="text-xs text-emerald-400 font-semibold">{COURTS.length} Available Layouts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COURTS.map((court) => {
              const isSelected = selectedCourtId === court.id;
              return (
                <button
                  key={court.id}
                  onClick={() => setSelectedCourtId(court.id)}
                  className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer group ${
                    isSelected
                      ? 'bg-gradient-to-b from-emerald-950/60 to-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-xs">
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono mb-1">
                    {court.format}
                  </div>
                  <h3 className="text-lg font-bold text-white font-display mb-1 group-hover:text-emerald-300 transition-colors">
                    {court.name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                    {court.tagline}
                  </p>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Day: </span>
                      <span className="font-bold text-white font-mono">৳{court.dayPrice}</span>
                      <span className="text-slate-500 text-[10px]">/hr</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Night Floodlight: </span>
                      <span className="font-bold text-emerald-400 font-mono">৳{court.nightPrice}</span>
                      <span className="text-slate-500 text-[10px]">/hr</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Date Selector (Horizontal Scrollable Strip) */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2.5 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Step 2: Select Match Date</span>
            <span className="text-[10px] sm:text-xs text-slate-400">14-Day Advance Window</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {dateOptions.map((item) => {
              const isSelected = selectedDate === item.iso;
              return (
                <button
                  key={item.iso}
                  onClick={() => setSelectedDate(item.iso)}
                  className={`flex flex-col items-center justify-center min-w-[62px] sm:min-w-[76px] py-2 sm:py-3 px-1.5 sm:px-2 rounded-xl border transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20 scale-102'
                      : 'bg-white/[0.03] text-slate-300 border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className={`text-[10px] sm:text-[11px] uppercase tracking-wider ${isSelected ? 'text-slate-950 font-extrabold' : 'text-slate-400'}`}>
                    {item.dayName}
                  </span>
                  <span className={`text-lg sm:text-2xl font-black font-display leading-tight my-0.5 ${isSelected ? 'text-slate-950' : 'text-white'}`}>
                    {item.dayNum}
                  </span>
                  <span className={`text-[9px] sm:text-[10px] uppercase font-mono ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                    {item.monthName}
                  </span>
                  {item.isWeekend && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Time Filter Tabs */}
        <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="w-full sm:w-auto overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl whitespace-nowrap min-w-max">
              <button
                onClick={() => setSelectedPeriod('all')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedPeriod === 'all' ? 'bg-emerald-500 text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Slots
              </button>
              <button
                onClick={() => setSelectedPeriod('morning')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                  selectedPeriod === 'morning' ? 'bg-emerald-500 text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Morning</span>
              </button>
              <button
                onClick={() => setSelectedPeriod('afternoon')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedPeriod === 'afternoon' ? 'bg-emerald-500 text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Afternoon
              </button>
              <button
                onClick={() => setSelectedPeriod('prime_night')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                  selectedPeriod === 'prime_night' ? 'bg-emerald-500 text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Prime Floodlight</span>
              </button>
              <button
                onClick={() => setSelectedPeriod('late_night')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedPeriod === 'late_night' ? 'bg-emerald-500 text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Late Night (Till 2 AM)
              </button>
            </div>
          </div>

          <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-2 self-end sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-white font-medium">{availableCount} Available</span>
            <span className="text-slate-600">|</span>
            <span className="w-2 h-2 rounded-full bg-rose-500/80"></span>
            <span>Booked</span>
          </div>
        </div>

        {/* Step 4: Time Slots Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
          {filteredSlots.map((slot) => {
            const isBooked = slot.status === 'booked';
            return (
              <div
                key={slot.id}
                className={`p-2.5 sm:p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                  isBooked
                    ? 'bg-rose-950/20 border-rose-900/40 opacity-75'
                    : 'bg-white/[0.03] border-white/10 hover:border-emerald-500/50 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-emerald-500/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <span className="text-[11px] sm:text-xs font-semibold text-white truncate">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    {slot.isPeak && !isBooked && (
                      <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                        Peak
                      </span>
                    )}
                  </div>

                  <div className="text-xs sm:text-sm font-mono font-bold text-emerald-400 mb-2">
                    ৳{slot.price.toLocaleString()}
                  </div>
                </div>

                {isBooked ? (
                  <div className="pt-1.5 sm:pt-2 border-t border-rose-900/30">
                    <span className="block text-[10px] sm:text-[11px] font-semibold text-rose-400 uppercase tracking-wide">
                      Reserved
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 truncate block">
                      {slot.bookedBy || 'Private Squad'}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedSlotForBooking(slot)}
                    className="w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 hover:border-emerald-500 text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer group active:scale-95"
                  >
                    <span>Book Slot</span>
                    <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Pitch Specifications Footer Banner */}
        <div className="mt-8 p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <strong className="text-white">{selectedCourt.name}:</strong> {selectedCourt.turfType} · {selectedCourt.dimensions}
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-300 font-medium shrink-0">
            <span>✓ Match Bibs Available</span>
            <span>✓ Free High-Mast Lights</span>
            <span>✓ Mineral Water</span>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedSlotForBooking && (
        <BookingModal
          court={selectedCourt}
          slot={selectedSlotForBooking}
          selectedDate={selectedDate}
          onClose={() => setSelectedSlotForBooking(null)}
          onBookingConfirmed={(newBooking) => {
            setSelectedSlotForBooking(null);
            onBookingSuccess(newBooking);
          }}
        />
      )}
    </section>
  );
};
