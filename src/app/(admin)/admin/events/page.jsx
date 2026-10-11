'use client';
import React, { useState } from 'react';
import { useArena } from '@/context/ArenaContext';
import { Plus } from 'lucide-react';
export const dynamic = 'force-dynamic';
export default function AdminEventsPage() {
    const { tournaments, handleSaveTournament } = useArena();
    const [showAddModal, setShowAddModal] = useState(false);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('7v7 Championship');
    const [format, setFormat] = useState('7 vs 7 Knockouts');
    const [dates, setDates] = useState('Nov 20 – Nov 22, 2026');
    const [entryFee, setEntryFee] = useState(6500);
    const [prizePool, setPrizePool] = useState(35000);
    const [maxTeams, setMaxTeams] = useState(16);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !dates.trim()) return;

        await handleSaveTournament({
            title: title.trim(),
            category,
            format,
            dates,
            entryFee: Number(entryFee),
            prizePool: Number(prizePool),
            maxTeams: Number(maxTeams)
        });

        setShowAddModal(false);
        setTitle('');
    };

    return (<div className="space-y-6 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white font-display">
            Tournaments &amp; Events Hub
          </h2>
          <p className="text-xs text-slate-400">
            Organize official cups, knockouts, prize pools, and seasonal corporate leagues.
          </p>
        </div>

        <button type="button" onClick={() => setShowAddModal(true)} className="px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md shadow-lime-400/20">
          <Plus className="w-4 h-4 stroke-[3]"/>
          <span>Create Tournament</span>
        </button>
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tournaments.map(t => (<div key={t.id || t._id} className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-3 hover:border-lime-400/30 transition-all text-xs">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-lime-400/10 text-lime-400 border border-lime-400/20 font-bold uppercase font-mono text-[10px]">
                {t.category}
              </span>
              <span className="font-mono text-white font-bold">
                {t.registeredCount} / {t.maxTeams} Teams
              </span>
            </div>

            <div>
              <h4 className="text-base font-black text-white font-display">{t.title}</h4>
              <p className="text-slate-400 text-xs mt-1">{t.format}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#080d12] border border-white/5 font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block">Entry Fee</span>
                <span className="font-bold text-white">৳{(t.entryFee || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Prize Pool</span>
                <span className="font-bold text-lime-400">৳{(t.prizePool || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-slate-400 text-[11px] pt-2 border-t border-white/5">
              <span>Dates: {t.dates}</span>
              <span className="capitalize text-emerald-400 font-bold">{t.status?.replace('_', ' ') || 'open'}</span>
            </div>
          </div>))}
      </div>

      {/* CREATE TOURNAMENT MODAL */}
      {showAddModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-lime-400/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white font-display">Create Tournament</h3>
            <p className="text-xs text-slate-400">Add a new competitive championship fixture.</p>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Title *</label>
                <input type="text" required placeholder="e.g. Winter Cup 2026" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"/>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Tournament Dates *</label>
                <input type="text" required placeholder="e.g. Nov 20 – Nov 22, 2026" value={dates} onChange={e => setDates(e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"/>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Entry Fee (৳)</label>
                  <input type="number" value={entryFee} onChange={e => setEntryFee(Number(e.target.value))} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Prize Pool (৳)</label>
                  <input type="number" value={prizePool} onChange={e => setPrizePool(Number(e.target.value))} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-lime-400 text-slate-950 font-black rounded-xl">
                  Publish Cup
                </button>
              </div>
            </form>
          </div>
        </div>)}

    </div>);
}
