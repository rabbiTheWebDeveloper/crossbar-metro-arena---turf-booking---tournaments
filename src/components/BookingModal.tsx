'use client';

import React, { useState } from 'react';
import { Court, TimeSlot, BookingAddOn, Booking } from '../types';
import { BOOKING_ADDONS, VENUE_INFO } from '../data/initialData';
import { X, CheckCircle, Shield, Phone, User, Users, Calendar, Clock, CreditCard, ChevronRight, AlertCircle } from 'lucide-react';
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
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [teamName, setTeamName] = useState('');
  const [matchType, setMatchType] = useState<Booking['matchType']>('friendly');
  const [selectedAddOns, setSelectedAddOns] = useState<BookingAddOn[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<Booking['paymentMethod']>('pay_at_turf');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate pricing
  const courtPrice = slot.price;
  const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + item.price, 0);
  const totalPrice = courtPrice + addOnsTotal;

  const toggleAddOn = (addon: BookingAddOn) => {
    if (selectedAddOns.some(a => a.id === addon.id)) {
      setSelectedAddOns(selectedAddOns.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!captainName.trim()) {
      setError('Please provide the captain or organizer name.');
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
    setIsSubmitting(true);

    // Generate random 4-digit code
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `CMA-${randomCode}`;

    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      bookingCode,
      courtId: court.id,
      courtName: court.name,
      date: selectedDate,
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
      paymentMethod,
      paymentStatus: paymentMethod === 'pay_at_turf' ? 'confirmed_unpaid' : 'paid_advance',
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    setTimeout(() => {
      // Confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#10b981', '#ffffff', '#38bdf8']
        });
      } catch {
        // Safe fallback
      }

      onBookingConfirmed(newBooking);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-[#0c131a] border border-white/15 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-[#0c131a] p-5 border-b border-white/10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4" />
              <span>Reserve Court Slot</span>
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
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
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
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Ahmed"
                    value={captainName}
                    onChange={(e) => setCaptainName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contact Phone Number *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="01796-337133"
                    value={captainPhone}
                    onChange={(e) => setCaptainPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Team / Squad Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Uttara Metro FC"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
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
                  <option value="corporate">Corporate Office Friendly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Add-ons Section */}
          <div className="pt-2">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Match Day Amenities & Equipment</span>
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

          {/* Payment Method */}
          <div className="pt-2">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Payment Option</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('pay_at_turf')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'pay_at_turf'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-sm'
                    : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-bold text-white">Pay at Turf</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">৳0 Upfront</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bkash')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'bkash'
                    ? 'bg-[#E2136E]/20 border-[#E2136E] text-white shadow-sm'
                    : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-bold text-[#E2136E]">bKash</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Merchant / Send</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('nagad')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'nagad'
                    ? 'bg-[#F7941D]/20 border-[#F7941D] text-white shadow-sm'
                    : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-bold text-[#F7941D]">Nagad</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Mobile Pay</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-sm'
                    : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-bold text-white">Debit/Credit</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Visa / Master</div>
              </button>
            </div>

            {paymentMethod !== 'pay_at_turf' && (
              <div className="mt-2.5 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-xs text-slate-300">
                <span className="text-emerald-400 font-semibold">Payment instruction:</span> Instant slot confirmation code will be issued. Complete remaining payment to Crossbar Arena official number <strong className="text-white">{VENUE_INFO.phone}</strong> or at the reception counter before kickoff.
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Special Requests or Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Need warm up 10 mins early, will bring team photographer"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Bill Breakdown & Submit */}
          <div className="pt-4 border-t border-white/10">
            <div className="space-y-1.5 text-xs text-slate-300 mb-4">
              <div className="flex justify-between">
                <span>Turf Slot ({court.name})</span>
                <span className="font-mono font-semibold text-white">৳{courtPrice.toLocaleString()}</span>
              </div>
              {addOnsTotal > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Match Day Equipment & Add-ons ({selectedAddOns.length})</span>
                  <span className="font-mono font-semibold">+৳{addOnsTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/5">
                <span>Total Amount Due</span>
                <span className="font-mono text-emerald-400 text-lg">৳{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 rounded-xl border border-white/15 text-slate-300 hover:bg-white/5 font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Reserving Slot...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-slate-950" />
                    <span>Confirm Match Booking</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
