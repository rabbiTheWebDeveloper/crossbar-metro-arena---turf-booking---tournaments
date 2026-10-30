'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { BOOKING_ADDONS } from '../data/initialData';
import { useArena, cleanPhone } from '../context/ArenaContext';
import { formatIsoDate, BD_PHONE_REGEX } from '../lib/dateUtils';
import { X, Shield, Phone, User, Users, AlertCircle, Timer, Check, ArrowRight } from 'lucide-react';

/**
 * Step 1 of the public online booking: collect squad details, add-ons and the payment option.
 * It hands a contract-shaped `pendingBooking` to the SSLCommerz confirm modal, which starts the
 * server-priced payment. No prices are ever sent to the server from here.
 */
export const BookingModal = ({ court, slot, selectedDate, onClose }) => {
    const { handlePlaceSlotHold, handleReleaseSlotHold, currentUser, isVisitor, pricing, teams, setShowSSLCommerzModal, setPendingBookingData } = useArena();

    const captainTeams = useMemo(() => {
        if (!currentUser || currentUser.role !== 'player') return [];
        const myPhone = cleanPhone(currentUser.phone);
        return teams.filter(t => (t.captainPhone && cleanPhone(t.captainPhone) === myPhone) || t.captainId === currentUser.id || t.captainName === currentUser.name);
    }, [currentUser, teams]);

    const [captainName, setCaptainName] = useState(!isVisitor ? (currentUser?.name || '') : '');
    const [captainPhone, setCaptainPhone] = useState(!isVisitor ? (currentUser?.phone || '') : '');
    const [teamName, setTeamName] = useState(captainTeams[0]?.name || '');
    const [matchType, setMatchType] = useState('friendly');
    const [selectedAddOnIds, setSelectedAddOnIds] = useState([]);
    const [paymentChoice, setPaymentChoice] = useState('advance_500');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Local (cosmetic) hold countdown; the real hold is created server-side when payment starts
    const holdMinutes = Number(pricing.holdMinutes) > 0 ? Number(pricing.holdMinutes) : 10;
    const [secondsRemaining, setSecondsRemaining] = useState(holdMinutes * 60);

    // Place the local hold once per slot/date (not on every team-name keystroke)
    useEffect(() => {
        handlePlaceSlotHold(court.id, selectedDate, slot.slotNumber, 'Holding player');
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
        return () => clearInterval(countdown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [court.id, selectedDate, slot.slotNumber]);

    const formatTimer = (secs) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

    // Price preview (same rules the server applies; the server recomputes before payment)
    const advanceSetting = Number(pricing.advanceAmount) > 0 ? Number(pricing.advanceAmount) : 500;
    const courtPrice = Number(slot.price) || 0;
    const selectedAddOns = BOOKING_ADDONS.filter(a => selectedAddOnIds.includes(a.id));
    const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + item.price, 0);
    const totalPrice = courtPrice + addOnsTotal;
    const advanceAmount = paymentChoice === 'advance_500' ? Math.min(advanceSetting, totalPrice) : totalPrice;
    const dueAmount = Math.max(0, totalPrice - advanceAmount);

    const toggleAddOn = (addon) => {
        setSelectedAddOnIds(prev => (prev.includes(addon.id) ? prev.filter(id => id !== addon.id) : [...prev, addon.id]));
    };

    const handleClose = () => {
        handleReleaseSlotHold(court.id, selectedDate, slot.slotNumber);
        onClose();
    };

    const handleSubmitToSSL = (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        if (secondsRemaining <= 0) {
            setError(`Your ${holdMinutes}-minute hold has expired. Please close this window and select the slot again.`);
            return;
        }
        if (!captainName.trim()) { setError('Please provide the captain or squad representative name.'); return; }
        const phone = cleanPhone(captainPhone);
        if (!BD_PHONE_REGEX.test(phone)) { setError('Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).'); return; }
        if (!teamName.trim()) { setError('Please specify your squad or team name.'); return; }
        setError('');
        setIsSubmitting(true);

        const pendingBooking = {
            date: selectedDate,
            slotNumber: slot.slotNumber,
            captainName: captainName.trim(),
            captainPhone: phone,
            teamName: teamName.trim(),
            playerCount: 14,
            matchType,
            addOns: selectedAddOnIds,
            paymentType: paymentChoice,
            notes: notes.trim()
        };
        setPendingBookingData(pendingBooking);
        setShowSSLCommerzModal(true);
        // Keep the local hold: the payment modal releases it if the customer backs out.
        onClose();
    };

    return (<div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-[#0b1016] border border-emerald-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">

        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/20 blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-[#0b1016] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">
                Slot #{slot.slotNumber} · {String(slot.period || '').toUpperCase()}
              </span>
              <span className="text-white/20">·</span>
              <span className="text-xs text-slate-300 font-semibold">{court.name}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-display uppercase tracking-wide">
              {slot.displayTime}
            </h3>
            <div className="text-xs text-slate-300 mt-0.5">
              Match date: <strong className="text-white">{formatIsoDate(selectedDate)}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-bold ${secondsRemaining < 120
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'}`} title="Time left to complete your details">
              <Timer className="w-3.5 h-3.5"/>
              <span>{formatTimer(secondsRemaining)}</span>
            </div>

            <button type="button" onClick={handleClose} className="p-1.5 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer" aria-label="Close">
              <X className="w-5 h-5"/>
            </button>
          </div>
        </div>

        {error && (<div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400"/>
            <span>{error}</span>
          </div>)}

        <form onSubmit={handleSubmitToSSL} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">

          {/* 1. Captain & team */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              1. Squad &amp; Captain Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Captain / Booker Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                  <input type="text" required placeholder="e.g. Siam Chowdhury" value={captainName} onChange={e => setCaptainName(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bangladeshi Mobile *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                  <input type="tel" required inputMode="numeric" placeholder="01XXXXXXXXX" value={captainPhone} onChange={e => setCaptainPhone(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"/>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Used to look up your booking and ticket pass.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Squad / Team Name *</label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                  <input type="text" required placeholder="e.g. Uttara Metro FC" value={teamName} onChange={e => setTeamName(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"/>
                </div>
                {captainTeams.length > 0 && (<div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-slate-400 flex-wrap">
                    <span>Quick select:</span>
                    {captainTeams.map(t => (<button key={t.id} type="button" onClick={() => setTeamName(t.name)} className="text-emerald-400 hover:underline font-bold cursor-pointer">
                        {t.name}
                      </button>))}
                  </div>)}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Match Category</label>
                <select value={matchType} onChange={e => setMatchType(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500">
                  <option value="friendly">Friendly Scrimmage</option>
                  <option value="competitive">Competitive Tournament Match</option>
                  <option value="practice">Squad Tactical Training</option>
                  <option value="corporate">Corporate / Office Game</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Add-ons */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              2. Optional Turf Equipment Add-Ons
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BOOKING_ADDONS.map(addon => {
                  const isSelected = selectedAddOnIds.includes(addon.id);
                  return (<button type="button" key={addon.id} onClick={() => toggleAddOn(addon)} className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-left ${isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 text-white'
                      : 'bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/5'}`}>
                    <div>
                      <div className="text-xs font-bold">{addon.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{addon.description}</div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="text-xs font-mono font-bold text-emerald-400">+৳{addon.price}</div>
                      <div className={`w-4 h-4 rounded-md border mt-1 ml-auto flex items-center justify-center ${isSelected ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-white/20'}`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]"/>}
                      </div>
                    </div>
                  </button>);
              })}
            </div>
          </div>

          {/* 3. Payment option */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              3. Payment Option (bKash / Nagad / Cards via SSLCommerz)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="button" onClick={() => setPaymentChoice('advance_500')} className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${paymentChoice === 'advance_500'
                  ? 'bg-emerald-500/15 border-emerald-500 shadow-md shadow-emerald-500/10'
                  : 'bg-white/[0.02] border-white/10 opacity-75 hover:opacity-100'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white uppercase">Pay ৳{advanceSetting.toLocaleString()} advance</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentChoice === 'advance_500' ? 'border-emerald-400 bg-emerald-400' : 'border-white/30'}`}>
                    {paymentChoice === 'advance_500' && <div className="w-2 h-2 rounded-full bg-slate-950"></div>}
                  </div>
                </div>
                <div className="text-xl font-black font-mono text-emerald-400">৳{Math.min(advanceSetting, totalPrice).toLocaleString()}</div>
                <div className="text-[12px] text-slate-300 mt-1">
                  Pay the remaining <strong className="text-white font-mono">৳{Math.max(0, totalPrice - Math.min(advanceSetting, totalPrice)).toLocaleString()}</strong> in cash / bKash at the arena desk on arrival.
                </div>
              </button>

              <button type="button" onClick={() => setPaymentChoice('full_payment')} className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${paymentChoice === 'full_payment'
                  ? 'bg-emerald-500/15 border-emerald-500 shadow-md shadow-emerald-500/10'
                  : 'bg-white/[0.02] border-white/10 opacity-75 hover:opacity-100'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white uppercase">100% full payment</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentChoice === 'full_payment' ? 'border-emerald-400 bg-emerald-400' : 'border-white/30'}`}>
                    {paymentChoice === 'full_payment' && <div className="w-2 h-2 rounded-full bg-slate-950"></div>}
                  </div>
                </div>
                <div className="text-xl font-black font-mono text-emerald-400">৳{totalPrice.toLocaleString()}</div>
                <div className="text-[12px] text-slate-300 mt-1">
                  Clear everything online. Nothing due on match day.
                </div>
              </button>
            </div>

            {/* Price breakdown */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span>Slot price ({slot.displayTime})</span>
                <span className="font-mono text-white">৳{courtPrice.toLocaleString()}</span>
              </div>
              {selectedAddOns.map(a => (<div key={a.id} className="flex items-center justify-between text-slate-400">
                  <span>+ {a.name}</span>
                  <span className="font-mono">৳{a.price.toLocaleString()}</span>
                </div>))}
              <div className="flex items-center justify-between text-white font-bold border-t border-white/10 pt-1.5">
                <span>Total</span>
                <span className="font-mono">৳{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <span>Pay online now</span>
                <span className="font-mono">৳{advanceAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Due at the arena</span>
                <span className="font-mono">৳{dueAmount.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">The final amount is confirmed by the arena server on the next step before you are sent to SSLCommerz.</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes for the arena desk (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value.slice(0, 300))} rows={2} placeholder="e.g. We need 2 extra bibs sets, arriving 10 min early" className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 resize-none"/>
          </div>

          {/* Cancellation policy */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-slate-300 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400"/>
              <span>Arena Cancellation Policy</span>
            </div>
            <p className="text-[12px] text-slate-400 leading-relaxed">
              Cancellations are allowed up to <strong>{Number(pricing.cancellationHours) || 24} hours</strong> before kickoff from your Player Portal; the advance goes to the refund queue. Later than that, call the arena hotline.
            </p>
          </div>

          <button type="submit" disabled={isSubmitting || secondsRemaining <= 0} className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
            <span>{secondsRemaining <= 0 ? 'Hold expired' : `Continue to payment (৳${advanceAmount.toLocaleString()})`}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]"/>
          </button>
        </form>

      </div>
    </div>);
};
