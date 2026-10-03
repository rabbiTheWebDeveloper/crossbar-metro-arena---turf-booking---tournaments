'use client';

import React, { useState } from 'react';
import { Tournament, TournamentRegistration } from '../types';
import { VENUE_INFO } from '../data/initialData';
import { X, Trophy, Shield, Users, CheckCircle, AlertCircle, Phone, Mail, Award, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TournamentModalProps {
  tournament: Tournament;
  onClose: () => void;
  onRegisterSuccess: (reg: TournamentRegistration) => void;
}

export const TournamentModal: React.FC<TournamentModalProps> = ({
  tournament,
  onClose,
  onRegisterSuccess
}) => {
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [captainEmail, setCaptainEmail] = useState('');
  const [jerseyColor, setJerseyColor] = useState('Volt Green & Black');
  const [playersText, setPlayersText] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<TournamentRegistration['paymentMethod']>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setError('Please provide team name.');
      return;
    }
    if (!captainName.trim()) {
      setError('Please provide captain name.');
      return;
    }
    if (!captainPhone.trim() || captainPhone.length < 10) {
      setError('Please provide a valid Bangladeshi contact number (e.g. 01796-337133).');
      return;
    }

    const playerList = playersText
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (playerList.length < 5) {
      setError('Please list at least 5 squad players (one per line).');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const newReg: TournamentRegistration = {
      id: `reg-${Date.now()}`,
      tournamentId: tournament.id,
      tournamentTitle: tournament.title,
      teamName: teamName.trim(),
      captainName: captainName.trim(),
      captainPhone: captainPhone.trim(),
      captainEmail: captainEmail.trim() || `${teamName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      jerseyColor: jerseyColor.trim(),
      playersList: playerList,
      paymentMethod,
      transactionId: transactionId.trim() || undefined,
      status: 'pending',
      registeredAt: new Date().toISOString()
    };

    setTimeout(() => {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#22c55e', '#38bdf8', '#ffffff']
        });
      } catch {
        // safe
      }
      onRegisterSuccess(newReg);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-[#0c131a] border border-amber-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-[#0c131a] p-5 sm:p-6 border-b border-white/10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4" />
              <span>Official Tournament Registration</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display uppercase tracking-wide">
              {tournament.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300 mt-1">
              <span className="text-amber-300 font-semibold">{tournament.edition}</span>
              <span>·</span>
              <span>{tournament.dates}</span>
              <span>·</span>
              <span className="text-emerald-400 font-mono font-bold">Prize: ৳{tournament.prizePool.toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tournament Overview strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Format</span>
              <span className="text-white font-semibold">{tournament.format}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Entry Fee</span>
              <span className="text-amber-400 font-bold font-mono">৳{tournament.entryFee.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Slots Left</span>
              <span className="text-emerald-400 font-semibold">{tournament.maxTeams - tournament.registeredCount} spots open</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Venue</span>
              <span className="text-slate-200">Uttara Metro Arena</span>
            </div>
          </div>

          {/* Team & Captain Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Team & Captain Credentials</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Uttara Thunderbolts FC"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Captain / Manager Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samiul Haque"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Captain WhatsApp / Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="01796-337133"
                  value={captainPhone}
                  onChange={(e) => setCaptainPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Team Kit / Jersey Color
                </label>
                <input
                  type="text"
                  placeholder="e.g. Neon Green & Black"
                  value={jerseyColor}
                  onChange={(e) => setJerseyColor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Squad Roster */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Squad Roster (Enter 1 player per line) *</span>
              </label>
              <span className="text-[11px] text-slate-400">Min 5 · Max 12 Players</span>
            </div>
            <textarea
              rows={4}
              required
              placeholder="1. Samiul Haque (GK)&#10;2. Tanvir Ahmed (CB - Captain)&#10;3. Siam Hossain (CM)&#10;4. Naimur Rahman (LW)&#10;5. Fahim Shakil (ST)&#10;6. Shakib Al Hasan (Sub)&#10;7. Rayhan Kabir (Sub)"
              value={playersText}
              onChange={(e) => setPlayersText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 font-mono text-xs leading-relaxed"
            ></textarea>
          </div>

          {/* Payment Method for Entry Fee */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>Registration Entry Fee (৳{tournament.entryFee.toLocaleString()})</span>
              </label>
              <span className="text-[11px] text-emerald-400 font-semibold">Includes Match Balls & Hydration</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('bkash')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'bkash'
                    ? 'bg-[#E2136E]/20 border-[#E2136E] text-white'
                    : 'bg-white/[0.03] border-white/10 text-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-[#E2136E]">bKash</div>
                <div className="text-[10px] text-slate-400">Send Money / Pay</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('nagad')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'nagad'
                    ? 'bg-[#F7941D]/20 border-[#F7941D] text-white'
                    : 'bg-white/[0.03] border-white/10 text-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-[#F7941D]">Nagad</div>
                <div className="text-[10px] text-slate-400">Mobile Wallet</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('arena_counter')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'arena_counter'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white'
                    : 'bg-white/[0.03] border-white/10 text-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-white">Turf Counter</div>
                <div className="text-[10px] text-slate-400">Cash at Desk</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'bank_transfer'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white'
                    : 'bg-white/[0.03] border-white/10 text-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-white">Bank Transfer</div>
                <div className="text-[10px] text-slate-400">EFT / Fast Pay</div>
              </button>
            </div>

            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10 text-xs text-slate-300">
              <span className="text-amber-400 font-semibold">Crossbar Official Number: </span>
              <strong className="text-white">{VENUE_INFO.phone}</strong> (bKash / Nagad Personal / Merchant). Send entry fee with Team Name in reference, then enter transaction ID below:
              <input
                type="text"
                placeholder="Transaction ID / TrxID (or leave blank if paying at turf)"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="mt-2 w-full px-3 py-1.5 rounded bg-black/40 border border-white/10 text-white text-xs font-mono"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 rounded-xl border border-white/15 text-slate-300 hover:bg-white/5 font-semibold text-sm transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting Registration...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-slate-950" />
                  <span>Register Squad Now (৳{tournament.entryFee.toLocaleString()})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
