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
  Check,
  Smartphone,
  ArrowRight
} from 'lucide-react';

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
  const {
    handlePlaceSlotHold,
    handleReleaseSlotHold,
    currentUser,
    pricing,
    teams,
    setShowSSLCommerzModal,
    setPendingBookingData
  } = useArena();

  // Pre-fill if logged in as player
  const captainTeams = useMemo(() => {
    if (!currentUser || currentUser.role !== 'player') return [];
    return teams.filter(t => t.captainPhone === currentUser.phone || t.captainName === currentUser.name);
  }, [currentUser, teams]);

  const [captainName, setCaptainName] = useState(currentUser?.name || '');
  const [captainPhone, setCaptainPhone] = useState(currentUser?.phone || '');
  const [teamName, setTeamName] = useState(captainTeams[0]?.name || '');
  const [matchType, setMatchType] = useState<Booking['matchType']>('friendly');
  const [selectedAddOns, setSelectedAddOns] = useState<BookingAddOn[]>([]);
  
  // Payment choice: ৳500 Advance or Full Payment (Section 4 Rule 6)
  const defaultAdvance = pricing.advanceAmount || 500;
  const [paymentChoice, setPaymentChoice] = useState<'advance_500' | 'full_payment'>('advance_500');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // 10-Minute Hold Countdown (Section 4 Rule 3)
  const holdSeconds = (pricing.holdMinutes || 10) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(holdSeconds);

  // Place slot hold on mount
  useEffect(() => {
    handlePlaceSlotHold(court.id, selectedDate, slot.slotNumber, teamName || 'Holding Player');

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

  // Pricing calculation
  const courtPrice = slot.price;
  const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + item.price, 0);
  const totalPrice = courtPrice + addOnsTotal;

  const advanceAmount = paymentChoice === 'advance_500' ? Math.min(defaultAdvance, totalPrice) : totalPrice;
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

  const handleSubmitToSSL = (e: React.FormEvent) => {
    e.preventDefault();

    if (secondsRemaining <= 0) {
      setError('Your 10-minute hold has expired. Please select the slot again.');
      return;
    }
    if (!captainName.trim()) {
      setError('Please provide the captain or squad representative name.');
      return;
    }
    if (!captainPhone.trim() || captainPhone.length < 10) {
      setError('Please enter a valid Bangladeshi mobile number (e.g. 01844-332211).');
      return;
    }
    if (!teamName.trim()) {
      setError('Please specify your squad or team name.');
      return;
    }

    setError('');

    // Prepare pending booking and open SSLCommerz modal
    const pendingBooking: Partial<Booking> = {
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
      playerCount: 14,
      matchType,
      addOns: selectedAddOns,
      courtPrice,
      addOnsPrice: addOnsTotal,
      totalPrice,
      paymentType: paymentChoice,
      advanceAmount,
      dueAmount,
      notes
    };

    setPendingBookingData(pendingBooking);
    onClose(); // close details modal
    setShowSSLCommerzModal(true); // open payment gateway modal
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-[#0b1016] border border-emerald-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/20 blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-[#0b1016] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">
                Slot #{slot.slotNumber} · {slot.period.toUpperCase()}
              </span>
              <span className="text-white/20">·</span>
              <span className="text-xs text-slate-300 font-semibold">{court.name}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-display uppercase tracking-wide">
              {slot.displayTime}
            </h3>
            <div className="text-xs text-slate-300 mt-0.5">
              Match Date: <strong className="text-white">{selectedDate}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 10-Minute Hold Badge */}
            <div className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-bold ${
              secondsRemaining < 120
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}>
              <Timer className="w-3.5 h-3.5" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmitToSSL} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Captain & Team Details */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              1. Squad &amp; Captain Information
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Captain / Booker Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Siam Chowdhury"
                    value={captainName}
                    onChange={e => setCaptainName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bangladeshi Mobile (SMS Pass) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="01844-332211"
                    value={captainPhone}
                    onChange={e => setCaptainPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Squad / Team Name *
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Uttara Metro FC"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                {captainTeams.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-400">
                    <span>Quick select:</span>
                    {captainTeams.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTeamName(t.name)}
                        className="text-emerald-400 hover:underline font-bold"
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Match Category
                </label>
                <select
                  value={matchType}
                  onChange={e => setMatchType(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="friendly">Friendly Scrimmage</option>
                  <option value="competitive">Competitive Tournament Match</option>
                  <option value="practice">Squad Tactical Training</option>
                  <option value="corporate">Corporate / Office Game</option>
                </select>
              </div>
            </div>
          </div>

          {/* Add-Ons Selection */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              2. Optional Turf Equipment Add-Ons
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BOOKING_ADDONS.map(addon => {
                const isSelected = selectedAddOns.some(a => a.id === addon.id);
                return (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddOn(addon)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-white'
                        : 'bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{addon.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{addon.description}</div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="text-xs font-mono font-bold text-emerald-400">+৳{addon.price}</div>
                      <div className={`w-4 h-4 rounded-md border mt-1 flex items-center justify-center ${
                        isSelected ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-white/20'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Amount Choice: ৳500 Advance vs Full Payment */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                3. Payment Lock-In Option (bKash / Nagad / Cards)
              </h4>
              <span className="text-[11px] text-slate-400 font-semibold">
                Total Price: <strong className="text-white font-mono">৳{totalPrice.toLocaleString()}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: ৳500 Advance */}
              <div
                onClick={() => setPaymentChoice('advance_500')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  paymentChoice === 'advance_500'
                    ? 'bg-emerald-500/15 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-white/[0.02] border-white/10 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white uppercase">Pay ৳{defaultAdvance} Advance</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentChoice === 'advance_500' ? 'border-emerald-400 bg-emerald-400' : 'border-white/30'
                  }`}>
                    {paymentChoice === 'advance_500' && <div className="w-2 h-2 rounded-full bg-slate-950"></div>}
                  </div>
                </div>
                <div className="text-xl font-black font-mono text-emerald-400">
                  ৳{defaultAdvance.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Pay remaining <strong className="text-white font-mono">৳{dueAmount.toLocaleString()}</strong> in cash/bKash at turf reception upon arrival.
                </div>
              </div>

              {/* Option 2: Full Payment */}
              <div
                onClick={() => setPaymentChoice('full_payment')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  paymentChoice === 'full_payment'
                    ? 'bg-emerald-500/15 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-white/[0.02] border-white/10 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white uppercase">100% Full Payment</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentChoice === 'full_payment' ? 'border-emerald-400 bg-emerald-400' : 'border-white/30'
                  }`}>
                    {paymentChoice === 'full_payment' && <div className="w-2 h-2 rounded-full bg-slate-950"></div>}
                  </div>
                </div>
                <div className="text-xl font-black font-mono text-emerald-400">
                  ৳{totalPrice.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Clear 100% online. Zero balance due on matchday; walk straight onto turf!
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation Notice (Section 4 Rule 7) */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-slate-300 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Arena Cancellation Policy</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Cancellations allowed up to <strong>24 hours</strong> before kickoff from your Player Portal. Advance money goes to refund queue. Later than that, call arena hotline.
            </p>
          </div>

          {/* Submit to SSLCommerz */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Proceed to SSLCommerz Payment (৳{advanceAmount.toLocaleString()})</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

      </div>
    </div>
  );
};
