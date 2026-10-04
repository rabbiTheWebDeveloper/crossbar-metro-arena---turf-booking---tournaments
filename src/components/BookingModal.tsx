'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Court, TimeSlot, BookingAddOn, Booking } from '../types';
import { BOOKING_ADDONS, VENUE_INFO } from '../data/initialData';
import { useArena } from '../context/ArenaContext';
import {
  X,
  CheckCircle,
  Shield,
  Phone,
  User,
  Users,
  Calendar,
  Clock,
  CreditCard,
  ChevronRight,
  AlertCircle,
  Timer,
  Lock,
  Sparkles,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BookingModalProps {
  court: Court;
  slot: TimeSlot;
  selectedDate: string; // YYYY-MM-DD
  onClose: () => void;
  onBookingConfirmed: (newBooking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  court,
  slot,
  selectedDate,
  onClose,
  onBookingConfirmed
}) => {
  const { handlePlaceSlotHold, handleReleaseSlotHold } = useArena();

  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [teamName, setTeamName] = useState('');
  const [matchType, setMatchType] = useState<Booking['matchType']>('friendly');
  const [selectedAddOns, setSelectedAddOns] = useState<BookingAddOn[]>([]);
  
  // Payment choice: ৳500 Advance or Full Payment
  const [paymentChoice, setPaymentChoice] = useState<'advance_500' | 'full_payment'>('advance_500');
  const [paymentGateway, setPaymentGateway] = useState<'bkash' | 'nagad' | 'card'>('bkash');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<'details' | 'verifying_sslcommerz' | 'confirmed'>('details');

  // 10-Minute Hold Countdown (600 seconds)
  const [secondsRemaining, setSecondsRemaining] = useState(600);

  // Place slot hold on mount
  useEffect(() => {
    handlePlaceSlotHold(court.id, selectedDate, slot.slotNumber, teamName || 'Player Team');

    const countdown = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          handleReleaseSlotHold(court.id, selectedDate, slot.slotNumber);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdown);
    };
  }, [court.id, selectedDate, slot.slotNumber, handlePlaceSlotHold, handleReleaseSlotHold, teamName]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Pricing math
  const courtPrice = slot.price;
  const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + item.price, 0);
  const totalPrice = courtPrice + addOnsTotal;

  const advanceAmount = paymentChoice === 'advance_500' ? Math.min(500, totalPrice) : totalPrice;
  const dueAmount = Math.max(0, totalPrice - advanceAmount);

  const toggleAddOn = (addon: BookingAddOn) => {
    if (selectedAddOns.some(a => a.id === addon.id)) {
      setSelectedAddOns(selectedAddOns.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
    }
  };

  const handleClose = () => {
    handleReleaseSlotHold(court.id, selectedDate, slot.slotNumber);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (secondsRemaining <= 0) {
      setError('Your 10-minute hold has expired. Please select the slot again.');
      return;
    }
    if (!captainName.trim()) {
      setError('Please provide the captain or team representative name.');
      return;
    }
    if (!captainPhone.trim() || captainPhone.length < 10) {
      setError('Please enter a valid phone number (e.g. 01796-337133).');
      return;
    }
    if (!teamName.trim()) {
      setError('Please specify your squad or team name.');
      return;
    }

    setError('');
    setIsProcessing(true);
    setProcessStep('verifying_sslcommerz');

    // Simulate SSLCommerz / MFS Secure Gateway Verification
    setTimeout(() => {
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const bookingCode = `CMA-${randomCode}`;

      const newBooking: Booking = {
        id: `book-${Date.now()}`,
        bookingCode,
        courtId: court.id,
        courtName: court.name,
        date: selectedDate,
        slotNumber: slot.slotNumber,
        startTime: slot.startTime,
        endTime: slot.endTime,
        displayTime: slot.displayTime,
        captainName: captainName.trim(),
        captainPhone: captainPhone.trim(),
        teamName: teamName.trim(),
        playerCount: court.format === '7 vs 7' ? 14 : court.format === '5 vs 5' ? 10 : 20,
        matchType,
        addOns: selectedAddOns,
        courtPrice,
        addOnsPrice: addOnsTotal,
        totalPrice,
        paymentType: paymentChoice,
        advanceAmount,
        dueAmount,
        paymentMethod: paymentGateway,
        paymentStatus: paymentChoice === 'full_payment' ? 'paid_full' : 'paid_advance',
        notes: notes.trim(),
        createdAt: new Date().toISOString()
      };

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#22c55e', '#ffffff', '#38bdf8']
        });
      } catch {
        // Safe fallback
      }

      onBookingConfirmed(newBooking);
      setIsProcessing(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-[#0c131a] border border-white/15 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Hold Countdown Bar */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <Timer className="w-4 h-4 text-amber-400 animate-spin" />
            <span>Slot Held For You (10 Min Window)</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
            <span>{formatTimer(secondsRemaining)}</span>
            <span className="text-[10px] text-amber-400/80 font-normal">remaining</span>
          </div>
        </div>

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-[#0c131a] p-5 border-b border-white/10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4" />
              <span>Instant Turf Booking · Slot #{slot.slotNumber} (90 Mins)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
              {court.name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
              <span className="flex items-center gap-1 text-emerald-300 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {slot.displayTime}
              </span>
              <span>·</span>
              <span>{selectedDate}</span>
              <span>·</span>
              <span className="text-slate-400">{court.dimensions}</span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading Overlay when verifying with SSLCommerz */}
        {processStep === 'verifying_sslcommerz' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 border-t-emerald-400 animate-spin mx-auto flex items-center justify-center" />
            <h3 className="text-lg font-bold text-white">Verifying Secure Payment...</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Connecting with SSLCommerz / {paymentGateway.toUpperCase()} payment gateway. Locking slot #{slot.slotNumber} to prevent double booking.
            </p>
          </div>
        )}

        {/* Content Form */}
        {processStep === 'details' && (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {secondsRemaining <= 60 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Less than 1 minute left on your hold! Confirm now to lock this slot.</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Captain & Team Details */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                <span>Captain & Squad Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Captain / Organizer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Ahmed"
                    value={captainName}
                    onChange={(e) => setCaptainName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contact Phone Number (bKash/Nagad) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01796-337133"
                    value={captainPhone}
                    onChange={(e) => setCaptainPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Team / Squad Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Uttara Metro FC"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Match Category
                  </label>
                  <select
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value as Booking['matchType'])}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#111a24] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="friendly">Friendly Match (7v7 / 5v5)</option>
                    <option value="competitive">Competitive Squad Challenge</option>
                    <option value="practice">Team Practice / Training</option>
                    <option value="corporate">Corporate Friendly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Match Day Amenities */}
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Match Day Amenities</span>
                </span>
                <span className="text-xs text-slate-400 font-normal">Optional</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {BOOKING_ADDONS.map((addon) => {
                  const isSelected = selectedAddOns.some(a => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddOn(addon)}
                      className={`flex items-start justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500 text-white'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs sm:text-sm text-white flex items-center gap-1.5">
                          <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] border ${
                            isSelected ? 'bg-emerald-500 border-emerald-500 text-black font-black' : 'border-slate-500'
                          }`}>
                            {isSelected && '✓'}
                          </span>
                          <span>{addon.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{addon.description}</div>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400 shrink-0 ml-2">
                        +৳{addon.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Choice: ৳500 Advance vs Full Price */}
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Online Payment Terms</span>
                </span>
                <span className="text-xs text-emerald-400 font-medium">৳500 advance or full price</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setPaymentChoice('advance_500')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentChoice === 'advance_500'
                      ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-sm">৳500 Advance</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      Most Popular
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Pay ৳500 now online to confirm slot.
                  </div>
                  <div className="text-[11px] text-emerald-400/90 mt-1 font-mono">
                    Rest ৳{dueAmount.toLocaleString()} paid at turf counter before match.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentChoice('full_payment')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentChoice === 'full_payment'
                      ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-sm">Full Payment Online</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400">
                      Hassle Free
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Pay complete ৳{totalPrice.toLocaleString()} now.
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1 font-mono">
                    ৳0 balance due at turf. Direct fast-track pitch entry.
                  </div>
                </button>
              </div>

              {/* Gateway selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentGateway('bkash')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentGateway === 'bkash'
                      ? 'bg-[#E2136E]/20 border-[#E2136E] text-white shadow-sm ring-1 ring-[#E2136E]/40'
                      : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-bold text-[#E2136E]">bKash</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Online Payment</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentGateway('nagad')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentGateway === 'nagad'
                      ? 'bg-[#F7941D]/20 border-[#F7941D] text-white shadow-sm ring-1 ring-[#F7941D]/40'
                      : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-bold text-[#F7941D]">Nagad</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Mobile Pay</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentGateway('card')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentGateway === 'card'
                      ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/40'
                      : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-bold text-white">SSLCommerz / Card</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Visa / Mastercard</div>
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Special Requests or Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Bringing team jerseys, warm-up 10 mins early"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Price breakdown & submit */}
            <div className="pt-4 border-t border-white/10">
              <div className="space-y-1.5 text-xs text-slate-300 mb-4">
                <div className="flex justify-between">
                  <span>90-Min Turf Slot ({court.name})</span>
                  <span className="font-mono font-semibold text-white">৳{courtPrice.toLocaleString()}</span>
                </div>
                {addOnsTotal > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Match Day Equipment ({selectedAddOns.length})</span>
                    <span className="font-mono font-semibold">+৳{addOnsTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-300 pt-1 border-t border-white/5">
                  <span>Total Booking Cost</span>
                  <span className="font-mono font-bold text-white">৳{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/5">
                  <span className="text-emerald-400">
                    Pay Now ({paymentChoice === 'advance_500' ? '৳500 Advance' : 'Full Online'})
                  </span>
                  <span className="font-mono text-emerald-400 text-lg">
                    ৳{advanceAmount.toLocaleString()}
                  </span>
                </div>
                {dueAmount > 0 && (
                  <div className="flex justify-between text-[11px] text-amber-400">
                    <span>Balance Due At Turf Reception</span>
                    <span className="font-mono font-bold">৳{dueAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-1/3 py-3 rounded-xl border border-white/15 text-slate-300 hover:bg-white/5 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Cancel Hold
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4 text-slate-950" />
                  <span>Pay ৳{advanceAmount.toLocaleString()} & Confirm Slot</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
