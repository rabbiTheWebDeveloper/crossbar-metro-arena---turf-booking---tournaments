'use client';
import React, { useState, useEffect } from 'react';
import { useArena, cleanPhone } from '../context/ArenaContext';
import { X, Trophy, Shield, Users, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';

const PAYMENT_OPTIONS = [
    { value: 'bkash', title: 'bKash', sub: 'Send Money / Pay', active: 'bg-[#E2136E]/20 border-[#E2136E] text-white', titleCls: 'text-[#E2136E]' },
    { value: 'nagad', title: 'Nagad', sub: 'Mobile Wallet', active: 'bg-[#F7941D]/20 border-[#F7941D] text-white', titleCls: 'text-[#F7941D]' },
    { value: 'pay_at_turf', title: 'Pay at Turf', sub: 'Cash at the desk', active: 'bg-emerald-950/60 border-emerald-500 text-white', titleCls: 'text-white' },
    { value: 'bank', title: 'Bank Transfer', sub: 'EFT / Fast Pay', active: 'bg-emerald-950/60 border-emerald-500 text-white', titleCls: 'text-white' }
];
const MIN_PLAYERS = 5;
const MAX_PLAYERS = 12;

/**
 * Tournament registration form. `onRegisterSuccess(payload)` must return the
 * handler result `{ ok, registration?, message?, error? }` so the form can show errors.
 */
export const TournamentModal = ({ tournament, onClose, onRegisterSuccess }) => {
    const { currentUser, isVisitor, siteSettings } = useArena();
    const [teamName, setTeamName] = useState('');
    const [captainName, setCaptainName] = useState(isVisitor ? '' : (currentUser?.name || ''));
    const [captainPhone, setCaptainPhone] = useState(isVisitor ? '' : (currentUser?.phone || ''));
    const [captainEmail, setCaptainEmail] = useState('');
    const [jerseyColor, setJerseyColor] = useState('');
    const [playersText, setPlayersText] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('bkash');
    const [transactionId, setTransactionId] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && !isSubmitting) onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, isSubmitting]);

    const playerList = playersText.split('\n').map(p => p.replace(/^\s*\d+[.)-]?\s*/, '').trim()).filter(Boolean);
    const max = Number(tournament.maxTeams) || 0;
    const spotsLeft = Math.max(0, max - (Number(tournament.registeredCount) || 0));
    const needsTrx = paymentMethod !== 'pay_at_turf';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        if (!teamName.trim()) { setError('Please provide your team name.'); return; }
        if (!captainName.trim()) { setError('Please provide the captain name.'); return; }
        const digits = cleanPhone(captainPhone);
        if (!/^01[3-9]\d{8}$/.test(digits)) { setError('Please provide a valid 11-digit Bangladeshi mobile number for the captain.'); return; }
        if (captainEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(captainEmail.trim())) { setError('That email address does not look valid. Leave it blank if you prefer.'); return; }
        if (playerList.length < MIN_PLAYERS) { setError(`Please list at least ${MIN_PLAYERS} squad players (one per line).`); return; }
        if (playerList.length > MAX_PLAYERS) { setError(`A squad can have at most ${MAX_PLAYERS} players. You listed ${playerList.length}.`); return; }
        setError('');
        setIsSubmitting(true);
        const payload = {
            tournamentId: tournament.id,
            tournamentTitle: tournament.title,
            teamName: teamName.trim(),
            captainName: captainName.trim(),
            captainPhone: digits,
            captainEmail: captainEmail.trim(),
            jerseyColor: jerseyColor.trim(),
            playersList: playerList,
            paymentMethod,
            transactionId: transactionId.trim() || undefined
        };
        try {
            const result = await onRegisterSuccess(payload);
            if (result && result.ok) {
                try {
                    const confetti = (await import('canvas-confetti')).default;
                    confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 }, colors: ['#f59e0b', '#4cbf02', '#38bdf8', '#ffffff'] });
                }
                catch { /* confetti is decorative */ }
            }
            else {
                setError(result?.error || 'Registration could not be submitted. Please try again.');
            }
        }
        catch {
            setError('Registration could not be submitted. Please try again.');
        }
        finally {
            setIsSubmitting(false);
        }
    };

    return (<div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="tournament-modal-title">
      <div className="relative bg-[#0c131a] border border-amber-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-[#0c131a] p-5 sm:p-6 border-b border-white/10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4"/>
              <span>Tournament Registration</span>
            </div>
            <h2 id="tournament-modal-title" className="text-xl sm:text-2xl font-black text-white font-display uppercase tracking-wide">{tournament.title}</h2>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300 mt-1">
              <span className="text-amber-300 font-semibold">{tournament.edition}</span>
              <span>·</span>
              <span>{tournament.dates}</span>
              <span>·</span>
              <span className="text-emerald-400 font-mono font-bold">Prize: ৳{Number(tournament.prizePool || 0).toLocaleString()}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" aria-label="Close">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (<div role="alert" className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0"/>
              <span>{error}</span>
            </div>)}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase">Format</span>
              <span className="text-white font-semibold">{tournament.format}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase">Entry Fee</span>
              <span className="text-amber-400 font-bold font-mono">৳{Number(tournament.entryFee || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase">Spots Left</span>
              <span className="text-emerald-400 font-semibold">{max > 0 ? `${spotsLeft} open` : 'Open entry'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase">Deadline</span>
              <span className="text-slate-200">{tournament.registrationDeadline || 'Until full'}</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400"/>
              <span>Team &amp; Captain</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label htmlFor="treg-team" className="block text-xs font-medium text-slate-300 mb-1">Team Name *</label>
                <input id="treg-team" type="text" required maxLength={60} placeholder="e.g. Uttara Thunderbolts FC" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"/>
              </div>
              <div>
                <label htmlFor="treg-captain" className="block text-xs font-medium text-slate-300 mb-1">Captain / Manager Name *</label>
                <input id="treg-captain" type="text" required maxLength={60} placeholder="Full name" value={captainName} onChange={(e) => setCaptainName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"/>
              </div>
              <div>
                <label htmlFor="treg-phone" className="block text-xs font-medium text-slate-300 mb-1">Captain WhatsApp / Mobile *</label>
                <input id="treg-phone" type="tel" inputMode="numeric" required placeholder="01XXXXXXXXX" value={captainPhone} onChange={(e) => setCaptainPhone(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"/>
              </div>
              <div>
                <label htmlFor="treg-email" className="block text-xs font-medium text-slate-300 mb-1">Captain Email <span className="text-slate-500">(optional)</span></label>
                <input id="treg-email" type="email" placeholder="name@example.com" value={captainEmail} onChange={(e) => setCaptainEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"/>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="treg-kit" className="block text-xs font-medium text-slate-300 mb-1">Team Kit / Jersey Colour</label>
                <input id="treg-kit" type="text" maxLength={40} placeholder="e.g. Green & Black" value={jerseyColor} onChange={(e) => setJerseyColor(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"/>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="treg-players" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400"/>
                <span>Squad Roster (one player per line) *</span>
              </label>
              <span className={`text-[12px] font-mono ${playerList.length >= MIN_PLAYERS && playerList.length <= MAX_PLAYERS ? 'text-emerald-400' : 'text-slate-400'}`}>{playerList.length} / {MAX_PLAYERS} · min {MIN_PLAYERS}</span>
            </div>
            <textarea id="treg-players" rows={5} required placeholder={'Player name (GK)\nPlayer name (CB - Captain)\nPlayer name (CM)\nPlayer name (LW)\nPlayer name (ST)'} value={playersText} onChange={(e) => setPlayersText(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono text-xs leading-relaxed"></textarea>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400"/>
                <span>Entry Fee (৳{Number(tournament.entryFee || 0).toLocaleString()})</span>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3" role="radiogroup" aria-label="Payment method">
              {PAYMENT_OPTIONS.map(opt => (<button key={opt.value} type="button" role="radio" aria-checked={paymentMethod === opt.value} onClick={() => setPaymentMethod(opt.value)} className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${paymentMethod === opt.value ? opt.active : 'bg-white/[0.03] border-white/10 text-slate-300'}`}>
                  <div className={`text-xs font-bold ${opt.titleCls}`}>{opt.title}</div>
                  <div className="text-[11px] text-slate-400">{opt.sub}</div>
                </button>))}
            </div>

            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10 text-xs text-slate-300">
              {needsTrx ? (<>
                  <span className="text-amber-400 font-semibold">Arena payment number: </span>
                  <strong className="text-white">{siteSettings.phoneFormatted || siteSettings.phone}</strong>. Send the entry fee with your team name in the reference, then enter the transaction ID below. Your spot is confirmed once the desk verifies the payment.
                </>) : (<>
                  <span className="text-emerald-400 font-semibold">Pay at the turf: </span>
                  bring the entry fee to the arena desk before the deadline. Your spot stays pending until it is paid.
                </>)}
              <input type="text" maxLength={60} placeholder={needsTrx ? 'Transaction ID / TrxID' : 'Transaction ID (optional)'} value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="mt-2 w-full px-3 py-1.5 rounded bg-black/40 border border-white/10 text-white text-xs font-mono"/>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="py-3 px-5 rounded-xl border border-white/15 text-slate-300 hover:bg-white/5 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50">
              Back
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? (<>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"/>
                  <span>Submitting...</span>
                </>) : (<>
                  <CheckCircle className="w-4 h-4 text-slate-950"/>
                  <span>Register Squad (৳{Number(tournament.entryFee || 0).toLocaleString()})</span>
                </>)}
            </button>
          </div>
        </form>
      </div>
    </div>);
};
