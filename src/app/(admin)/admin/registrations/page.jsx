'use client';
import React, { useState } from 'react';
import { useArena } from '@/context/ArenaContext';
export const dynamic = 'force-dynamic';
export default function AdminRegistrationsPage() {
    const { registrations, handleRegistrationSuccess } = useArena();
    const [search, setSearch] = useState('');
    const filteredRegistrations = registrations.filter(r => r.teamName.toLowerCase().includes(search.toLowerCase()) ||
        r.captainName.toLowerCase().includes(search.toLowerCase()) ||
        r.captainPhone.includes(search) ||
        r.tournamentTitle.toLowerCase().includes(search.toLowerCase()));
    const handleUpdateStatus = (regId, newStatus) => {
        const target = registrations.find(r => r.id === regId);
        if (target) {
            handleRegistrationSuccess({ ...target, status: newStatus });
        }
    };
    return (<div className="space-y-6 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white font-display">
            Tournament Registrations
          </h2>
          <p className="text-xs text-slate-400">
            Verify squad entries, entrance fee transactions, and roster rosters for upcoming tournaments.
          </p>
        </div>

        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team, captain or cup..." className="bg-[#0c131a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white max-w-xs outline-none"/>
      </div>

      {filteredRegistrations.length === 0 ? (<div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/5 text-slate-400 text-xs">
          No tournament registrations found.
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRegistrations.map(reg => {
                const isVerified = reg.status === 'verified';
                const isRejected = reg.status === 'rejected';
                return (<div key={reg.id} className={`p-5 rounded-3xl border text-xs space-y-3 transition-all ${isVerified
                        ? 'bg-[#0a1210] border-emerald-500/30'
                        : isRejected
                            ? 'bg-[#150a0a] border-rose-500/20 opacity-60'
                            : 'bg-[#0c131a] border-amber-400/30'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{reg.teamName}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${isVerified
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : isRejected
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-400/20 text-amber-300'}`}>
                    {reg.status}
                  </span>
                </div>

                <div className="space-y-1 text-slate-400">
                  <div className="text-lime-400 font-bold truncate">{reg.tournamentTitle}</div>
                  <div>Captain: <span className="text-white font-medium">{reg.captainName}</span> ({reg.captainPhone})</div>
                  <div>Players: {reg.playerCount} · Jersey: {reg.jerseyColor}</div>
                  {reg.transactionId && (<div className="font-mono text-slate-500 text-[10px]">
                      Trx: {reg.transactionId} ({reg.paymentMethod})
                    </div>)}
                </div>

                {!isVerified && !isRejected && (<div className="pt-3 border-t border-white/10 flex gap-2">
                    <button type="button" onClick={() => handleUpdateStatus(reg.id, 'verified')} className="flex-1 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs cursor-pointer">
                      Approve Team
                    </button>
                    <button type="button" onClick={() => handleUpdateStatus(reg.id, 'rejected')} className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 font-bold text-xs cursor-pointer">
                      Reject
                    </button>
                  </div>)}
              </div>);
            })}
        </div>)}

    </div>);
}
